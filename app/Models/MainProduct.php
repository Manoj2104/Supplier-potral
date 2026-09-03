<?php

namespace App\Models;

use App\Models\Contracts\JsonResourceful;
use App\Traits\HasJsonResourcefulData;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class MainProduct extends Model implements HasMedia, JsonResourceful
{
    use HasFactory, HasJsonResourcefulData, InteractsWithMedia;

    protected $fillable = [
        'name',
        'short_name',
        'code',
        'product_unit',
        'product_type',
    ];

    const JSON_API_TYPE = 'products';

    const SINGLE_PRODUCT = 1;
    const VARIATION_PRODUCT = 2;

    const PATH = 'main_product';


    protected $appends = ['image_url'];

    public static $rules = [
        'images.*' => 'image|mimes:jpg,jpeg,png',
    ];

    protected $casts = [
        'name' => 'string',
        'short_name' => 'string',
        'code' => 'string',
        'product_unit' => 'string',
        'product_type' => 'integer',
    ];

    public function getIdFilterFields(): array
    {
        return [
            'id' => self::class,
        ];
    }

    public function prepareLinks(): array
    {
        return [
            'self' => route('products.show', $this->id),
        ];
    }

    public function prepareAttributes(): array
    {
        $this->load('products');
        $prices = collect($this->products)->pluck('product_price')->toArray();

        $fields = [
            'name' => $this->name,
            'short_name' => $this->short_name ?: mb_substr($this->name, 0, 35),
            'code' => $this->code,
            'product_unit' => $this->getProductUnitName($this->product_unit),
            'product_type' => $this->product_type,
            'min_price' => count($prices) > 0 ? min($prices) : 0,
            'max_price' => count($prices) > 0 ? max($prices) : 0,
            'images' => $this->image_url,
            'products' => $this->products ? $this->products->map(function ($product) {
                if (!$product) return [];
                $productData = $product->prepareAttributes();
                $productData['id'] = $product->id;

                return $productData;
            }) : [],
        ];

        if ($this->product_type == self::VARIATION_PRODUCT) {
            $fields['variation'] = $this->variations ? $this->variations->prepareAttributes() : null;
            $fields['variation_types'] = $this->variationTypes ? $this->variationTypes->map(function ($variationType) {
                return $variationType->only('id', 'name');
            }) : [];
        }

        return $fields;
    }

    /**
     * @return array|string
     */
    public function getImageUrlAttribute()
    {
        /** @var Media $media */
        $medias = $this->getMedia(MainProduct::PATH);
        $images = [];
        if (!empty($medias) && count($medias) > 0) {
            foreach ($medias as $key => $media) {
                $images['imageUrls'][$key] = str_replace('\\', '/', $media->getFullUrl());
                $images['id'][$key] = $media->id;
            }

            return $images;
        }

        // Child sub-products fallback
        $subProduct = $this->products()->has('media')->with('media')->first();
        if ($subProduct) {
            $subMedias = $subProduct->getMedia(Product::PATH);
            if (!empty($subMedias) && count($subMedias) > 0) {
                foreach ($subMedias as $key => $media) {
                    $images['imageUrls'][$key] = str_replace('\\', '/', $media->getFullUrl());
                    $images['id'][$key] = $media->id;
                }
                return $images;
            }
        }

        return '';
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function variations()
    {
        return $this->hasOneThrough(Variation::class, VariationProduct::class, 'main_product_id', 'id', 'id', 'variation_id');
    }
    public function variationTypes()
    {
        return $this->hasManyThrough(VariationType::class, VariationProduct::class, 'main_product_id', 'id', 'id', 'variation_type_id');
    }

    /**
     * @return array|string
     */
    public function getProductUnitName()
    {
        $productUnit = BaseUnit::whereId($this->product_unit)->first();
        if (!$productUnit) {
            $productUnit = Unit::whereId($this->product_unit)->first();
        }
        if ($productUnit) {
            return $productUnit->toArray();
        }

        return '';
    }
}
