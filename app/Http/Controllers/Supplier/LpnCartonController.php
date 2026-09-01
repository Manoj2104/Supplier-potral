<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use App\Models\LpnCarton;
use App\Models\LpnItem;
use App\Models\Purchase;
use App\Models\SupplierAsn;
use App\Models\SupplierNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LpnCartonController extends Controller
{
    /**
     * Ensure default cartons exist (DISABLED - Only real supplier cartons allowed)
     */
    public static function ensureDefaultCartons(SupplierAsn $asn)
    {
        return;
    }

    /**
     * Get JSON details of a carton for slide drawer & preview
     */
    public function show($id)
    {
        $carton = LpnCarton::with(['items.product', 'asn', 'purchase.warehouse', 'supplier'])->findOrFail($id);
        
        // Attach product images
        foreach ($carton->items as $item) {
            $product = $item->product;
            if ($product) {
                $media = DB::table('media')
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

        return response()->json([
            'success' => true,
            'carton'  => $carton,
        ]);
    }

    /**
     * Store new Carton under ASN
     */
    public function store(Request $request)
    {
        $request->validate([
            'asn_id'       => 'required|exists:supplier_asns,id',
            'carton_type'  => 'required|string',
            'weight'       => 'nullable|numeric',
            'dimensions'   => 'nullable|string',
            'items'        => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.packed_quantity' => 'required|integer|min:1',
        ]);

        $asn = SupplierAsn::findOrFail($request->asn_id);
        $cartonCount = $asn->cartons()->count();

        $cartonNumber = 'Carton ' . ($cartonCount + 1);
        $lpnNumber = LpnCarton::generateLpnNumber();

        $dims = $request->dimensions ?: '40 x 30 x 30 cm';
        $weight = $request->weight ? (float) $request->weight : 15.0;

        $carton = LpnCarton::create([
            'lpn_number'    => $lpnNumber,
            'carton_number' => $cartonNumber,
            'asn_id'        => $asn->id,
            'purchase_id'   => $asn->purchase_id,
            'supplier_id'   => $asn->supplier_id,
            'warehouse_id'  => $asn->purchase ? $asn->purchase->warehouse_id : 1,
            'carton_type'   => $request->carton_type,
            'dimensions'    => $dims,
            'weight'        => $weight,
            'volume'        => 0.05,
            'status'        => 'Ready for Dispatch',
            'is_printed'    => false,
            'created_by'    => session('pda_emp_name', 'Supplier User'),
        ]);

        foreach ($request->items as $i) {
            $prod = \App\Models\Product::find($i['product_id']);
            if ($prod) {
                LpnItem::create([
                    'lpn_carton_id'   => $carton->id,
                    'product_id'      => $prod->id,
                    'sku'             => $prod->code ?: ('SKU-' . $prod->id),
                    'barcode'         => $prod->code ?: ('BAR-' . $prod->id),
                    'batch_number'    => $i['batch_number'] ?? 'BATCH-' . date('ym'),
                    'expiry_date'     => $i['expiry_date'] ?? '2026-12-31',
                    'packed_quantity' => (int) $i['packed_quantity'],
                    'status'          => 'packed',
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Carton {$cartonNumber} ({$lpnNumber}) created successfully!",
            'carton'  => $carton->load('items.product'),
        ]);
    }

    /**
     * Delete a carton
     */
    public function destroy($id)
    {
        $carton = LpnCarton::findOrFail($id);
        $carton->delete();

        return response()->json([
            'success' => true,
            'message' => 'Carton deleted successfully!',
        ]);
    }

    /**
     * Display Cartons (LPN) Hub for Supplier
     */
    public function index(Request $request)
    {
        $portal = $request->supplier_portal;
        $supplierId = $portal ? $portal->supplier_id : 1;

        $cartons = LpnCarton::with(['items.product', 'asn.purchase.warehouse', 'supplier'])
            ->where('supplier_id', $supplierId)
            ->latest()
            ->get();

        // Auto-sync LPN Carton status with parent ASN / PO receiving status
        foreach ($cartons as $c) {
            $asnStatus = optional($c->asn)->status;
            if (in_array($asnStatus, ['putaway_completed', 'completed'])) {
                if ($c->status !== 'Putaway Completed') {
                    $c->update(['status' => 'Putaway Completed']);
                }
            } elseif (in_array($asnStatus, ['verified', 'arrived', 'received', 'receiving'])) {
                if (!in_array($c->status, ['Received', 'Received at WH', 'Putaway In Progress', 'Putaway Completed'])) {
                    $c->update(['status' => 'Received at WH']);
                }
            } elseif (in_array($asnStatus, ['dispatched', 'in_transit'])) {
                if ($c->status === 'Ready for Dispatch') {
                    $c->update(['status' => 'In Transit']);
                }
            }
        }

        $unreadCount = SupplierNotification::where('supplier_id', $supplierId)->where('is_read', false)->count();

        // Calculate KPI stats
        $totalCartons = $cartons->count();
        $totalWeight  = $cartons->sum('weight');
        $totalUnits   = 0;
        foreach ($cartons as $c) {
            $totalUnits += $c->items->sum('packed_quantity');
        }
        $readyCount   = $cartons->where('status', 'Ready for Dispatch')->count();

        return view('supplier.cartons.index', compact('cartons', 'portal', 'unreadCount', 'totalCartons', 'totalWeight', 'totalUnits', 'readyCount'));
    }

    /**
     * Render printable thermal label view (100x150mm / 4x6 inch format) or download PDF
     */
    public function printLabel(Request $request, $id)
    {
        $carton = LpnCarton::with(['items.product', 'asn.purchase.warehouse', 'supplier'])->findOrFail($id);
        $carton->update(['is_printed' => true]);

        if ($request->has('pdf') || $request->has('download')) {
            $purchase = $carton->asn ? $carton->asn->purchase : $carton->purchase;
            if (!$purchase && $carton->purchase_id) {
                $purchase = Purchase::with(['warehouse', 'supplier'])->find($carton->purchase_id);
            }
            try {
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('supplier.docs.thermal-labels-pdf', [
                    'purchase' => $purchase,
                    'carton'   => $carton,
                ])
                ->setPaper([0, 0, 288, 432], 'portrait')
                ->setOption('isHtml5ParserEnabled', true);

                return $pdf->download("LPN-Label-{$carton->lpn_number}.pdf");
            } catch (\Throwable $e) {
                // fallback
            }
        }

        return view('supplier.asn.thermal-label', compact('carton'));
    }
}
