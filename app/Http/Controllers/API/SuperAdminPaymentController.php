<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\PaymentControlService;
use App\Models\Company;
use App\Models\ActivationKey;
use App\Models\License;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Models\PaymentSetting;
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
            'system_upi_id'               => 'nullable|string|max:100',
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

            // 2. AUTO-DELETE old expired keys and create brand-new active key
            ActivationKey::where('company_id', $company->id)->delete();
            $newKeyCode = 'INFYPOS-2026-KEY-' . strtoupper(substr(md5(uniqid('key_', true) . microtime()), 0, 8));
            $activeKey = ActivationKey::create([
                'company_id'          => $company->id,
                'key_code'            => $newKeyCode,
                'plan_name'           => 'INFY-POS PREMIUM',
                'price'               => 499.00,
                'status'              => 'active',
                'activated_at'        => $now,
                'expires_at'          => $newEndsAt,
                'machine_fingerprint' => \App\Services\LicenseGuardService::getLocalMachineGuid(),
            ]);

            try {
                $cloudComp = \App\Services\CloudLicenseServerService::findCompanyRecord($company);
                if ($cloudComp && !empty($cloudComp['id'])) {
                    $cloudCompanyId = (int)$cloudComp['id'];
                    \App\Services\CloudLicenseServerService::supabaseRequest('/activation_keys?company_id=eq.' . $cloudCompanyId, 'DELETE');
                    \App\Services\CloudLicenseServerService::supabaseRequest('/companies?id=eq.' . $cloudCompanyId, 'PATCH', [
                        'status'               => 'active',
                        'subscription_ends_at' => $newEndsAt->toIso8601String(),
                        'updated_at'           => date('c'),
                    ]);
                    \App\Services\CloudLicenseServerService::supabaseRequest('/activation_keys', 'POST', [
                        'key_code'            => $newKeyCode,
                        'company_id'          => $cloudCompanyId,
                        'plan_name'           => 'INFY-POS PREMIUM (₹499/mo)',
                        'price'               => 499.00,
                        'status'              => 'active',
                        'machine_fingerprint' => \App\Services\LicenseGuardService::getLocalMachineGuid(),
                        'activated_at'        => $now->toIso8601String(),
                        'expires_at'          => $newEndsAt->toIso8601String(),
                        'created_at'          => date('c'),
                        'updated_at'          => date('c'),
                    ]);
                }
            } catch (\Throwable $cloudEx) {}

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
            $payMethod = strtoupper($request->input('method', 'UPI'));
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
                'method'              => $payMethod,
                'email'               => $company->email ?: 'admin@infypos.local',
                'contact'             => $company->phone ?: '9876543210',
                'captured_at'         => $now,
                'raw_reference'       => json_encode([
                    'provider'      => 'system',
                    'method'        => $payMethod,
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
                'method'        => $payMethod,
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

    /**
     * POST /api/payment/system/initiate
     * Generates a unique order reference and dynamic UPI string
     */
    public function initiateSystemPayment(Request $request)
    {
        $setting = PaymentSetting::getSettings();
        $orderId = 'INFY-POS-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid('upi_', true) . microtime()), 0, 5));
        $upiId = $setting->system_upi_id ?: 'infypos@upi';
        $merchantName = $setting->merchant_name ?: 'INFY-POS Enterprise';
        $amount = 499.00;
        $gstAmount = 89.82;
        $totalAmount = 588.82;
        
        $upiString = "upi://pay?pa=" . urlencode($upiId) . "&pn=" . urlencode($merchantName) . "&am=" . number_format($totalAmount, 2, '.', '') . "&cu=INR&tn=" . urlencode($orderId);

        return response()->json([
            'success'      => true,
            'order_id'     => $orderId,
            'upi_id'       => $upiId,
            'merchant_name'=> $merchantName,
            'amount'       => $amount,
            'gst_amount'   => $gstAmount,
            'total_amount' => $totalAmount,
            'currency'     => 'INR',
            'upi_string'   => $upiString,
        ]);
    }

    /**
     * POST /api/payment/system/submit
     * Customer submits UTR & optional screenshot for verification
     */
    public function submitSystemPayment(Request $request)
    {
        $request->validate([
            'utr'         => 'required|string|min:6|max:60',
            'order_id'    => 'nullable|string|max:60',
            'screenshot'  => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $company = Company::first();
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'No company found.'], 404);
        }

        $utr = trim($request->input('utr'));
        $orderId = $request->input('order_id') ?: ('INFY-POS-' . date('Ymd') . '-' . strtoupper(substr(uniqid('upi_', true), -5)));

        // Handle screenshot upload
        $screenshotUrl = null;
        if ($request->hasFile('screenshot')) {
            $file = $request->file('screenshot');
            $filename = 'proof_' . date('Ymd_His') . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
            $destDir = public_path('uploads/payment_screenshots');
            if (!file_exists($destDir)) {
                @mkdir($destDir, 0755, true);
            }
            $file->move($destDir, $filename);
            $screenshotUrl = '/uploads/payment_screenshots/' . $filename;
        }

        $license = EnterpriseLicenseService::ensureCurrentLicense();
        $subscription = Subscription::where('license_id', $license->license_id)->latest('id')->first();

        // Check for duplicate verified UTR
        $existing = SubscriptionPayment::where('utr', $utr)
            ->where('verification_status', 'verified')
            ->first();
        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'This UTR has already been verified and processed.',
            ], 422);
        }

        $payment = SubscriptionPayment::create([
            'user_id'             => 1,
            'company_id'          => $company->id,
            'subscription_id'     => $subscription ? $subscription->id : 1,
            'order_id'            => $orderId,
            'provider'            => 'system_upi',
            'upi_reference'       => $orderId,
            'utr'                 => $utr,
            'screenshot_path'     => $screenshotUrl,
            'razorpay_payment_id' => 'SYS-UPI-' . strtoupper(Str::random(10)),
            'razorpay_order_id'   => $orderId,
            'amount'              => 499.00,
            'gst_amount'          => 89.82,
            'total_amount'        => 588.82,
            'currency'            => 'INR',
            'status'              => 'PENDING',
            'verification_status' => 'pending',
            'method'              => 'UPI',
            'email'               => $company->email ?: 'admin@infypos.local',
            'contact'             => $company->phone ?: '9876543210',
            'captured_at'         => null,
            'raw_reference'       => [
                'provider'     => 'system_upi',
                'order_id'     => $orderId,
                'utr'          => $utr,
                'screenshot'   => $screenshotUrl,
                'submitted_at' => Carbon::now()->toIso8601String(),
            ],
        ]);

        PaymentControlService::recordAudit('system_upi_payment_submitted', [
            'order_id'     => $orderId,
            'utr'          => $utr,
            'total_amount' => 588.82,
            'screenshot'   => $screenshotUrl,
        ]);

        return response()->json([
            'success'             => true,
            'message'             => 'Payment details submitted successfully. Verification pending.',
            'order_id'            => $orderId,
            'utr'                 => $utr,
            'status'              => 'PENDING',
            'verification_status' => 'pending',
        ]);
    }

    /**
     * GET /api/payment/system/status/{reference}
     */
    public function getSystemPaymentStatus($reference)
    {
        $payment = SubscriptionPayment::where('order_id', $reference)
            ->orWhere('utr', $reference)
            ->latest('id')
            ->first();

        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment reference not found.'], 404);
        }

        $company = Company::first();
        return response()->json([
            'success'             => true,
            'order_id'            => $payment->order_id,
            'utr'                 => $payment->utr,
            'status'              => $payment->status,
            'verification_status' => $payment->verification_status,
            'rejection_reason'    => $payment->rejection_reason,
            'total_amount'        => $payment->total_amount ?: 588.82,
            'plan_name'           => 'INFY-POS PREMIUM',
            'valid_until'         => $company && $company->subscription_ends_at ? Carbon::parse($company->subscription_ends_at)->format('d M Y') : 'Active',
        ]);
    }

    /**
     * GET /api/saas-admin/payment-settings/pending-requests
     */
    public function getPendingPayments()
    {
        $pending = SubscriptionPayment::where('verification_status', 'pending')
            ->orWhere('status', 'PENDING')
            ->latest('id')
            ->get();

        $company = Company::first();
        $formatted = $pending->map(function ($p) use ($company) {
            return [
                'id'                  => $p->id,
                'customer_name'       => $company ? ($company->company_name ?: 'Manoj') : 'Customer',
                'customer_email'      => $p->email,
                'customer_phone'      => $p->contact,
                'plan_name'           => 'INFY-POS PREMIUM',
                'amount'              => '₹588.82',
                'total_amount'        => $p->total_amount ?: 588.82,
                'utr'                 => $p->utr ?: $p->razorpay_payment_id,
                'payment_reference'   => $p->order_id ?: $p->razorpay_order_id ?: ('REF-' . $p->id),
                'screenshot_url'      => $p->screenshot_path ? url($p->screenshot_path) : null,
                'status'              => $p->status,
                'verification_status' => $p->verification_status,
                'created_at'          => $p->created_at ? $p->created_at->format('d M Y, h:i A') : 'Just now',
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $formatted,
            'count'   => $formatted->count(),
        ]);
    }

    /**
     * POST /api/saas-admin/payment-settings/verify-request/{id}
     * Super Admin authorizes and activates subscription
     */
    public function verifyPaymentRequest($id)
    {
        $payment = SubscriptionPayment::findOrFail($id);
        if ($payment->verification_status === 'verified') {
            return response()->json(['success' => false, 'message' => 'Payment has already been verified.'], 400);
        }

        $company = Company::first();
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'No company found.'], 404);
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

            // 2. Generate active activation key
            ActivationKey::where('company_id', $company->id)->delete();
            $newKeyCode = 'INFYPOS-2026-KEY-' . strtoupper(substr(md5(uniqid('key_', true) . microtime()), 0, 8));
            $activeKey = ActivationKey::create([
                'company_id'          => $company->id,
                'key_code'            => $newKeyCode,
                'plan_name'           => 'INFY-POS PREMIUM',
                'price'               => 499.00,
                'status'              => 'active',
                'activated_at'        => $now,
                'expires_at'          => $newEndsAt,
                'machine_fingerprint' => \App\Services\LicenseGuardService::getLocalMachineGuid(),
            ]);

            // 3. Update Enterprise License & Subscription
            $license = EnterpriseLicenseService::ensureCurrentLicense();
            $license->status = 'ACTIVE';
            $license->save();

            $subscription = Subscription::where('license_id', $license->license_id)->latest('id')->first();
            if ($subscription) {
                $subscription->expires_at      = $newEndsAt;
                $subscription->next_billing_at = $newEndsAt;
                $subscription->status          = 'ACTIVE';
                $subscription->payment_method  = 'System UPI Payment';
                $subscription->save();
            }

            // 4. Mark Payment Verified
            $payment->status              = 'SUCCESS';
            $payment->verification_status = 'verified';
            $payment->verified_by         = auth()->id() ?: 1;
            $payment->verified_at         = $now;
            $payment->captured_at         = $now;
            $payment->save();

            // Re-issue cryptographic license token
            \App\Services\LicenseGuardService::issueLicenseToken($company, $activeKey);

            PaymentControlService::recordAudit('system_payment_verified_by_admin', [
                'payment_id'    => $payment->id,
                'order_id'      => $payment->order_id,
                'utr'           => $payment->utr,
                'amount'        => 588.82,
                'extended_days' => 30,
                'expires_at'    => $newEndsAt->toIso8601String(),
            ]);

            DB::commit();

            return response()->json([
                'success'           => true,
                'message'           => 'Payment verified successfully! Subscription activated (+30 Days).',
                'status'            => 'ACTIVE',
                'expires_at'        => $newEndsAt->toIso8601String(),
                'remaining_seconds' => max(0, $newEndsAt->timestamp - time()),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/saas-admin/payment-settings/reject-request/{id}
     */
    public function rejectPaymentRequest(Request $request, $id)
    {
        $payment = SubscriptionPayment::findOrFail($id);
        $reason = $request->input('reason', 'Transaction reference could not be verified in receiving bank account.');

        $payment->status              = 'FAILED';
        $payment->verification_status = 'rejected';
        $payment->rejection_reason    = $reason;
        $payment->save();

        PaymentControlService::recordAudit('system_payment_rejected_by_admin', [
            'payment_id' => $payment->id,
            'order_id'   => $payment->order_id,
            'utr'        => $payment->utr,
            'reason'     => $reason,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment has been rejected.',
            'status'  => 'FAILED',
        ]);
    }
}
