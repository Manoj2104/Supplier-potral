<?php

namespace App\Services;

use App\Models\PaymentSetting;
use App\Models\SaasAuditLog;
use App\Models\SubscriptionPayment;
use App\Models\Company;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Pagination\LengthAwarePaginator;

class PaymentControlService
{
    /**
     * Get authoritative active provider
     */
    public static function getActiveProvider(): string
    {
        return PaymentSetting::getActiveProvider();
    }

    public static function isRazorpayActive(): bool
    {
        return PaymentSetting::isRazorpayActive();
    }

    public static function isSystemActive(): bool
    {
        return PaymentSetting::isSystemActive();
    }

    /**
     * Get sanitized settings representation for frontend
     */
    public static function getSanitizedSettings(): array
    {
        return PaymentSetting::getSettings()->toSanitizedArray();
    }

    /**
     * Atomically switch the active payment provider
     */
    public static function switchProvider(string $provider, ?int $adminId = null): array
    {
        $provider = strtolower(trim($provider));
        if (!in_array($provider, ['razorpay', 'system', 'none'])) {
            throw new \InvalidArgumentException("Invalid payment provider: {$provider}");
        }

        $setting = PaymentSetting::getSettings();
        $oldProvider = $setting->active_provider;

        // If turning on Razorpay, verify required credentials exist
        if ($provider === 'razorpay') {
            if (!$setting->isRazorpayConfigured()) {
                throw new \RuntimeException("Razorpay is not ready. Please complete Razorpay configuration (Key ID, Secret, and Plan ID) before enabling it.");
            }
        }

        DB::beginTransaction();
        try {
            if ($provider === 'razorpay') {
                $setting->active_provider       = 'razorpay';
                $setting->razorpay_enabled      = true;
                $setting->system_payment_enabled = false;
            } elseif ($provider === 'system') {
                $setting->active_provider       = 'system';
                $setting->razorpay_enabled      = false;
                $setting->system_payment_enabled = true;
            } else {
                $setting->active_provider       = 'none';
                $setting->razorpay_enabled      = false;
                $setting->system_payment_enabled = false;
            }

            if ($adminId) {
                $setting->updated_by = $adminId;
            }
            $setting->save();

            self::recordAudit('payment_provider_changed', [
                'old_provider' => $oldProvider,
                'new_provider' => $provider,
                'razorpay_enabled' => $setting->razorpay_enabled,
                'system_payment_enabled' => $setting->system_payment_enabled,
            ], $adminId);

            DB::commit();

            return [
                'success' => true,
                'message' => "Payment provider switched to " . ($provider === 'razorpay' ? 'Razorpay' : ($provider === 'system' ? 'System Payment' : 'None')) . " successfully.",
                'data'    => $setting->toSanitizedArray(),
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Test connection to Razorpay API without leaking credentials
     */
    public static function testRazorpayConnection(?string $keyId = null, ?string $keySecret = null, ?string $mode = null): array
    {
        $setting = PaymentSetting::getSettings();

        $activeKeyId = !empty($keyId) ? trim($keyId) : $setting->razorpay_key_id;
        $activeSecret = !empty($keySecret) && !str_contains($keySecret, '••••')
            ? trim($keySecret)
            : $setting->getDecryptedKeySecret();
        $activeMode = !empty($mode) ? $mode : ($setting->razorpay_mode ?: 'test');

        if (empty($activeKeyId) || empty($activeSecret)) {
            return [
                'success'     => false,
                'message'     => 'Razorpay credentials not found. Please provide Key ID and Key Secret.',
                'environment' => $activeMode,
                'account'     => 'Disconnected',
                'api'         => 'Not configured',
            ];
        }

        // Validate Key ID prefix against selected mode
        if ($activeMode === 'test' && !str_starts_with($activeKeyId, 'rzp_test_')) {
            return [
                'success'     => false,
                'message'     => 'Invalid Test Mode Key ID. Test Key ID must begin with "rzp_test_".',
                'environment' => $activeMode,
                'account'     => 'Prefix Mismatch',
                'api'         => 'Blocked',
            ];
        }
        if ($activeMode === 'live' && !str_starts_with($activeKeyId, 'rzp_live_')) {
            return [
                'success'     => false,
                'message'     => 'Invalid Live Mode Key ID. Live Key ID must begin with "rzp_live_".',
                'environment' => $activeMode,
                'account'     => 'Prefix Mismatch',
                'api'         => 'Blocked',
            ];
        }

        // Connect to Razorpay API v1/payments with 4s timeout
        $url = 'https://api.razorpay.com/v1/payments?count=1';

        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERPWD, $activeKeyId . ':' . $activeSecret);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Accept: application/json',
            ]);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
            curl_setopt($ch, CURLOPT_TIMEOUT, 6);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);

