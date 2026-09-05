<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\CreatePurchaseRequest;
use App\Http\Requests\UpdatePurchaseRequest;
use App\Http\Resources\PurchaseCollection;
use App\Http\Resources\PurchaseResource;
use App\Models\ManageStock;
use App\Models\Purchase;
use App\Models\Setting;
use App\Models\Supplier;
use App\Models\SupplierAsn;
use App\Models\Warehouse;
use App\Repositories\PurchaseRepository;
use Barryvdh\DomPDF\Facade\Pdf;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Class PurchaseAPIController
 */
class PurchaseAPIController extends AppBaseController
{
    /** @var PurchaseRepository */
    private $purchaseRepository;

    public function __construct(PurchaseRepository $purchaseRepository)
    {
        $this->purchaseRepository = $purchaseRepository;
    }

    public function index(Request $request): PurchaseCollection
    {
        $perPage = getPageSize($request);
        $search = $request->filter['search'] ?? ($request->get('search') ?? '');
        $purchases = \App\Models\Purchase::query();

        if (!empty($search)) {
            $purchases = $purchases->where(function (Builder $query) use ($search) {
                $query->where('reference_code', 'LIKE', "%$search%")
                    ->orWhereHas('supplier', function (Builder $q) use ($search) {
                        $q->where('name', 'LIKE', "%$search%");
                    })
                    ->orWhereHas('warehouse', function (Builder $q) use ($search) {
                        $q->where('name', 'LIKE', "%$search%");
                    });
            });
        }

        if ($request->get('start_date') && $request->get('end_date')) {
            $purchases = $purchases->whereBetween('date', [$request->get('start_date'), $request->get('end_date')]);
        }

        if ($request->get('warehouse_id')) {
            $purchases = $purchases->where('warehouse_id', $request->get('warehouse_id'));
        }

        if ($request->get('status')) {
            $purchases = $purchases->where('status', $request->get('status'));
        }

        $purchases = $purchases->with(['supplier', 'warehouse', 'purchaseItems.product'])->latest('id')->paginate($perPage);

        PurchaseResource::usingWithCollection();

        return new PurchaseCollection($purchases);
    }

    public function store(CreatePurchaseRequest $request): PurchaseResource
    {
        $input = $request->all();
        $purchase = $this->purchaseRepository->storePurchase($input);

        // ── Non-blocking Cloud Push: Response goes to browser FIRST, then sync in background ──
        register_shutdown_function(function () {
            try {
                \App\Services\CloudDatabaseSyncService::pushLocalToCloud();
            } catch (\Throwable $e) {}
        });

        return new PurchaseResource($purchase);
    }

    public function show($id): PurchaseResource
    {
        $purchase = $this->purchaseRepository->find($id);

        return new PurchaseResource($purchase);
    }

    public function edit(Purchase $purchase): PurchaseResource
    {
        $purchase = \Illuminate\Support\Facades\Cache::remember('purchase_edit_' . $purchase->id, 30, function () use ($purchase) {
            return $purchase->load('purchaseItems.product.stocks', 'warehouse', 'supplier');
        });

        return new PurchaseResource($purchase);
    }

    public function update(UpdatePurchaseRequest $request, $id): PurchaseResource
    {
        $input = $request->all();
        $purchase = $this->purchaseRepository->updatePurchase($input, $id);

        // ── Non-blocking Cloud Push on Update ──
        register_shutdown_function(function () {
            try { \App\Services\CloudDatabaseSyncService::pushLocalToCloud(); } catch (\Throwable $e) {}
        });

        return new PurchaseResource($purchase);
    }

    public function destroy($id): JsonResponse
    {
        try {
            DB::beginTransaction();
            //manage stock
            $purchase = \App\Models\Purchase::with('purchaseItems')->where('id', $id)->first();
            if ($purchase && $purchase->purchaseItems) {
                foreach ($purchase->purchaseItems as $purchaseItem) {
                    $product = ManageStock::whereWarehouseId($purchase->warehouse_id)
                        ->whereProductId($purchaseItem['product_id'])
                        ->first();
                    if ($product) {
                        if ($product->quantity >= $purchaseItem['quantity']) {
                            $totalQuantity = $product->quantity - $purchaseItem['quantity'];
                            $product->update([
                                'quantity' => $totalQuantity,
                            ]);
                        } else {
                            throw new UnprocessableEntityHttpException(__('messages.error.available_quantity'));
                        }
                    }
                }
            }
            $this->purchaseRepository->delete($id);
            DB::commit();

            return $this->sendSuccess('Purchase Deleted successfully');
        } catch (Exception $e) {
            DB::rollBack();
            throw new UnprocessableEntityHttpException($e->getMessage());
        }
    }

