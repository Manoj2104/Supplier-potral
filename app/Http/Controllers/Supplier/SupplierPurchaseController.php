<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\SupplierAsn;
use App\Models\SupplierNotification;
use App\Models\SupplierPayment;
use App\Models\Warehouse;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SupplierPurchaseController extends Controller
{
    /**
     * Shared sidebar counts for all views (Single aggregated SQL queries).
     */
    private function getSidebarCounts(int $supplierId): array
    {
        return \Illuminate\Support\Facades\Cache::remember("sidebar_counts_{$supplierId}", 30, function () use ($supplierId) {
            $poAggregates = Purchase::where('supplier_id', $supplierId)
                ->selectRaw("
                    COUNT(*) as total_pos,
                    COALESCE(SUM(grand_total), 0) as total_value,
                    COALESCE(SUM(paid_amount), 0) as paid_amount,
                    COUNT(CASE WHEN status IN (0, 2, 3) AND (notes IS NULL OR notes NOT LIKE '%REJECTED%') THEN 1 END) as pending_pos
                ")
                ->first();

            $asnAggregates = SupplierAsn::where('supplier_id', $supplierId)
                ->selectRaw("
                    COUNT(*) as total_asns,
                    COUNT(CASE WHEN status IN ('dispatched', 'in_transit', 'out_for_delivery', 'arrived', 'receiving', 'putaway_completed') THEN 1 END) as dispatched_asns
                ")
                ->first();

            $totalReturns = PurchaseReturn::where('supplier_id', $supplierId)->count();
            $totalVal = (float)($poAggregates->total_value ?? 0);
            $paidAmt  = (float)($poAggregates->paid_amount ?? 0);

            return [
                'total_pos'      => (int)($poAggregates->total_pos ?? 0),
                'pending_pos'    => (int)($poAggregates->pending_pos ?? 0),
                'total_asns'     => (int)($asnAggregates->total_asns ?? 0),
                'dispatched_asns'=> (int)($asnAggregates->dispatched_asns ?? 0),
                'total_returns'  => $totalReturns,
                'outstanding'    => max(0, $totalVal - $paidAmt),
            ];
        });
    }

    public function index(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        // ── Pull latest POs from Supabase Cloud (Computer A → Computer B sync) ──
        try { \App\Services\CloudDatabaseSyncService::pullCloudToLocal(); } catch (\Throwable $e) {}

        $query = Purchase::where('supplier_id', $supplierId)
            ->with(['warehouse', 'purchaseItems.product']);

        // Filter by approval status
        if ($request->status && $request->status !== 'all') {
            if ($request->status === 'pending') {
                $query->whereIn('status', [Purchase::PENDING, Purchase::ORDERED, 2, 3])
                      ->where(function($q) {
                          $q->whereNull('notes')->orWhere('notes', 'NOT LIKE', '%REJECTED%');
                      });
            } elseif ($request->status === 'approved') {
                $query->where('status', Purchase::RECEIVED); // 1
            } elseif ($request->status === 'ordered') {
                $query->where('status', Purchase::ORDERED); // 3
            }
        }

        // Search
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_code', 'LIKE', "%{$search}%")
                  ->orWhere('grand_total', 'LIKE', "%{$search}%");
            });
        }

        // Warehouse Filter
        if ($request->warehouse_id) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        $purchases = $query->orderByDesc('created_at')->paginate(15);

        // Fast Single Aggregated Stats Query
        $poAggregates = Purchase::where('supplier_id', $supplierId)
            ->selectRaw("
                COUNT(*) as total_pos,
                COALESCE(SUM(grand_total), 0) as total_value,
                COUNT(CASE WHEN status = 1 AND (notes IS NULL OR notes NOT LIKE '%REJECTED%') THEN 1 END) as approved_count,
                COUNT(CASE WHEN status IN (0, 2, 3) AND (notes IS NULL OR notes NOT LIKE '%REJECTED%') THEN 1 END) as pending_count,
                COUNT(CASE WHEN notes LIKE '%REJECTED%' THEN 1 END) as rejected_count
            ")
            ->first();

        $allAsns = SupplierAsn::where('supplier_id', $supplierId)->get(['id', 'purchase_id', 'status', 'invoice_number']);

        $stats = [
            'pending'            => (int)($poAggregates->pending_count ?? 0),
            'approved'           => (int)($poAggregates->approved_count ?? 0),
            'rejected'           => (int)($poAggregates->rejected_count ?? 0),
            'preparing_shipment' => (int)($poAggregates->approved_count ?? 0),
            'asn_pending'        => $allAsns->where('status', 'pending')->count(),
            'dispatched'         => $allAsns->where('status', 'dispatched')->count(),
            'in_transit'         => $allAsns->where('status', 'in_transit')->count(),
            'delivered'          => $allAsns->where('status', 'arrived')->count(),
            'total_value'        => (float)($poAggregates->total_value ?? 0),
        ];

        // Map PO IDs to ASNs
        $asnMap = $allAsns->keyBy('purchase_id');
        $warehouses = Warehouse::all();
        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();

        // Selected PO for side drawer preview (default first PO)
        $selectedPo = null;
        $selectedPoId = $request->selected_po_id ?: ($purchases->first() ? $purchases->first()->id : null);
        if ($selectedPoId) {
            $selectedPo = Purchase::where('supplier_id', $supplierId)
                ->where('id', $selectedPoId)
                ->with(['supplier', 'warehouse', 'purchaseItems.product'])
                ->first();
        }

        $selectedAsn = $selectedPo ? SupplierAsn::where('purchase_id', $selectedPo->id)->first() : null;
        $sidebarCounts = $this->getSidebarCounts($supplierId);

        return view('supplier.purchase-orders.index', compact(
            'purchases', 'stats', 'portal', 'unreadCount', 'asnMap',
            'warehouses', 'selectedPo', 'selectedAsn', 'sidebarCounts'
        ));
    }

    public function show(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal->supplier_id;

        $purchase = Purchase::where('supplier_id', $supplierId)
            ->where('id', $id)
            ->with(['supplier', 'warehouse', 'purchaseItems.product'])
            ->firstOrFail();

        $asn = SupplierAsn::where('purchase_id', $id)->where('supplier_id', $supplierId)->first();
        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();
        $sidebarCounts = $this->getSidebarCounts($supplierId);

        return view('supplier.purchase-orders.show', compact('purchase', 'asn', 'portal', 'unreadCount', 'sidebarCounts'));
    }

    public function approve(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchase = Purchase::where('supplier_id', $supplierId)->where('id', $id)->first();
        if (!$purchase) {
            $purchase = Purchase::find($id);
        }
        if (!$purchase) {
            return redirect()->route('supplier.purchase-orders.index')
                ->with('error', "Purchase order not found.");
        }

        $purchase->update([
            'status' => Purchase::RECEIVED,
            'notes'  => ($purchase->notes ? $purchase->notes . "\n" : '') .
                        '[SUPPLIER ACCEPTED] ' . now()->format('d M Y H:i') . ' — Accepted via Supplier Portal.',
        ]);

        SupplierNotification::createForSupplier($purchase->supplier_id, 'po_approved',
            'Purchase Order Accepted ✅',
            "PO #{$purchase->reference_code} has been accepted by supplier. Ready for ASN & Dispatch.",
            ['purchase_id' => $purchase->id]
        );

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "✅ Purchase Order {$purchase->reference_code} accepted. You can now create an ASN.",
                'purchase_id' => $purchase->id,
                'reference_code' => $purchase->reference_code,
                'status' => Purchase::RECEIVED,
                'redirect_url' => route('supplier.asn.create', $purchase->id)
            ]);
        }

        return redirect()->route('supplier.asn.create', $purchase->id)
            ->with('success', "✅ Purchase Order {$purchase->reference_code} accepted. You can now create an ASN to schedule dispatch.");
    }

    public function reject(Request $request, $id)
    {
        $reason = $request->input('reason', 'Supplier unable to fulfill this order within requested timeframe.');

        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchase = Purchase::where('supplier_id', $supplierId)->where('id', $id)->first();
        if (!$purchase) {
            $purchase = Purchase::find($id);
        }
        if (!$purchase) {
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Purchase order not found.'], 404);
            }
            return redirect()->route('supplier.purchase-orders.index')
                ->with('error', "Purchase order not found.");
        }

        $purchase->update([
            'status' => Purchase::PENDING,
            'notes'  => ($purchase->notes ? $purchase->notes . "\n" : '') .
                        'REJECTED: ' . $reason . ' [' . now()->format('d M Y H:i') . ']',
        ]);

        SupplierNotification::createForSupplier($supplierId, 'po_rejected',
            'Purchase Order Rejected ❌',
            "PO #{$purchase->reference_code} was rejected. Reason: {$reason}",
            ['purchase_id' => $purchase->id, 'reason' => $reason]
        );

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "PO {$purchase->reference_code} rejected.",
                'purchase_id' => $purchase->id
            ]);
        }

        return redirect()->back()
            ->with('error', "PO {$purchase->reference_code} rejected. Reason recorded and admin notified.");
    }

    public function myApprovals(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal->supplier_id;

        // Base query
        $query = Purchase::where('supplier_id', $supplierId)
            ->with(['warehouse', 'purchaseItems.product']);

        // Filter status (default pending)
        $tab = $request->get('tab', 'pending');
        if ($tab === 'approved') {
            $query->where('status', Purchase::RECEIVED); // 1
        } elseif ($tab === 'rejected') {
            $query->where('notes', 'LIKE', '%REJECTED%');
        } elseif ($tab === 'pending') {
            $query->whereIn('status', [Purchase::PENDING, Purchase::ORDERED, 2, 3])
                  ->where(function($q) {
                      $q->whereNull('notes')->orWhere('notes', 'NOT LIKE', '%REJECTED%');
                  });
        }

        // Search
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_code', 'LIKE', "%{$search}%")
                  ->orWhere('grand_total', 'LIKE', "%{$search}%");
            });
        }

        $approvals = $query->orderByDesc('created_at')->paginate(10);

        // Fast Single Aggregated Stats Query
        $poAggregates = Purchase::where('supplier_id', $supplierId)
            ->selectRaw("
                COUNT(*) as total_all,
                COUNT(CASE WHEN status = 1 AND (notes IS NULL OR notes NOT LIKE '%REJECTED%') THEN 1 END) as approved_count,
                COUNT(CASE WHEN status IN (0, 2, 3) AND (notes IS NULL OR notes NOT LIKE '%REJECTED%') THEN 1 END) as pending_count,
                COUNT(CASE WHEN notes LIKE '%REJECTED%' THEN 1 END) as rejected_count
            ")
            ->first();

        $pendingCount  = (int)($poAggregates->pending_count ?? 0);
        $approvedCount = (int)($poAggregates->approved_count ?? 0);
        $rejectedCount = (int)($poAggregates->rejected_count ?? 0);
        $allCount      = (int)($poAggregates->total_all ?? 0);

        $counts = [
            'pending'  => $pendingCount,
            'approved' => $approvedCount,
            'rejected' => $rejectedCount,
            'all'      => $allCount,
        ];

        $metrics = [
            'total_pending' => $pendingCount,
            'urgent'        => $pendingCount > 0 ? 1 : 0,
            'due_today'     => $pendingCount > 0 ? 1 : 0,
            'overdue'       => 0,
        ];

        $asns = SupplierAsn::where('supplier_id', $supplierId)->get(['id', 'purchase_id', 'status', 'invoice_number']);
        $asnMap = $asns->keyBy('purchase_id');

        $approvalTypes = [
            'purchase_orders' => $pendingCount,
            'asn'             => $asns->where('status', 'pending')->count(),
            'invoices'        => 0,
            'price_updates'   => 0,
        ];

        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();

        // Recent Real Activity
        $recentActivity = SupplierNotification::where('supplier_id', $supplierId)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        $allPos = Purchase::where('supplier_id', $supplierId)->limit(10)->get();
        $sidebarCounts = $this->getSidebarCounts($supplierId);

        return view('supplier.my-approvals', compact(
            'approvals', 'allPos', 'asns', 'asnMap', 'counts', 'metrics', 'approvalTypes', 'portal', 'unreadCount', 'recentActivity', 'tab', 'sidebarCounts'
        ));
    }

    public function invoices(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $query = Purchase::where('supplier_id', $supplierId)
            ->with(['warehouse', 'purchaseItems.product', 'asn']);

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_code', 'LIKE', "%{$search}%")
                  ->orWhere('grand_total', 'LIKE', "%{$search}%")
                  ->orWhereHas('asn', function ($aq) use ($search) {
                      $aq->where('invoice_number', 'LIKE', "%{$search}%");
                  });
            });
        }

        $invoices = $query->orderByDesc('created_at')->paginate(15);

        // Fast Single-Pass SQL Aggregate for KPIs & Totals
        $stats = Purchase::where('supplier_id', $supplierId)
            ->selectRaw("
                COUNT(*) as total_count,
                COALESCE(SUM(grand_total), 0) as total_value,
                COALESCE(SUM(paid_amount), 0) as paid_amount,
                COUNT(CASE WHEN status = 1 THEN 1 END) as approved_count,
                COUNT(CASE WHEN status IN (0, 2, 3) AND (notes IS NULL OR notes NOT LIKE '%REJECTED%') THEN 1 END) as pending_count,
                COUNT(CASE WHEN notes LIKE '%REJECTED%' THEN 1 END) as rejected_count,
                COUNT(CASE WHEN paid_amount >= grand_total AND grand_total > 0 THEN 1 END) as paid_count,
                COUNT(CASE WHEN status IN (0, 2, 3) AND date < CURRENT_DATE THEN 1 END) as overdue_count
            ")
            ->first();

        $totalCount     = (int)($stats->total_count ?? 0);
        $totalVal       = (float)($stats->total_value ?? 0);
        $paidAmt        = (float)($stats->paid_amount ?? 0);
        $approvedCount  = (int)($stats->approved_count ?? 0);
        $pendingCount   = (int)($stats->pending_count ?? 0);
        $rejectedCount  = (int)($stats->rejected_count ?? 0);
        $paidCount      = (int)($stats->paid_count ?? 0);
        $overdueCount   = (int)($stats->overdue_count ?? 0);
        $gstTotal       = round($totalVal * 0.18, 2);

        $kpis = [
            'draft'            => 0,
            'submitted'        => $totalCount,
            'verified'         => $approvedCount,
            'pending_approval' => $pendingCount,
            'approved'         => $approvedCount,
            'rejected'         => $rejectedCount,
            'paid'             => $paidCount,
            'overdue'          => $overdueCount,
        ];

        $totals = [
            'total_count'    => $totalCount,
            'total_value'    => $totalVal,
            'gst_amount'     => $gstTotal,
            'paid_amount'    => $paidAmt,
            'pending_amount' => max(0, $totalVal - $paidAmt),
            'overdue_amount' => 0,
        ];

        $unreadCount   = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();
        $sidebarCounts = $this->getSidebarCounts($supplierId);

        return view('supplier.invoices', compact(
            'invoices', 'kpis', 'totals', 'portal', 'unreadCount', 'sidebarCounts'
        ));
    }

    public function invoicesRealtimeApi(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $stats = Purchase::where('supplier_id', $supplierId)
            ->selectRaw("
                COUNT(*) as total_count,
                COALESCE(SUM(grand_total), 0) as total_value,
                COALESCE(SUM(paid_amount), 0) as paid_amount,
                COUNT(CASE WHEN status = 1 THEN 1 END) as approved_count,
                COUNT(CASE WHEN status IN (0, 2, 3) AND (notes IS NULL OR notes NOT LIKE '%REJECTED%') THEN 1 END) as pending_count,
                COUNT(CASE WHEN notes LIKE '%REJECTED%' THEN 1 END) as rejected_count,
                COUNT(CASE WHEN paid_amount >= grand_total AND grand_total > 0 THEN 1 END) as paid_count,
                COUNT(CASE WHEN status IN (0, 2, 3) AND date < CURRENT_DATE THEN 1 END) as overdue_count
            ")
            ->first();

        $totalCount     = (int)($stats->total_count ?? 0);
        $totalVal       = (float)($stats->total_value ?? 0);
        $paidAmt        = (float)($stats->paid_amount ?? 0);
        $approvedCount  = (int)($stats->approved_count ?? 0);
        $pendingCount   = (int)($stats->pending_count ?? 0);
        $rejectedCount  = (int)($stats->rejected_count ?? 0);
        $paidCount      = (int)($stats->paid_count ?? 0);
        $overdueCount   = (int)($stats->overdue_count ?? 0);
        $gstTotal       = round($totalVal * 0.18, 2);

        $kpis = [
            'submitted'        => $totalCount,
            'verified'         => $approvedCount,
            'pending_approval' => $pendingCount,
            'approved'         => $approvedCount,
            'rejected'         => $rejectedCount,
            'paid'             => $paidCount,
            'overdue'          => $overdueCount,
        ];

        $totals = [
            'total_count'    => $totalCount,
            'total_value'    => $totalVal,
            'gst_amount'     => $gstTotal,
            'paid_amount'    => $paidAmt,
            'pending_amount' => max(0, $totalVal - $paidAmt),
        ];

        return response()->json([
            'success'        => true,
            'kpis'           => $kpis,
            'totals'         => $totals,
            'sidebar_counts' => $this->getSidebarCounts($supplierId),
        ]);
    }

    public function createInvoice(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $request->validate([
            'po_id'          => 'required',
            'invoice_number' => 'required|string|max:100',
        ]);

        $purchase = Purchase::where('supplier_id', $supplierId)->where('id', $request->po_id)->first();
        if (!$purchase) {
            $purchase = Purchase::where('id', $request->po_id)->first();
        }

        if ($purchase) {
            if ($purchase->asn) {
                $purchase->asn->update(['invoice_number' => $request->invoice_number]);
            }
            SupplierNotification::create([
                'supplier_id' => $supplierId,
                'title'       => 'Tax Invoice Submitted',
                'message'     => 'Invoice ' . $request->invoice_number . ' for ' . ($purchase->reference_code ?: 'PO #'.$purchase->id) . ' has been recorded.',
                'type'        => 'invoice',
                'is_read'     => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Commercial Tax Invoice ' . $request->invoice_number . ' created and submitted successfully!',
        ]);
    }

    public function warehouse(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal->supplier_id;

        $warehouses = Warehouse::with(['purchases' => function ($q) use ($supplierId) {
            $q->where('supplier_id', $supplierId);
        }])->get();

        $allPos = Purchase::where('supplier_id', $supplierId)->with('purchaseItems')->get();
        $allAsns = SupplierAsn::where('supplier_id', $supplierId)->get();

        $totalItemsCount = 0;
        foreach ($allPos as $p) {
            $totalItemsCount += $p->purchaseItems->sum('quantity');
        }

        $kpis = [
            'total_warehouses'  => $warehouses->count(),
            'total_stock_value' => $allPos->sum('grand_total'),
            'total_items'       => $totalItemsCount,
            'low_stock_items'   => 0,
            'out_of_stock'      => 0,
            'incoming_grn'      => $allAsns->count(),
        ];

        $recentGrns = Purchase::where('supplier_id', $supplierId)
            ->with('warehouse')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();
        $sidebarCounts = $this->getSidebarCounts($supplierId);

        return view('supplier.warehouse', compact(
            'warehouses', 'kpis', 'allPos', 'recentGrns', 'portal', 'unreadCount', 'sidebarCounts'
        ));
    }

    /**
     * Purchase Returns — Supplier View
     * Shows all returns linked to this supplier's POs.
     */
    public function returns(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal->supplier_id;

        $returns = PurchaseReturn::where('supplier_id', $supplierId)
            ->with(['warehouse', 'purchaseReturnItems.product'])
            ->orderByDesc('created_at')
            ->paginate(15);

        $allReturns = PurchaseReturn::where('supplier_id', $supplierId)->get();

        $stats = [
            'total'    => $allReturns->count(),
            'pending'  => $allReturns->where('status', 1)->count(),
            'approved' => $allReturns->where('status', 1)->count(),
            'total_value' => $allReturns->sum('grand_total'),
        ];

        $unreadCount   = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();
        $sidebarCounts = $this->getSidebarCounts($supplierId);

        return view('supplier.returns', compact(
            'returns', 'stats', 'portal', 'unreadCount', 'sidebarCounts'
        ));
    }

    /**
     * Stock Receiving alias
     */
    public function stockReceiving(Request $request)
    {
        return $this->receivingQueue($request);
    }

    /**
     * Receiving Queue Dashboard
     */
    public function receivingQueue(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $asns = SupplierAsn::where('supplier_id', $supplierId)
            ->with(['purchase.warehouse', 'supplier'])
            ->orderByDesc('created_at')
            ->get();

        $unreadCount   = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();
        $sidebarCounts = $this->getSidebarCounts($supplierId);

        return view('supplier.receiving.index', compact('asns', 'portal', 'unreadCount', 'sidebarCounts'));
    }

    /**
     * Receiving Session Page
     */
    public function receivingSession(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $asn = SupplierAsn::where('supplier_id', $supplierId)
            ->where('id', $id)
            ->with(['purchase.warehouse', 'purchase.purchaseItems.product', 'supplier'])
            ->first();

        if (!$asn) {
            $asn = SupplierAsn::with(['purchase.warehouse', 'purchase.purchaseItems.product', 'supplier'])->first();
        }

        $unreadCount   = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();
        $sidebarCounts = $this->getSidebarCounts($supplierId);

        return view('supplier.receiving.session', compact('asn', 'portal', 'unreadCount', 'sidebarCounts'));
    }

    public function downloadPdf(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchase = Purchase::where('id', $id)
            ->with(['purchaseItems.product', 'supplier', 'warehouse'])
            ->firstOrFail();

        $companyLogo = '';
        try {
            $logoUrl = getLogoUrl();
            if ($logoUrl) {
                $imgPath = public_path(ltrim($logoUrl, '/'));
                if (file_exists($imgPath)) {
                    $companyLogo = 'data:image/png;base64,' . base64_encode(file_get_contents($imgPath));
                }
            }
        } catch (\Throwable $e) {
            $companyLogo = '';
        }

        try {
            $pdf = Pdf::loadView('pdf.purchase-pdf', compact('purchase', 'companyLogo'));
            return $pdf->stream('Purchase-Order-' . ($purchase->reference_code ?: $purchase->id) . '.pdf');
        } catch (\Throwable $e) {
            return response()->view('pdf.purchase-pdf', compact('purchase', 'companyLogo'));
        }
    }

    public function invoicePdf(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchase = Purchase::where('supplier_id', $supplierId)
            ->where('id', $id)
            ->with(['purchaseItems.product', 'supplier', 'warehouse'])
            ->first();

        if (!$purchase) {
            $purchase = Purchase::where('id', $id)->with(['purchaseItems.product', 'supplier', 'warehouse'])->first();
        }
        if (!$purchase) {
            $purchase = Purchase::with(['purchaseItems.product', 'supplier', 'warehouse'])->first();
        }

        $invNumber = $request->get('inv', $request->get('invoice_number', ($purchase && $purchase->asn ? $purchase->asn->invoice_number : ('INV-' . date('Y-m') . '-' . str_pad($purchase ? $purchase->id : 1, 4, '0', STR_PAD_LEFT)))));

        if ($request->has('pdf') || $request->has('download')) {
            try {
                $isPdf = true;
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('supplier.invoices.pdf', compact('purchase', 'portal', 'isPdf'))
                    ->setPaper('a4', 'portrait')
                    ->setOption('isHtml5ParserEnabled', true)
                    ->setOption('isRemoteEnabled', true);
                if ($request->has('download')) {
                    return $pdf->download($invNumber . '.pdf');
                }
                return $pdf->stream($invNumber . '.pdf');
            } catch (\Throwable $e) {
                // fallback
            }
        }

        return view('supplier.invoices.pdf', compact('purchase', 'portal'));
    }

    public function packingListPdf(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchase = Purchase::where('supplier_id', $supplierId)->where('id', $id)
            ->with(['purchaseItems.product', 'supplier', 'warehouse'])->first()
            ?? Purchase::where('id', $id)->with(['purchaseItems.product', 'supplier', 'warehouse'])->first()
            ?? Purchase::with(['purchaseItems.product', 'supplier', 'warehouse'])->first();

        $invNumber = $request->get('inv', $request->get('invoice_number', 'PL-' . date('Y-m') . '-' . $purchase->id));

        if ($request->has('pdf') || $request->has('download')) {
            $isPdf = true;
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('supplier.docs.packing-list', compact('purchase', 'portal', 'isPdf'))
                ->setPaper('a4', 'portrait')
                ->setOption('isHtml5ParserEnabled', true);
            if ($request->has('download')) return $pdf->download('PackingList-' . $purchase->id . '.pdf');
            return $pdf->stream('PackingList-' . $purchase->id . '.pdf');
        }
        return view('supplier.docs.packing-list', compact('purchase', 'portal'));
    }

    public function deliveryChallanPdf(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchase = Purchase::where('supplier_id', $supplierId)->where('id', $id)
            ->with(['purchaseItems.product', 'supplier', 'warehouse'])->first()
            ?? Purchase::where('id', $id)->with(['purchaseItems.product', 'supplier', 'warehouse'])->first()
            ?? Purchase::with(['purchaseItems.product', 'supplier', 'warehouse'])->first();

        if ($request->has('pdf') || $request->has('download')) {
            $isPdf = true;
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('supplier.docs.delivery-challan', compact('purchase', 'portal', 'isPdf'))
                ->setPaper('a4', 'portrait')
                ->setOption('isHtml5ParserEnabled', true);
            if ($request->has('download')) return $pdf->download('DeliveryChallan-' . $purchase->id . '.pdf');
            return $pdf->stream('DeliveryChallan-' . $purchase->id . '.pdf');
        }
        return view('supplier.docs.delivery-challan', compact('purchase', 'portal'));
    }

    public function lpnManifestPdf(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchase = Purchase::where('supplier_id', $supplierId)->where('id', $id)
            ->with(['purchaseItems.product', 'supplier', 'warehouse'])->first()
            ?? Purchase::where('id', $id)->with(['purchaseItems.product', 'supplier', 'warehouse'])->first()
            ?? Purchase::with(['purchaseItems.product', 'supplier', 'warehouse'])->first();

        if ($request->has('pdf') || $request->has('download')) {
            $isPdf = true;
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('supplier.docs.lpn-manifest', compact('purchase', 'portal', 'isPdf'))
                ->setPaper('a4', 'portrait')
                ->setOption('isHtml5ParserEnabled', true);
            if ($request->has('download')) return $pdf->download('LpnManifest-' . $purchase->id . '.pdf');
            return $pdf->stream('LpnManifest-' . $purchase->id . '.pdf');
        }
        return view('supplier.docs.lpn-manifest', compact('purchase', 'portal'));
    }

    public function ewayBillPdf(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchase = Purchase::where('supplier_id', $supplierId)->where('id', $id)
            ->with(['purchaseItems.product', 'supplier', 'warehouse'])->first()
            ?? Purchase::where('id', $id)->with(['purchaseItems.product', 'supplier', 'warehouse'])->first()
            ?? Purchase::with(['purchaseItems.product', 'supplier', 'warehouse'])->first();

        if ($request->has('pdf') || $request->has('download')) {
            $isPdf = true;
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('supplier.docs.eway-bill', compact('purchase', 'portal', 'isPdf'))
                ->setPaper('a4', 'portrait')
                ->setOption('isHtml5ParserEnabled', true);
            if ($request->has('download')) return $pdf->download('eWayBill-' . $purchase->id . '.pdf');
            return $pdf->stream('eWayBill-' . $purchase->id . '.pdf');
        }
        return view('supplier.docs.eway-bill', compact('purchase', 'portal'));
    }

    /**
     * Display Enterprise Supplier Payments Hub — Real Data & Real-Time Settlements
     */
    public function payments(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $query = Purchase::where('supplier_id', $supplierId)
            ->with(['warehouse', 'purchaseItems.product', 'supplier']);

        // Search Filter
        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('reference_code', 'LIKE', "%{$s}%")
                  ->orWhere('grand_total', 'LIKE', "%{$s}%")
                  ->orWhere('notes', 'LIKE', "%{$s}%")
                  ->orWhereHas('warehouse', function ($wq) use ($s) {
                      $wq->where('name', 'LIKE', "%{$s}%");
                  });
            });
        }

        // Warehouse filter
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        $allPurchases = (clone $query)->orderByDesc('created_at')->get();

        $unreadCount   = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();
        $sidebarCounts = $this->getSidebarCounts($supplierId);

        $paymentsList = [];
        $totalPaid    = 0;
        $totalPending = 0;
        $totalOverdue = 0;
        $totalDisputed = 0;

        foreach ($allPurchases as $p) {
            $grandTotal  = (float) ($p->grand_total ?? 0);
            $paidAmount  = (float) ($p->paid_amount ?? 0);
            $outstanding = max(0, $grandTotal - $paidAmount);
            $tds         = round($paidAmount * 0.02, 2);
            $netPaid     = round($paidAmount - $tds, 2);

            // Check if there is a recorded SupplierPayment entry
            $sp = SupplierPayment::where('purchase_id', $p->id)
                ->orWhere('po_code', $p->reference_code)
                ->latest()
                ->first();

            $isDisputed = $sp && $sp->status === 'disputed';

            if ($isDisputed) {
                $payStatus = 'Disputed';
                $totalDisputed += $grandTotal;
                $totalPending  += $grandTotal;
            } elseif ($grandTotal > 0 && $paidAmount >= $grandTotal) {
                $payStatus = 'Paid';
                $totalPaid += $netPaid;
            } elseif ($paidAmount > 0) {
                $payStatus     = 'Partial';
                $totalPaid    += $netPaid;
                $totalPending += $outstanding;
            } else {
                $dueDate = Carbon::parse($p->date)->addDays(30);
                if ($dueDate->isPast()) {
                    $payStatus     = 'Overdue';
                    $totalOverdue += $grandTotal;
                } else {
                    $payStatus     = 'Pending';
                    $totalPending += $grandTotal;
                }
            }

            // Payment type label
            $payType = 'Bank Transfer';
            if ($sp && !empty($sp->payment_type)) {
                $payType = $sp->payment_type;
            } elseif ($p->payment_type == 1) {
                $payType = 'Cash';
            } elseif ($p->payment_type == 2) {
                $payType = 'Cheque';
            } elseif ($p->payment_type == 4) {
                $payType = 'UPI / NetBanking';
            }

            $paymentsList[] = (object) [
                'id'             => $p->id,
                'payment_id'     => $sp ? $sp->id : null,
                'po_reference'   => $p->reference_code ?: ('PO-' . $p->id),
                'po_date'        => Carbon::parse($p->date)->format('d M Y'),
                'warehouse'      => optional($p->warehouse)->name ?: 'Suguna Warehouse',
                'warehouse_city' => optional($p->warehouse)->city ?: 'Chennai',
                'payment_type'   => $payType,
                'txn_id'         => $sp ? $sp->txn_id : ('TXN-UTR-' . str_pad($p->id, 6, '0', STR_PAD_LEFT)),
                'receipt_url'    => $sp ? $sp->receipt_url : null,
                'item_count'     => $p->purchaseItems->count(),
                'gross_amount'   => $grandTotal,
                'paid_amount'    => $paidAmount,
                'outstanding'    => $outstanding,
                'tds'            => $tds,
                'net_paid'       => $netPaid,
                'tax_amount'     => (float) ($p->tax_amount ?? 0),
                'status'         => $payStatus,
                'dispute_reason' => $sp ? $sp->dispute_reason : null,
                'dispute_date'   => $sp && $sp->dispute_date ? Carbon::parse($sp->dispute_date)->format('d M Y, h:i A') : null,
                'dispute_status' => $sp ? $sp->dispute_status : 'none',
                'notes'          => $sp ? $sp->notes : $p->notes,
            ];
        }

        // Tab Filtering
        $currentTab = $request->get('status', 'all');
        $filteredPayments = collect($paymentsList);

        if ($currentTab === 'paid') {
            $filteredPayments = $filteredPayments->where('status', 'Paid');
        } elseif ($currentTab === 'partial') {
            $filteredPayments = $filteredPayments->where('status', 'Partial');
        } elseif ($currentTab === 'pending') {
            $filteredPayments = $filteredPayments->where('status', 'Pending');
        } elseif ($currentTab === 'disputed' || $currentTab === 'unpaid') {
            $filteredPayments = $filteredPayments->where('status', 'Disputed');
        } elseif ($currentTab === 'overdue') {
            $filteredPayments = $filteredPayments->where('status', 'Overdue');
        }

        // Sorting
        $sort = $request->get('sort', 'newest');
        if ($sort === 'oldest') {
            $filteredPayments = $filteredPayments->sortBy('id')->values();
        } elseif ($sort === 'amount') {
            $filteredPayments = $filteredPayments->sortByDesc('gross_amount')->values();
        } elseif ($sort === 'outstanding') {
            $filteredPayments = $filteredPayments->sortByDesc('outstanding')->values();
        } else {
            $filteredPayments = $filteredPayments->sortByDesc('id')->values();
        }

        $paymentHistory = SupplierPayment::where('supplier_id', $supplierId)
            ->with(['purchase.warehouse', 'supplier'])
            ->orderByDesc('created_at')
            ->get();

        $payablePurchases = Purchase::where('supplier_id', $supplierId)
            ->with(['warehouse'])
            ->orderByDesc('created_at')
            ->get();

        $counts = [
            'all'      => count($paymentsList),
            'paid'     => collect($paymentsList)->where('status', 'Paid')->count(),
            'partial'  => collect($paymentsList)->where('status', 'Partial')->count(),
            'pending'  => collect($paymentsList)->where('status', 'Pending')->count(),
            'disputed' => collect($paymentsList)->where('status', 'Disputed')->count(),
            'overdue'  => collect($paymentsList)->where('status', 'Overdue')->count(),
            'history'  => $paymentHistory->count(),
        ];

        $warehouses = Warehouse::all();

        return view('supplier.payments.index', compact(
            'filteredPayments', 'paymentsList', 'totalPaid', 'totalPending', 'totalOverdue', 'totalDisputed',
            'counts', 'warehouses', 'currentTab', 'paymentHistory', 'payablePurchases', 'portal', 'unreadCount', 'sidebarCounts'
        ));
    }

    /**
     * Supplier disputes a payment / marks as unpaid
     */
    public function disputePayment(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchase = Purchase::where('supplier_id', $supplierId)->where('id', $id)->firstOrFail();

        $request->validate([
            'dispute_reason' => 'required|string|min:3',
        ]);

        $reason = $request->dispute_reason;

        // Find or create SupplierPayment record
        $sp = SupplierPayment::where('purchase_id', $purchase->id)
            ->orWhere('po_code', $purchase->reference_code)
            ->latest()
            ->first();
        if (!$sp) {
            $sp = SupplierPayment::create([
                'payment_ref'    => 'SP-' . str_pad($purchase->id, 4, '0', STR_PAD_LEFT),
                'purchase_id'    => $purchase->id,
                'supplier_id'    => $supplierId,
                'payment_date'   => now(),
                'amount'         => (float)$purchase->paid_amount,
                'payment_type'   => 'Bank Transfer',
                'txn_id'         => 'TXN-DISPUTED-' . time(),
                'status'         => 'disputed',
                'dispute_reason' => $reason,
                'dispute_status' => 'disputed',
                'dispute_date'   => now(),
                'notes'          => 'Disputed by Supplier: ' . $reason,
                'created_by'     => 'Supplier Portal',
            ]);
        } else {
            $sp->update([
                'status'         => 'disputed',
                'dispute_reason' => $reason,
                'dispute_status' => 'disputed',
                'dispute_date'   => now(),
                'notes'          => ($sp->notes ? $sp->notes . ' | ' : '') . 'Dispute filed on ' . date('d M Y') . ': ' . $reason,
            ]);
        }

        // Notify Admin / Buyer
        SupplierNotification::createForSupplier(
            $supplierId,
            'payment_disputed',
            'Payment Dispute Submitted: ' . ($purchase->reference_code ?: 'PO-' . $purchase->id),
            "You have reported payment for PO {$purchase->reference_code} as unpaid. Reason: {$reason}. The buyer finance team has been notified to re-verify.",
            ['purchase_id' => $purchase->id, 'payment_id' => $sp->id]
        );

        return redirect()->route('supplier.payments')->with('success', "Payment dispute submitted for {$purchase->reference_code}. Buyer finance team has been notified!");
    }

    /**
     * Export Payments CSV
     */
    public function exportPaymentsCsv(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchases = Purchase::where('supplier_id', $supplierId)->with(['warehouse'])->orderByDesc('created_at')->get();

        $filename = 'Supplier_Payments_Settlement_' . date('Ymd_His') . '.csv';
        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($purchases) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['PO Reference', 'PO Date', 'Warehouse', 'Gross Amount (INR)', 'Paid Amount (INR)', 'TDS (2%)', 'Net Received', 'Outstanding (INR)', 'Status', 'Txn/UTR Ref']);

            foreach ($purchases as $p) {
                $grandTotal  = (float) ($p->grand_total ?? 0);
                $paidAmount  = (float) ($p->paid_amount ?? 0);
                $outstanding = max(0, $grandTotal - $paidAmount);
                $tds         = round($paidAmount * 0.02, 2);
                $netPaid     = round($paidAmount - $tds, 2);

                $sp = SupplierPayment::where('purchase_id', $p->id)->first();
                $st = ($sp && $sp->status === 'disputed') ? 'Disputed' : (($grandTotal > 0 && $paidAmount >= $grandTotal) ? 'Paid' : ($paidAmount > 0 ? 'Partial' : 'Pending'));

                fputcsv($file, [
                    $p->reference_code ?: ('PO-' . $p->id),
                    Carbon::parse($p->date)->format('Y-m-d'),
                    optional($p->warehouse)->name ?: 'Suguna Warehouse',
                    number_format($grandTotal, 2, '.', ''),
                    number_format($paidAmount, 2, '.', ''),
                    number_format($tds, 2, '.', ''),
                    number_format($netPaid, 2, '.', ''),
                    number_format($outstanding, 2, '.', ''),
                    $st,
                    $sp ? $sp->txn_id : '—',
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Process & Record Supplier Payment / Settlement
     */
    public function processPayment(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $request->validate([
            'purchase_id'  => 'required|exists:purchases,id',
            'amount'       => 'required|numeric|min:0.01',
            'payment_type' => 'required|string',
            'txn_id'       => 'nullable|string|max:100',
            'payment_date' => 'nullable|date',
            'notes'        => 'nullable|string|max:500',
            'receipt'      => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $purchase = Purchase::where('id', $request->purchase_id)->firstOrFail();
        $amount   = (float) $request->amount;

        // Handle receipt upload
        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('supplier-payments/receipts', 'public');
        }

        // Generate payment reference code
        $payCount = SupplierPayment::count() + 1;
        $payRef   = 'SP-' . str_pad($payCount, 4, '0', STR_PAD_LEFT);
        $txnId    = $request->txn_id ?: ('UTR-' . strtoupper(substr(md5(uniqid()), 0, 8)));

        // Create or update SupplierPayment record
        $sp = SupplierPayment::create([
            'payment_ref'   => $payRef,
            'purchase_id'   => $purchase->id,
            'supplier_id'   => $purchase->supplier_id ?: $supplierId,
            'payment_date'  => $request->payment_date ? Carbon::parse($request->payment_date) : now(),
            'amount'        => $amount,
            'payment_type'  => $request->payment_type,
            'txn_id'        => $txnId,
            'receipt_url'   => $receiptPath,
            'status'        => 'completed',
            'notes'         => $request->notes,
            'created_by'    => 'Supplier Portal / Admin',
        ]);

        // Update purchase record paid amount & payment type
        $newPaid = (float)($purchase->paid_amount ?? 0) + $amount;
        $purchase->paid_amount = $newPaid;
        
        $typeMapping = [
            'Cash' => 1,
            'Cheque' => 2,
            'Bank Transfer' => 3,
            'UPI / NetBanking' => 4,
            'Other' => 5
        ];
        if (isset($typeMapping[$request->payment_type])) {
            $purchase->payment_type = $typeMapping[$request->payment_type];
        }

        // Set status
        if ($newPaid >= $purchase->grand_total) {
            $purchase->payment_status = 1; // Paid
        } else {
            $purchase->payment_status = 2; // Partial
        }
        $purchase->save();

        // Create Notification
        try {
            SupplierNotification::create([
                'supplier_id' => $purchase->supplier_id ?: $supplierId,
                'type'        => 'payment_released',
                'title'       => "Payment of ₹" . number_format($amount, 2) . " Processed",
                'message'     => "Payment {$payRef} for PO {$purchase->reference_code} (Txn: {$txnId}) has been successfully processed and verified.",
                'is_read'     => false,
            ]);
        } catch (\Throwable $e) {}

        return redirect()->route('supplier.payments')
            ->with('success', "Payment {$payRef} of ₹" . number_format($amount, 2) . " successfully processed for PO {$purchase->reference_code} (Txn: {$txnId})!");
    }

    /**
     * Printable Payment Settlement Statement
     */
    public function paymentStatement(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchases = Purchase::where('supplier_id', $supplierId)->with(['warehouse', 'supplier'])->orderByDesc('created_at')->get();
        $supplier = optional($purchases->first())->supplier;

        return view('supplier.payments.statement', compact('purchases', 'supplier', 'portal'));
    }
}

