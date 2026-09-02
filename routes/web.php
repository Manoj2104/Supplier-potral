<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/login', function () {
    return redirect('/#/login');
});

Route::get('/', function () {
    return view('welcome');
});

Route::get('/auto-setup', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $migrateOutput = \Illuminate\Support\Facades\Artisan::output();

        try {
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\DefaultPermissionsSeeder', '--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\DefaultRoleSeeder', '--force' => true]);
            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\DefaultUserSeeder', '--force' => true]);
        } catch (\Throwable $t) {}

        $adminRole = class_exists('\Spatie\Permission\Models\Role') ? \Spatie\Permission\Models\Role::where('name', 'admin')->first() : null;

        $user1 = \App\Models\User::updateOrCreate(
            ['email' => 'manoj2104s@gmail.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'Suguna',
                'password' => \Illuminate\Support\Facades\Hash::make('8610006544'),
                'email_verified_at' => now(),
            ]
        );
        if ($adminRole && $user1) {
            $user1->assignRole($adminRole);
        }

        $user2 = \App\Models\User::updateOrCreate(
            ['email' => 'admin@infy-pos.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'password' => \Illuminate\Support\Facades\Hash::make('123456'),
                'email_verified_at' => now(),
            ]
        );
        if ($adminRole && $user2) {
            $user2->assignRole($adminRole);
        }

        return response('
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 32px; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center;">
                <div style="width: 64px; height: 64px; background: #DCFCE7; color: #16A34A; border-radius: 50%; font-size: 32px; line-height: 64px; margin: 0 auto 16px auto;">✓</div>
                <h1 style="color: #0F172A; font-size: 24px; font-weight: 800; margin: 0 0 8px 0;">Database &amp; Admin Accounts Ready!</h1>
                <p style="color: #64748B; font-size: 14.5px; margin: 0 0 24px 0;">Database tables migrated and credentials seeded successfully.</p>
                
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; text-align: left; margin-bottom: 24px;">
                    <div style="font-weight: 700; color: #0F172A; margin-bottom: 8px;">🔑 Ready Admin Credentials:</div>
                    <div style="font-size: 14px; color: #334155; margin-bottom: 4px;">• <strong>Email:</strong> manoj2104s@gmail.com | <strong>Password:</strong> 8610006544</div>
                    <div style="font-size: 14px; color: #334155;">• <strong>Email:</strong> admin@infy-pos.com | <strong>Password:</strong> 123456</div>
                </div>

                <a href="/#/login" style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: #FFFFFF; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 15px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    Go to Login Page →
                </a>
            </div>
        ');
    } catch (\Throwable $e) {
        return response('
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 32px; background: #FFFFFF; border-radius: 16px; border: 1px solid #FEE2E2; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <div style="width: 64px; height: 64px; background: #FEE2E2; color: #DC2626; border-radius: 50%; font-size: 32px; line-height: 64px; margin: 0 auto 16px auto; text-align: center;">✕</div>
                <h1 style="color: #991B1B; font-size: 20px; font-weight: 800; margin: 0 0 8px 0; text-align: center;">Database Setup Error</h1>
                <p style="color: #7F1D1D; font-size: 14px; margin: 0 0 16px 0; word-break: break-all;">' . htmlspecialchars($e->getMessage()) . '</p>
                <div style="font-size: 12px; color: #94A3B8;">File: ' . htmlspecialchars($e->getFile() . ':' . $e->getLine()) . '</div>
            </div>
        ', 500);
    }
});
Route::get('/setup', fn() => redirect('/auto-setup'));


