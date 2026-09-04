<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\CreateMainProductRequest;
use App\Http\Requests\UpdateMainProductRequest;
use App\Http\Resources\MainProductCollection;
use App\Http\Resources\MainProductResource;
use App\Models\MainProduct;
use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\SaleItem;
use App\Models\VariationProduct;
use App\Repositories\MainProductRepository;
use App\Repositories\ProductRepository;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class MainProductAPIController extends AppBaseController
{
    /** @var MainProductRepository */
    private $mainProductRepository;

    public function __construct(MainProductRepository $mainProductRepository)
    {
        $this->mainProductRepository = $mainProductRepository;
    }


    public function index(Request $request)
    {
        $perPage = getPageSize($request);
        $products = $this->mainProductRepository;

        $eagerLoads = [
            'products.stock',
            'products.productCategory',
            'products.brand',
            'variations',
            'variationTypes',
            'media'
        ];

        if ($request->get('product_unit')) {
            $products->where('product_unit', $request->get('product_unit'));
        }

        if ($request->get('warehouse_id') && $request->get('warehouse_id') != 'null') {
            $warehouseId = $request->get('warehouse_id');
            $products->whereHas('products.stock', function ($q) use ($warehouseId) {
                $q->where('manage_stocks.warehouse_id', $warehouseId);
            });
        }

        $products = $products->with($eagerLoads)->paginate($perPage);
        MainProductResource::usingWithCollection();

        return new MainProductCollection($products);
    }

    public function show($id): MainProductResource
    {
        /** @var MainProduct $mainProduct */
        $mainProduct = $this->mainProductRepository->find($id);

        return new MainProductResource($mainProduct);
    }

    /**
     * @return MainProductResource|JsonResponse
     */
    public function store(CreateMainProductRequest $request)
    {
        $input = $request->all();

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

        try {
            DB::beginTransaction();

            $productRepo = app(ProductRepository::class);
            $shortName = !empty($input['short_name']) ? trim($input['short_name']) : '';
            if (empty($shortName) || mb_strlen($shortName) > 35) {
                $shortName = \App\Services\ProductIntelligence\UniversalShoppingExtractor::generateSmartShortName($input['name']);
            }
            $input['short_name'] = $shortName;

            $mainProduct = MainProduct::create([
                'name' => $input['name'],
                'short_name' => $shortName,
                'code' => $input['product_code'],
                'product_unit' => $input['product_unit'],
                'product_type' => $input['product_type'],
            ]);

            if (isset($input['images']) && !empty($input['images'])) {
                foreach ($input['images'] as $image) {
                    try {
                        $mainProduct->addMedia($image)->toMediaCollection(
                            MainProduct::PATH,
                            config('app.media_disc')
                        );
                    } catch (\Throwable $mErr) {
                        \Log::warning('MainProduct addMedia notice: ' . $mErr->getMessage());
                    }
                }
            } elseif (isset($input['image_url']) && !empty($input['image_url'])) {
                try {
                    $mainProduct->addMediaFromUrl($input['image_url'])->toMediaCollection(
                        MainProduct::PATH,
                        config('app.media_disc')
                    );
                } catch (\Throwable $e) {
                    \Log::warning('MainProduct addMediaFromUrl notice: ' . $e->getMessage());
                }
            }

            $input['main_product_id'] = $mainProduct->id;
            if ($input['product_type'] == 2) {
                $commonProductInput = Arr::except($input, 'variation_data');

                $variationData = $input['variation_data'];
                if (is_string($variationData)) {
                    $variationData = json_decode($variationData, true) ?: [];
                }
                foreach ($variationData as $key => $variation) {
                    $variation = array_merge($commonProductInput, $variation);
                    if (empty($variation['code']) || $variation['code'] === $mainProduct->product_code) {
                        $variation['code'] = $mainProduct->product_code . '-V' . ($key + 1);
                    }
                    $product = $productRepo->storeProduct($variation);

                    // Ensure valid variation_id and variation_type_id to satisfy foreign key constraints
                    $vId = $variation['variation_id'] ?? null;
                    if (!$vId || !\App\Models\Variation::where('id', $vId)->exists()) {
                        $firstVar = \App\Models\Variation::first();
                        $vId = $firstVar ? $firstVar->id : 1;
                    }

                    $vtId = $variation['variation_type_id'] ?? null;
                    if (!$vtId || !\App\Models\VariationType::where('id', $vtId)->exists()) {
                        $firstVt = \App\Models\VariationType::where('variation_id', $vId)->first();
                        if (!$firstVt) {
                            $firstVt = \App\Models\VariationType::create([
                                'name' => !empty($variation['name']) ? $variation['name'] : 'Standard',
                                'variation_id' => $vId
                            ]);
                        }
                        $vtId = $firstVt->id;
                    }

                    VariationProduct::create([
                        'product_id' => $product->id,
                        'variation_id' => $vId,
                        'variation_type_id' => $vtId,
                        'main_product_id' => $mainProduct->id,
                    ]);
                }
            } else {
                $product = $productRepo->storeProduct($input);
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw new UnprocessableEntityHttpException($e->getMessage());
        }

        return new MainProductResource($product);
    }

    /**
     * @return MainProductResource|JsonResponse
     */
    public function update(UpdateMainProductRequest $request, $id)
    {
        $input = $request->all();
        $mainProduct = MainProduct::find($id);

        $shortName = !empty($input['short_name']) ? trim($input['short_name']) : '';
        if (empty($shortName) || mb_strlen($shortName) > 35) {
            $shortName = \App\Services\ProductIntelligence\UniversalShoppingExtractor::generateSmartShortName($input['name']);
        }
        $input['short_name'] = $shortName;

        $mainProduct->update([
            'name' => $input['name'],
            'short_name' => $shortName,
            'code' => $input['product_code'],
            'product_unit' => $input['product_unit'],
        ]);


        if (isset($input['images']) && !empty($input['images'])) {
            foreach ($input['images'] as $image) {
                $product['image_url'] = $mainProduct->addMedia($image)->toMediaCollection(
                    MainProduct::PATH,
                    config('app.media_disc')
                );
            }
        }

        $products = Product::with('variationType')->where('main_product_id', $id)->get();

        foreach ($products as $product) {
            if ($mainProduct->product_type == MainProduct::VARIATION_PRODUCT) {
                $input['code'] = $input['product_code'] . '-' . strtoupper($product->variationType->name);
            } else {
                $input['code'] = $input['product_code'];
            }
            $productRepo = app(ProductRepository::class);
            $product = $productRepo->updateProduct($input, $product->id);
        }

        return new MainProductResource($product);
    }

    public function destroy($id): JsonResponse
    {
        try {
            DB::beginTransaction();
            $products = Product::where('main_product_id', $id)->get();

            foreach ($products as $product) {
                // Delete associated purchase and sale line items to allow clean product deletion
                PurchaseItem::where('product_id', $product->id)->delete();
                SaleItem::where('product_id', $product->id)->delete();

                if (File::exists(Storage::path('product_barcode/barcode-PR_' . $product->id . '.png'))) {
                    File::delete(Storage::path('product_barcode/barcode-PR_' . $product->id . '.png'));
                }
                $product->delete();
            }

            VariationProduct::where('main_product_id', $id)->delete();

            $this->mainProductRepository->delete($id);
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->sendError($e->getMessage());
        }

        return $this->sendSuccess('Product deleted successfully');
    }
}
