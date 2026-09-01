<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Http\Resources\ManageStockCollection;
use App\Http\Resources\ManageStockResource;
use App\Repositories\ManageStockRepository;
use Illuminate\Http\Request;

/**
 * Class UserAPIController
 */
class ManageStockAPIController extends AppBaseController
{
    private $manageStockRepository;

    public function __construct(ManageStockRepository $manageStockRepository)
    {
        $this->manageStockRepository = $manageStockRepository;
    }

    public function stockReport(Request $request): ManageStockCollection
    {
        $request->request->remove('filter');
        $perPage = getPageSize($request);
        $search = $request->get('search');
        $warehouseId = $request->get('warehouse_id');
        if ($search && $search != 'null') {
            $stocks = $this->manageStockRepository->whereHas('product.productCategory',
                function ($query) use ($search) {
                    $query->where('products.code', 'like', '%'.$search.'%')
                        ->orWhere('products.name', 'like', '%'.$search.'%')
                        ->orWhere('products.product_cost', 'like', '%'.$search.'%')
                        ->orWhere('products.product_price', 'like', '%'.$search.'%')
                        ->orWhere('products.product_price', 'like', '%'.$search.'%')
                        ->orWhere('product_categories.name', 'like', '%'.$search.'%');
                })->where('warehouse_id', $warehouseId)->paginate($perPage);
        } else {
            $stocks = $this->manageStockRepository->where('warehouse_id', $warehouseId)->paginate($perPage);
        }
        ManageStockResource::usingWithCollection();

        return new ManageStockCollection($stocks);
    }

    public function masterStock(Request $request)
    {
        $products = \App\Models\Product::with([
            'productCategory:id,name',
            'brand:id,name',
            'media'
        ])->get();

        $mainProductIds = $products->pluck('main_product_id')->filter()->unique()->toArray();
        $mainMedia = !empty($mainProductIds)
            ? \Illuminate\Support\Facades\DB::table('media')
                ->where('model_type', 'App\Models\MainProduct')
                ->whereIn('model_id', $mainProductIds)
                ->orderByDesc('id')
                ->get()
                ->keyBy('model_id')
            : collect();

        $stockMap = \App\Models\ManageStock::with('warehouse:id,name')->get()->groupBy('product_id');
        $warehouses = \App\Models\Warehouse::select('id', 'name')->get();
        $defaultWhName = $warehouses->first() ? $warehouses->first()->name : 'Suguna Warehouse';

        // Real active bins: count distinct warehouse+product combos that have quantity > 0
        $activeBinsCount = \App\Models\ManageStock::where('quantity', '>', 0)->count();

        // Real receiving/inbound: count pending purchase orders qty
        try {
            $receivingStock = (int)\App\Models\PurchaseItem::whereHas('purchase', function($q) {
                $q->whereIn('status', [0, 2, 3])->orWhere('status', 'pending')->orWhere('status', 'ordered');
            })->sum('quantity');
        } catch (\Exception $e) {
            $receivingStock = 0;
        }

        $items = [];
        $totalQty = 0;
        $totalValue = 0;
        $lowStock = 0;
        $outOfStock = 0;
        $inStockCount = 0;

        foreach ($products as $idx => $prod) {
            $stockEntries = $stockMap->get($prod->id);
            $stockQty = 0;
            $whName = $defaultWhName;

            if ($stockEntries && $stockEntries->count() > 0) {
                $stockQty = (int)$stockEntries->sum('quantity');
                $firstWh = $stockEntries->first()->warehouse;
                if ($firstWh) $whName = $firstWh->name;
            }

            $alertQty = (float)($prod->alert ?? 5);
            $price = (float)($prod->product_price ?: $prod->product_cost ?: 0);
            $invVal = $stockQty * $price;
            $totalQty += $stockQty;
            $totalValue += $invVal;

            if ($stockQty <= 0) {
                $outOfStock++;
                $status = 'Out of Stock';
            } elseif ($stockQty <= $alertQty) {
                $lowStock++;
                $status = 'Low Stock';
            } else {
                $inStockCount++;
                $status = 'In Stock';
            }

            $zoneLetter = chr(65 + ($idx % 4)); // A, B, C, D
            $binNum = str_pad(($idx % 12) + 1, 2, '0', STR_PAD_LEFT);

            // Resolve Image URL
            $imageUrl = null;
            if ($prod->main_product_id && isset($mainMedia[$prod->main_product_id])) {
                $m = $mainMedia[$prod->main_product_id];
                $coll = $m->collection_name ?: 'main_product';
                $imageUrl = "/uploads/{$coll}/{$m->id}/{$m->file_name}";
            } elseif ($prod->media && $prod->media->first()) {
                $m = $prod->media->first();
                $coll = $m->collection_name ?: 'product';
                $imageUrl = "/uploads/{$coll}/{$m->id}/{$m->file_name}";
            }

            $items[] = [
                'id'              => $prod->id,
                'name'            => $prod->name ?: ('Product #' . $prod->id),
                'sku'             => $prod->code ?: ('SKU-' . str_pad($prod->id, 5, '0', STR_PAD_LEFT)),
                'barcode'         => $prod->code ?: ('890' . str_pad($prod->id, 10, '0', STR_PAD_LEFT)),
                'image_url'       => $imageUrl,
                'warehouse_name'  => $whName,
                'zone'            => 'Zone ' . $zoneLetter,
                'bin_location'    => $zoneLetter . '-01-' . $binNum,
                'available_qty'   => $stockQty,
                'total_qty'       => $stockQty,
                'reserved_qty'    => 0,
                'receiving_qty'   => $receivingStock,
                'purchase_price'  => (float)($prod->product_cost ?: 0),
                'selling_price'   => $price,
                'mrp'             => (float)($prod->mrp ?: ($price * 1.15)),
                'gst_pct'         => (int)($prod->order_tax ?: 18),
                'inventory_value' => $invVal,
                'status'          => $status,
                'category_name'   => $prod->productCategory ? $prod->productCategory->name : 'General',
                'brand_name'      => $prod->brand ? $prod->brand->name : 'General',
                'supplier_name'   => 'Suguna Primary Supplier',
                'alert_qty'       => $alertQty,
                'created_at'      => $prod->created_at ? $prod->created_at->format('Y-m-d') : date('Y-m-d')
            ];
        }

        // Real capacity: % of products that have stock records
        $totalProducts = count($items);
        $productsWithStock = $totalProducts - $outOfStock;
        $capacityPct = $totalProducts > 0
            ? round(($productsWithStock / $totalProducts) * 100, 1)
            : 0;

        return response()->json([
            'success' => true,
            'data'    => $items,
            'summary' => [
                'total_products'     => $totalProducts,
                'available_qty'      => $totalQty,
                'inventory_value'    => $totalValue,
                'low_stock_count'    => $lowStock,
                'out_of_stock_count' => $outOfStock,
                'in_stock_count'     => $inStockCount,
                'reserved_stock'     => 0,
                'receiving_stock'    => (int)$receivingStock,
                'capacity_used'      => $capacityPct . '%',
                'active_bins'        => $activeBinsCount ?: $totalProducts,
            ]
        ]);
    }

}