    /**
     * @throws \Spatie\MediaLibrary\MediaCollections\Exceptions\FileDoesNotExist
     * @throws \Spatie\MediaLibrary\MediaCollections\Exceptions\FileIsTooBig
     */
    public function pdfDownload(Purchase $purchase): JsonResponse
    {
        $purchase = $purchase->load('purchaseItems.product', 'supplier');

        $data = [];
        if (Storage::exists('pdf.purchase-pdf-'.$purchase->reference_code.'.pdf')) {
            Storage::delete('pdf.purchase-pdf-'.$purchase->reference_code.'.pdf');
        }

        $companyLogo = getLogoBase64();

        $pdf = PDF::loadView('pdf.purchase-pdf', compact('purchase','companyLogo'))->setOptions([
            'tempDir'             => public_path(),
            'chroot'              => public_path(),
            'isRemoteEnabled'     => false,
            'isHtml5ParserEnabled'=> true,
            'defaultFont'         => 'DejaVu Sans',
        ]);
        Storage::disk(config('app.media_disc'))->put('pdf/Purchase-'.$purchase->reference_code.'.pdf', $pdf->output());
        $data['purchase_pdf_url'] = Storage::url('pdf/Purchase-'.$purchase->reference_code.'.pdf');

        return $this->sendResponse($data, 'pdf retrieved Successfully');
    }

    public function purchaseInfo(Purchase $purchase): JsonResponse
    {
        $cached = \Illuminate\Support\Facades\Cache::remember('purchase_info_' . $purchase->id, 30, function () use ($purchase) {
            $purchase = $purchase->load(['purchaseItems.product', 'warehouse', 'supplier']);
            $keyName = [
                'email', 'company_name', 'phone', 'address',
            ];
            $purchase['company_info'] = Setting::whereIn('key', $keyName)->pluck('value', 'key')->toArray();
            return $purchase;
        });

        return $this->sendResponse($cached, 'Purchase information retrieved successfully');
    }

    public function getPurchaseProductReport(Request $request): PurchaseCollection
    {
        $perPage = getPageSize($request);
        $productId = $request->get('product_id');
        $purchases = $this->purchaseRepository->whereHas('purchaseItems', function ($q) use ($productId) {
            $q->where('product_id', '=', $productId);
        })->with(['purchaseItems.product', 'supplier']);

        $purchases = $purchases->paginate($perPage);

        PurchaseResource::usingWithCollection();

        return new PurchaseCollection($purchases);
    }

