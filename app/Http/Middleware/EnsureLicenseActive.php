<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\EnterpriseLicenseService;

class EnsureLicenseActive
{
    // Routes always permitted regardless of license state (authentication, license checks, webhooks)
    protected $exemptPatterns = [
        'api/v1/license/*',
        'api/v1/subscription/renew',
        'api/license/*',
        'api/saas/*',
        'api/saas-admin/*',
        'api/super-admin/*',
        'api/payment/*',
        'api/billing/*',
        'api/webhooks/*',
        'api/login',
        'api/logout',
        'login',
        'logout',
        'install*',
        'saas-admin*',
        'super-admin*',
        'api/config',
        'api/front-setting',
    ];

    /**
     * Handle an incoming request and enforce server-authoritative license verification.
     */
    public function handle(Request $request, Closure $next)
    {
        // Bypass for cloud/render or supplier portal endpoints
        if (str_contains($request->getHost(), 'onrender.com') || $request->is('supplier*') || $request->is('api/supplier*') || env('PORTAL_MODE') === 'supplier') {
            return $next($request);
        }

        // Never trust client assertion headers
        if ($request->hasHeader('X-License-Active')) {
            // Client attempting to override license validity - strictly ignored
        }

        // Check exemption
        foreach ($this->exemptPatterns as $pattern) {
            if ($request->is($pattern)) {
                return $next($request);
            }
        }

        $installationId = $request->header('X-Installation-Id', $request->input('installation_id'));
        $machineHash    = $request->header('X-Machine-Hash', $request->input('machine_hash'));

        $evaluation = EnterpriseLicenseService::evaluateStatus($installationId, $machineHash, $request->ip() ?: '127.0.0.1');

        if (!$evaluation['valid']) {
            $errorCode = $evaluation['error_code'] ?? ($evaluation['status'] ?? 'LICENSE_EXPIRED');
            $message   = $evaluation['message'] ?? 'Active subscription required to access this feature.';
            $statusCode = ($errorCode === 'LICENSE_EXPIRED' || $errorCode === 'EXPIRED') ? 402 : 403;

            return response()->json([
                'success'           => false,
                'valid'             => false,
                'status'            => $evaluation['status'] ?? 'EXPIRED',
                'error_code'        => $errorCode,
                'message'           => $message,
                'server_time'       => $evaluation['server_time'] ?? now()->toIso8601String(),
                'remaining_seconds' => 0,
                'billing_url'       => url('/#/app/subscription'),
            ], $statusCode);
        }

        return $next($request);
    }
}
