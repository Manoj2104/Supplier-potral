<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\PaymentControlService;
use App\Models\Company;
use App\Models\ActivationKey;
use App\Models\License;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Services\EnterpriseLicenseService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SuperAdminPaymentController extends Controller
{
    /**
     * GET /api/super-admin/payment-settings
     * Retrieve current payment configuration & active provider state
     */
    public function getSettings(Request $request)
    {
        return response()->json([
            'success' => true,
            'data'    => PaymentControlService::getSanitizedSettings(),
        ]);
    }

    /**
     * POST /api/super-admin/payment-settings/provider
     * Atomic switch between Razorpay and System Payment
     */
    public function switchProvider(Request $request)
    {
        $request->validate([
            'provider' => 'required|string|in:razorpay,system,none',
        ]);

        try {
            $result = PaymentControlService::switchProvider($request->input('provider'));
            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/super-admin/payment-settings/razorpay
     * Save/update Razorpay credentials and configuration
     */
    public function saveRazorpay(Request $request)
    {
        $request->validate([
            'razorpay_mode'           => 'required|string|in:test,live',
            'razorpay_key_id'         => 'required|string',
            'razorpay_key_secret'     => 'nullable|string',
            'razorpay_webhook_secret' => 'nullable|string',
            'razorpay_plan_id'        => 'required|string',
            'merchant_name'           => 'nullable|string',
        ]);

        try {
            $result = PaymentControlService::saveRazorpayConfig($request->all());
            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/super-admin/payment-settings/razorpay/test
     * Test connection to Razorpay API
     */
    public function testRazorpay(Request $request)
    {
        $keyId     = $request->input('key_id');
        $keySecret = $request->input('key_secret');
        $mode      = $request->input('mode');

        $result = PaymentControlService::testRazorpayConnection($keyId, $keySecret, $mode);
        $status = !empty($result['success']) ? 200 : 422;

        return response()->json($result, $status);
    }

    /**
     * POST /api/super-admin/payment-settings/system
     * Save/update System Payment configuration
     */
    public function saveSystemPayment(Request $request)
    {
        $request->validate([
            'system_payment_mode'         => 'nullable|string',
            'system_payment_verification' => 'required|string|in:automatic,manual',
            'currency'                    => 'nullable|string|size:3',
        ]);

        try {
            $result = PaymentControlService::saveSystemPaymentConfig($request->all());
            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * GET /api/super-admin/payment-settings/logs
     * List payment history logs with filters
     */
    public function getLogs(Request $request)
    {
        $filters = [
            'provider' => $request->query('provider'),
            'status'   => $request->query('status'),
            'search'   => $request->query('search'),
            'page'     => (int) $request->query('page', 1),
        ];

        $logs = PaymentControlService::getPaymentLogs($filters, 15);
        return response()->json([
            'success' => true,
            'data'    => $logs,
        ]);
    }

    /**
     * GET /api/payment/provider
     * Customer-facing authoritative active payment provider endpoint
     */
    public function getCustomerProvider(Request $request)
    {
        $settings = PaymentControlService::getSanitizedSettings();
        $provider = PaymentControlService::getActiveProvider();

        return response()->json([
            'success' => true,
            'data'    => [
                'provider'               => $provider,
                'razorpay_enabled'       => (bool) $settings['razorpay_enabled'],
                'system_payment_enabled' => (bool) $settings['system_payment_enabled'],
                'razorpay_key_id'        => $settings['razorpay_key_id'],
                'merchant_name'          => $settings['merchant_name'],
                'currency'               => $settings['currency'],
                'system_verification'    => $settings['system_payment_verification'],
            ]
        ]);
    }

    /**
     * POST /api/payment/system/process
     * Process internal system payment when System Payment provider is active
     */
    public function processSystemPayment(Request $request)
    {
        if (!PaymentControlService::isSystemActive()) {
            return response()->json([
                'success' => false,
                'message' => 'System Payment is not the active payment provider. Current active provider: ' . PaymentControlService::getActiveProvider(),
            ], 403);
        }

        $company = Company::first();
        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'No active company found.',
            ], 404);
        }

        DB::beginTransaction();
        try {
            $now = Carbon::now();
            $currentEnd = $company->subscription_ends_at ? Carbon::parse($company->subscription_ends_at) : null;
            $newEndsAt = ($currentEnd && $currentEnd->isFuture())
                ? $currentEnd->copy()->addDays(30)
                : $now->copy()->addDays(30);

            // 1. Update Company
            $company->status               = 'active';
            $company->subscription_ends_at = $newEndsAt;
            $company->auto_renew           = 1;
            $company->save();

            // 2. Update ActivationKey
            $activeKey = ActivationKey::where('company_id', $company->id)->where('status', 'active')->latest('id')->first();
            if ($activeKey) {
                $activeKey->expires_at = $newEndsAt;
                $activeKey->save();
            } else {
                $activeKey = ActivationKey::create([
                    'company_id'          => $company->id,
                    'key_code'            => 'INFYPOS-2026-SYS-' . strtoupper(substr(md5(uniqid()), 0, 8)),
                    'plan_name'           => 'INFY-POS PREMIUM',
                    'price'               => 499.00,
                    'status'              => 'active',
                    'activated_at'        => $now,
                    'expires_at'          => $newEndsAt,
                ]);
            }

            // 3. Update Enterprise License & Subscription
            $license = EnterpriseLicenseService::ensureCurrentLicense();
            $license->status = 'ACTIVE';
            $license->save();

            $subscription = Subscription::where('license_id', $license->license_id)->latest('id')->first();
            if ($subscription) {
                $subscription->expires_at      = $newEndsAt;
                $subscription->next_billing_at = $newEndsAt;
                $subscription->status          = 'ACTIVE';
                $subscription->payment_method  = 'System Payment / Internal';
                $subscription->save();
            }

            // 4. Record Payment in SubscriptionPayment
            $sysPaymentId = 'SYS-PAY-' . strtoupper(Str::random(12));
            $paymentRecord = SubscriptionPayment::create([
                'user_id'             => 1,
                'company_id'          => $company->id,
                'subscription_id'     => $subscription ? $subscription->id : 1,
                'provider'            => 'system',
                'razorpay_payment_id' => $sysPaymentId,
                'razorpay_order_id'   => 'SYS-ORD-' . strtoupper(Str::random(10)),
                'amount'              => 499.00,
                'currency'            => 'INR',
                'status'              => 'SUCCESS',
                'method'              => 'SYSTEM',
                'email'               => $company->email ?: 'admin@infypos.local',
                'contact'             => $company->phone ?: '9876543210',
                'captured_at'         => $now,
                'raw_reference'       => json_encode([
                    'provider'      => 'system',
                    'verified_by'   => 'Internal System Engine',
                    'verification'  => 'automatic',
                    'extended_days' => 30,
                    'timestamp'     => $now->toIso8601String(),
                ]),
            ]);

            // Re-issue cryptographic license token
            \App\Services\LicenseGuardService::issueLicenseToken($company, $activeKey);

            PaymentControlService::recordAudit('system_payment_processed', [
                'payment_id'    => $sysPaymentId,
                'amount'        => 499.00,
                'extended_days' => 30,
                'expires_at'    => $newEndsAt->toIso8601String(),
            ]);

            DB::commit();

            return response()->json([
                'success'           => true,
                'message'           => 'System payment verified successfully! Subscription extended by +30 Days.',
                'payment_id'        => $sysPaymentId,
                'status'            => 'ACTIVE',
                'expires_at'        => $newEndsAt->toIso8601String(),
                'remaining_seconds' => max(0, $newEndsAt->timestamp - time()),
                'provider'          => 'system',
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to process system payment: ' . $e->getMessage(),
            ], 500);
        }
    }
}
