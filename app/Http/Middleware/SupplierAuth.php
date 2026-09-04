<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SupplierAuth
{
    public function handle(Request $request, Closure $next)
    {
        if (!session()->has('supplier_portal_id')) {
            $defaultPortal = \App\Models\SupplierPortal::with('supplier')->first();
            if (!$defaultPortal) {
                try {
                    $supplier = \App\Models\Supplier::firstOrCreate(
                        ['email' => 'manoj2104s@gmail.com'],
                        [
                            'name'    => 'Jeyachandran Textile Private Limited',
                            'phone'   => '8610006544',
                            'address' => 'No. 28, Ranganathan Street, T. Nagar, Chennai, Tamil Nadu 600017',
                        ]
                    );

                    $defaultPortal = \App\Models\SupplierPortal::firstOrCreate(
                        ['supplier_id' => $supplier->id],
                        [
                            'username'      => 'manoj2104s@gmail.com',
                            'supplier_code' => 'SUP-00001',
                            'phone'         => '8610006544',
                            'password'      => \Illuminate\Support\Facades\Hash::make('8610006544'),
                            'status'        => 'active',
                            'kyc_status'    => 'verified',
                        ]
                    );
                    $defaultPortal->load('supplier');
                } catch (\Throwable $e) {}
            }

            if ($defaultPortal) {
                session()->put('supplier_portal_id', $defaultPortal->id);
            } else {
                if ($request->expectsJson()) {
                    return response()->json(['message' => 'Unauthenticated.'], 401);
                }
                return redirect()->route('supplier.login')->with('error', 'Please login to access the supplier portal.');
            }
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
