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
        'install', 'install/*', 'saas/*', 'landing', 'supplier', 'supplier/*', 'supplier-action/*',
        'api/config', 'api/front-setting', 'api/permissions', 'api/settings', 'api/languages', 'api/languages/*', 'api/currencies', 'api/currencies/*', 'api/report-product-quantity',
        'api/saas/*', 'api/payment/*', 'api/saas-admin/*', 'api/saas-admin', 'api/license/*', 'api/subscription*',
    ];

    public function handle(Request $request, Closure $next)
    {
        // Skip middleware for exempt/installer routes
        foreach ($this->exempt as $pattern) {
            if ($request->is($pattern)) {
                return $next($request);
            }
        }

        $isCloud = env('APP_ENV') === 'production' || str_contains($request->getHost(), 'render.com');

        try {
            DB::connection()->getPdo();

            // In cloud deployments, auto-ensure company exists and allow all traffic
            if ($isCloud) {
                if (\Illuminate\Support\Facades\Schema::hasTable('companies')) {
                    $company = Company::first();
                    if (!$company) {
                        try {
                            Company::create([
                                'name' => 'Suguna Enterprise WMS & POS Hub',
                                'email' => 'admin@infypos.com',
                                'phone' => '1234567890',
                                'status' => 1,
                            ]);
                        } catch (\Throwable $ce) {}
                    }
                }
                return $next($request);
            }

            if (!\Illuminate\Support\Facades\Schema::hasTable('users') || \App\Models\User::count() === 0) {
                if ($request->is('saas-admin*') || $request->is('api/saas-admin*') || $request->is('api/license*')) {
                    return $next($request);
                }
                return redirect('/install');
            }
            $company = Company::first();
            if (!$company) {
                if ($request->is('saas-admin*') || $request->is('api/saas-admin*') || $request->is('api/license*')) {
                    return $next($request);
                }
                return redirect('/install');
            }
        } catch (\Throwable $e) {
            if ($isCloud) {
                return $next($request);
            }
            if ($request->is('saas-admin*') || $request->is('api/saas-admin*') || $request->is('api/license*')) {
                return $next($request);
            }
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Database not installed', 'redirect' => '/install'], 500);
            }
            return redirect('/install');
        }

            // ── BYPASS PREVENTION: ASYMMETRIC RSA-2048 LICENSEGUARD VALIDATION ──
            $guardResult = \App\Services\LicenseGuardService::validate();

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
