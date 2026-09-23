<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ActivationKey;
use App\Models\Company;
use App\Models\CompanySubscription;
use App\Models\RazorpayWebhookEvent;
use App\Models\Subscription;
use App\Models\SubscriptionPayment;
use App\Services\CloudLicenseServerService;
use App\Services\EnterpriseLicenseService;
use App\Services\LicenseGuardService;
use App\Services\RazorpayService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RazorpayBillingController extends Controller
{
    /**
     * POST /api/billing/razorpay/subscription
     * Create Razorpay Subscription or Order for INFY-POS PREMIUM (₹499/Month)
     */
    public function createSubscription(Request $request)
    {
        $company = Company::first();
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'Company not found'], 404);
        }

        $amountPaise = 49900; // Authoritative ₹499 in paise (Never trust client)
        $planName = 'INFY-POS PREMIUM';
        $keyId = RazorpayService::getKeyId();

        // Check if Razorpay live credentials are set
        $isLiveCredentials = !str_contains($keyId, 'rzp_test_51Z1Z1Z1Z1Z1Z1') && !str_contains($keyId, '99999999999999');

        $subscriptionId = null;
        $orderId = null;

        if ($isLiveCredentials) {
            $subsUnsupported = \Illuminate\Support\Facades\Cache::get('razorpay_subscriptions_unsupported', false);
            if (!$subsUnsupported) {
                // Attempt Razorpay Recurring Subscription (AutoPay)
                $subRes = RazorpayService::createSubscription(null, 12, 1, [
                    'company_id'   => (string)$company->id,
                    'company_name' => $company->name,
                ]);

                if (!empty($subRes['id'])) {
                    $subscriptionId = $subRes['id'];
                } elseif (isset($subRes['http_code']) && $subRes['http_code'] === 401) {
                    \Illuminate\Support\Facades\Cache::put('razorpay_subscriptions_unsupported', true, 86400);
                }
            }

            if (!$subscriptionId) {
                // Fallback to direct Razorpay Order (UPI, Cards, NetBanking, QR)
                $orderRes = RazorpayService::createOrder($amountPaise, 'inv_' . time(), [
                    'company_id'   => (string)$company->id,
                    'company_name' => $company->name,
                ]);
                if (!empty($orderRes['id'])) {
                    $orderId = $orderRes['id'];
                }
            }
        }

        // Test/Sandbox fallback generation if mock key
        if (!$subscriptionId && !$orderId) {
            $subscriptionId = 'sub_' . strtoupper(substr(md5(uniqid('sub_', true)), 0, 14));
            $orderId = 'order_' . strtoupper(substr(md5(uniqid('ord_', true)), 0, 14));
        }

        // Record pending subscription in database
        $sub = CompanySubscription::create([
            'company_id'               => $company->id,
            'plan_name'                => $planName,
            'amount'                   => 499.00,
            'billing_interval'         => 'monthly',
            'auto_renewal'             => true,
            'payment_gateway'          => 'Razorpay',
            'razorpay_subscription_id' => $subscriptionId,
            'razorpay_order_id'        => $orderId,
            'status'                   => 'pending',
            'invoice_number'           => 'INV-2026-' . rand(10000, 99999),
        ]);

        return response()->json([
            'success'         => true,
            'key_id'          => $keyId,
            'subscription_id' => $subscriptionId,
            'order_id'        => $orderId,
            'amount'          => $amountPaise,
            'currency'        => 'INR',
            'plan_name'       => $planName,
            'company'         => $company->name,
            'prefill'         => [
                'name'    => $company->owner_name ?: 'Business Owner',
                'email'   => $company->email ?: 'admin@infypos.local',
                'contact' => $company->phone ?: '',
            ],
            'theme'           => [
                'color' => '#059669',
            ],
        ]);
    }

    /**
     * POST /api/billing/razorpay/verify
     * Cryptographically Verify Payment Signature & Authoritatively Extend License
     */
    public function verifyPayment(Request $request)
    {
        $paymentId      = trim($request->input('razorpay_payment_id') ?: $request->input('payment_id'));
        $subscriptionId = trim($request->input('razorpay_subscription_id') ?: $request->input('subscription_id'));
        $orderId        = trim($request->input('razorpay_order_id') ?: $request->input('order_id'));
        $signature      = trim($request->input('razorpay_signature') ?: $request->input('signature'));
        $paymentMethod  = $request->input('payment_method', 'Razorpay / UPI / Cards');

        if (empty($paymentId)) {
            return response()->json([
                'success'    => false,
                'error_code' => 'MISSING_PAYMENT_ID',
                'message'    => 'Missing Razorpay payment identifier.',
            ], 422);
        }

        $company = Company::first();
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'Company not found'], 404);
        }

        $keyId = RazorpayService::getKeyId();
        $isLiveCredentials = !str_contains($keyId, 'rzp_test_51Z1Z1Z1Z1Z1Z1') && !str_contains($keyId, '99999999999999');

        // Verify cryptographic signature if live credentials or signature provided
        if ($isLiveCredentials || !empty($signature)) {
            $isSubscription = !empty($subscriptionId);
            $identifier = $isSubscription ? $subscriptionId : $orderId;

            $signatureValid = RazorpayService::verifyPaymentSignature(
                $paymentId,
                $identifier,
                $signature,
                $isSubscription
            );

            if (!$signatureValid && $isLiveCredentials) {
                Log::warning('Razorpay signature verification failed', [
                    'payment_id'      => $paymentId,
                    'subscription_id' => $subscriptionId,
                    'order_id'        => $orderId,
                    'received_sig'    => $signature,
                ]);

                return response()->json([
                    'success'    => false,
                    'error_code' => 'INVALID_SIGNATURE',
                    'message'    => 'Payment verification failed: cryptographic signature mismatch.',
                ], 400);
            }
        }

        // Idempotency check: don't process duplicate payment
        $existingPayment = SubscriptionPayment::where('razorpay_payment_id', $paymentId)->first();
        if ($existingPayment && $existingPayment->status === 'captured') {
            return response()->json([
                'success' => true,
                'message' => 'Payment already verified and processed.',
                'subscription_ends_at' => $company->subscription_ends_at ? $company->subscription_ends_at->format('d M Y') : 'N/A',
                'next_billing_date'    => $company->subscription_ends_at ? $company->subscription_ends_at->format('d M Y') : 'N/A',
            ]);
        }

        // Calculate Authoritative Expiry Extension (+30 Days from current end, or from now if expired)
        $now = Carbon::now();
        $currentEnds = $company->subscription_ends_at ? Carbon::parse($company->subscription_ends_at) : null;
        if (!$currentEnds && $company->trial_ends_at) {
            $currentEnds = Carbon::parse($company->trial_ends_at);
        }

        $isCurrentlyActive = ($company->status === 'active' || $company->status === 'trial') && $currentEnds && $currentEnds->isFuture();

        if ($isCurrentlyActive) {
            $startsAt  = $currentEnds->copy();
            $newEndsAt = $currentEnds->copy()->addDays(30);
        } else {
            $startsAt  = $now->copy();
            $newEndsAt = $now->copy()->addDays(30);
        }

        // 1. Update Company Status & Expiry
        $company->status               = 'active';
        $company->auto_renew           = true;
        $company->subscription_ends_at = $newEndsAt;
        $company->save();

        // 2. Create/Update CompanySubscription
        $sub = CompanySubscription::where('razorpay_subscription_id', $subscriptionId)
            ->orWhere('razorpay_order_id', $orderId)
            ->latest('id')
            ->first();

        if (!$sub) {
            $sub = new CompanySubscription();
            $sub->company_id = $company->id;
        }

        $invoiceNumber = $sub->invoice_number ?: ('INV-2026-' . rand(10000, 99999));

        $sub->fill([
            'plan_name'                => 'INFY-POS PREMIUM',
            'amount'                   => 499.00,
            'billing_interval'         => 'monthly',
            'auto_renewal'             => true,
            'payment_gateway'          => $paymentMethod ?: 'Razorpay',
            'razorpay_payment_id'      => $paymentId,
            'razorpay_order_id'        => $orderId,
            'razorpay_subscription_id' => $subscriptionId,
            'status'                   => 'active',
            'starts_at'                => $startsAt,
            'ends_at'                  => $newEndsAt,
            'current_period_start'     => $startsAt,
            'current_period_end'       => $newEndsAt,
            'next_billing_at'          => $newEndsAt,
            'last_payment_id'          => $paymentId,
            'invoice_number'           => $invoiceNumber,
        ]);
        $sub->save();

        // 3. Record in SubscriptionPayment table
        SubscriptionPayment::create([
            'company_id'               => $company->id,
            'subscription_id'          => $sub->id,
            'razorpay_payment_id'      => $paymentId,
            'razorpay_order_id'        => $orderId,
            'razorpay_subscription_id' => $subscriptionId,
            'razorpay_signature'       => $signature,
            'amount'                   => 499.00,
            'currency'                 => 'INR',
            'status'                   => 'captured',
            'method'                   => $paymentMethod,
            'email'                    => $company->email,
            'contact'                  => $company->phone,
            'captured_at'              => $now,
            'raw_reference'            => $request->all(),
        ]);

        // 4. Update / Create ActivationKey
        $activeKey = ActivationKey::where('company_id', $company->id)->where('status', 'active')->latest('id')->first();
        if ($activeKey) {
            $activeKey->expires_at = $newEndsAt;
            $activeKey->plan_name  = 'INFY-POS PREMIUM (₹499/mo)';
            $activeKey->save();
        } else {
            $keyCode = 'INFYPOS-2026-KEY-' . strtoupper(substr(md5(uniqid() . $company->id), 0, 8));
            $activeKey = ActivationKey::create([
                'key_code'            => $keyCode,
                'company_id'          => $company->id,
                'machine_fingerprint' => LicenseGuardService::getLocalMachineGuid(),
                'plan_name'           => 'INFY-POS PREMIUM (₹499/mo)',
                'price'               => 499.00,
                'status'              => 'active',
                'activated_at'        => $now,
                'expires_at'          => $newEndsAt,
            ]);
        }

        // 5. Authoritatively re-issue LicenseGuard cryptographic token
        LicenseGuardService::issueLicenseToken($company, $activeKey);

        // 6. Sync Enterprise licensing models
        $license = EnterpriseLicenseService::ensureCurrentLicense();
        Subscription::where('license_id', $license->license_id)->update([
            'expires_at'      => $newEndsAt,
            'next_billing_at' => $newEndsAt,
            'auto_renew'      => true,
            'status'          => 'ACTIVE',
        ]);

        // 7. Live Sync to Central Cloud DB (Supabase)
        try {
            $cloudComp = CloudLicenseServerService::findCompanyRecord($company);
            $cloudCompanyId = $cloudComp['id'] ?? 3;

            CloudLicenseServerService::supabaseRequest('/companies?id=eq.' . $cloudCompanyId, 'PATCH', [
                'status'               => 'active',
                'subscription_ends_at' => $newEndsAt->toIso8601String(),
                'updated_at'           => date('c'),
            ]);

            CloudLicenseServerService::supabaseRequest('/activation_keys?company_id=eq.' . $cloudCompanyId . '&status=eq.active', 'PATCH', [
                'expires_at' => $newEndsAt->toIso8601String(),
                'updated_at' => date('c'),
            ]);
        } catch (\Throwable $cloudEx) {
            Log::warning('Cloud Supabase subscription sync after payment: ' . $cloudEx->getMessage());
        }

        $daysRemaining = max(0, Carbon::now()->diffInDays($newEndsAt, false));

        return response()->json([
            'success'              => true,
            'message'              => 'Payment ₹499 verified successfully! INFY-POS PREMIUM activated until ' . $newEndsAt->format('d M Y') . '.',
            'subscription_ends_at' => $newEndsAt->format('d M Y'),
            'next_billing_date'    => $newEndsAt->format('d M Y'),
            'days_remaining'       => $daysRemaining,
            'invoice_number'       => $invoiceNumber,
            'auto_renew'           => true,
        ]);
    }

    /**
     * POST /api/billing/razorpay/cancel
     * Cancel Recurring Auto-Renewal
     */
    public function cancelAutoRenew(Request $request)
    {
        $company = Company::first();
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'Company not found'], 404);
        }

        $sub = CompanySubscription::where('company_id', $company->id)
            ->where('status', 'active')
            ->whereNotNull('razorpay_subscription_id')
            ->latest('id')
            ->first();

        if ($sub && !empty($sub->razorpay_subscription_id)) {
            try {
                RazorpayService::cancelSubscription($sub->razorpay_subscription_id, true);
                $sub->auto_renewal = false;
                $sub->cancelled_at = Carbon::now();
                $sub->save();
            } catch (\Throwable $e) {
                Log::warning('Razorpay cancel subscription exception: ' . $e->getMessage());
            }
        }

        $company->auto_renew = false;
        $company->save();

        Subscription::where('status', 'ACTIVE')->update(['auto_renew' => false]);

        return response()->json([
            'success'    => true,
            'auto_renew' => false,
            'message'    => 'Auto-Renewal has been disabled. Your plan remains active until ' . ($company->subscription_ends_at ? $company->subscription_ends_at->format('d M Y') : 'the end of your billing cycle') . '.',
        ]);
    }

    /**
     * POST /api/webhooks/razorpay
     * Production-grade, Idempotent Webhook Handler for Razorpay Subscription Lifecycle
     */
    public function webhook(Request $request)
    {
        $rawPayload = $request->getContent();
        $signature  = $request->header('X-Razorpay-Signature', '');

        // 1. Verify Webhook Signature
        if (!RazorpayService::verifyWebhookSignature($rawPayload, $signature)) {
            Log::warning('Razorpay webhook signature verification failed', [
                'ip' => $request->ip(),
                'signature' => $signature,
            ]);
            return response()->json(['error' => 'Invalid webhook signature'], 400);
        }

        $payload = json_decode($rawPayload, true);
        if (!is_array($payload)) {
            return response()->json(['error' => 'Invalid JSON payload'], 400);
        }

        $event     = $payload['event'] ?? '';
        $eventId   = $payload['event_id'] ?? ($payload['id'] ?? md5($rawPayload));
        $hash      = hash('sha256', $rawPayload);

        // 2. Strict Idempotency Check
        $existingEvent = RazorpayWebhookEvent::where('event_id', $eventId)->first();
        if ($existingEvent) {
            return response()->json(['status' => 'already_processed', 'event_id' => $eventId]);
        }

        // Record incoming webhook event
        $webhookLog = RazorpayWebhookEvent::create([
            'event_id'          => $eventId,
            'event_type'        => $event,
            'payload_hash'      => $hash,
            'payload'           => $rawPayload,
            'processing_status' => 'processing',
        ]);

        try {
            DB::beginTransaction();

            $company = Company::first();

            switch ($event) {
                case 'subscription.charged':
                case 'payment.captured':
                    $paymentObj = $payload['payload']['payment']['entity'] ?? [];
                    $subObj     = $payload['payload']['subscription']['entity'] ?? [];

                    $paymentId = $paymentObj['id'] ?? ('pay_' . md5(uniqid()));
                    $subId     = $subObj['id'] ?? ($paymentObj['subscription_id'] ?? null);
                    $orderId   = $paymentObj['order_id'] ?? null;
                    $amount    = ($paymentObj['amount'] ?? 49900) / 100;
                    $method    = $paymentObj['method'] ?? 'Razorpay AutoPay';

                    $now = Carbon::now();
                    $newEndsAt = ($company && $company->subscription_ends_at && Carbon::parse($company->subscription_ends_at)->isFuture())
                        ? Carbon::parse($company->subscription_ends_at)->addDays(30)
                        : $now->copy()->addDays(30);

                    if ($company) {
                        $company->status               = 'active';
                        $company->auto_renew           = true;
                        $company->subscription_ends_at = $newEndsAt;
                        $company->save();

                        CompanySubscription::create([
                            'company_id'               => $company->id,
                            'plan_name'                => 'INFY-POS PREMIUM',
                            'amount'                   => $amount,
                            'billing_interval'         => 'monthly',
                            'auto_renewal'             => true,
                            'payment_gateway'          => $method,
                            'razorpay_payment_id'      => $paymentId,
                            'razorpay_order_id'        => $orderId,
                            'razorpay_subscription_id' => $subId,
                            'status'                   => 'active',
                            'starts_at'                => $now,
                            'ends_at'                  => $newEndsAt,
                            'current_period_start'     => $now,
                            'current_period_end'       => $newEndsAt,
                            'next_billing_at'          => $newEndsAt,
                            'last_payment_id'          => $paymentId,
                            'invoice_number'           => 'INV-2026-' . rand(10000, 99999),
                        ]);

                        SubscriptionPayment::firstOrCreate(
                            ['razorpay_payment_id' => $paymentId],
                            [
                                'company_id'               => $company->id,
                                'razorpay_order_id'        => $orderId,
                                'razorpay_subscription_id' => $subId,
                                'amount'                   => $amount,
                                'currency'                 => $paymentObj['currency'] ?? 'INR',
                                'status'                   => 'captured',
                                'method'                   => $method,
                                'email'                    => $paymentObj['email'] ?? $company->email,
                                'contact'                  => $paymentObj['contact'] ?? $company->phone,
                                'captured_at'              => $now,
                                'raw_reference'            => $payload,
                            ]
                        );

                        // Extend active key & license token
                        $activeKey = ActivationKey::where('company_id', $company->id)->where('status', 'active')->latest('id')->first();
                        if ($activeKey) {
                            $activeKey->expires_at = $newEndsAt;
                            $activeKey->save();
                            LicenseGuardService::issueLicenseToken($company, $activeKey);
                        }

                        EnterpriseLicenseService::ensureCurrentLicense();
                    }
                    break;

                case 'payment.failed':
                    $paymentObj = $payload['payload']['payment']['entity'] ?? [];
                    $subId      = $paymentObj['subscription_id'] ?? null;

                    if ($company) {
                        // Grace period: allow 7 days before suspending store
                        $company->status = 'grace_period';
                        $company->save();

                        if ($subId) {
                            CompanySubscription::where('razorpay_subscription_id', $subId)->update([
                                'grace_period_until' => Carbon::now()->addDays(7),
                            ]);
                        }

                        SubscriptionPayment::create([
                            'company_id'               => $company->id,
                            'razorpay_payment_id'      => $paymentObj['id'] ?? ('fail_' . md5(uniqid())),
                            'razorpay_order_id'        => $paymentObj['order_id'] ?? null,
                            'razorpay_subscription_id' => $subId,
                            'amount'                   => ($paymentObj['amount'] ?? 49900) / 100,
                            'currency'                 => $paymentObj['currency'] ?? 'INR',
                            'status'                   => 'failed',
                            'failure_reason'           => $paymentObj['error_description'] ?? 'Recurring payment failed',
                            'raw_reference'            => $payload,
                        ]);
                    }
                    break;

                case 'subscription.cancelled':
                case 'subscription.halted':
                    if ($company) {
                        $company->auto_renew = false;
                        $company->save();

                        $subEntity = $payload['payload']['subscription']['entity'] ?? [];
                        if (!empty($subEntity['id'])) {
                            CompanySubscription::where('razorpay_subscription_id', $subEntity['id'])->update([
                                'auto_renewal' => false,
                                'cancelled_at' => Carbon::now(),
                            ]);
                        }
                    }
                    break;

                default:
                    Log::info("Razorpay unhandled webhook event: {$event}");
                    break;
            }

            DB::commit();

            $webhookLog->processing_status = 'processed';
            $webhookLog->processed_at      = Carbon::now();
            $webhookLog->save();

            return response()->json(['success' => true, 'event' => $event]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Razorpay Webhook Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            $webhookLog->processing_status = 'failed';
            $webhookLog->error_message     = $e->getMessage();
            $webhookLog->save();

            return response()->json(['error' => 'Webhook processing failed', 'message' => $e->getMessage()], 500);
        }
    }
}
