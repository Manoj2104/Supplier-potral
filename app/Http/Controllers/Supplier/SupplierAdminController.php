<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierPortal;
use App\Models\SupplierNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class SupplierAdminController extends Controller
{
    /**
     * Admin: List all supplier portal accounts
     */
    public function index()
    {
        $portals = SupplierPortal::with('supplier')->orderByDesc('created_at')->paginate(20);
        $suppliers = Supplier::whereDoesntHave('portal')->get(); // suppliers without a portal account
        return view('supplier.admin.index', compact('portals', 'suppliers'));
    }

    /**
     * Admin: Create a new supplier portal account
     */
    public function store(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id|unique:supplier_portals,supplier_id',
            'password'    => 'required|min:6',
        ]);

        $supplier = Supplier::findOrFail($request->supplier_id);

        // Generate supplier code
        $lastCode = SupplierPortal::orderByDesc('id')->value('supplier_code');
        $lastNum  = $lastCode ? (int) substr($lastCode, 4) : 0;
        $code     = 'SUP-' . str_pad($lastNum + 1, 5, '0', STR_PAD_LEFT);

        $portal = SupplierPortal::create([
            'supplier_id'   => $supplier->id,
            'username'      => $supplier->email,
            'password'      => Hash::make($request->password),
            'supplier_code' => $code,
            'phone'         => $supplier->phone,
            'status'        => 'active',
            'kyc_status'    => 'pending',
        ]);

        // Send welcome email
        if ($request->send_email) {
            try {
                Mail::send('emails.supplier.welcome', [
                    'supplier'       => $supplier,
                    'portal'         => $portal,
                    'tempPassword'   => $request->password,
                    'loginUrl'       => url('/supplier/login'),
                ], function ($m) use ($supplier) {
                    $m->to($supplier->email)
                      ->subject('Welcome to INFY-POS Supplier Portal – Your Account Credentials');
                });
            } catch (\Exception $e) {
                // silently log
            }
        }

        // Seed welcome notification
        SupplierNotification::createForSupplier($supplier->id, 'system',
            'Welcome to Supplier Portal!',
            "Your supplier portal account has been created. Supplier Code: {$code}. Login at " . url('/supplier/login'),
            ['supplier_code' => $code]
        );

        return redirect()->route('supplier.admin.index')
            ->with('success', "Portal account created for {$supplier->name}. Code: {$code}");
    }

    /**
     * Admin: Toggle supplier portal status
     */
    public function toggleStatus(Request $request, $id)
    {
        $portal = SupplierPortal::findOrFail($id);
        $newStatus = $portal->status === 'active' ? 'inactive' : 'active';
        $portal->update(['status' => $newStatus]);

        return redirect()->back()->with('success', "Supplier status updated to {$newStatus}.");
    }

    /**
     * Admin: Reset supplier password
     */
    public function resetPassword(Request $request, $id)
    {
        $request->validate(['password' => 'required|min:6']);

        $portal = SupplierPortal::with('supplier')->findOrFail($id);
        $portal->update([
            'password'       => Hash::make($request->password),
            'login_attempts' => 0,
            'locked_until'   => null,
        ]);

        if ($request->send_email) {
            try {
                Mail::send('emails.supplier.password-reset', [
                    'supplier'     => $portal->supplier,
                    'newPassword'  => $request->password,
                    'loginUrl'     => url('/supplier/login'),
                ], function ($m) use ($portal) {
                    $m->to($portal->username)
                      ->subject('INFY-POS Supplier Portal – Password Reset');
                });
            } catch (\Exception $e) {}
        }

        return redirect()->back()->with('success', 'Password reset successfully.');
    }

    /**
     * Admin: Block/unblock supplier
     */
    public function block(Request $request, $id)
    {
        $portal = SupplierPortal::findOrFail($id);
        $portal->update(['status' => 'blocked', 'login_attempts' => 0, 'locked_until' => null]);
        return redirect()->back()->with('success', 'Supplier account blocked.');
    }

    public function unblock(Request $request, $id)
    {
        $portal = SupplierPortal::findOrFail($id);
        $portal->update(['status' => 'active', 'login_attempts' => 0, 'locked_until' => null]);
        return redirect()->back()->with('success', 'Supplier account unblocked.');
    }
}
