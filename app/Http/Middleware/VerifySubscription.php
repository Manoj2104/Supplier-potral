<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Company;
use App\Services\LicenseService;
use App\Services\MachineLockService;
use Carbon\Carbon;

class VerifySubscription
{
    // These paths are never blocked regardless of subscription status
    protected $exempt = [
        '/',                  // Root SPA — welcome.blade.php handles DB check client-side via JS
        'login', 'logout', 'forgot-password', 'reset-password',
        'api/login', 'api/logout', 'api/forgot-password', 'api/reset-password',
        'api/m1/login', 'api/m1/logout', 'api/m1/forgot-password', 'api/m1/reset-password',
        'install', 'install/*', 'saas/*', 'landing',
        'api/config', 'api/front-setting', 'api/permissions', 'api/settings', 'api/languages', 'api/languages/*', 'api/currencies', 'api/currencies/*', 'api/report-product-quantity',
        'api/saas/*', 'api/payment/*', 'api/saas-admin/*', 'api/saas-admin', 'api/license/*', 'api/subscription*',
        'api/v1/license/*', 'api/v1/license', 'api/v1/subscription*', 'api/v1/subscription',
        'api/billing/*', 'api/billing', 'api/webhooks/*', 'api/webhooks',
    ];

    public function handle(Request $request, Closure $next)
    {
        // On cloud/Render or for any supplier portal request, bypass local POS hardware license check
        if (str_contains($request->getHost(), 'onrender.com') || $request->is('supplier*') || $request->is('api/supplier*') || env('PORTAL_MODE') === 'supplier') {
            return $next($request);
        }

        // Skip middleware for exempt/installer routes
        foreach ($this->exempt as $pattern) {
            if ($request->is($pattern)) {
                return $next($request);
            }
        }

        try {
            DB::connection()->getPdo();
            if (!\Illuminate\Support\Facades\Schema::hasTable('users') || \App\Models\User::count() === 0) {
                if ($request->is('saas-admin*') || $request->is('api/saas-admin*') || $request->is('api/license*') || $request->is('api/v1/license*')) {
                    return $next($request);
                }
                return redirect('/install');
            }
            $company = Company::first();
            if (!$company) {
                if ($request->is('saas-admin*') || $request->is('api/saas-admin*') || $request->is('api/license*') || $request->is('api/v1/license*')) {
                    return $next($request);
                }
                return redirect('/install');
            }
        } catch (\Throwable $e) {
            if ($request->is('saas-admin*') || $request->is('api/saas-admin*') || $request->is('api/license*') || $request->is('api/v1/license*')) {
                return $next($request);
            }
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Database not installed', 'redirect' => '/install'], 500);
            }
            return redirect('/install');
        }

        // ── BYPASS PREVENTION: IMMEDIATE DB STATUS CHECK ──
        if ($company->status === 'suspended' || $company->status === 'revoked') {
            if ($request->is('api/*')) {
                return response()->json([
                    'success'      => false,
                    'error'        => 'ACCOUNT_SUSPENDED',
                    'error_code'   => 'ACCOUNT_SUSPENDED',
                    'status'       => 'suspended',
                    'is_suspended' => true,
                    'message'      => 'This terminal account has been suspended by Super Admin.',
                    'billing'      => url('/#/app/subscription'),
                ], 403);
            }
            return redirect('/#/app/subscription');
        }

        if ($company->status === 'expired' || $company->status === 'locked') {
                // Check if company has an active future key in local database (offline resilience)
                $localFutureKey = \App\Models\ActivationKey::where('company_id', $company->id)
                    ->where('expires_at', '>', Carbon::now())
                    ->latest('id')
                    ->first();
                $isLocalFuture = ($company->subscription_ends_at && Carbon::parse($company->subscription_ends_at)->isFuture()) || $localFutureKey;

                // Before returning 402, check if company was activated/renewed in Cloud!
                $cloudActivated = \Illuminate\Support\Facades\Cache::remember('cloud_auto_resurrect_' . $company->id, 3, function () use ($company) {
                    try {
                        $cloudComp = \App\Services\CloudLicenseServerService::findCompanyRecord($company);
                        if ($cloudComp && (strtolower($cloudComp['status'] ?? '') === 'active' || strtolower($cloudComp['status'] ?? '') === 'trial')) {
                                $subEnds = !empty($cloudComp['subscription_ends_at']) ? Carbon::parse($cloudComp['subscription_ends_at']) : null;
                                $trialEnds = !empty($cloudComp['trial_ends_at']) ? Carbon::parse($cloudComp['trial_ends_at']) : null;
                                $effEnds = $subEnds ?: $trialEnds;
                                if ($effEnds && $effEnds->isFuture()) {
                                    return [
                                        'status'  => strtolower($cloudComp['status']),
                                        'ends_at' => $effEnds,
                                    ];
                                }
                            }
                    } catch (\Throwable $e) {}
                    return null;
                });

                if ($cloudActivated) {
                    $company->status = $cloudActivated['status'];
                    $company->subscription_ends_at = $cloudActivated['ends_at'];
                    $company->save();

                    $localKey = \App\Models\ActivationKey::where('company_id', $company->id)->where('status', 'active')->latest('id')->first();
                    if (!$localKey) {
                        $localKey = new \App\Models\ActivationKey();
                        $localKey->company_id = $company->id;
                        $localKey->key_code   = 'INFYPOS-2026-KEY-' . strtoupper(substr(md5(uniqid()), 0, 8));
                        $localKey->status     = 'active';
                        $localKey->expires_at = $cloudActivated['ends_at'];
                        $localKey->plan_name  = ($cloudActivated['status'] === 'trial') ? 'INFY-POS FREE TRIAL (14 Days)' : 'INFY-POS PREMIUM (30 Days)';
                        $localKey->price      = 499;
                        $localKey->save();
                    }
                    \App\Services\LicenseGuardService::issueLicenseToken($company, $localKey);
                } elseif ($isLocalFuture) {
                    // Offline resilience: Local license is legitimately future-dated!
                    $company->status = 'active';
                    if ($localFutureKey) {
                        $company->subscription_ends_at = $localFutureKey->expires_at;
                        $localFutureKey->status = 'active';
                        $localFutureKey->save();
                        \App\Services\LicenseGuardService::issueLicenseToken($company, $localFutureKey);
                    }
                    $company->save();
                } else {
                    if ($request->is('api/*')) {
                        return response()->json([
                            'success'     => false,
                            'error'       => 'SUBSCRIPTION_EXPIRED',
                            'error_code'  => 'LICENSE_EXPIRED',
                            'message'     => 'Your subscription has expired or was terminated by Super Admin. Please renew to continue.',
                            'billing'     => url('/#/app/subscription'),
                        ], 402);
                    }
                    return redirect('/#/app/subscription');
                }
            }

