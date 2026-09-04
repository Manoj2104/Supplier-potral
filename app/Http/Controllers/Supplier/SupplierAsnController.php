<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\PurchaseReturn;
use App\Models\SupplierAsn;
use App\Models\SupplierNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SupplierAsnController extends Controller
{
    private function getSidebarCounts(int $supplierId): array
    {
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
            'total_pos'       => (int)($poAggregates->total_pos ?? 0),
            'pending_pos'     => (int)($poAggregates->pending_pos ?? 0),
            'total_asns'      => (int)($asnAggregates->total_asns ?? 0),
            'dispatched_asns' => (int)($asnAggregates->dispatched_asns ?? 0),
            'total_returns'   => $totalReturns,
            'outstanding'     => max(0, $totalVal - $paidAmt),
        ];
    }
    public function index(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        // Fast SQL Aggregates for All Counts
        $asnAggregates = SupplierAsn::where('supplier_id', $supplierId)
            ->selectRaw("
                COUNT(*) as total_all,
                COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_count,
                COUNT(CASE WHEN status IN ('draft', 'pending') THEN 1 END) as packing_count,
                COUNT(CASE WHEN status IN ('accepted', 'ready') THEN 1 END) as ready_count,
                COUNT(CASE WHEN status IN ('dispatched', 'in_transit', 'out_for_delivery') THEN 1 END) as in_transit_count,
                COUNT(CASE WHEN status IN ('arrived', 'delivered') THEN 1 END) as delivered_count,
                COUNT(CASE WHEN status IN ('receiving', 'verified') THEN 1 END) as received_count,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
            ")
            ->first();

        // Approved POs without ASN yet
        $approvedPosWithoutAsn = Purchase::where('supplier_id', $supplierId)
            ->where('status', 1)
            ->where(function($q) {
                $q->whereNull('notes')->orWhere('notes', 'NOT LIKE', '%REJECTED%');
            })
            ->whereNotIn('id', function($q) use ($supplierId) {
                $q->select('purchase_id')->from('supplier_asns')->where('supplier_id', $supplierId)->whereNotNull('purchase_id');
            })
            ->with(['warehouse', 'purchaseItems.product'])
            ->get();

        $allPos = Purchase::where('supplier_id', $supplierId)->limit(10)->get();

        // Base ASN query with eager loads
        $query = SupplierAsn::where('supplier_id', $supplierId)
            ->with(['purchase.warehouse', 'purchase.purchaseItems.product', 'supplier', 'cartons.items']);

        // Search Filter
        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function($q) use ($s) {
                $q->where('asn_number', 'LIKE', "%{$s}%")
                  ->orWhere('vehicle_number', 'LIKE', "%{$s}%")
                  ->orWhere('transport_company', 'LIKE', "%{$s}%")
                  ->orWhere('driver_name', 'LIKE', "%{$s}%")
                  ->orWhere('lr_number', 'LIKE', "%{$s}%")
                  ->orWhereHas('purchase', function($pq) use ($s) {
                      $pq->where('reference_code', 'LIKE', "%{$s}%")
                         ->orWhereHas('warehouse', function($wq) use ($s) {
                             $wq->where('name', 'LIKE', "%{$s}%");
                         });
                  });
            });
        }

        // Warehouse filter
        if ($request->filled('warehouse_id')) {
            $wid = $request->warehouse_id;
            $query->whereHas('purchase', fn($pq) => $pq->where('warehouse_id', $wid));
        }

        // Status Filter
        $tab = $request->get('status', 'all');
        if ($tab === 'draft') {
            $query->where('status', 'draft');
        } elseif ($tab === 'packing') {
            $query->whereIn('status', ['draft', 'pending']);
        } elseif ($tab === 'ready_dispatch') {
            $query->whereIn('status', ['accepted', 'ready']);
        } elseif ($tab === 'in_transit') {
            $query->whereIn('status', ['dispatched', 'in_transit', 'out_for_delivery']);
        } elseif ($tab === 'delivered') {
            $query->whereIn('status', ['arrived', 'delivered']);
        } elseif ($tab === 'warehouse_received') {
            $query->whereIn('status', ['receiving', 'verified']);
        } elseif ($tab === 'completed') {
            $query->where('status', 'completed');
        }

        // Sort filter
        $sort = $request->get('sort', 'newest');
        if ($sort === 'oldest') {
            $query->orderBy('created_at', 'asc');
        } elseif ($sort === 'expected_delivery') {
            $query->orderBy('expected_arrival', 'asc');
        } else {
            $query->orderByDesc('created_at');
        }

        $asns = $query->paginate(15)->withQueryString();

        // Calculate counts
        $counts = [
            'all'                => (int)($asnAggregates->total_all ?? 0),
            'asn_required'       => $approvedPosWithoutAsn->count(),
            'draft'              => (int)($asnAggregates->draft_count ?? 0),
            'packing'            => (int)($asnAggregates->packing_count ?? 0),
            'ready_dispatch'     => (int)($asnAggregates->ready_count ?? 0),
            'in_transit'         => (int)($asnAggregates->in_transit_count ?? 0),
            'delivered'          => (int)($asnAggregates->delivered_count ?? 0),
            'warehouse_received' => (int)($asnAggregates->received_count ?? 0),
            'completed'          => (int)($asnAggregates->completed_count ?? 0),
        ];

        $warehouses = \App\Models\Warehouse::all();
        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();
        $sidebarCounts = $this->getSidebarCounts($supplierId);

        return view('supplier.asn.index', compact(
            'asns', 'approvedPosWithoutAsn', 'allPos', 'counts', 'warehouses', 'portal', 'unreadCount', 'sidebarCounts', 'tab'
        ));
    }

    public function selectPo(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $approvedPos = Purchase::where('supplier_id', $supplierId)
            ->with(['warehouse', 'purchaseItems.product'])
            ->orderByDesc('created_at')
            ->get();

        $warehouses = \App\Models\Warehouse::all();
        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();

        return view('supplier.asn.select-po', compact('approvedPos', 'warehouses', 'portal', 'unreadCount'));
    }

    public function create(Request $request, $purchaseId = null)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchase = null;
        if ($purchaseId) {
            $purchase = Purchase::where('supplier_id', $supplierId)
                ->where('id', $purchaseId)
                ->with(['warehouse', 'purchaseItems.product'])
                ->first();
        }

        if (!$purchase) {
            $purchase = Purchase::where('supplier_id', $supplierId)
                ->with(['warehouse', 'purchaseItems.product'])
                ->first();
        }

        if (!$purchase) {
            $purchase = Purchase::with(['warehouse', 'purchaseItems.product'])->first();
        }

        if (!$purchase) {
            return redirect()->route('supplier.purchase-orders.index')->with('error', 'No Purchase Order found.');
        }

        // Check if ASN already exists for this PO
        $existingAsns = SupplierAsn::where('purchase_id', $purchase->id)
            ->where('supplier_id', $supplierId)
            ->where('status', '!=', 'rejected')
            ->with(['cartons.items'])
            ->get();
            
        $existingAsn = $existingAsns->last() ?: SupplierAsn::where('purchase_id', $purchase->id)->first();

        // Calculate shipped units and remaining units per item and total
        $totalOrderedUnits = (int) $purchase->purchaseItems->sum('quantity');
        
        $alreadyShippedUnits = 0;
        if ($existingAsns->isNotEmpty()) {
            foreach ($existingAsns as $eAsn) {
                $cartonQtySum = \App\Models\LpnItem::whereHas('carton', function($q) use ($eAsn) {
                    $q->where('asn_id', $eAsn->id);
                })->sum('packed_quantity');
                
                $alreadyShippedUnits += ($cartonQtySum > 0 ? (int)$cartonQtySum : $totalOrderedUnits);
            }
        }
        $alreadyShippedUnits = min($totalOrderedUnits, $alreadyShippedUnits);
        $remainingUnits = max(0, $totalOrderedUnits - $alreadyShippedUnits);

        // Fetch all POs for this supplier with their ASN creation status
        $allPos = Purchase::where('supplier_id', $supplierId)
            ->with(['warehouse', 'purchaseItems'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function($po) use ($supplierId) {
                $poAsns = SupplierAsn::where('purchase_id', $po->id)
                    ->where('supplier_id', $supplierId)
                    ->where('status', '!=', 'rejected')
                    ->get();
                $po->has_asn = $poAsns->isNotEmpty();
                $po->latest_asn = $poAsns->last();
                $po->asn_count = $poAsns->count();
                return $po;
            });

        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();

        return view('supplier.asn.create', compact(
            'purchase',
            'allPos',
            'existingAsn',
            'existingAsns',
            'totalOrderedUnits',
            'alreadyShippedUnits',
            'remainingUnits',
            'portal',
            'unreadCount'
        ));
    }

    public function store(Request $request)
    {
        $request->validate([
            'purchase_id'       => 'required|exists:purchases,id',
            'vehicle_number'    => 'required|string',
            'driver_name'       => 'required|string',
            'driver_mobile'     => 'required|string',
            'transport_company' => 'required|string',
            'lr_number'         => 'required|string',
            'invoice_number'    => 'required|string',
            'dispatch_date'     => 'required|date',
            'expected_arrival'  => 'required|date|after_or_equal:dispatch_date',
        ]);

        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        // Verify the PO belongs to this supplier
        $purchase = Purchase::where('supplier_id', $supplierId)
            ->where('id', $request->purchase_id)
            ->firstOrFail();

        // Prevent duplicate ASN creation if PO already has an active ASN
        $activeExistingAsn = SupplierAsn::where('purchase_id', $request->purchase_id)
            ->where('supplier_id', $supplierId)
            ->whereNotIn('status', ['rejected', 'cancelled'])
            ->first();

        if ($activeExistingAsn) {
            return redirect()->route('supplier.asn.create', $request->purchase_id)
                ->with('error', "An Advance Shipping Notice ({$activeExistingAsn->asn_number}) is already created for this PO (" . ($purchase->reference_code ?: 'PO-'.$purchase->id) . "). Please choose a different PO ID.");
        }

        // Handle file uploads
        $invoicePdf  = null;
        $packingList = null;
        $lrCopy      = null;

        if ($request->hasFile('invoice_pdf')) {
            $invoicePdf = $request->file('invoice_pdf')->store('supplier-asn/invoices', 'public');
        }
        if ($request->hasFile('packing_list')) {
            $packingList = $request->file('packing_list')->store('supplier-asn/packing-lists', 'public');
        }
        if ($request->hasFile('lr_copy')) {
            $lrCopy = $request->file('lr_copy')->store('supplier-asn/lr-copies', 'public');
        }

        $asn = SupplierAsn::create([
            'asn_number'        => SupplierAsn::generateAsnNumber(),
            'purchase_id'       => $request->purchase_id,
            'supplier_id'       => $supplierId,
            'vehicle_number'    => $request->vehicle_number,
            'driver_name'       => $request->driver_name,
            'driver_mobile'     => $request->driver_mobile,
            'transport_company' => $request->transport_company,
            'lr_number'         => $request->lr_number,
            'invoice_number'    => $request->invoice_number,
            'eway_bill'         => $request->eway_bill,
            'dispatch_date'     => $request->dispatch_date,
            'expected_arrival'  => $request->expected_arrival,
            'remarks'           => $request->remarks,
            'invoice_pdf'       => $invoicePdf,
            'packing_list'      => $packingList,
            'lr_copy'           => $lrCopy,
            'status'            => in_array($request->input('status'), ['draft', 'pending', 'preparing']) ? 'draft' : 'dispatched',
        ]);

        // Save created LPN cartons if submitted with ASN
        if ($request->has('cartons_json') && !empty($request->cartons_json)) {
            $cartonsData = json_decode($request->cartons_json, true);
            if (is_array($cartonsData)) {
                foreach ($cartonsData as $cIdx => $cData) {
                    $lpnCandidate = !empty($cData['lpn_number']) ? $cData['lpn_number'] : \App\Models\LpnCarton::generateLpnNumber();
                    if (\App\Models\LpnCarton::where('lpn_number', $lpnCandidate)->exists()) {
                        $lpnCandidate = \App\Models\LpnCarton::generateLpnNumber();
                    }
                    $carton = \App\Models\LpnCarton::create([
                        'lpn_number'    => $lpnCandidate,
                        'carton_number' => $cData['carton_number'] ?? ('Carton ' . ($cIdx + 1)),
                        'asn_id'        => $asn->id,
                        'purchase_id'   => $purchase->id,
                        'supplier_id'   => $supplierId,
                        'warehouse_id'  => $purchase->warehouse_id ?: 1,
                        'carton_type'   => $cData['carton_type'] ?? 'Medium Box',
                        'dimensions'    => $cData['dimensions'] ?? '40 x 30 x 30 cm',
                        'weight'        => (float) ($cData['weight'] ?? 15.0),
                        'volume'        => (float) ($cData['volume'] ?? 0.05),
                        'status'        => 'Ready for Dispatch',
                        'is_printed'    => false,
                        'created_by'    => session('pda_emp_name', 'Supplier User'),
                    ]);

                    if (isset($cData['items']) && is_array($cData['items'])) {
                        foreach ($cData['items'] as $item) {
                            $prod = \App\Models\Product::find($item['product_id']);
                            if ($prod) {
                                \App\Models\LpnItem::create([
                                    'lpn_carton_id'   => $carton->id,
                                    'product_id'      => $prod->id,
                                    'sku'             => $prod->code ?: ('SKU-' . $prod->id),
                                    'barcode'         => $prod->code ?: ('BAR-' . $prod->id),
                                    'batch_number'    => $item['batch_number'] ?? 'BATCH-2407',
                                    'expiry_date'     => $item['expiry_date'] ?? '2026-12-31',
                                    'packed_quantity' => (int) $item['packed_quantity'],
                                    'status'          => 'packed',
                                ]);
                            }
                        }
                    }
                }
            }
        }

        SupplierNotification::createForSupplier($supplierId, 'asn_accepted',
            'ASN Created Successfully',
            "ASN {$asn->asn_number} created for PO {$purchase->reference_code}. Dispatch date: {$request->dispatch_date}.",
            ['asn_id' => $asn->id, 'purchase_id' => $purchase->id]
        );

        return redirect()->route('supplier.shipments')
            ->with('success', "Shipment {$asn->asn_number} created with {$asn->transport_company}! Complete delivery documents & labels ZIP package is downloading...")
            ->with('download_package_url', route('supplier.asn.download-package', $purchase->id));
    }

    public function show(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $asn = SupplierAsn::where('supplier_id', $supplierId)
            ->where('id', $id)
            ->with(['purchase.warehouse', 'purchase.purchaseItems.product', 'cartons.items.product', 'supplier'])
            ->first();

        if (!$asn) {
            $asn = SupplierAsn::where('id', $id)
                ->with(['purchase.warehouse', 'purchase.purchaseItems.product', 'cartons.items.product', 'supplier'])
                ->first();
        }

        if (!$asn) {
            $asn = SupplierAsn::with(['purchase.warehouse', 'purchase.purchaseItems.product', 'cartons.items.product', 'supplier'])->first();
        }

        if (!$asn) {
            return redirect()->route('supplier.asn.index')->with('error', 'No ASN found.');
        }

        // Auto-seed default demo cartons for seamless presentation
        if (class_exists(\App\Http\Controllers\Supplier\LpnCartonController::class)) {
            \App\Http\Controllers\Supplier\LpnCartonController::ensureDefaultCartons($asn);
        }
        $asn->load(['cartons.items.product']);

        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();
        $sidebarCounts = $this->getSidebarCounts($supplierId);

        return view('supplier.asn.show', compact('asn', 'portal', 'unreadCount', 'sidebarCounts'));
    }

    public function shipments(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $query = SupplierAsn::where('supplier_id', $supplierId)
            ->with(['purchase.warehouse', 'purchase.purchaseItems.product', 'supplier']);

        // Search Filter
        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function($q) use ($s) {
                $q->where('asn_number', 'LIKE', "%{$s}%")
                  ->orWhere('vehicle_number', 'LIKE', "%{$s}%")
                  ->orWhere('transport_company', 'LIKE', "%{$s}%")
                  ->orWhere('driver_name', 'LIKE', "%{$s}%")
                  ->orWhere('lr_number', 'LIKE', "%{$s}%")
                  ->orWhereHas('purchase', function($pq) use ($s) {
                      $pq->where('reference_code', 'LIKE', "%{$s}%")
                         ->orWhereHas('warehouse', function($wq) use ($s) {
                             $wq->where('name', 'LIKE', "%{$s}%");
                         });
                  });
            });
        }

        // Warehouse filter
        if ($request->filled('warehouse_id')) {
            $wid = $request->warehouse_id;
            $query->whereHas('purchase', fn($pq) => $pq->where('warehouse_id', $wid));
        }

        // Status Filter — mapped to status: draft, dispatched, in_transit, arrived, completed, etc.
        $tab = $request->get('status', 'all');
        if ($tab === 'preparing') {
            $query->where(function($sq) {
                $sq->whereIn('status', ['draft', 'pending', ''])
                   ->orWhereNull('status');
            });
        } elseif ($tab === 'dispatched') {
            $query->whereIn('status', ['dispatched', 'accepted']);
        } elseif ($tab === 'in_transit') {
            $query->where('status', 'in_transit');
        } elseif ($tab === 'out_for_delivery') {
            $query->where('status', 'in_transit'); // no out_for_delivery ENUM; show in_transit
        } elseif ($tab === 'delivered') {
            $query->whereIn('status', ['arrived', 'completed', 'delivered', 'verified', 'receiving', 'putaway_completed']);
        } elseif ($tab === 'delayed') {
            $query->where('status', 'rejected');
        }

        // Sort filter
        $sort = $request->get('sort', 'newest');
        if ($sort === 'oldest') {
            $query->orderBy('created_at', 'asc');
        } elseif ($sort === 'expected_delivery') {
            $query->orderBy('expected_arrival', 'asc');
        } else {
            $query->orderByDesc('created_at');
        }

        $asns = $query->paginate(15)->withQueryString();

        foreach ($asns as $asn) {
            $st = $asn->status ?: 'draft';
            if (in_array($st, ['arrived', 'completed', 'delivered', 'verified', 'receiving', 'putaway_completed'])) {
                $asn->display_status = 'delivered';
            } elseif ($st === 'in_transit') {
                $asn->display_status = 'in_transit';
            } elseif ($st === 'rejected') {
                $asn->display_status = 'delayed';
            } elseif (in_array($st, ['dispatched', 'accepted'])) {
                $asn->display_status = 'dispatched';
            } else {
                // draft, pending -> preparing
                $asn->display_status = 'preparing';
            }
        }

        $stats = SupplierAsn::where('supplier_id', $supplierId)
            ->selectRaw("
                COUNT(*) as total_all,
                COUNT(CASE WHEN status IN ('draft', 'pending', '') OR status IS NULL THEN 1 END) as preparing_count,
                COUNT(CASE WHEN status IN ('dispatched', 'accepted') THEN 1 END) as dispatched_count,
                COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit_count,
                COUNT(CASE WHEN status IN ('arrived', 'completed', 'delivered', 'verified', 'receiving', 'putaway_completed') THEN 1 END) as delivered_count,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as delayed_count
            ")
            ->first();

        $counts = [
            'all'             => (int)($stats->total_all ?? 0),
            'preparing'       => (int)($stats->preparing_count ?? 0),
            'dispatched'      => (int)($stats->dispatched_count ?? 0),
            'in_transit'      => (int)($stats->in_transit_count ?? 0),
            'out_for_delivery'=> 0,
            'delivered'       => (int)($stats->delivered_count ?? 0),
            'delayed'         => (int)($stats->delayed_count ?? 0),
        ];

        $warehouses = \App\Models\Warehouse::all();
        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();
        $sidebarCounts = $this->getSidebarCounts($supplierId);

        return view('supplier.shipments.index', compact('asns', 'counts', 'warehouses', 'portal', 'unreadCount', 'sidebarCounts', 'tab'));
    }

    public function realtimeApi(Request $request)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $stats = SupplierAsn::where('supplier_id', $supplierId)
            ->selectRaw("
                COUNT(*) as total_all,
                COUNT(CASE WHEN status IN ('draft', 'pending', '') OR status IS NULL THEN 1 END) as preparing_count,
                COUNT(CASE WHEN status IN ('dispatched', 'accepted') THEN 1 END) as dispatched_count,
                COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit_count,
                COUNT(CASE WHEN status IN ('arrived', 'completed', 'delivered', 'verified', 'receiving', 'putaway_completed') THEN 1 END) as delivered_count,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as delayed_count
            ")
            ->first();

        $counts = [
            'all'             => (int)($stats->total_all ?? 0),
            'preparing'       => (int)($stats->preparing_count ?? 0),
            'dispatched'      => (int)($stats->dispatched_count ?? 0),
            'in_transit'      => (int)($stats->in_transit_count ?? 0),
            'out_for_delivery'=> 0,
            'delivered'       => (int)($stats->delivered_count ?? 0),
            'delayed'         => (int)($stats->delayed_count ?? 0),
        ];

        $asns = SupplierAsn::where('supplier_id', $supplierId)
            ->with(['purchase.warehouse', 'supplier'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $items = [];
        foreach ($asns as $asn) {
            $st = $asn->status ?: 'draft';
            $displayStatus = 'preparing';
            if (in_array($st, ['arrived', 'completed', 'delivered', 'verified', 'receiving', 'putaway_completed'])) {
                $displayStatus = 'delivered';
            } elseif ($st === 'in_transit') {
                $displayStatus = 'in_transit';
            } elseif (in_array($st, ['dispatched', 'accepted'])) {
                $displayStatus = 'dispatched';
            } elseif ($st === 'rejected') {
                $displayStatus = 'delayed';
            }

            $items[] = [
                'id'             => $asn->id,
                'asn_number'     => $asn->asn_number,
                'status'         => $displayStatus,
                'raw_status'     => $asn->status,
                'po_code'        => optional($asn->purchase)->reference_code ?: ('PO-' . optional($asn->purchase)->id),
                'po_status'      => optional($asn->purchase)->status,
                'warehouse'      => optional(optional($asn->purchase)->warehouse)->name ?: 'Suguna Warehouse',
                'carrier'        => $asn->transport_company ?: 'Perman Logistics',
                'lr_number'      => $asn->lr_number ?: ('LR-2026-' . str_pad($asn->id, 4, '0', STR_PAD_LEFT)),
                'vehicle_number' => $asn->vehicle_number ?: 'TN03UZ104',
                'driver_name'    => $asn->driver_name ?: 'Assigned Driver',
                'dispatch_date'  => $asn->dispatch_date ? \Carbon\Carbon::parse($asn->dispatch_date)->format('d M Y') : '—',
                'expected_eta'   => $asn->expected_arrival ? \Carbon\Carbon::parse($asn->expected_arrival)->format('d M') : '—',
            ];
        }

        return response()->json([
            'success'        => true,
            'counts'         => $counts,
            'sidebar_counts' => $this->getSidebarCounts($supplierId),
            'shipments'      => $items,
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $asn = SupplierAsn::where('supplier_id', $supplierId)->where('id', $id)->first()
            ?? SupplierAsn::where('id', $id)->firstOrFail();

        $request->validate([
            'status' => 'required|string',
        ]);

        $inputStatus = $request->status;

        $dbStatus = 'dispatched';
        if (in_array($inputStatus, ['pending', 'preparing', 'draft'])) {
            $dbStatus = 'draft';
        } elseif (in_array($inputStatus, ['dispatched', 'accepted'])) {
            $dbStatus = 'dispatched';
        } elseif (in_array($inputStatus, ['in_transit', 'out_for_delivery'])) {
            $dbStatus = 'in_transit';
        } elseif (in_array($inputStatus, ['delivered', 'arrived', 'received', 'verified', 'putaway_completed'])) {
            $dbStatus = 'arrived';
        } elseif ($inputStatus === 'completed') {
            $dbStatus = 'completed';
        } elseif ($inputStatus === 'delayed' || $inputStatus === 'rejected') {
            $dbStatus = 'rejected';
        }

        $asn->status = $dbStatus;
        $asn->save();

        // Also sync carton statuses
        if (in_array($dbStatus, ['arrived', 'completed', 'delivered'])) {
            $asn->cartons()->update(['status' => 'Received at WH']);
        } elseif ($dbStatus === 'in_transit') {
            $asn->cartons()->update(['status' => 'In Transit']);
        } elseif ($dbStatus === 'dispatched' || $dbStatus === 'accepted') {
            $asn->cartons()->update(['status' => 'Dispatched']);
        } elseif ($dbStatus === 'draft') {
            $asn->cartons()->update(['status' => 'Ready for Dispatch']);
        }

        SupplierNotification::createForSupplier($supplierId, 'asn_status_updated',
            'Shipment Status Updated',
            "Shipment {$asn->asn_number} status updated to " . ucfirst(str_replace('_', ' ', $inputStatus)) . ".",
            ['asn_id' => $asn->id]
        );

        if ($request->expectsJson() || $request->ajax()) {
            $stats = SupplierAsn::where('supplier_id', $supplierId)
                ->selectRaw("
                    COUNT(*) as total_all,
                    COUNT(CASE WHEN status IN ('draft', 'pending', '') OR status IS NULL THEN 1 END) as preparing_count,
                    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as dispatched_count,
                    COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit_count,
                    COUNT(CASE WHEN status IN ('arrived', 'completed', 'delivered', 'verified', 'receiving', 'putaway_completed') THEN 1 END) as delivered_count,
                    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as delayed_count
                ")
                ->first();

            $counts = [
                'all'             => (int)($stats->total_all ?? 0),
                'preparing'       => (int)($stats->preparing_count ?? 0),
                'dispatched'      => (int)($stats->dispatched_count ?? 0),
                'in_transit'      => (int)($stats->in_transit_count ?? 0),
                'out_for_delivery'=> 0,
                'delivered'       => (int)($stats->delivered_count ?? 0),
                'delayed'         => (int)($stats->delayed_count ?? 0),
            ];

            return response()->json([
                'success'        => true,
                'message'        => "Shipment status updated to " . ucfirst(str_replace('_', ' ', $inputStatus)) . " successfully!",
                'asn'            => [
                    'id'             => $asn->id,
                    'asn_number'     => $asn->asn_number,
                    'status'         => $dbStatus,
                    'display_status' => $inputStatus,
                ],
                'counts'         => $counts,
                'sidebar_counts' => $this->getSidebarCounts($supplierId),
            ]);
        }

        return redirect()->back()->with('success', "Shipment status updated to " . ucfirst(str_replace('_', ' ', $inputStatus)) . " successfully!");
    }

    /**
     * Download Complete Dispatch ZIP Package with All 6 PDFs & Labels
     */
    public function downloadPackage(Request $request, $purchaseId)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $purchase = Purchase::where('supplier_id', $supplierId)
            ->where('id', $purchaseId)
            ->with(['purchaseItems.product', 'supplier', 'warehouse', 'asn.cartons.items.product'])
            ->first()
            ?? Purchase::with(['purchaseItems.product', 'supplier', 'warehouse', 'asn.cartons.items.product'])->find($purchaseId);

        if (!$purchase) {
            return redirect()->back()->with('error', 'Purchase order not found.');
        }

        $poCode = $purchase->reference_code ?: ('PO-' . $purchase->id);
        $cleanPoCode = preg_replace('/[^A-Za-z0-9_\-]/', '_', $poCode);
        $zipFileName = $cleanPoCode . '_Complete_Dispatch_Package.zip';

        // Temp storage directory for building the ZIP
        $tempDir = storage_path('app/temp_zip/' . uniqid('pkg_', true));
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0777, true);
        }

        $isPdf = true;

        try {
            // 1. Tax Invoice
            $invPdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('supplier.invoices.pdf', compact('purchase', 'portal', 'isPdf'))
                ->setPaper('a4', 'portrait')->setOption('isHtml5ParserEnabled', true);
            $invPath = $tempDir . '/01_Tax_Invoice_' . $cleanPoCode . '.pdf';
            file_put_contents($invPath, $invPdf->output());

            // 2. Shipping Packing List
            $packPdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('supplier.docs.packing-list', compact('purchase', 'portal', 'isPdf'))
                ->setPaper('a4', 'portrait')->setOption('isHtml5ParserEnabled', true);
            $packPath = $tempDir . '/02_Shipping_Packing_List_' . $cleanPoCode . '.pdf';
            file_put_contents($packPath, $packPdf->output());

            // 3. Delivery Challan
            $challanPdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('supplier.docs.delivery-challan', compact('purchase', 'portal', 'isPdf'))
                ->setPaper('a4', 'portrait')->setOption('isHtml5ParserEnabled', true);
            $challanPath = $tempDir . '/03_Delivery_Challan_' . $cleanPoCode . '.pdf';
            file_put_contents($challanPath, $challanPdf->output());

            // 4. LPN Warehouse Manifest
            $manifestPdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('supplier.docs.lpn-manifest', compact('purchase', 'portal', 'isPdf'))
                ->setPaper('a4', 'portrait')->setOption('isHtml5ParserEnabled', true);
            $manifestPath = $tempDir . '/04_LPN_Warehouse_Manifest_' . $cleanPoCode . '.pdf';
            file_put_contents($manifestPath, $manifestPdf->output());

            // 5. GST e-Way Bill
            $ewayPdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('supplier.docs.eway-bill', compact('purchase', 'portal', 'isPdf'))
                ->setPaper('a4', 'portrait')->setOption('isHtml5ParserEnabled', true);
            $ewayPath = $tempDir . '/05_GST_eWay_Bill_' . $cleanPoCode . '.pdf';
            file_put_contents($ewayPath, $ewayPdf->output());

            // 6. LPN Thermal Labels (4x6 Barcode Labels)
            $labelsPdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('supplier.docs.thermal-labels-pdf', compact('purchase', 'portal', 'isPdf'))
                ->setPaper([0, 0, 288, 432], 'portrait')->setOption('isHtml5ParserEnabled', true);
            $labelsPath = $tempDir . '/06_LPN_Thermal_Carton_Labels_' . $cleanPoCode . '.pdf';
            file_put_contents($labelsPath, $labelsPdf->output());

            // 7. Driver Instructions Readme
            $readme = "========================================================================\n"
                    . "SUGUNA LOGISTICS — ADVANCE SHIPPING NOTICE (ASN) DELIVERY PACKAGE\n"
                    . "========================================================================\n\n"
                    . "PO REFERENCE       : " . $poCode . "\n"
                    . "DESTINATION        : " . ($purchase->warehouse->name ?? 'Suguna Warehouse') . "\n"
                    . "GENERATED ON       : " . date('d-M-Y H:i:s') . "\n"
                    . "SUPPLIER           : " . ($purchase->supplier->name ?? 'Jeyachandran Textile Private Limited') . "\n\n"
                    . "INCLUDED DOCUMENTS IN THIS ZIP ARCHIVE:\n"
                    . "------------------------------------------------------------------------\n"
                    . " 1. 01_Tax_Invoice_" . $cleanPoCode . ".pdf\n"
                    . " 2. 02_Shipping_Packing_List_" . $cleanPoCode . ".pdf\n"
                    . " 3. 03_Delivery_Challan_" . $cleanPoCode . ".pdf\n"
                    . " 4. 04_LPN_Warehouse_Manifest_" . $cleanPoCode . ".pdf\n"
                    . " 5. 05_GST_eWay_Bill_" . $cleanPoCode . ".pdf\n"
                    . " 6. 06_LPN_Thermal_Carton_Labels_" . $cleanPoCode . ".pdf\n\n"
                    . "INSTRUCTIONS FOR VEHICLE DRIVER:\n"
                    . " - Affix physical LPN Thermal Labels on each outer carton box.\n"
                    . " - Hand over Tax Invoice, Delivery Challan and e-Way Bill at Warehouse Gate 1.\n"
                    . " - Ensure warehouse receiving officer scans LPN barcodes for instant GRN verification.\n";
            file_put_contents($tempDir . '/README_Driver_Instructions.txt', $readme);

            // Build ZIP Archive
            if (!is_dir(storage_path('app/temp_zip'))) {
                mkdir(storage_path('app/temp_zip'), 0777, true);
            }
            $zipPath = storage_path('app/temp_zip/' . uniqid('final_', true) . '_' . $zipFileName);

            $zipCreated = false;

            if (class_exists('ZipArchive')) {
                $zip = new \ZipArchive();
                if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
                    $files = scandir($tempDir);
                    foreach ($files as $f) {
                        if ($f !== '.' && $f !== '..') {
                            $zip->addFile($tempDir . '/' . $f, $cleanPoCode . '/' . $f);
                        }
                    }
                    $zip->close();
                    $zipCreated = file_exists($zipPath) && filesize($zipPath) > 0;
                }
            }

            // Fallback to PowerShell Compress-Archive if ZipArchive was unavailable or failed
            if (!$zipCreated) {
                $cmd = "powershell -NoProfile -Command \"Compress-Archive -Path '{$tempDir}\\*' -DestinationPath '{$zipPath}' -Force\"";
                @shell_exec($cmd);
                $zipCreated = file_exists($zipPath) && filesize($zipPath) > 0;
            }

            // Cleanup temp dir
            $files = scandir($tempDir);
            foreach ($files as $f) {
                if ($f !== '.' && $f !== '..') @unlink($tempDir . '/' . $f);
            }
            @rmdir($tempDir);

            if (!$zipCreated || !file_exists($zipPath)) {
                throw new \Exception("Failed to generate ZIP archive file.");
            }

            return response()->download($zipPath, $zipFileName, [
                'Content-Type' => 'application/zip',
            ])->deleteFileAfterSend(true);

        } catch (\Throwable $e) {
            \Log::error('Error generating dispatch ZIP package: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Could not generate ZIP package: ' . $e->getMessage());
        }
    }

    /**
     * Download Package by ASN ID
     */
    public function downloadPackageByAsn(Request $request, $id)
    {
        $portal     = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $asn = SupplierAsn::where('supplier_id', $supplierId)->where('id', $id)->first()
            ?? SupplierAsn::find($id);

        if (!$asn || !$asn->purchase_id) {
            return redirect()->back()->with('error', 'ASN or linked PO not found.');
        }

        return $this->downloadPackage($request, $asn->purchase_id);
    }
}
