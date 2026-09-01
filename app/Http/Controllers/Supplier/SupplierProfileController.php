<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use App\Models\SupplierPortal;
use App\Models\SupplierNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class SupplierProfileController extends Controller
{
    public function show(Request $request)
    {
        $portal      = $request->supplier_portal;
        $supplierId  = $portal ? $portal->supplier_id : 1;
        $supplierInfo = ($portal && $portal->supplier) ? $portal->supplier : (\App\Models\Supplier::find($supplierId) ?? (object)[
            'name'    => 'Jeyachandran Textile Private Limited',
            'email'   => 'manoj2104s@gmail.com',
            'phone'   => '+918610006544',
            'city'    => 'Chennai',
            'country' => 'India',
            'address' => '123, Industrial Estate, Chennai, Tamil Nadu',
        ]);

        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();

        $loginHistory = $portal ? $portal->portalSessions()->orderByDesc('login_at')->limit(10)->get() : collect([]);

        return view('supplier.profile.index', compact('portal', 'supplierInfo', 'unreadCount', 'loginHistory'));
    }

    public function update(Request $request)
    {
        $portal = $request->supplier_portal;

        $request->validate([
            'contact_person'  => 'nullable|string|max:100',
            'phone'           => 'nullable|string|max:20',
            'alt_phone'       => 'nullable|string|max:20',
            'gst'             => 'nullable|string|max:20',
            'pan'             => 'nullable|string|max:15',
            'bank_name'       => 'nullable|string|max:100',
            'account_number'  => 'nullable|string|max:30',
            'ifsc'            => 'nullable|string|max:15',
            'upi'             => 'nullable|string|max:50',
        ]);

        $updateData = $request->only([
            'contact_person', 'phone', 'alt_phone', 'gst', 'pan', 'fssai',
            'bank_name', 'account_number', 'ifsc', 'upi',
        ]);

        // Handle profile image
        if ($request->hasFile('profile_image')) {
            if ($portal->profile_image) {
                Storage::disk('public')->delete($portal->profile_image);
            }
            $updateData['profile_image'] = $request->file('profile_image')->store('supplier-portal/profiles', 'public');
        }

        // Handle company logo
        if ($request->hasFile('company_logo')) {
            if ($portal->company_logo) {
                Storage::disk('public')->delete($portal->company_logo);
            }
            $updateData['company_logo'] = $request->file('company_logo')->store('supplier-portal/logos', 'public');
        }

        $portal->update($updateData);

        return redirect()->route('supplier.profile')
            ->with('success', 'Profile updated successfully!');
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password'         => 'required|min:8|confirmed',
        ]);

        $portal = $request->supplier_portal;

        if (!$portal->checkPassword($request->current_password)) {
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect. Please check and try again.'
                ], 422);
            }
            return back()->withErrors(['current_password' => 'Current password is incorrect.']);
        }

        $portal->update(['password' => Hash::make($request->password)]);

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Your password has been changed successfully!'
            ]);
        }

        return back()->with('success', 'Password changed successfully!');
    }

    public function notifications(Request $request)
    {
        $portal      = $request->supplier_portal;
        $supplierId  = $portal ? $portal->supplier_id : 1;

        $notifications = SupplierNotification::where('supplier_id', $supplierId)
            ->orderByDesc('created_at')
            ->paginate(25);

        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();
        $totalCount  = SupplierNotification::where('supplier_id', $supplierId)->count();
        $poCount     = SupplierNotification::where('supplier_id', $supplierId)->where(function($q) {
            $q->whereIn('type', ['new_po', 'po_approved', 'po_rejected'])
              ->orWhere('title', 'like', '%PO%')
              ->orWhere('title', 'like', '%Order%');
        })->count();

        $shipmentCount = SupplierNotification::where('supplier_id', $supplierId)->where(function($q) {
            $q->whereIn('type', ['asn_accepted', 'shipment', 'asn'])
              ->orWhere('title', 'like', '%Shipment%')
              ->orWhere('title', 'like', '%ASN%')
              ->orWhere('title', 'like', '%Dispatch%');
        })->count();

        $paymentCount = SupplierNotification::where('supplier_id', $supplierId)->where(function($q) {
            $q->whereIn('type', ['payment_released', 'payment', 'invoice_approved'])
              ->orWhere('title', 'like', '%Payment%')
              ->orWhere('title', 'like', '%Invoice%');
        })->count();

        $kpis = [
            'total'    => $totalCount,
            'unread'   => $unreadCount,
            'po'       => $poCount,
            'shipment' => $shipmentCount,
            'payment'  => $paymentCount,
        ];

        return view('supplier.notifications', compact('portal', 'notifications', 'unreadCount', 'kpis'));
    }

    public function markNotificationsRead(Request $request)
    {
        $portal = $request->supplier_portal;
        SupplierNotification::where('supplier_id', $portal->supplier_id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
