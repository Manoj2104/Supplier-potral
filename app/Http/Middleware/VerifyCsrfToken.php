<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',
        'pda/*',
        'install/test-db',
        'install/verify-license',
        'install/finalize',
        'api/saas/*',
        'saas-admin/generate-key',
        'saas-admin/revoke-key/*',
        'supplier/login',
        'supplier/logout',
        'supplier/purchase-orders/*/approve',
        'supplier/purchase-orders/*/reject',
        'supplier/purchase-orders/*',
        'supplier/asn/*',
        'supplier/shipments/*',
        'supplier/notifications/*',
        'supplier/cartons/*',
        'supplier/*',
    ];
}
