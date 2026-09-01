<?php

declare(strict_types=1);

namespace App\Services\ProductIntelligence\Adapters;

use App\Services\ProductIntelligence\VariantIdentityEngine;

class ZeptoAdapter extends AbstractMarketplaceAdapter
{
    protected string $platform = 'Zepto';

    public function detect(string $url): bool
    {
        return str_contains(strtolower($url), 'zepto.com');
    }

    public function fetch(string $url): array
    {
        $path  = parse_url($url, PHP_URL_PATH) ?? '';
        $parts = array_values(array_filter(explode('/', $path)));
        $slug  = '';
        $pvid  = '';

        for ($i = 0; $i < count($parts); $i++) {
            if ($parts[$i] === 'pn' && isset($parts[$i + 1])) {
                $slug = $parts[$i + 1];
            }
            if ($parts[$i] === 'pvid' && isset($parts[$i + 1])) {
                $pvid = $parts[$i + 1];
            }
        }

        $html     = $this->safeGet($url);
        $embedded = $html ? $this->extractEmbeddedData($html) : [];

        $productData = [
            'url'       => $url,
            'slug'      => $slug,
            'pvid'      => $pvid,
            'html'      => $html,
            'embedded'  => $embedded,
            'raw_title' => $embedded['og']['title'] ?? $embedded['page_title'] ?? '',
            'brand'     => '',
            'price'     => 0.0,
            'mrp'       => 0.0,
            'qty'       => '',
            'unit'      => '',
            'images'    => [],
        ];

        // Try to extract structured product data from Next.js state
        if (!empty($embedded['next_data']['props']['pageProps'])) {
            $pp   = $embedded['next_data']['props']['pageProps'];
            $prod = $pp['product']
                 ?? $pp['initialData']['product']
                 ?? $pp['productVariant']
                 ?? $pp['initialData']['productVariant']
                 ?? null;

            if ($prod) {
                $productData['raw_title'] = $prod['name'] ?? $prod['product_name'] ?? $productData['raw_title'];
                $productData['brand']     = $prod['brand'] ?? $prod['brand_name'] ?? '';
                $productData['price']     = (float)($prod['discounted_price'] ?? $prod['selling_price'] ?? $prod['price'] ?? 0) / 100;
                $productData['mrp']       = (float)($prod['mrp'] ?? 0) / 100;
                $productData['qty']       = $prod['pack_size'] ?? $prod['quantity'] ?? '';
                $productData['unit']      = $prod['unit'] ?? '';

                // Extract images from Next.js state
                if (!empty($prod['images']) && is_array($prod['images'])) {
                    $productData['state_images'] = $prod['images'];
                }
                if (!empty($prod['image_url'])) {
                    $productData['state_images'][] = $prod['image_url'];
                }
            }
        }

        return $productData;
    }

    public function extractVariantFingerprint(array $rawData): array
    {
        $title = $rawData['raw_title'] ?? '';
        if (empty($title) && !empty($rawData['slug'])) {
            $title = $this->slugToTitle($rawData['slug']);
        }

        return VariantIdentityEngine::buildFingerprint([
            'name'        => $title,
            'brand'       => $rawData['brand'] ?? '',
            'pack_size'   => $rawData['qty'] ?? '',
            'slug'        => $rawData['slug'] ?? '',
            'pvid'        => $rawData['pvid'] ?? '',
            'platform_id' => $rawData['pvid'] ?? '',
        ]);
    }

