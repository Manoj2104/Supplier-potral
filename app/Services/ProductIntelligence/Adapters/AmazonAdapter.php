<?php

declare(strict_types=1);

namespace App\Services\ProductIntelligence\Adapters;

use App\Services\ProductIntelligence\VariantIdentityEngine;

class AmazonAdapter extends AbstractMarketplaceAdapter
{
    protected string $platform = 'Amazon';

    public function detect(string $url): bool
    {
        $lower = strtolower($url);
        return str_contains($lower, 'amazon.in') || str_contains($lower, 'amzn.in') || str_contains($lower, 'amazon.com');
    }

    public function fetch(string $url): array
    {
        $html = $this->safeGet($url);
        $embedded = $html ? $this->extractEmbeddedData($html) : [];
        $title = $embedded['og']['title'] ?? $embedded['page_title'] ?? '';

        $asin = '';
        if (preg_match('/(?:dp|gp\/product)\/([A-Z0-9]{10})/i', $url, $m)) {
            $asin = $m[1];
        }

        return [
            'url' => $url,
            'asin' => $asin,
            'html' => $html,
            'embedded' => $embedded,
            'raw_title' => $title,
            'brand' => '',
            'price' => 0.0,
            'mrp' => 0.0,
            'images' => []
        ];
    }

    public function extractVariantFingerprint(array $rawData): array
    {
        return VariantIdentityEngine::buildFingerprint([
            'name' => $rawData['raw_title'] ?? '',
            'brand' => $rawData['brand'] ?? '',
            'pack_size' => '',
            'platform_id' => $rawData['asin'] ?? ''
        ]);
    }

    public function extractImages(array $rawData, string $pvid = '', string $slug = ''): array
    {
        $images = [];
        if (!empty($rawData['embedded']['og']['image'])) {
            $images[] = [
                'url' => $rawData['embedded']['og']['image'],
                'type' => 'FRONT_PACK',
                'source' => 'Amazon OpenGraph',
                'verified' => false
            ];
        }
        return $images;
    }

    public function extractPrice(array $rawData): array
    {
        return [
            'selling_price' => $rawData['price'] ?? 0.0,
            'mrp' => $rawData['mrp'] ?? 0.0,
            'currency' => 'INR',
            'source' => 'Amazon Live',
            'timestamp' => date('c'),
            'price_type' => 'LIVE_SELLING_PRICE'
        ];
    }

    public function extractIdentifiers(array $rawData): array
    {
        return [
            'barcode' => null,
            'barcode_format' => null,
            'asin' => $rawData['asin'] ?? null,
            'source' => 'Amazon'
        ];
    }
}