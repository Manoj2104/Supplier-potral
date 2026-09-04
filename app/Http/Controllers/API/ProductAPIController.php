<?php

namespace App\Http\Controllers\API;

use App\Exports\ProductExcelExport;
use App\Http\Controllers\AppBaseController;
use App\Http\Requests\CreateProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductCollection;
use App\Http\Resources\ProductResource;
use App\Imports\ProductImport;
use App\Models\MainProduct;
use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\SaleItem;
use App\Models\VariationProduct;
use App\Repositories\ProductRepository;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ProductAPIController extends AppBaseController
{
    /** @var ProductRepository */
    private $productRepository;

    public function __construct(ProductRepository $productRepository)
    {
        $this->productRepository = $productRepository;
    }

    public function index(Request $request): ProductCollection
    {
        $perPage = getPageSize($request);
        $search = $request->filter['search'] ?? ($request->get('search') ?? '');
        $products = \App\Models\Product::query();

        if (!empty($search)) {
            $products = $products->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%$search%")
                  ->orWhere('code', 'LIKE', "%$search%");
            });
        }

        $eagerLoads = [
            'media',
            'mainProduct.media',
            'productCategory',
            'brand',
            'variationProduct.variation',
            'variationProduct.variationType'
        ];

        if ($request->get('product_unit')) {
            $products->where('product_unit', $request->get('product_unit'));
        }

        if ($request->get('warehouse_id') && $request->get('warehouse_id') != 'null') {
            $warehouseId = $request->get('warehouse_id');
            $products->whereHas('stock', function ($q) use ($warehouseId) {
                $q->where('manage_stocks.warehouse_id', $warehouseId);
            });
            $eagerLoads['stock'] = function (HasOne $query) use ($warehouseId) {
                $query->where('manage_stocks.warehouse_id', $warehouseId);
            };
        } else {
            $eagerLoads[] = 'stock';
        }

        $products = $products->with($eagerLoads)->latest('id')->paginate($perPage);
        ProductResource::usingWithCollection();

        return new ProductCollection($products);
    }

    /**
     * @return ProductResource|JsonResponse
     */
    public function store(CreateProductRequest $request)
    {
        $input = $request->all();

        if ($input['main_product_id']) {
            $mainProduct = MainProduct::find($input['main_product_id']);
            if ($mainProduct->product_type == MainProduct::SINGLE_PRODUCT) {
                return $this->sendError('You can add variations for single type product');
            }
        }

        if (!empty($input['code'])) {
            $codeClean = trim($input['code']);
            $codeLen = strlen($codeClean);
            if (isset($input['barcode_symbol']) && $input['barcode_symbol'] == Product::EAN8) {
                if ($codeLen === 13) {
                    $input['barcode_symbol'] = Product::EAN13;
                } elseif ($codeLen !== 7 && $codeLen !== 8) {
                    return $this->sendError('Please enter 7 or 8 digit code for EAN-8');
                }
            } elseif (isset($input['barcode_symbol']) && $input['barcode_symbol'] == Product::UPC) {
                if ($codeLen === 13) {
                    $input['barcode_symbol'] = Product::EAN13;
                } elseif ($codeLen !== 11 && $codeLen !== 12) {
                    return $this->sendError('Please enter 11 or 12 digit code for UPC');
                }
            }
        }

        $product = $this->productRepository->storeProduct($input);

        VariationProduct::create([
            'product_id' => $product->id,
            'variation_id' => $input['variation_id'],
            'variation_type_id' => $input['variation_type'],
            'main_product_id' => $input['main_product_id'],
        ]);

        return new ProductResource($product);
    }

    public function show($id): ProductResource
    {
        $product = $this->productRepository->find($id);

        return new ProductResource($product);
    }

    public function update(UpdateProductRequest $request, $id): ProductResource
    {
        $input = $request->all();

        $product = $this->productRepository->updateProduct($input, $id);

        return new ProductResource($product);
    }

    public function destroy($id): JsonResponse
    {
        PurchaseItem::where('product_id', $id)->delete();
        SaleItem::where('product_id', $id)->delete();

        if (File::exists(Storage::path('product_barcode/barcode-PR_' . $id . '.png'))) {
            File::delete(Storage::path('product_barcode/barcode-PR_' . $id . '.png'));
        }

        $product = $this->productRepository->find($id);
        if ($product) {
            $mainProduct = MainProduct::withCount('products')->find($product->main_product_id);

            if ($mainProduct && $mainProduct->product_type == MainProduct::VARIATION_PRODUCT && $mainProduct->products_count <= 1) {
                return $this->sendError('You can not delete last variation product');
            }

            VariationProduct::where('product_id', $id)->delete();
            $this->productRepository->delete($id);
        }

        return $this->sendSuccess('Product deleted successfully');
    }

    public function productImageDelete($mediaId): JsonResponse
    {
        $media = Media::where('id', $mediaId)->firstOrFail();
        $media->delete();

        return $this->sendSuccess('Product image deleted successfully');
    }

    public function importProducts(Request $request): JsonResponse
    {
        Excel::import(new ProductImport, request()->file('file'));

        return $this->sendSuccess('Products imported successfully');
    }

    public function getProductExportExcel(Request $request): JsonResponse
    {
        if (Storage::exists('excel/product-excel-export.xlsx')) {
            Storage::delete('excel/product-excel-export.xlsx');
        }
        Excel::store(new ProductExcelExport, 'excel/product-excel-export.xlsx');

        $data['product_excel_url'] = Storage::url('excel/product-excel-export.xlsx');

        return $this->sendResponse($data, 'Product retrieved successfully');
    }

    public function getAllProducts()
    {
        $products = Product::all();
        $data = [];

        foreach ($products as $product) {
            $data[] = [
                'id' => $product->id,
                'name' => $product->name,
            ];
        }

        return $this->sendResponse($data, 'Products retrieve successfully.');
    }

    public function getProductStats(): JsonResponse
    {
        $data = \Illuminate\Support\Facades\Cache::remember('product_catalog_stats', 10, function () {
            $total = Product::count();
            $stocks = DB::table('manage_stocks')
                ->select('product_id', DB::raw('SUM(quantity) as qty'))
                ->groupBy('product_id')
                ->pluck('qty', 'product_id');

            $products = DB::table('products')->select('id', 'product_price')->get();

            $active = 0;
            $low = 0;
            $out = 0;
            $totalVal = 0;
            $priceSum = 0;
            $priceCount = 0;

            foreach ($products as $p) {
                $q = (float) ($stocks[$p->id] ?? 0);
                if ($q > 0) $active++;
                if ($q > 0 && $q < 20) $low++;
                if ($q == 0) $out++;
                $totalVal += ($p->product_price * $q);
                if ($p->product_price > 0) {
                    $priceSum += $p->product_price;
                    $priceCount++;
                }
            }

            $avgPrice = $priceCount > 0 ? ($priceSum / $priceCount) : 0;

            return [
                'total_products'   => $total,
                'active_products'  => $active,
                'low_stock'        => $low,
                'out_of_stock'     => $out,
                'total_value'      => round($totalVal, 2),
                'avg_cost'         => round($avgPrice, 2),
                'recently_updated' => Product::where('updated_at', '>=', now()->subDays(30))->count(),
            ];
        });

        return $this->sendResponse($data, 'Product stats retrieved successfully');
    }
}