    public function sendSupplierMail(Request $request): JsonResponse
    {
        set_time_limit(120);
        $email = $request->input('email', 'manoj8610006544@gmail.com');
        $poNumber = $request->input('po_number', 'PO-2026-000034');

        $purchase = Purchase::with(['purchaseItems.product', 'supplier', 'warehouse'])->latest()->first();

        $refCode = $purchase ? ($purchase->reference_code ?: ('PO-2026' . str_pad($purchase->id, 5, '0', STR_PAD_LEFT))) : $poNumber;
        $purchaseId = $purchase ? $purchase->id : 1;

        $hostUrl = config('app.public_tunnel_url', 'https://infypos-procurement.loca.lt');
        $approvalUrl = "{$hostUrl}/supplier_action/accept/{$purchaseId}";
        $rejectUrl = "{$hostUrl}/supplier_action/reject/{$purchaseId}";

        try {
            $pdfOutput = null;
            try {
                $companyLogo = null;
                $logoPath = public_path('images/infyom.png');
                if (file_exists($logoPath)) {
                    $companyLogo = (string) \Image::make($logoPath)->encode('data-url');
                }
                $pdf = \PDF::loadView('pdf.purchase-pdf', compact('purchase', 'companyLogo'))->setOptions([
                    'tempDir'             => public_path(),
            'chroot'              => public_path(),
            'isRemoteEnabled'     => false,
            'isHtml5ParserEnabled'=> true,
            'defaultFont'         => 'DejaVu Sans',
                    'isRemoteEnabled' => false,
                ]);
                $pdfOutput = $pdf->output();
            } catch (\Exception $pdfEx) {
                \Log::warning('API PDF Warning: ' . $pdfEx->getMessage());
            }

            \Mail::send('emails.enterprise_purchase_order', compact('purchase', 'approvalUrl', 'rejectUrl'), function ($message) use ($email, $refCode, $pdfOutput) {
                $message->to($email)
                        ->cc('manoj8610006544@gmail.com')
                        ->subject("📦 Purchase Order #{$refCode} Awaiting Your Approval");
                if ($pdfOutput) {
                    $message->attachData($pdfOutput, "{$refCode}.pdf", [
                        'mime' => 'application/pdf',
                    ]);
                }
            });

            return $this->sendSuccess("Enterprise Purchase Order HTML Email with PDF attachment transmitted to {$email} via Gmail SMTP.");
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    public static function deriveLifecycleStatus($po, $asn): string
    {
        if ($asn) {
            $asnStatus = strtolower(trim($asn->status ?? ''));
            if ($asnStatus === 'putaway_completed' || $asnStatus === 'completed') {
                return 'Stock Received';
            } elseif ($asnStatus === 'putaway_in_progress') {
                return 'Putaway In Progress';
            } elseif ($asnStatus === 'arrived' || $asnStatus === 'delivered') {
                return 'Delivered';
            } elseif ($asnStatus === 'verified') {
                return 'Receiving Completed';
            } elseif ($asnStatus === 'partial') {
                return 'Partially Received';
            } elseif ($asnStatus === 'receiving') {
                return 'Receiving in Progress';
            } elseif ($asnStatus === 'out_for_delivery') {
                return 'Out for Delivery';
            } elseif ($asnStatus === 'in_transit') {
                return 'In Transit';
            } elseif ($asnStatus === 'dispatched' || $asnStatus === 'accepted') {
                return 'Dispatched';
            } elseif (in_array($asnStatus, ['draft', 'pending', 'created', 'preparing'])) {
                return 'Preparing';
            } else {
                return ucfirst(str_replace('_', ' ', $asnStatus));
            }
        }

        // When NO ASN exists:
        $notes = $po ? (string)($po->notes ?? '') : '';
        $isAccepted = str_contains($notes, '[SUPPLIER ACCEPTED]') || ($po && ($po->status === Purchase::RECEIVED || $po->status === 1 || $po->status === '1'));

        if ($isAccepted) {
            return 'Ready for ASN';
        }

        if ($po && ($po->status === Purchase::PENDING || $po->status === 2 || $po->status === '2' || $po->status === 0 || $po->status === '0' || $po->status === 'draft')) {
            return 'Waiting for Approval';
        }

        return 'Waiting for Approval';
    }

    public function inboundPlanningData(Request $request): JsonResponse
    {
        $cachedData = \Illuminate\Support\Facades\Cache::remember('inbound_planning_data_v2', 60, function () {
            $purchases = Purchase::with([
                'supplier:id,name',
                'warehouse:id,name',
                'purchaseItems:id,purchase_id,product_id,quantity,product_cost,net_unit_cost,sub_total',
                'purchaseItems.product:id,name,code'
            ])->orderByDesc('id')->get();

            $asns = SupplierAsn::select([
                'id', 'purchase_id', 'asn_number', 'status', 'transport_company',
                'vehicle_number', 'driver_name', 'driver_mobile', 'lr_number',
                'dispatch_date', 'expected_arrival'
            ])->get()->keyBy('purchase_id');

            $items = [];
            $expectedToday = 0;
            $waitingAsn = 0;
            $asnCreated = 0;
            $shipmentsInTransit = 0;
            $totalQty = 0;
            $totalVal = 0;

            $todayStr = \Carbon\Carbon::today()->toDateString();

            foreach ($purchases as $idx => $po) {
                $asn = $asns->get($po->id);
                $stockQty = ($po->purchaseItems && $po->purchaseItems->count() > 0) ? (int)$po->purchaseItems->sum('quantity') : 1;
                $val = (float) ($po->grand_total ?: 0);
                $totalQty += $stockQty;
                $totalVal += $val;

                $status = self::deriveLifecycleStatus($po, $asn);

                if ($status === 'Ready for ASN' || $status === 'Waiting for ASN' || $status === 'Waiting for Approval' || $status === 'Pending Receiving' || $status === 'Preparing') {
                    $waitingAsn++;
                } elseif ($status === 'ASN Created') {
                    $asnCreated++;
                } elseif ($status === 'In Transit' || $status === 'Dispatched' || $status === 'Out for Delivery' || $status === 'Delivered' || $status === 'Ready to Receive') {
                    $shipmentsInTransit++;
                }

                if ($po->date && (\Carbon\Carbon::parse($po->date)->isToday() || \Carbon\Carbon::parse($po->date)->toDateString() === $todayStr)) {
                    $expectedToday++;
                }

                $poRef = $po->reference_code ?: ('PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT));

                $asnStatus = $asn ? strtolower(trim($asn->status ?? '')) : null;
                $hasGrn = $asn && in_array($asnStatus, ['arrived', 'verified', 'partial', 'putaway_in_progress', 'putaway_completed', 'delivered', 'completed']);
                $grnNumber = $hasGrn ? ('GRN-2026-' . str_pad($asn->id + 120, 5, '0', STR_PAD_LEFT)) : '—';
                $isGrnCompleted = $asn && in_array($asnStatus, ['arrived', 'putaway_completed', 'delivered', 'completed']);
                $isPartial = ($asnStatus === 'partial');

                $receivedQty = $isGrnCompleted ? $stockQty : ($isPartial ? max(1, $stockQty - 1) : 0);
                $remainingQty = max(0, $stockQty - $receivedQty);

                $grnStatus = 'Pending Receiving';
                if ($isGrnCompleted) {
                    $grnStatus = 'Completed';
                } elseif ($isPartial) {
                    $grnStatus = 'Partially Received';
                } elseif ($asnStatus === 'receiving') {
                    $grnStatus = 'Receiving in Progress';
                } elseif ($asnStatus === 'out_for_delivery') {
                    $grnStatus = 'Out for Delivery';
                } elseif ($asnStatus === 'in_transit') {
                    $grnStatus = 'In Transit';
                } elseif ($asnStatus === 'dispatched' || $asnStatus === 'accepted') {
                    $grnStatus = 'Dispatched';
                } elseif ($asnStatus === 'arrived' || $asnStatus === 'delivered') {
                    $grnStatus = 'Delivered';
                } elseif ($asn) {
                    $grnStatus = ucfirst(str_replace('_', ' ', $asnStatus));
                } elseif ($status === 'Ready for ASN') {
                    $grnStatus = 'Pending Receiving';
                }

                $items[] = [
                    'id' => $po->id,
                    'inbound_id' => 'INB-2026-' . str_pad($po->id, 5, '0', STR_PAD_LEFT),
                    'po_id' => $poRef,
                    'asn_id' => $asn ? $asn->asn_number : '—',
                    'shipment_id' => ($asn && in_array(strtolower($asn->status ?? ''), ['in_transit', 'dispatched', 'accepted', 'arrived', 'completed', 'delivered', 'verified'])) ? ('SHP-2026-' . str_pad($asn->id, 5, '0', STR_PAD_LEFT)) : '—',
                    'grn_number' => $grnNumber,
                    'grn_status' => $grnStatus,
                    'is_grn_completed' => $isGrnCompleted,
                    'supplier' => $po->supplier ? $po->supplier->name : 'Supplier #' . $po->supplier_id,
                    'warehouse' => $po->warehouse ? $po->warehouse->name : 'Suguna Warehouse',
                    'stock_qty' => $stockQty . ' Units',
                    'raw_qty' => $stockQty,
                    'received_qty' => $receivedQty,
                    'remaining_qty' => $remainingQty,
                    'expected_delivery' => $po->date ? \Carbon\Carbon::parse($po->date)->format('d M Y, h:i A') : 'On schedule',
                    'delivery_date' => $po->date ? \Carbon\Carbon::parse($po->date)->format('d M Y') : 'On schedule',
                    'delivery_time' => $po->date ? \Carbon\Carbon::parse($po->date)->format('h:i A') : '12:00 PM',
                    'status' => $status,
                    'priority' => ($idx % 3 == 0) ? 'High' : (($idx % 2 == 0) ? 'Medium' : 'Low'),
                    'vehicle_no' => ($asn && !empty($asn->vehicle_number)) ? $asn->vehicle_number : null,
                    'transporter' => ($asn && !empty($asn->transport_company)) ? $asn->transport_company : null,
                    'driver' => ($asn && !empty($asn->driver_name)) ? $asn->driver_name : null,
                    'driver_mobile' => ($asn && !empty($asn->driver_mobile)) ? $asn->driver_mobile : null,
                    'lr_number' => ($asn && !empty($asn->lr_number)) ? $asn->lr_number : null,
                    'expected_cartons' => max(1, round($stockQty / 5)),
                    'expected_weight' => (max(1, round($stockQty / 5)) * 20) . ' KG',
                    'purchase_value' => '₹ ' . number_format($val, 2),
                    'items' => $po->purchaseItems ? $po->purchaseItems->map(function($pi) {
                        return [
                            'name' => $pi->product ? $pi->product->name : 'Product Item',
                            'sku' => $pi->product ? $pi->product->code : 'SKU',
                            'quantity' => $pi->quantity,
                            'unit_cost' => $pi->product_cost ?: 0
                        ];
                    })->toArray() : []
                ];
            }

            return [
                'items' => $items,
                'kpi' => [
                    'expected_today' => $expectedToday,
                    'waiting_asn' => $waitingAsn,
                    'asn_created' => $asnCreated,
                    'shipment_created' => $shipmentsInTransit,
                    'shipments_in_transit' => $shipmentsInTransit,
                    'expected_quantity' => number_format($totalQty) . ' Units',
                    'expected_value' => '₹ ' . number_format($totalVal, 2),
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $cachedData
        ]);
    }

    public function inboundPlanningDetail($id): JsonResponse
    {
        $po = Purchase::with(['supplier', 'warehouse', 'purchaseItems.product'])->find($id);
        if (!$po) {
            $po = Purchase::with(['supplier', 'warehouse', 'purchaseItems.product'])->first();
        }

        $asn = $po ? SupplierAsn::where('purchase_id', $po->id)->first() : null;
        $stockQty = ($po && $po->purchaseItems && $po->purchaseItems->count() > 0) ? $po->purchaseItems->sum('quantity') : 1;
        $val = (float)($po ? ($po->grand_total ?: 0) : 0);
        $poRef = $po ? ($po->reference_code ?: ('PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT))) : 'PO-2026-000001';

        $status = self::deriveLifecycleStatus($po, $asn);
        $poIdVal = $po ? $po->id : $id;

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $poIdVal,
                'inbound_id' => 'INB-2026-' . str_pad($poIdVal, 5, '0', STR_PAD_LEFT),
                'po_id' => $poRef,
                'asn_id' => $asn ? $asn->asn_number : null,
                'shipment_id' => ($asn && in_array(strtolower($asn->status ?? ''), ['in_transit', 'dispatched'])) ? ('SHP-2026-' . str_pad($asn->id, 5, '0', STR_PAD_LEFT)) : null,
                'supplier' => ($po && $po->supplier) ? $po->supplier->name : 'Supplier #' . ($po ? $po->supplier_id : 1),
                'warehouse' => ($po && $po->warehouse) ? $po->warehouse->name : 'Suguna Warehouse',
                'expected_qty' => $stockQty,
                'line_items_count' => ($po && $po->purchaseItems && $po->purchaseItems->count() > 0) ? $po->purchaseItems->count() : 1,
                'cartons' => max(1, round($stockQty / 5)),
                'weight' => (max(1, round($stockQty / 5)) * 20) . ' KG',
                'purchase_value' => '₹ ' . number_format($val, 2),
                'status' => $status,
                'po_created_date' => \Carbon\Carbon::parse($po ? ($po->created_at ?: now()) : now())->format('d M Y, h:i A'),
                'expected_delivery' => $po && $po->date ? \Carbon\Carbon::parse($po->date)->format('d M Y, h:i A') : '30 Aug 2026, 12:00 PM',
                'asn_details' => $asn ? [
                    'asn_number' => $asn->asn_number,
                    'vehicle_number' => $asn->vehicle_number ?: 'N/A',
                    'transport_company' => $asn->transport_company ?: 'N/A',
                    'driver_name' => $asn->driver_name ?: 'N/A',
                    'driver_mobile' => $asn->driver_mobile ?: 'N/A',
                    'dispatch_date' => $asn->dispatch_date ? \Carbon\Carbon::parse($asn->dispatch_date)->format('d M Y') : 'N/A',
                ] : null,
                'items' => ($po && $po->purchaseItems && $po->purchaseItems->count() > 0) ? $po->purchaseItems->map(function($pi) {
                    $prod = $pi->product;
                    $img = null;
                    if ($prod) {
                        $mainProdId = $prod->main_product_id ?: $prod->id;
                        $media = \Illuminate\Support\Facades\DB::table('media')
                            ->where(function($q) use ($prod, $mainProdId) {
                                $q->where(function($q2) use ($mainProdId) {
                                    $q2->where('model_type', 'App\Models\MainProduct')->where('model_id', $mainProdId);
                                })->orWhere(function($q3) use ($prod) {
                                    $q3->where('model_type', 'App\Models\Product')->where('model_id', $prod->id);
                                });
                            })
                            ->orderByDesc('id')
                            ->first();

                        if ($media) {
                            $coll = $media->collection_name ?: 'main_product';
                            $img = asset("uploads/{$coll}/{$media->id}/{$media->file_name}");
                        }
                    }
                    return [
                        'product_name' => $prod ? $prod->name : 'Product Item',
                        'code' => $prod ? $prod->code : 'SKU',
                        'barcode' => ($prod && !empty($prod->code)) ? $prod->code : '8906123456789',
                        'image_url' => $img,
                        'quantity' => $pi->quantity . ' Units',
                        'raw_quantity' => (int) $pi->quantity,
                        'unit_cost' => '₹ ' . number_format((float)($pi->net_unit_cost ?: ($pi->product_cost ?: 0)), 2),
                        'subtotal' => '₹ ' . number_format((float)($pi->sub_total ?: 0), 2),
                    ];
                }) : []
            ]
        ]);
    }

    public function validateReceivingInbound(\Illuminate\Http\Request $request): JsonResponse
    {
        $query = trim($request->input('search', ''));
        if (empty($query)) {
            return response()->json([
                'success' => false,
                'found' => false,
                'message' => 'Please enter or scan an Inbound ID, PO Number, or ASN.'
            ]);
        }

        // Try searching by exact ID, reference_code, inbound format, or ASN number
        $poId = null;
        if (preg_match('/(?:INB|PO|PU)[-_]?(?:2026[-_]?)?0*(\d+)/i', $query, $matches)) {
            $num = (int)$matches[1];
            // Handle PU_1112 or similar 111x offsets if applicable
            if ($num > 1100 && $num < 1200) {
                $poId = $num - 1110;
            } else {
                $poId = $num;
            }
        } elseif (is_numeric($query)) {
            $poId = (int)$query;
        }

        $po = null;
        if ($poId) {
            $po = Purchase::with(['supplier', 'warehouse', 'purchaseItems.product'])->find($poId);
        }

        if (!$po) {
            $po = Purchase::with(['supplier', 'warehouse', 'purchaseItems.product'])
                ->where('reference_code', 'LIKE', "%{$query}%")
                ->orWhereHas('supplier', function($sq) use ($query) {
                    $sq->where('name', 'LIKE', "%{$query}%");
                })
                ->first();
        }

        if (!$po) {
            $asn = SupplierAsn::with(['purchase.supplier', 'purchase.warehouse', 'purchase.purchaseItems.product'])
                ->where('asn_number', 'LIKE', "%{$query}%")
                ->orWhere('invoice_number', 'LIKE', "%{$query}%")
                ->orWhere('vehicle_number', 'LIKE', "%{$query}%")
                ->first();
            if ($asn && $asn->purchase) {
                $po = $asn->purchase;
            }
        }

        if (!$po) {
            return response()->json([
                'success' => false,
                'found' => false,
                'message' => 'No matching Inbound record found for "' . $query . '".'
            ]);
        }

        $asn = SupplierAsn::where('purchase_id', $po->id)->first();
        $status = self::deriveLifecycleStatus($po, $asn);
        $stockQty = ($po->purchaseItems && $po->purchaseItems->count() > 0) ? $po->purchaseItems->sum('quantity') : 1;
        $val = (float)($po->grand_total ?: 0);
        $poRef = $po->reference_code ?: ('PO-2026-' . str_pad($po->id, 6, '0', STR_PAD_LEFT));

        $eligible = false;
        $reason = '';

        if ($status === 'Waiting for Approval') {
            $eligible = false;
            $reason = 'This Purchase Order is currently Waiting for Supplier Approval. Goods cannot be received until the supplier accepts the order.';
        } elseif ($status === 'Ready for ASN' || $status === 'Waiting for ASN') {
            $eligible = false;
            $reason = 'Supplier has approved the PO, but Advance Shipping Notice (ASN) has not yet been created.';
        } elseif ($status === 'ASN Created') {
            $eligible = true;
            $reason = 'Advance Shipping Notice (ASN) is created. Shipment is ready to begin warehouse receiving.';
        } elseif ($status === 'In Transit' || $status === 'Out for Delivery') {
            $eligible = true;
            $reason = 'Shipment is in transit / at dock and eligible for dock receiving.';
        } elseif ($status === 'Ready to Receive') {
            $eligible = true;
            $reason = 'Shipment is at warehouse dock and ready for dock receiving.';
        } elseif ($status === 'Receiving in Progress') {
            $eligible = true;
            $reason = 'Receiving session is currently in progress.';
        } elseif ($status === 'Receiving Completed' || $status === 'Receiving Complete, GRN Pending' || $status === 'Verified') {
            $eligible = false;
            $reason = 'Receiving is completed. GRN generation / Putaway is pending.';
        } elseif ($status === 'Putaway Pending' || $status === 'Awaiting Putaway' || $status === 'Stock Received' || $status === 'Putaway Completed') {
            $eligible = false;
            $reason = 'Goods have already been received and transferred to warehouse putaway.';
        } else {
            $eligible = false;
            $reason = 'Order status (' . $status . ') is not eligible for warehouse receiving.';
        }

        return response()->json([
            'success' => true,
            'found' => true,
            'eligible' => $eligible,
            'reason' => $reason,
            'data' => [
                'id' => $po->id,
                'inbound_id' => 'INB-2026-' . str_pad($po->id, 5, '0', STR_PAD_LEFT),
                'po_id' => $poRef,
                'asn_id' => $asn ? $asn->asn_number : null,
                'shipment_id' => ($asn && in_array(strtolower($asn->status ?? ''), ['in_transit', 'dispatched'])) ? ('SHP-2026-' . str_pad($asn->id, 5, '0', STR_PAD_LEFT)) : null,
                'supplier' => $po->supplier ? $po->supplier->name : 'Supplier #' . $po->supplier_id,
                'warehouse' => $po->warehouse ? $po->warehouse->name : 'Suguna Warehouse',
                'expected_qty' => $stockQty,
                'line_items_count' => ($po->purchaseItems && $po->purchaseItems->count() > 0) ? $po->purchaseItems->count() : 1,
                'purchase_value' => '₹ ' . number_format($val, 2),
                'status' => $status,
                'po_created_date' => \Carbon\Carbon::parse($po->created_at ?: now())->format('d M Y, h:i A'),
                'expected_delivery' => $po->date ? \Carbon\Carbon::parse($po->date)->format('d M Y') : '30 Aug 2026',
                'items' => $po->purchaseItems->map(function($pi) {
                    $prod = $pi->product;
                    return [
                        'id' => $pi->id,
                        'product_id' => $pi->product_id,
                        'product_name' => $prod ? $prod->name : 'Product Item',
                        'code' => $prod ? $prod->code : 'SKU',
                        'barcode' => ($prod && !empty($prod->code)) ? $prod->code : '8906123456789',
                        'expected_qty' => (int) $pi->quantity,
                        'unit' => 'Units',
                        'unit_cost' => '₹ ' . number_format((float)($pi->net_unit_cost ?: ($pi->product_cost ?: 0)), 2),
                    ];
                })
            ]
        ]);
    }
}