            // ── BYPASS PREVENTION: ASYMMETRIC RSA-2048 LICENSEGUARD VALIDATION ──
            $guardResult = \App\Services\LicenseGuardService::validate();

            if (!$guardResult['valid']) {
                // Check if we can auto-issue token for active company
                $activeKey = \App\Models\ActivationKey::where('company_id', $company->id)->where('status', 'active')->latest('id')->first();
                if ($company->status === 'active' && $activeKey && $activeKey->expires_at && Carbon::parse($activeKey->expires_at)->isFuture()) {
                    \App\Services\LicenseGuardService::issueLicenseToken($company, $activeKey);
                    $guardResult = \App\Services\LicenseGuardService::validate();
                }

                if (!$guardResult['valid']) {
                    $lockReason = $guardResult['message'] ?? 'Subscription Expired / License Locked';
                    $lockStatus = strtolower($guardResult['error_code'] ?? 'expired');

                    if ($request->is('api/*')) {
                        return response()->json([
                            'success'     => false,
                            'error'       => 'LICENSE_UNAUTHORIZED',
                            'error_code'  => $guardResult['error_code'] ?? 'UNAUTHORIZED',
                            'message'     => $lockReason,
                        ], 403);
                    }

                    return response()->json([
                        'success'     => false,
                        'error'       => 'LICENSE_UNAUTHORIZED',
                        'error_code'  => $guardResult['error_code'] ?? 'UNAUTHORIZED',
                        'message'     => $lockReason,
                    ], 403);
                }
            }

            $status   = $company->status;
            $claims   = $guardResult['claims'] ?? [];
            $expiresAt = $claims['expires_at'] ?? 0;
            $daysLeft = $expiresAt > 0 ? max(0, (int)round(($expiresAt - time()) / 86400)) : 365;

            // Active subscription or active trial with valid cryptographic token
            if ($guardResult['valid'] && ($claims['status'] ?? '') === 'active') {
                $this->flashBannerIfLow($request, $daysLeft);
                return $next($request);
            }


            // Grace period (3 days after expiry)
            if ($status === 'grace_period' || ($localLic['status'] ?? '') === 'grace_period') {
                $request->session()->put('subscription_banner', [
                    'type'    => 'grace',
                    'message' => 'Subscription expired! You are in a 3-day grace period. Renew for ₹499/mo to continue.',
                    'color'   => 'orange',
                ]);
                return $next($request);
            }

            // Expired:
            // API calls → return 402 JSON
            if ($request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error'   => 'Subscription expired.',
                    'message' => 'Your ₹499/month subscription has expired. Please renew to continue.',
                    'billing' => url('/#/app/subscription'),
                ], 402);
            }

            return $next($request);


        return $next($request);
    }

    private function flashBannerIfLow(Request $request, int $daysLeft): void
    {
        if ($daysLeft <= 7 && $daysLeft > 3) {
            $request->session()->put('subscription_banner', [
                'type'    => 'warning',
                'message' => "⚠️ Subscription expires in {$daysLeft} days. Renew to avoid interruption.",
                'color'   => 'yellow',
            ]);
        } elseif ($daysLeft <= 3 && $daysLeft > 0) {
            $request->session()->put('subscription_banner', [
                'type'    => 'urgent',
                'message' => "🔴 Only {$daysLeft} day(s) left! Renew your ₹499/month subscription NOW.",
                'color'   => 'red',
            ]);
        }
    }
}
