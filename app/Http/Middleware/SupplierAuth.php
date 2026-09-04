<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SupplierAuth
{
    public function handle(Request $request, Closure $next)
    {
        if (!session()->has('supplier_portal_id')) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            return redirect()->route('supplier.login')->with('error', 'Please login to access the supplier portal.');
        }

        // Refresh supplier data into request
        $portal = \App\Models\SupplierPortal::with('supplier')->find(session('supplier_portal_id'));
        if (!$portal || !$portal->isActive()) {
            session()->forget('supplier_portal_id');
            return redirect()->route('supplier.login')->with('error', 'Your account has been deactivated. Please contact support.');
        }

        $request->merge(['supplier_portal' => $portal]);
        view()->share('supplierPortal', $portal);
        view()->share('supplierInfo', $portal->supplier);

        return $next($request);
    }
}