    /**
     * CRITICAL FIX v12.0 — collect ALL accessible product images.
     * Previous version stopped at the first hit (WRONG).
     *
     * Discovery order:
     *   1. Next.js embedded state images
     *   2. Multiple Zepto CDN URL patterns (all variants)
     *   3. OpenGraph image
     *   4. HTML img tags
     *   5. JSON-LD Product images
     */
    public function extractImages(array $rawData, string $pvid = '', string $slug = ''): array
    {
        $effPvid = $pvid ?: ($rawData['pvid'] ?? '');
        $effSlug = $slug ?: ($rawData['slug'] ?? '');
        $images  = [];
        $seen    = [];

        $addImage = function (string $url, string $type, string $source, bool $verified = false) use (&$images, &$seen) {
            $url = trim($url);
            if (empty($url)) return;
            $key = md5($url);
            if (isset($seen[$key])) return;
            $seen[$key] = true;
            $images[] = [
                'url'             => $url,
                'type'            => $type,
                'source'          => $source,
                'verified'        => $verified,
                'download_status' => 'PENDING',
            ];
        };

        // 1. Next.js state images
        foreach ($rawData['state_images'] ?? [] as $idx => $imgUrl) {
            if (is_string($imgUrl) && str_starts_with($imgUrl, 'http')) {
                $type = $idx === 0 ? 'FRONT_PACK' : ($idx === 1 ? 'BACK_PACK' : 'OTHER');
                $addImage($imgUrl, $type, 'Zepto Next.js State', true);
            } elseif (is_array($imgUrl) && !empty($imgUrl['url'])) {
                $type = ($imgUrl['type'] ?? 'front') === 'back' ? 'BACK_PACK' : 'FRONT_PACK';
                $addImage($imgUrl['url'], $type, 'Zepto Next.js State', true);
            }
        }

        // 2. Zepto CDN patterns — ALL variants, not just first hit
        if (!empty($effPvid)) {
            $titleSlug = !empty($effSlug)
                ? implode('-', array_map('ucfirst', explode('-', $effSlug)))
                : 'Product';

            $patterns = [
                // Standard product images (multiple aspect ratios and widths)
                "https://cdn.zeptonow.com/production/ik-seo/tr:w-1000,ar-1000-1000,pr-true,f-auto,q-80/{$effPvid}.jpeg",
                "https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-2000-2000,pr-true,f-auto,q-80/cms/product_variant/{$effPvid}/{$titleSlug}.jpeg",
                "https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1000-1000,pr-true,f-auto,q-80/cms/product_variant/{$effPvid}/{$titleSlug}.jpeg",
                "https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-2000-2000,pr-true,f-auto,q-40,dpr-2/cms/product_variant/{$effPvid}/{$titleSlug}.jpeg",
                "https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1000-1000,pr-true,f-auto,q-40,dpr-2/cms/product_variant/{$effPvid}/{$titleSlug}.jpeg",
                "https://cdn.zeptonow.com/production/tr:w-600,ar-100-100,pr-true,f-auto,q-80/inventory/product/{$effPvid}.jpg",
                "https://cdn.zeptonow.com/production/tr:w-1200,ar-100-100,pr-true,f-auto,q-80/inventory/product/{$effPvid}.jpg",
                // Back-panel image patterns (indexed slots)
                "https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1000-1000,pr-true,f-auto,q-80/cms/product_variant/{$effPvid}/{$titleSlug}-2.jpeg",
                "https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1000-1000,pr-true,f-auto,q-80/cms/product_variant/{$effPvid}/{$titleSlug}-3.jpeg",
                "https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1000-1000,pr-true,f-auto,q-80/cms/product_variant/{$effPvid}/{$titleSlug}-4.jpeg",
                "https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1000-1000,pr-true,f-auto,q-80/cms/product_variant/{$effPvid}/{$titleSlug}-5.jpeg",
            ];

            // Numbered image slots (1..6) — Zepto stores all packaging photos here
            for ($i = 1; $i <= 6; $i++) {
                $patterns[] = "https://cdn.zeptonow.com/production/ik-seo/tr:w-1000,ar-1000-1000,pr-true,f-auto,q-80/cms/product_variant/{$effPvid}/{$i}.jpeg";
                $patterns[] = "https://cdn.zeptonow.com/production/ik-seo/tr:w-1000,ar-1000-1000,pr-true,f-auto,q-80/cms/product_variant/{$effPvid}/{$i}.jpg";
            }

            // Check each pattern in parallel (small batches)
            foreach (array_unique($patterns) as $idx => $cdnUrl) {
                if ($this->imageExists($cdnUrl)) {
                    // Heuristic: index 0 = front, 1+ = other packaging sides
                    $type = count($images) === 0 ? 'FRONT_PACK' : ($idx >= 7 ? 'BACK_PACK' : 'OTHER');
                    $addImage($cdnUrl, $type, 'Zepto CDN (Live)', true);
                }
            }
        }

        // 3. OpenGraph image
        if (!empty($rawData['embedded']['og']['image'])) {
            $addImage($rawData['embedded']['og']['image'], 'FRONT_PACK', 'Zepto OpenGraph', false);
        }

        // 4. JSON-LD images
        foreach ($rawData['embedded']['json_ld'] ?? [] as $ld) {
            if (!empty($ld['image'])) {
                $ldImgs = is_array($ld['image']) ? $ld['image'] : [$ld['image']];
                foreach ($ldImgs as $idx => $ldImg) {
                    $url = is_array($ldImg) ? ($ldImg['url'] ?? '') : $ldImg;
                    $addImage($url, $idx === 0 ? 'FRONT_PACK' : 'OTHER', 'JSON-LD Product', false);
                }
            }
        }

        // 5. HTML img tags — extract product image candidates
        if (!empty($rawData['html'])) {
            preg_match_all('/<img[^>]+src=["\']([^"\']+zepto[^"\']+)["\'][^>]*>/i', $rawData['html'], $m);
            foreach ($m[1] ?? [] as $imgUrl) {
                if (preg_match('/\.(jpg|jpeg|png|webp)/i', $imgUrl)) {
                    $addImage($imgUrl, 'OTHER', 'HTML img tag', false);
                }
            }
            // Also extract srcset and data-src
            preg_match_all('/(?:srcset|data-src)=["\']([^"\']+)["\']/', $rawData['html'], $m2);
            foreach ($m2[1] ?? [] as $srcSet) {
                $urls = preg_split('/\s*,\s*/', $srcSet);
                foreach ($urls as $part) {
                    $u = preg_split('/\s+/', trim($part))[0] ?? '';
                    if (str_starts_with($u, 'http') && preg_match('/\.(jpg|jpeg|png|webp)/i', $u)) {
                        $addImage($u, 'OTHER', 'HTML srcset', false);
                    }
                }
            }
        }

        return $images;
    }

    public function extractPrice(array $rawData): array
    {
        return [
            'selling_price' => $rawData['price'] ?? 0.0,
            'mrp'           => $rawData['mrp'] ?? 0.0,
            'currency'      => 'INR',
            'source'        => 'Zepto Live Marketplace',
            'timestamp'     => date('c'),
            'price_type'    => 'LIVE_SELLING_PRICE',
        ];
    }

    public function extractIdentifiers(array $rawData): array
    {
        return [
            'barcode'        => null,
            'barcode_format' => null,
            'pvid'           => $rawData['pvid'] ?? null,
            'slug'           => $rawData['slug'] ?? null,
            'source'         => 'Zepto Identifiers',
        ];
    }
}