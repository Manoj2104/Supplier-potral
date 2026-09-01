<?php

declare(strict_types=1);

namespace App\Services\ProductIntelligence\Adapters;

use App\Services\ProductIntelligence\VariantIdentityEngine;

class GenericAdapter extends AbstractMarketplaceAdapter
{
    protected string $platform = 'E-Commerce Marketplace';

    public function detect(string $url): bool
    {
        return true;
    }

    public function fetch(string $url): array
    {
        $html = $this->safeGet($url);
        $embedded = $html ? $this->extractEmbeddedData($html) : [];
        $title = $embedded['og']['title'] ?? $embedded['page_title'] ?? '';

        return [
            'url' => $url,
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
            'pack_size' => ''
        ]);
    }

    public function extractImages(array $rawData, string $pvid = '', string $slug = ''): array
    {
        $images = [];
        if (!empty($rawData['embedded']['og']['image'])) {
            $images[] = [
                'url' => $rawData['embedded']['og']['image'],
                'type' => 'FRONT_PACK',
                'source' => 'OpenGraph Meta',
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
            'source' => 'Live Page',
            'timestamp' => date('c'),
            'price_type' => 'LIVE_SELLING_PRICE'
        ];
    }

    public function extractIdentifiers(array $rawData): array
    {
        return [
            'barcode' => null,
            'barcode_format' => null,
            'source' => 'Generic'
        ];
    }
}