            if ($response !== false && $httpCode >= 200 && $httpCode < 300) {
                self::recordAudit('razorpay_test_connection', [
                    'mode' => $activeMode,
                    'result' => 'SUCCESS',
                    'key_id_prefix' => substr($activeKeyId, 0, 12),
                ]);

                return [
                    'success'     => true,
                    'environment' => $activeMode === 'live' ? 'Live Mode (Production)' : 'Test Mode (Sandbox)',
                    'account'     => 'Connected & Verified',
                    'api'         => 'Operational (HTTP 200)',
                    'message'     => 'Razorpay connection validated successfully. Credentials are authenticated.',
                ];
            }

            self::recordAudit('razorpay_test_connection', [
                'mode' => $activeMode,
                'result' => 'FAILED',
                'http_code' => $httpCode,
            ]);

            return [
                'success'     => false,
                'environment' => $activeMode,
                'account'     => 'Authentication Failed',
                'api'         => "Error (HTTP {$httpCode})",
                'message'     => 'Unable to authenticate with Razorpay. Please verify your Key ID and Key Secret.',
            ];
        }

        return [
            'success' => false,
            'message' => 'PHP cURL extension required for payment gateway connectivity.',
        ];
    }

    /**
     * Save Razorpay configuration safely
     */
    public static function saveRazorpayConfig(array $data, ?int $adminId = null): array
    {
        $setting = PaymentSetting::getSettings();

        $mode          = $data['razorpay_mode'] ?? $setting->razorpay_mode ?: 'test';
        $keyId         = trim($data['razorpay_key_id'] ?? $setting->razorpay_key_id);
        $planId        = trim($data['razorpay_plan_id'] ?? $setting->razorpay_plan_id ?: 'plan_INFYPOS_MONTHLY_499');
        $merchantName  = trim($data['merchant_name'] ?? $setting->merchant_name ?: 'INFY-POS Enterprise');

        // Mode prefix verification
        if ($mode === 'test' && !empty($keyId) && !str_starts_with($keyId, 'rzp_test_')) {
            throw new \InvalidArgumentException("In Test Mode, Key ID must begin with 'rzp_test_'.");
        }
        if ($mode === 'live' && !empty($keyId) && !str_starts_with($keyId, 'rzp_live_')) {
            throw new \InvalidArgumentException("In Live Mode, Key ID must begin with 'rzp_live_'.");
        }

        $setting->razorpay_mode    = $mode;
        $setting->razorpay_key_id  = $keyId;
        $setting->razorpay_plan_id = $planId;
        $setting->merchant_name    = $merchantName;

        // Encrypt new secrets if provided and not masked
        if (!empty($data['razorpay_key_secret']) && !str_contains($data['razorpay_key_secret'], '••••')) {
            $setting->razorpay_key_secret_encrypted = Crypt::encryptString(trim($data['razorpay_key_secret']));
        }
        if (!empty($data['razorpay_webhook_secret']) && !str_contains($data['razorpay_webhook_secret'], '••••')) {
            $setting->razorpay_webhook_secret_encrypted = Crypt::encryptString(trim($data['razorpay_webhook_secret']));
        }

        if ($adminId) {
            $setting->updated_by = $adminId;
        }

        $setting->save();

        self::recordAudit('razorpay_configuration_updated', [
            'mode'           => $mode,
            'key_id_prefix'  => substr($keyId, 0, 12),
            'plan_id'        => $planId,
            'secret_updated' => !empty($data['razorpay_key_secret']) && !str_contains($data['razorpay_key_secret'], '••••'),
        ], $adminId);

        return [
            'success' => true,
            'message' => 'Razorpay configuration saved and encrypted successfully.',
            'data'    => $setting->toSanitizedArray(),
        ];
    }

    /**
     * Save System Payment configuration
     */
    public static function saveSystemPaymentConfig(array $data, ?int $adminId = null): array
    {
        $setting = PaymentSetting::getSettings();

        $setting->system_payment_mode         = trim($data['system_payment_mode'] ?? 'system');
        $setting->system_payment_verification = trim($data['system_payment_verification'] ?? 'automatic');
        $setting->currency                    = strtoupper(trim($data['currency'] ?? 'INR'));

        if ($adminId) {
            $setting->updated_by = $adminId;
        }

        $setting->save();

        self::recordAudit('system_payment_configuration_updated', [
            'mode'         => $setting->system_payment_mode,
            'verification' => $setting->system_payment_verification,
            'currency'     => $setting->currency,
        ], $adminId);

        return [
            'success' => true,
            'message' => 'System Payment settings saved successfully.',
            'data'    => $setting->toSanitizedArray(),
        ];
    }

    /**
     * Retrieve filterable Payment Logs
     */
    public static function getPaymentLogs(array $filters = [], int $perPage = 15): array
    {
        $query = SubscriptionPayment::query()->latest('created_at');

        if (!empty($filters['provider']) && $filters['provider'] !== 'all') {
            $p = strtoupper($filters['provider']);
            $query->where(function ($q) use ($p) {
                $q->where('provider', strtolower($p))
                  ->orWhere('method', $p);
            });
        }

        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', strtoupper($filters['status']));
        }

        if (!empty($filters['search'])) {
            $s = trim($filters['search']);
            $query->where(function ($q) use ($s) {
                $q->where('razorpay_payment_id', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('contact', 'like', "%{$s}%")
                  ->orWhere('method', 'like', "%{$s}%");
            });
        }

        $totalCount = $query->count();
        $page = max(1, (int) ($filters['page'] ?? 1));
        $records = $query->skip(($page - 1) * $perPage)->take($perPage)->get();

        $company = Company::first();
        $storeName = $company ? ($company->store_name ?: $company->name) : 'Primary POS Store';
        $customerName = $company ? ($company->owner_name ?: 'Administrator') : 'Store Admin';

        $data = $records->map(function ($item) use ($storeName, $customerName) {
            $isSystem = strcasecmp($item->provider ?? '', 'system') === 0 || strcasecmp($item->method ?? '', 'SYSTEM') === 0;
            return [
                'id'              => $item->id,
                'date'            => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : 'N/A',
                'customer'        => $customerName,
                'store'           => $storeName,
                'provider'        => $isSystem ? 'SYSTEM' : 'RAZORPAY',
                'amount'          => (float) $item->amount,
                'currency'        => $item->currency ?: 'INR',
                'payment_id'      => $item->razorpay_payment_id ?: ('SYS-TXN-' . str_pad($item->id, 6, '0', STR_PAD_LEFT)),
                'status'          => strtoupper($item->status ?: 'SUCCESS'),
                'subscription'    => 'INFY-POS PREMIUM (+30 Days)',
                'method'          => $item->method ?: ($isSystem ? 'System Automatic' : 'UPI/Card'),
                'email'           => $item->email ?: ($company->email ?? 'admin@infypos.local'),
                'contact'         => $item->contact ?: ($company->phone ?? '9876543210'),
            ];
        });

        return [
            'data'         => $data,
            'total'        => $totalCount,
            'per_page'     => $perPage,
            'current_page' => $page,
            'last_page'    => ceil($totalCount / $perPage),
        ];
    }

    /**
     * Record sanitized audit entry
     */
    public static function recordAudit(string $action, array $details, ?int $adminId = null): void
    {
        try {
            $company = Company::first();
            $companyId = $company ? $company->id : 1;

            $request = request();
            $ip = $request ? $request->ip() : '127.0.0.1';
            $userAgent = $request ? substr($request->userAgent() ?: 'CLI', 0, 250) : 'CLI';

            $sanitizedDetails = array_map(function ($val) {
                if (is_string($val) && (str_contains(strtolower($val), 'secret') || strlen($val) > 100)) {
                    return '••••';
                }
                return $val;
            }, $details);

            $sanitizedDetails['ip']         = $ip;
            $sanitizedDetails['user_agent'] = $userAgent;
            $sanitizedDetails['timestamp']  = now()->toIso8601String();

            SaasAuditLog::create([
                'company_id' => $companyId,
                'user_id'    => $adminId ?: 1,
                'action'     => $action,
                'details'    => json_encode($sanitizedDetails),
                'ip_address' => $ip,
            ]);
        } catch (\Throwable $e) {
            Log::warning("Failed to record payment audit log: " . $e->getMessage());
        }
    }
}