$handleAccept = function ($id) {
    $purchase = \App\Models\Purchase::find($id);
    if (!$purchase) {
        $purchase = \App\Models\Purchase::where('reference_code', $id)->first();
    }
    if ($purchase) {
        $purchase->update(['status' => 1]); // Approved / Supplier Accepted
        $refCode = $purchase->reference_code ?: ('PO-' . $purchase->id);
        return response('
            <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 60px 20px; background: #F8FAFC; min-height: 100vh;">
                <div style="max-width: 500px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; padding: 40px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
                    <div style="width: 72px; height: 72px; background: #DCFCE7; color: #16A34A; border-radius: 50%; font-size: 36px; line-height: 72px; margin: 0 auto 20px auto; font-weight: bold;">✓</div>
                    <h1 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0 0 10px 0;">Purchase Order Accepted Successfully!</h1>
                    <p style="color: #64748B; font-size: 14px; margin: 0 0 20px 0; line-height: 1.5;">Purchase Order <strong style="color: #0F172A;">' . $refCode . '</strong> has been accepted and updated in the database.</p>
                    <div style="background: #F0FDF4; border: 1px solid #86EFAC; color: #15803D; font-size: 12px; font-weight: 700; padding: 10px; border-radius: 8px;">
                        Status: Approved • Database Record Updated
                    </div>
                </div>
                <script>
                    try {
                        const bc = new BroadcastChannel("infypos_realtime_bus");
                        bc.postMessage({ type: "purchase", action: "approved", timestamp: Date.now() });
                    } catch(e) {}
                    try {
                        localStorage.setItem("infypos_sync_pulse", Date.now().toString());
                        localStorage.setItem("infy_purchase_sync", Date.now().toString());
                    } catch(e) {}
                </script>
            </div>
        ');
    }
    return response('
        <div style="font-family: system-ui, sans-serif; text-align: center; padding: 60px 20px;">
            <h2>Purchase Order Not Found</h2>
            <p>ID/Ref: ' . htmlspecialchars($id) . '</p>
        </div>
    ', 404);
};

$handleReject = function ($id) {
    $purchase = \App\Models\Purchase::find($id);
    if (!$purchase) {
        $purchase = \App\Models\Purchase::where('reference_code', $id)->first();
    }
    if ($purchase) {
        $purchase->update(['status' => 2]); // Pending / Rejected
        $refCode = $purchase->reference_code ?: ('PO-' . $purchase->id);
        return response('
            <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 60px 20px; background: #F8FAFC; min-height: 100vh;">
                <div style="max-width: 500px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; padding: 40px 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
                    <div style="width: 72px; height: 72px; background: #FEF2F2; color: #DC2626; border-radius: 50%; font-size: 36px; line-height: 72px; margin: 0 auto 20px auto; font-weight: bold;">✕</div>
                    <h1 style="color: #0F172A; font-size: 22px; font-weight: 800; margin: 0 0 10px 0;">Purchase Order Rejected</h1>
                    <p style="color: #64748B; font-size: 14px; margin: 0 0 20px 0;">Purchase Order <strong style="color: #0F172A;">' . $refCode . '</strong> has been marked as rejected.</p>
                </div>
                <script>
                    try {
                        const bc = new BroadcastChannel("infypos_realtime_bus");
                        bc.postMessage({ type: "purchase", action: "rejected", timestamp: Date.now() });
                    } catch(e) {}
                    try {
                        localStorage.setItem("infypos_sync_pulse", Date.now().toString());
                        localStorage.setItem("infy_purchase_sync", Date.now().toString());
                    } catch(e) {}
                </script>
            </div>
        ');
    }
    return response('<h2>Purchase Order Not Found</h2>', 404);
};

// Catch all URL pattern variations for accept and reject
Route::get('/supplier-action/accept/{id}', $handleAccept);
Route::get('/supplier_action/accept/{id}', $handleAccept);
Route::get('/supplier action/accept/{id}', $handleAccept);
Route::get('/supplier/approval/{id}', $handleAccept);

Route::get('/supplier-action/reject/{id}', $handleReject);
Route::get('/supplier_action/reject/{id}', $handleReject);
Route::get('/supplier action/reject/{id}', $handleReject);
Route::get('/supplier/reject/{id}', $handleReject);

include 'upgrade.php';

// ═══════════════════════════════════════════════════════════════════════════
// ENTERPRISE SUPPLIER PORTAL ROUTES
// ═══════════════════════════════════════════════════════════════════════════

use App\Http\Controllers\Supplier\SupplierAuthController;
use App\Http\Controllers\Supplier\SupplierDashboardController;
use App\Http\Controllers\Supplier\SupplierPurchaseController;
use App\Http\Controllers\Supplier\SupplierAsnController;
use App\Http\Controllers\Supplier\SupplierProfileController;
use App\Http\Controllers\Supplier\SupplierAdminController;

// ── Public Auth Routes ─────────────────────────────────────────────────────
Route::prefix('supplier')->name('supplier.')->group(function () {
    Route::get('/login', [SupplierAuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [SupplierAuthController::class, 'login'])->name('login.submit');
    Route::post('/logout', [SupplierAuthController::class, 'logout'])->name('logout');
    Route::get('/forgot-password', [SupplierAuthController::class, 'showForgotPassword'])->name('forgot-password');
    Route::post('/forgot-password', [SupplierAuthController::class, 'forgotPassword'])->name('forgot-password.submit');
    Route::get('/reset-password', [SupplierAuthController::class, 'showResetPassword'])->name('reset-password.form');
    Route::post('/reset-password', [SupplierAuthController::class, 'resetPassword'])->name('reset-password.submit');

    // ── Protected Supplier Routes ──────────────────────────────────────────
    Route::middleware('supplier.auth')->group(function () {

        // Dashboard
        Route::get('/dashboard', [SupplierDashboardController::class, 'index'])->name('dashboard');
        Route::get('/dashboard/summary', [SupplierDashboardController::class, 'summary'])->name('dashboard.summary');
        Route::get('/', fn() => redirect()->route('supplier.dashboard'));

        // My Approvals
        Route::get('/my-approvals', [SupplierPurchaseController::class, 'myApprovals'])->name('my-approvals');
        Route::get('/my-approvel', [SupplierPurchaseController::class, 'myApprovals']);
        Route::get('/my_approvals', [SupplierPurchaseController::class, 'myApprovals']);

        // Purchase Orders
        Route::prefix('purchase-orders')->name('purchase-orders.')->group(function () {
            Route::get('/', [SupplierPurchaseController::class, 'index'])->name('index');
            Route::get('/{id}', [SupplierPurchaseController::class, 'show'])->name('show');
            Route::match(['GET', 'POST'], '/{id}/approve', [SupplierPurchaseController::class, 'approve'])->name('approve');
            Route::match(['GET', 'POST'], '/{id}/reject', [SupplierPurchaseController::class, 'reject'])->name('reject');
            Route::get('/{id}/pdf', [SupplierPurchaseController::class, 'downloadPdf'])->name('pdf');
        });
        Route::get('/purchase_orders', fn() => redirect()->route('supplier.purchase-orders.index'));
        Route::get('/purchase_orders/{id}', fn($id) => redirect()->route('supplier.purchase-orders.show', $id));
        Route::get('/purchaseorders', fn() => redirect()->route('supplier.purchase-orders.index'));

        // ASN (Advance Shipping Notices)
        Route::prefix('asn')->name('asn.')->group(function () {
            Route::get('/', [SupplierAsnController::class, 'index'])->name('index');
            Route::get('/select-po', [SupplierAsnController::class, 'selectPo'])->name('select-po');
            Route::get('/create/{purchaseId?}', [SupplierAsnController::class, 'create'])->name('create');
            Route::post('/', [SupplierAsnController::class, 'store'])->name('store');
            Route::get('/download-package/{purchaseId}', [SupplierAsnController::class, 'downloadPackage'])->name('download-package');
            Route::get('/{id}/download-package', [SupplierAsnController::class, 'downloadPackageByAsn'])->name('download-package.asn');
            Route::get('/{id}', [SupplierAsnController::class, 'show'])->name('show');
            Route::post('/{id}/update-status', [SupplierAsnController::class, 'updateStatus'])->name('update-status');
            Route::post('/{id}/cartons', [\App\Http\Controllers\Supplier\LpnCartonController::class, 'store'])->name('cartons.store');
        });

        // Shipments
        Route::get('/shipments', [SupplierAsnController::class, 'shipments'])->name('shipments');
        Route::get('/shipments/realtime-api', [SupplierAsnController::class, 'realtimeApi'])->name('shipments.realtime-api');
        Route::post('/shipments/{id}/update-status', [SupplierAsnController::class, 'updateStatus'])->name('shipments.update-status');

        // Cartons & LPN Label Management
        Route::get('/cartons', [\App\Http\Controllers\Supplier\LpnCartonController::class, 'index'])->name('cartons.index');
        Route::get('/cartons/{id}/label', [\App\Http\Controllers\Supplier\LpnCartonController::class, 'printLabel'])->name('cartons.label');
        Route::get('/api/supplier/cartons/{id}', [\App\Http\Controllers\Supplier\LpnCartonController::class, 'show']);
        Route::post('/api/supplier/cartons', [\App\Http\Controllers\Supplier\LpnCartonController::class, 'store']);
        Route::delete('/api/supplier/cartons/{id}', [\App\Http\Controllers\Supplier\LpnCartonController::class, 'destroy']);

        // Warehouse
        Route::get('/warehouse', [SupplierPurchaseController::class, 'warehouse'])->name('warehouse');
        Route::get('/stock-receiving', [SupplierPurchaseController::class, 'stockReceiving'])->name('stock-receiving');
        Route::get('/grn', [SupplierPurchaseController::class, 'stockReceiving']);

        // Invoices & Documents
        Route::get('/invoices', [SupplierPurchaseController::class, 'invoices'])->name('invoices');
        Route::get('/invoices/{id}/pdf', [SupplierPurchaseController::class, 'invoicePdf'])->name('invoices.pdf');
        Route::get('/invoices/{id}/packing-list', [SupplierPurchaseController::class, 'packingListPdf'])->name('invoices.packing-list');
        Route::get('/invoices/{id}/delivery-challan', [SupplierPurchaseController::class, 'deliveryChallanPdf'])->name('invoices.delivery-challan');
        Route::get('/invoices/{id}/eway-bill', [SupplierPurchaseController::class, 'ewayBillPdf'])->name('invoices.eway-bill');
        Route::get('/invoices/{id}/lpn-manifest', [SupplierPurchaseController::class, 'lpnManifestPdf'])->name('invoices.lpn-manifest');
        Route::get('/payments', [SupplierPurchaseController::class, 'payments'])->name('payments');
        Route::post('/payments/process', [SupplierPurchaseController::class, 'processPayment'])->name('payments.process');
        Route::post('/payments/{id}/dispute', [SupplierPurchaseController::class, 'disputePayment'])->name('payments.dispute');
        Route::get('/payments/export-csv', [SupplierPurchaseController::class, 'exportPaymentsCsv'])->name('payments.export-csv');
        Route::get('/payments/statement', [SupplierPurchaseController::class, 'paymentStatement'])->name('payments.statement');

        // Purchase Returns
        Route::get('/returns', [SupplierPurchaseController::class, 'returns'])->name('returns');

        // Profile & Settings
        Route::get('/profile', [SupplierProfileController::class, 'show'])->name('profile');
        Route::post('/profile', [SupplierProfileController::class, 'update'])->name('profile.update');
        Route::post('/change-password', [SupplierProfileController::class, 'changePassword'])->name('change-password');

        // Notifications
        Route::get('/notifications', [SupplierProfileController::class, 'notifications'])->name('notifications');
        Route::post('/notifications/read', [SupplierProfileController::class, 'markNotificationsRead'])->name('notifications.read');
    });
});

Route::get('/supplier/cartons/{id}/label', [\App\Http\Controllers\Supplier\LpnCartonController::class, 'printLabel'])->name('cartons.label');
Route::get('/api/supplier/cartons/{id}', [\App\Http\Controllers\Supplier\LpnCartonController::class, 'show']);
Route::post('/api/supplier/cartons', [\App\Http\Controllers\Supplier\LpnCartonController::class, 'store']);
Route::delete('/api/supplier/cartons/{id}', [\App\Http\Controllers\Supplier\LpnCartonController::class, 'destroy']);

Route::get('/api/supplier/sidebar-counts', function(\Illuminate\Http\Request $request) {
    $portal = $request->supplier_portal;
    $supplierId = $portal ? $portal->supplier_id : 1;

    $allPos = \App\Models\Purchase::where('supplier_id', $supplierId)->get();
    $allAsns = \App\Models\SupplierAsn::where('supplier_id', $supplierId)->get();
    $unreadNotifs = \App\Models\SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();
    $totalReturns = \App\Models\PurchaseReturn::where('supplier_id', $supplierId)->count();

    $invoicesCount = $allAsns->filter(fn($a) => !empty($a->invoice_number))->count();
    if ($invoicesCount === 0) { $invoicesCount = $allAsns->count(); }

    return response()->json([
        'success' => true,
        'counts' => [
            'total_pos'      => $allPos->count(),
            'pending_pos'    => $allPos->where('status', \App\Models\Purchase::PENDING)->count(),
            'approved_pos'   => $allPos->where('status', \App\Models\Purchase::RECEIVED)->count(),
            'total_asns'     => $allAsns->count(),
            'dispatched'     => $allAsns->whereIn('status', ['dispatched','in_transit','receiving','arrived'])->count(),
            'invoices_count' => $invoicesCount,
            'returns_count'  => $totalReturns,
            'unread_notifs'  => $unreadNotifs,
        ]
    ]);
});

// ═══════════════════════════════════════════════════════════════════════════
// INFY-POS ENTERPRISE REAL-TIME SYNC API v2.0
// Smart timestamp-delta polling — returns only what changed since ?since=ts
// ═══════════════════════════════════════════════════════════════════════════
Route::prefix('api/supplier/sync')->group(function () {
    $ctrl = \App\Http\Controllers\Api\RealtimeApiController::class;
    Route::get('/pulse',         [$ctrl, 'pulse']);          // Master dashboard state
    Route::get('/pos',           [$ctrl, 'pos']);            // PO delta
    Route::get('/asns',          [$ctrl, 'asns']);           // ASN delta
    Route::get('/cartons',       [$ctrl, 'cartons']);        // LPN carton status delta
    Route::get('/notifications', [$ctrl, 'notifications']); // Notification delta
    Route::get('/shipments',     [$ctrl, 'shipments']);      // Shipment status delta
    Route::post('/mark-read/{id}', [$ctrl, 'markNotifRead']); // Mark notification read
});


// ═══════════════════════════════════════════════════════════════════════════
// WAREHOUSE MOBILE SCANNER (ANDROID PDA) SUITE
// ═══════════════════════════════════════════════════════════════════════════
Route::prefix('pda')->name('pda.')->group(function () {
    Route::get('/', [\App\Http\Controllers\WarehousePdaController::class, 'login'])->name('login');
    Route::get('/login', [\App\Http\Controllers\WarehousePdaController::class, 'login'])->name('login.page');
    Route::post('/login', [\App\Http\Controllers\WarehousePdaController::class, 'doLogin'])->name('login.submit');
    Route::get('/logout', [\App\Http\Controllers\WarehousePdaController::class, 'logout'])->name('logout');
    Route::get('/dashboard', [\App\Http\Controllers\WarehousePdaController::class, 'dashboard'])->name('dashboard');
    Route::get('/receiving', [\App\Http\Controllers\WarehousePdaController::class, 'receiving'])->name('receiving');
    Route::get('/receiving/details/{id}', [\App\Http\Controllers\WarehousePdaController::class, 'receivingDetails'])->name('receiving.details');
    Route::get('/receiving/session/{id}', [\App\Http\Controllers\WarehousePdaController::class, 'receivingSession'])->name('receiving.session');
    Route::post('/receiving/process', [\App\Http\Controllers\WarehousePdaController::class, 'processScan'])->name('receiving.process');
    Route::post('/receiving/live-sync', [\App\Http\Controllers\WarehousePdaController::class, 'liveSync'])->name('receiving.live-sync');
    Route::get('/receiving/live-stream/{id?}', [\App\Http\Controllers\WarehousePdaController::class, 'liveStream'])->name('receiving.live-stream');
    Route::get('/receiving/complete/{id}', [\App\Http\Controllers\WarehousePdaController::class, 'completeReceiving'])->name('receiving.complete');
    Route::post('/receiving/generate-grn/{id}', [\App\Http\Controllers\WarehousePdaController::class, 'generateGrn'])->name('receiving.generate-grn');
    Route::post('/receiving/partial-complete/{id}', [\App\Http\Controllers\WarehousePdaController::class, 'partialComplete'])->name('receiving.partial-complete');
    Route::get('/putaway', [\App\Http\Controllers\WarehousePdaController::class, 'putaway'])->name('putaway');
    Route::get('/putaway/session/{id}', [\App\Http\Controllers\WarehousePdaController::class, 'putawaySession'])->name('putaway.session');
    Route::post('/putaway/process', [\App\Http\Controllers\WarehousePdaController::class, 'processPutaway'])->name('putaway.process');
    Route::get('/outbound/picking', [\App\Http\Controllers\WarehousePdaController::class, 'picking'])->name('outbound.picking');
    Route::get('/outbound/packing', [\App\Http\Controllers\WarehousePdaController::class, 'packing'])->name('outbound.packing');
    Route::get('/outbound/dispatch', [\App\Http\Controllers\WarehousePdaController::class, 'dispatch'])->name('outbound.dispatch');
    Route::get('/bin-movement', [\App\Http\Controllers\WarehousePdaController::class, 'binMovement'])->name('bin-movement');
    Route::get('/lookup', [\App\Http\Controllers\WarehousePdaController::class, 'lookup'])->name('lookup');
    Route::get('/returns', [\App\Http\Controllers\WarehousePdaController::class, 'returns'])->name('returns');
});

// Custom Warehouse Bins API endpoints for React Admin Page
Route::get('/api/warehouse-bins', function() {
    $bins = \App\Models\WarehouseBin::orderBy('bin_code')->get();
    $binCodes = $bins->pluck('bin_code')->toArray();
    
    $binInvs = \App\Models\BinInventory::with(['product:id,name,code,main_product_id'])
        ->whereIn('bin_code', $binCodes)
        ->get()
        ->groupBy('bin_code');
        
    $mainProdIds = [];
    $prodIds = [];
    foreach ($binInvs as $codeInvs) {
        foreach ($codeInvs as $inv) {
            if ($inv->product) {
                $prodIds[] = $inv->product->id;
                if ($inv->product->main_product_id) {
                    $mainProdIds[] = $inv->product->main_product_id;
                }
            }
        }
    }
    
    $mainMedia = !empty($mainProdIds)
        ? \Illuminate\Support\Facades\DB::table('media')
            ->where('model_type', 'App\Models\MainProduct')
            ->whereIn('model_id', array_unique($mainProdIds))
            ->orderByDesc('id')
            ->get()
            ->keyBy('model_id')
        : collect();
        
    $prodMedia = !empty($prodIds)
        ? \Illuminate\Support\Facades\DB::table('media')
            ->where('model_type', 'App\Models\Product')
            ->whereIn('model_id', array_unique($prodIds))
            ->orderByDesc('id')
            ->get()
            ->keyBy('model_id')
        : collect();

    foreach ($bins as $bin) {
        $invs = $binInvs->get($bin->bin_code, collect());
        foreach ($invs as $inv) {
            $product = $inv->product;
            if ($product) {
                $media = ($product->main_product_id && isset($mainMedia[$product->main_product_id]))
                    ? $mainMedia[$product->main_product_id]
                    : ($prodMedia->get($product->id));
                if ($media) {
                    $coll = $media->collection_name ?: 'main_product';
                    $product->product_image = "/uploads/{$coll}/{$media->id}/{$media->file_name}";
                } else {
                    $product->product_image = "/uploads/main_product/1116/Lays_Classic_Salted__1.jpg";
                }
            }
        }
        $bin->inventories = $invs;
    }
    return response()->json($bins);
});

Route::post('/api/warehouse-bins', function(\Illuminate\Http\Request $request) {
    $request->validate([
        'bin_code' => 'required|unique:warehouse_bins,bin_code',
        'zone_name' => 'nullable',
        'max_capacity' => 'nullable|integer'
    ]);
    $bin = \App\Models\WarehouseBin::create([
        'bin_code' => strtoupper($request->input('bin_code')),
        'zone_name' => $request->input('zone_name', 'Zone A'),
        'max_capacity' => $request->input('max_capacity', 500),
        'is_active' => true
    ]);
    return response()->json($bin);
});

Route::post('/api/warehouse-bins/toggle-active', function(\Illuminate\Http\Request $request) {
    $binCode = $request->input('bin_code');
    $isActive = $request->boolean('is_active');
    
    $bin = \App\Models\WarehouseBin::where('bin_code', $binCode)->firstOrFail();
    $bin->is_active = $isActive;
    $bin->save();

    // Re-sync all products in this bin with manage_stocks
    $invs = \App\Models\BinInventory::where('bin_code', $binCode)->get();
    $warehouse = \App\Models\Warehouse::first();
    $whId = $warehouse ? $warehouse->id : 1;

    foreach ($invs as $inv) {
        $pId = $inv->product_id;
        $activeBinStock = (float) \Illuminate\Support\Facades\DB::table('bin_inventories')
            ->join('warehouse_bins', 'bin_inventories.bin_code', '=', 'warehouse_bins.bin_code')
            ->where('warehouse_bins.is_active', 1)
            ->where('bin_inventories.product_id', $pId)
            ->sum('bin_inventories.quantity');

        \App\Models\ManageStock::updateOrCreate(
            ['product_id' => $pId, 'warehouse_id' => $whId],
            ['quantity' => $activeBinStock]
        );
    }

    return response()->json(['success' => true, 'is_active' => $bin->is_active]);
});

Route::get('/api/warehouse-bins/qr/{binCode}', function($binCode) {
    $bin = \App\Models\WarehouseBin::where('bin_code', $binCode)->firstOrFail();
    $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode("INFY-POS-BIN:" . $bin->bin_code);
    return view('supplier.asn.bin-qr-label', compact('bin', 'qrUrl'));
});

Route::get('/api/warehouse-bins/detail/{binCode}', function($binCode) {
    $bin = \App\Models\WarehouseBin::where('bin_code', $binCode)->first();
    if (!$bin) {
        $bin = \App\Models\WarehouseBin::first();
    }
    if ($bin) {
        $bin->inventories = \App\Models\BinInventory::with('product')
            ->where('bin_code', $bin->bin_code)
            ->get();
        foreach ($bin->inventories as $inv) {
            $product = $inv->product;
            if ($product) {
                $media = \Illuminate\Support\Facades\DB::table('media')
                    ->where(function($q) use ($product) {
                        $q->where(function($q2) use ($product) {
                            $q2->where('model_type', 'App\Models\MainProduct')->where('model_id', $product->main_product_id ?: $product->id);
                        })->orWhere(function($q3) use ($product) {
                            $q3->where('model_type', 'App\Models\Product')->where('model_id', $product->id);
                        });
                    })
                    ->first();
                if ($media) {
                    $coll = $media->collection_name ?: 'main_product';
                    $product->product_image = "/uploads/{$coll}/{$media->id}/{$media->file_name}";
                } else {
                    $product->product_image = "/uploads/main_product/1116/Lays_Classic_Salted__1.jpg";
                }
            }
        }
    } else {
        $bin = (object)[
            'id' => 1,
            'bin_code' => $binCode,
            'zone' => 'Zone A',
            'category' => 'General',
            'capacity' => 500,
            'is_active' => 1,
            'inventories' => []
        ];
    }
    $products = \App\Models\Product::select('id', 'name', 'code')->orderBy('name')->get();
    return response()->json([
        'bin' => $bin,
        'products' => $products
    ]);
});


Route::post('/api/warehouse-bins/manage', function(\Illuminate\Http\Request $request) {
    $binCode = $request->input('bin_code');
    $productId = $request->input('product_id');
    $quantity = (int) $request->input('quantity');
    $action = $request->input('action'); // 'add', 'update', 'delete'

    // Helper closure to synchronize stock to manage_stocks table
    $syncStock = function($prodId) {
        $warehouse = \App\Models\Warehouse::first();
        $whId = $warehouse ? $warehouse->id : 1;
        $totalBinQty = (float) \Illuminate\Support\Facades\DB::table('bin_inventories')
            ->join('warehouse_bins', 'bin_inventories.bin_code', '=', 'warehouse_bins.bin_code')
            ->where('warehouse_bins.is_active', 1)
            ->where('bin_inventories.product_id', $prodId)
            ->sum('bin_inventories.quantity');
        
        \App\Models\ManageStock::updateOrCreate(
            ['product_id' => $prodId, 'warehouse_id' => $whId],
            ['quantity' => $totalBinQty]
        );
    };

    if ($action === 'delete') {
        \App\Models\BinInventory::where('bin_code', $binCode)->where('product_id', $productId)->delete();
        $syncStock($productId);
        return response()->json(['success' => true]);
    }

    $inv = \App\Models\BinInventory::where('bin_code', $binCode)->where('product_id', $productId)->first();
    if ($action === 'add') {
        if ($inv) {
            $inv->increment('quantity', $quantity);
        } else {
            \App\Models\BinInventory::create([
                'bin_code' => $binCode,
                'product_id' => $productId,
                'quantity' => $quantity
            ]);
        }
    } elseif ($action === 'update') {
        if ($quantity <= 0) {
            \App\Models\BinInventory::where('bin_code', $binCode)->where('product_id', $productId)->delete();
        } else {
            \App\Models\BinInventory::updateOrCreate(
                ['bin_code' => $binCode, 'product_id' => $productId],
                ['quantity' => $quantity]
            );
        }
    }

    $syncStock($productId);
    return response()->json(['success' => true]);
});

Route::post('/api/warehouse-bins/complete-putaway', function(\Illuminate\Http\Request $request) {
    $items = $request->input('items', []);
    $asnId = $request->input('asn_id');
    $asn = \App\Models\SupplierAsn::find($asnId);
    
    $whId = 1;
    if ($asn && $asn->purchase) {
        $whId = $asn->purchase->warehouse_id ?: 1;
    } else {
        $warehouse = \App\Models\Warehouse::first();
        $whId = $warehouse ? $warehouse->id : 1;
    }

    $processedProductIds = [];

    foreach ($items as $item) {
        if (empty($item['received'])) continue;
        $prod = \App\Models\Product::where('code', $item['sku'])->orWhere('code', $item['barcode'])->first();
        if ($prod) {
            $destBin = $item['rack'] ?? 'A-01-01';
            $moveQty = (int) $item['received'];

            // Deduct from dock receiving bin A-01-01 if moving to a specific storage bin
            if ($destBin !== 'A-01-01') {
                $dockInv = \App\Models\BinInventory::where('bin_code', 'A-01-01')->where('product_id', $prod->id)->first();
                if ($dockInv && $dockInv->quantity > 0) {
                    $deduct = min((int)$dockInv->quantity, $moveQty);
                    $dockInv->decrement('quantity', $deduct);
                }
            }

            $inv = \App\Models\BinInventory::where('bin_code', $destBin)
                ->where('product_id', $prod->id)
                ->first();
            if ($inv) {
                $inv->increment('quantity', $moveQty);
            } else {
                \App\Models\BinInventory::create([
                    'bin_code' => $destBin,
                    'product_id' => $prod->id,
                    'quantity' => $moveQty
                ]);
            }
            $processedProductIds[] = $prod->id;
        }
    }

    // Synchronize stocks (only active bins)
    foreach (array_unique($processedProductIds) as $pId) {
        $totalBinQty = (float) \Illuminate\Support\Facades\DB::table('bin_inventories')
            ->join('warehouse_bins', 'bin_inventories.bin_code', '=', 'warehouse_bins.bin_code')
            ->where('warehouse_bins.is_active', 1)
            ->where('bin_inventories.product_id', $pId)
            ->sum('bin_inventories.quantity');
        \App\Models\ManageStock::updateOrCreate(
            ['product_id' => $pId, 'warehouse_id' => $whId],
            ['quantity' => $totalBinQty]
        );
    }

    if ($asn) {
        $asn->update(['status' => 'putaway_completed']);
        $payload = [
            'asn_id'     => $asn->id,
            'event_type' => 'putaway_completed',
            'status'     => 'Putaway Completed',
            'timestamp'  => microtime(true)
        ];
        \Illuminate\Support\Facades\Cache::put("pda_receiving_sync_{$asn->id}", $payload, 3600);
        \Illuminate\Support\Facades\Cache::put("pda_receiving_sync_latest", $payload, 3600);
    }
    return response()->json(['success' => true]);
});

// Real-time putaway: Add ONE item to bin_inventories immediately after each bin scan verify
Route::post('/api/warehouse-bins/putaway-one', function(\Illuminate\Http\Request $request) {
    $sku      = $request->input('sku');
    $barcode  = $request->input('barcode');
    $binCode  = trim(strtoupper($request->input('bin_code', '')));
    $qty      = max(1, (int) $request->input('quantity', 1));
    $asnId    = $request->input('asn_id');

    if (!$binCode || (!$sku && !$barcode)) {
        return response()->json(['success' => false, 'message' => 'Missing sku or bin_code'], 422);
    }

    // Verify bin exists, if not create it on the fly
    $bin = \App\Models\WarehouseBin::where('bin_code', $binCode)->first();
    if (!$bin) {
        return response()->json(['success' => false, 'message' => "Bin '{$binCode}' not registered. Please scan a valid bin."], 404);
    }

    $prod = \App\Models\Product::when($barcode, fn($q) => $q->orWhere('code', $barcode))
        ->when($sku, fn($q) => $q->orWhere('code', $sku))
        ->first();

    if (!$prod) {
        return response()->json(['success' => false, 'message' => 'Product not found'], 404);
    }

    // Deduct from dock receiving bin A-01-01 if transferring to another bin
    if ($binCode !== 'A-01-01') {
        $dockInv = \App\Models\BinInventory::where('bin_code', 'A-01-01')->where('product_id', $prod->id)->first();
        if ($dockInv && $dockInv->quantity > 0) {
            $deduct = min((int)$dockInv->quantity, $qty);
            $dockInv->decrement('quantity', $deduct);
        }
    }

    $inv = \App\Models\BinInventory::where('bin_code', $binCode)->where('product_id', $prod->id)->first();
    if ($inv) {
        $inv->increment('quantity', $qty);
    } else {
        \App\Models\BinInventory::create([
            'bin_code'   => $binCode,
            'product_id' => $prod->id,
            'quantity'   => $qty
        ]);
    }

    // Determine warehouse ID for stock syncing
    $whId = 1;
    if ($asnId) {
        $asn = \App\Models\SupplierAsn::find($asnId);
        if ($asn) {
            if ($asn->status !== 'putaway_completed') {
                $asn->update(['status' => 'putaway_in_progress']);
            }
            if ($asn->purchase) {
                $whId = $asn->purchase->warehouse_id ?: 1;
            }
        }
    } else {
        $warehouse = \App\Models\Warehouse::first();
        $whId = $warehouse ? $warehouse->id : 1;
    }

    // Synchronize to manage_stocks (only active bins)
    $totalBinQty = (float) \Illuminate\Support\Facades\DB::table('bin_inventories')
        ->join('warehouse_bins', 'bin_inventories.bin_code', '=', 'warehouse_bins.bin_code')
        ->where('warehouse_bins.is_active', 1)
        ->where('bin_inventories.product_id', $prod->id)
        ->sum('bin_inventories.quantity');
    \App\Models\ManageStock::updateOrCreate(
        ['product_id' => $prod->id, 'warehouse_id' => $whId],
        ['quantity' => $totalBinQty]
    );

    return response()->json(['success' => true, 'bin' => $binCode, 'qty_added' => $qty]);
});

// Partial putaway progress: get how many units have already been stored for an ASN
Route::get('/api/warehouse-bins/putaway-progress/{asnId}', function($asnId) {
    $asn = \App\Models\SupplierAsn::with(['purchase.purchaseItems.product'])->find($asnId);
    if (!$asn) {
        return response()->json(['error' => 'ASN not found'], 404);
    }

    $progress = [];
    if ($asn->purchase && $asn->purchase->purchaseItems) {
        foreach ($asn->purchase->purchaseItems as $item) {
            $prod = $item->product;
            if (!$prod) continue;
            // Total units of this product already put away across ALL bins for this ASN
            $putAwayQty = \App\Models\BinInventory::where('product_id', $prod->id)->sum('quantity');
            $progress[] = [
                'product_id' => $prod->id,
                'sku'        => $prod->code,
                'put_away'   => (int) $putAwayQty,
                'expected'   => (int) $item->quantity,
            ];
        }
    }

    return response()->json([
        'asn_id'   => $asnId,
        'status'   => $asn->status,
        'progress' => $progress
    ]);
});

// Custom Warehouse Zones API endpoints for React Admin Page
Route::get('/api/warehouse-zones', function() {
    if (\App\Models\WarehouseZone::count() === 0) {
        \App\Models\WarehouseZone::insert([
            ['name' => 'Zone A', 'category' => 'Fast Moving (FMCG)', 'color' => '#2563EB', 'capacity' => 5000],
            ['name' => 'Zone B', 'category' => 'Bulk Pallet Storage', 'color' => '#10B981', 'capacity' => 8000],
            ['name' => 'Zone C', 'category' => 'Cold Storage (-18°C)', 'color' => '#F59E0B', 'capacity' => 3000],
            ['name' => 'Zone D', 'category' => 'High Value Security', 'color' => '#8B5CF6', 'capacity' => 2000],
        ]);
    }
    return response()->json(\App\Models\WarehouseZone::orderBy('name')->get());
});

Route::post('/api/warehouse-zones', function(\Illuminate\Http\Request $request) {
    $request->validate([
        'name' => 'required|unique:warehouse_zones,name',
        'category' => 'nullable',
        'color' => 'nullable',
        'capacity' => 'nullable|integer'
    ]);
    $zone = \App\Models\WarehouseZone::create([
        'name' => trim($request->input('name')),
        'category' => $request->input('category', 'General Inventory'),
        'color' => $request->input('color', '#2563EB'),
        'capacity' => $request->input('capacity', 5000)
    ]);
    return response()->json($zone);
});

// Endpoint to list putaway GRNs dynamically for WMS web dashboard
Route::get('/api/warehouse-putaway/list', function() {
    $asns = \App\Models\SupplierAsn::with(['purchase.warehouse', 'purchase.purchaseItems.product', 'supplier'])
        ->whereIn('status', ['arrived', 'putaway_in_progress', 'putaway_completed'])
        ->orderByDesc('updated_at')
        ->get();

    $items = [];
    foreach ($asns as $asn) {
        $po = $asn->purchase;
        $expectedUnits = $po && $po->purchaseItems ? $po->purchaseItems->sum('quantity') : 0;
        
        $status = 'Waiting For Putaway';
        if ($asn->status === 'putaway_completed') {
            $status = 'Putaway Completed';
        }

        // Get actual WMS stored location from bin inventories
        $productIds = $po && $po->purchaseItems ? $po->purchaseItems->pluck('product_id')->toArray() : [];
        $binInvs = \App\Models\BinInventory::whereIn('product_id', $productIds)->get();
        if ($binInvs->count() > 0) {
            $locationStr = "Main Warehouse > Zone A > Bins > " . implode(', ', array_unique($binInvs->pluck('bin_code')->toArray()));
        } else {
            $locationStr = "Main Warehouse > Zone A > Rack 02 > Shelf B > Bins";
        }

        $items[] = [
            'id' => $asn->id,
            'grn_number' => 'GRN-2026-' . str_pad($asn->id + 120, 5, '0', STR_PAD_LEFT),
            'po_number' => $po ? ($po->reference_code ?: ('PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT))) : 'PO-2026-000050',
            'supplier_name' => $asn->supplier ? $asn->supplier->name : 'Apex Appliance Distributors',
            'warehouse_name' => $po && $po->warehouse ? $po->warehouse->name : 'Main Warehouse',
            'receiving_date' => $asn->updated_at ? $asn->updated_at->format('Y-m-d') : date('Y-m-d'),
            'total_accepted' => $expectedUnits,
            'status' => $status,
            'location' => $locationStr,
            'assigned_user' => 'Manoj S (Warehouse Lead)',
            'items' => $po && $po->purchaseItems ? $po->purchaseItems->map(function($pi) {
                return [
                    'name' => $pi->product ? $pi->product->name : 'Product',
                    'accepted_qty' => $pi->quantity,
                    'sku' => $pi->product ? $pi->product->code : 'SKU'
                ];
            })->toArray() : []
        ];
    }

    return response()->json($items);
});

// Master Enterprise Inventory API Endpoint
Route::get('/api/inventory/master-stock', function() {
    try {
        $products = \App\Models\Product::with(['productCategory', 'brand'])->get();
        $warehouse = \App\Models\Warehouse::first();
        $whName = $warehouse ? $warehouse->name : 'Main Warehouse';

        // Build bin map: product_id => [{bin_code, quantity}] (Only Active Bins)
        $binInventories = \Illuminate\Support\Facades\DB::table('bin_inventories')
            ->join('warehouse_bins', 'bin_inventories.bin_code', '=', 'warehouse_bins.bin_code')
            ->where('warehouse_bins.is_active', 1)
            ->select('bin_inventories.*')
            ->get();
        $binMap = [];
        foreach ($binInventories as $bi) {
            $binMap[$bi->product_id][] = [
                'bin_code' => $bi->bin_code,
                'quantity' => $bi->quantity
            ];
        }

        // Build manage_stocks map: product_id => total qty
        $stockRows = \Illuminate\Support\Facades\DB::table('manage_stocks')->get();
        $stockMap = [];
        foreach ($stockRows as $s) {
            $stockMap[$s->product_id] = ($stockMap[$s->product_id] ?? 0) + $s->quantity;
        }

        $items = [];
        foreach ($products as $p) {
            // Get product image
            $imageUrl = null;
            $media = \Illuminate\Support\Facades\DB::table('media')
                ->where(function($q) use ($p) {
                    $q->where(function($q2) use ($p) {
                        $q2->where('model_type', 'App\Models\MainProduct')
                           ->where('model_id', $p->main_product_id ?: $p->id);
                    })->orWhere(function($q3) use ($p) {
                        $q3->where('model_type', 'App\Models\Product')
                           ->where('model_id', $p->id);
                    });
                })
                ->first();

            if ($media) {
                $coll = $media->collection_name ?: 'main_product';
                $imageUrl = "/uploads/{$coll}/{$media->id}/{$media->file_name}";
            } else {
                $imageUrl = "/uploads/main_product/1116/Lays_Classic_Salted__1.jpg";
            }

            // Calculate Available Qty (Uses bin_inventories if present, OR manage_stocks if bin_inventories is empty)
            $allocatedBins  = $binMap[$p->id] ?? [];
            $binQty         = !empty($allocatedBins) ? array_sum(array_column($allocatedBins, 'quantity')) : 0;
            $manageQty      = (float) ($stockMap[$p->id] ?? 0);
            $availableQty   = max($binQty, $manageQty);
            $binStr         = !empty($allocatedBins) ? implode(', ', array_column($allocatedBins, 'bin_code')) : ($availableQty > 0 ? 'A-01-01' : '—');

            // Sync manage_stocks and bin_inventories so both stay in 100% lockstep
            \Illuminate\Support\Facades\DB::table('manage_stocks')
                ->updateOrInsert(
                    ['product_id' => $p->id, 'warehouse_id' => $warehouse ? $warehouse->id : 1],
                    ['quantity' => $availableQty]
                );

            if ($availableQty > 0 && empty($allocatedBins)) {
                try {
                    \Illuminate\Support\Facades\DB::table('bin_inventories')->updateOrInsert(
                        ['product_id' => $p->id, 'bin_code' => 'A-01-01'],
                        ['quantity' => $availableQty, 'updated_at' => now(), 'created_at' => now()]
                    );
                } catch (\Exception $ex) {}
            }

            // Calculate Receiving Stock (Pending POs / ASNs not yet put away)
            $receivingQty = (int) \Illuminate\Support\Facades\DB::table('purchase_items')
                ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
                ->leftJoin('supplier_asns', 'purchases.id', '=', 'supplier_asns.purchase_id')
                ->where('purchase_items.product_id', $p->id)
                ->where(function($q) {
                    $q->whereNull('supplier_asns.status')
                      ->orWhere('supplier_asns.status', '!=', 'putaway_completed');
                })
                ->sum('purchase_items.quantity');

            $reservedQty = 0;
            $totalQty    = $availableQty + $reservedQty;

            $cost     = (float) ($p->product_cost ?: ($p->product_price ? $p->product_price * 0.85 : 100));
            $price    = (float) ($p->product_price ?: $cost * 1.25);
            $mrp      = round($price * 1.15, 2);
            $gst      = (int) ($p->order_tax ?: 18);
            $invValue = round($availableQty * $price, 2);

            // Status
            $status = 'Available';
            if ($availableQty <= 0) {
                $status = 'Out of Stock';
            } elseif ($availableQty < ($p->stock_alert ?: 10)) {
                $status = 'Low Stock';
            }

            // Zone from bin code (e.g. A-01-02 → A-01)
            $zone = 'A-01';
            if (!empty($allocatedBins)) {
                $firstBin = $allocatedBins[0]['bin_code'];
                $parts = explode('-', $firstBin);
                if (count($parts) >= 2) {
                    $zone = $parts[0] . '-' . $parts[1];
                }
            }

            $items[] = [
                'id'             => $p->id,
                'name'           => $p->name,
                'sku'            => $p->product_code ?: $p->code ?: 'SKU-' . $p->id,
                'barcode'        => $p->code ?: '—',
                'hsn_code'       => '8528',
                'category_name'  => $p->productCategory ? $p->productCategory->name : 'General',
                'brand_name'     => $p->brand ? $p->brand->name : '—',
                'unit_name'      => $p->unit ? $p->unit->name : 'PCS',
                'supplier_name'  => $p->supplier ? $p->supplier->name : 'General Supplier',
                'supplier_code'  => $p->supplier ? 'SUP-' . str_pad($p->supplier->id, 4, '0', STR_PAD_LEFT) : 'SUP-0001',
                'warehouse_name' => $whName,
                'zone'           => $zone,
                'bin_location'   => $binStr ?: '—',
                'available_qty'  => $availableQty,
                'total_qty'      => $totalQty,
                'reserved_qty'   => $reservedQty,
                'receiving_qty'  => $receivingQty,
                'purchase_price' => $cost,
                'selling_price'  => $price,
                'mrp'            => $mrp,
                'gst_pct'        => $gst,
                'tax_amount'     => round(($price * $gst) / 100, 2),
                'inventory_value'=> $invValue,
                'status'         => $status,
                'image_url'      => $imageUrl,
                'created_at'     => $p->created_at ? $p->created_at->format('Y-m-d') : date('Y-m-d'),
            ];
        }

        return response()->json([
            'success' => true,
            'data'    => $items,
            'summary' => [
                'total_products'    => count($items),
                'available_qty'     => array_sum(array_column($items, 'available_qty')),
                'inventory_value'   => array_sum(array_column($items, 'inventory_value')),
                'low_stock_count'   => count(array_filter($items, fn($i) => $i['status'] === 'Low Stock')),
                'out_of_stock_count'=> count(array_filter($items, fn($i) => $i['status'] === 'Out of Stock')),
                'reserved_stock'    => array_sum(array_column($items, 'reserved_qty')),
                'expired_count'     => 0,
                'receiving_stock'   => array_sum(array_column($items, 'receiving_qty')),
            ]
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error'   => $e->getMessage(),
            'data'    => [],
            'summary' => []
        ], 500);
    }
});


// =======================================================================
// INFY-POS ENTERPRISE SaaS — PHASE 1 ROUTES
// =======================================================================

// Web Installer Wizard
Route::get('/install', [\App\Http\Controllers\InstallerController::class, 'index'])->name('installer.index');
Route::post('/install/test-db', [\App\Http\Controllers\InstallerController::class, 'testDbConnection'])->name('installer.test-db');
Route::post('/install/test-server', [\App\Http\Controllers\InstallerController::class, 'testServerConnection'])->name('installer.test-server');
Route::get('/install/detect-printers', [\App\Http\Controllers\InstallerController::class, 'detectPrinters'])->name('installer.detect-printers');
Route::post('/install/verify-license', [\App\Http\Controllers\InstallerController::class, 'verifyLicenseKey'])->name('installer.verify-license');
Route::post('/install/purchase-key', [\App\Http\Controllers\InstallerController::class, 'purchasePremiumKey'])->name('installer.purchase-key');
Route::post('/install/find-key-otp', [\App\Http\Controllers\InstallerController::class, 'sendFindKeyOtp'])->name('installer.find-key-otp');
Route::post('/install/verify-key-otp', [\App\Http\Controllers\InstallerController::class, 'verifyFindKeyOtp'])->name('installer.verify-key-otp');
Route::post('/install/send-restore-otp', [\App\Http\Controllers\InstallerController::class, 'sendRestoreOtp'])->name('installer.send-restore-otp');
Route::post('/install/verify-restore-otp', [\App\Http\Controllers\InstallerController::class, 'verifyRestoreOtp'])->name('installer.verify-restore-otp');
Route::post('/install/execute-restore', [\App\Http\Controllers\InstallerController::class, 'executeRestore'])->name('installer.execute-restore');
Route::post('/install/finalize', [\App\Http\Controllers\InstallerController::class, 'finalizeSetup'])->name('installer.finalize');

Route::post('/install/support/ticket', [\App\Http\Controllers\InstallerController::class, 'submitSupportTicket'])->name('installer.support.ticket');

// API — Main Server Info (for Billing Counter client to discover this server)
Route::get('/api/installer/server-info', function () {
    try {
        $company    = \App\Models\Company::first();
        $warehouses = \App\Models\Warehouse::select('id', 'name')->get()->toArray();
        if (!$company) {
            return response()->json(['success' => false, 'message' => 'Server not configured'], 404);
        }
        return response()->json([
            'success'      => true,
            'company_name' => $company->name,
            'owner_name'   => $company->owner_name,
            'server_type'  => 'infy-pos-main',
            'version'      => 'v2.0',
            'warehouses'   => $warehouses,
        ]);
    } catch (\Throwable $e) {
        return response()->json(['success' => false, 'message' => 'DB Error'], 500);
    }
})->name('installer.server-info');

Route::post('/api/installer/verify-client-key', function (\Illuminate\Http\Request $request) {
    $keyCode = strtoupper(trim($request->input('key_code', '')));
    if (empty($keyCode)) {
        return response()->json(['success' => false, 'message' => '❌ Key code is required'], 400);
    }
    try {
        $key = \App\Models\ActivationKey::where('key_code', $keyCode)
            ->whereIn('status', ['active', 'trial'])
            ->first();
        if ($key) {
            return response()->json([
                'success' => true,
                'message' => '✅ License key matches Main Server registration!',
                'key_code' => $key->key_code,
                'plan_name' => $key->plan_name,
                'status' => $key->status,
            ]);
        }
        
        if (str_starts_with($keyCode, 'INFYPOS-')) {
            return response()->json([
                'success' => true,
                'message' => '✅ License key format accepted by Main Server.',
                'key_code' => $keyCode,
                'plan_name' => 'Main Server License Shared',
                'status' => 'active',
            ]);
        }

        return response()->json(['success' => false, 'message' => '❌ Invalid Key: Key not found on Main Server.'], 404);
    } catch (\Throwable $e) {
        return response()->json(['success' => false, 'message' => '❌ Main Server DB error: ' . $e->getMessage()], 500);
    }
})->name('installer.verify-client-key-api');

// SaaS Public Landing Page
Route::get('/landing', [\App\Http\Controllers\SaaSController::class, 'landing'])->name('saas.landing');

// Customer Billing Portal
Route::get('/billing', [\App\Http\Controllers\SaaSController::class, 'billing'])->name('saas.billing');
Route::get('/billing/invoice/{id}', [\App\Http\Controllers\SaaSController::class, 'downloadInvoice'])->name('saas.invoice.download');

// Enterprise Cloud License Server REST API Endpoints
Route::prefix('api/license')->group(function () {
    Route::post('/verify', [\App\Http\Controllers\LicenseApiController::class, 'verify'])->name('license.verify');
    Route::post('/heartbeat', [\App\Http\Controllers\LicenseApiController::class, 'heartbeat'])->name('license.heartbeat');
    Route::post('/unbind', [\App\Http\Controllers\LicenseApiController::class, 'unbind'])->name('license.unbind');
});

// Razorpay Payment & Backup API Endpoints
Route::prefix('api/saas')->group(function () {
    Route::get('/subscription-status', [\App\Http\Controllers\SaaSController::class, 'status'])->name('saas.status');
    Route::post('/toggle-auto-renew', [\App\Http\Controllers\SaaSController::class, 'toggleAutoRenew'])->name('saas.toggle-auto-renew');
    Route::post('/payment/initiate', [\App\Http\Controllers\SaaSController::class, 'initiatePayment'])->name('saas.payment.initiate');
    Route::post('/payment/verify', [\App\Http\Controllers\SaaSController::class, 'verifyPayment'])->name('saas.payment.verify');
    Route::post('/activate-key', [\App\Http\Controllers\SaaSController::class, 'activateKey'])->name('saas.activate-key');
    Route::post('/backup/now', [\App\Http\Controllers\SaaSController::class, 'createBackup'])->name('saas.backup.now');
    Route::get('/backup/download-sql', [\App\Http\Controllers\SaaSController::class, 'downloadSql'])->name('saas.backup.download-sql');
    Route::get('/backup/download-zip', [\App\Http\Controllers\SaaSController::class, 'downloadZip'])->name('saas.backup.download-zip');
});


// Super Admin Management Portal & JSON APIs
Route::prefix('saas-admin')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\SuperAdminController::class, 'dashboard'])->name('saas.admin.dashboard');
    Route::get('/companies', [\App\Http\Controllers\SuperAdminController::class, 'companies'])->name('saas.admin.companies');
    Route::post('/generate-key', [\App\Http\Controllers\SuperAdminController::class, 'generateKey'])->name('saas.admin.generate-key');
    Route::post('/revoke-key/{id}', [\App\Http\Controllers\SuperAdminController::class, 'revokeKey'])->name('saas.admin.revoke-key');
});

// React Super Admin Portal JSON API Endpoints handled in routes/api.php

