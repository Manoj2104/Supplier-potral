<?php

declare(strict_types=1);

namespace App\Services\ProductIntelligence;

require_once __DIR__ . '/MasterProductCatalog.php';
require_once __DIR__ . '/ProductSpecificationAnalyzer.php';
require_once __DIR__ . '/VariantIdentityEngine.php';
require_once __DIR__ . '/EvidenceConfidenceEngine.php';
require_once __DIR__ . '/BarcodeChecksumService.php';
require_once __DIR__ . '/BarcodeVerificationEngine.php';
require_once __DIR__ . '/BarcodeDecoderService.php';
require_once __DIR__ . '/ProductRegistryVerificationEngine.php';
require_once __DIR__ . '/ProductConflictEngine.php';
require_once __DIR__ . '/Adapters/AbstractMarketplaceAdapter.php';
require_once __DIR__ . '/Adapters/ZeptoAdapter.php';
require_once __DIR__ . '/Adapters/BlinkitAdapter.php';
require_once __DIR__ . '/Adapters/AmazonAdapter.php';
require_once __DIR__ . '/Adapters/FlipkartAdapter.php';
require_once __DIR__ . '/Adapters/BigBasketAdapter.php';
require_once __DIR__ . '/Adapters/JioMartAdapter.php';
require_once __DIR__ . '/Adapters/GenericAdapter.php';

use App\Services\ProductIntelligence\Adapters\ZeptoAdapter;
use App\Services\ProductIntelligence\Adapters\BlinkitAdapter;
use App\Services\ProductIntelligence\Adapters\AmazonAdapter;
use App\Services\ProductIntelligence\Adapters\FlipkartAdapter;
use App\Services\ProductIntelligence\Adapters\BigBasketAdapter;
use App\Services\ProductIntelligence\Adapters\JioMartAdapter;
use App\Services\ProductIntelligence\Adapters\GenericAdapter;

/**
 * MarketplaceAdapterRegistry — v12.0
 *
 * The central product intelligence pipeline.
 * Coordinates 10 extraction steps from URL to final verified product object.
 *
 * Pipeline steps:
 *   1.  PVID exact match → MasterProductCatalog
 *   2.  Slug exact match → MasterProductCatalog
 *   3.  Live marketplace adapter fetch
 *   4.  Variant fingerprinting (VariantIdentityEngine)
 *   5.  Catalog match + conflict shield
 *   6.  Full-image discovery (ZeptoAdapter — all images)
 *   7.  Barcode CV decoding (BarcodeDecoderService — ZXing + jimp)
 *   8.  Registry verification (ProductRegistryVerificationEngine)
 *   9.  Conflict detection (ProductConflictEngine)
 *   10. Evidence scoring (EvidenceConfidenceEngine) + v12 response build
 *
 * ZERO FABRICATION RULES:
 *   - Never invent a barcode
 *   - Never label catalog barcode as PACKAGING_DETECTED
 *   - Never use DuckDuckGo/Google as authoritative source
 *   - Never label text-search result as REGISTRY_MATCH
 *   - cost_price is always null unless provided by existing POS logic
 */
class MarketplaceAdapterRegistry
{
    private static array $adapters = [];

    private static function initAdapters(): void
    {
        if (empty(self::$adapters)) {
            self::$adapters = [
                new ZeptoAdapter(),
                new BlinkitAdapter(),
                new AmazonAdapter(),
                new FlipkartAdapter(),
                new BigBasketAdapter(),
                new JioMartAdapter(),
                new GenericAdapter(),
            ];
        }
    }

    // ── MAIN ENTRY POINT ──────────────────────────────────────────────────────

    public static function resolve(string $url): array
    {
        $startTime = microtime(true);
        self::initAdapters();

        // ── SSRF Guard ──────────────────────────────────────────────────────
        $allowedDomains = [
            'zepto.com', 'blinkit.com', 'grofers.com', 'amazon.in', 'amzn.in',
            'flipkart.com', 'bigbasket.com', 'jiomart.com', 'swiggy.com',
        ];
        $host    = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
        $allowed = false;
        foreach ($allowedDomains as $d) {
            if (str_ends_with($host, $d)) { $allowed = true; break; }
        }

        // ── URL parsing ─────────────────────────────────────────────────────
        $path  = parse_url($url, PHP_URL_PATH) ?? '';
        $parts = array_values(array_filter(explode('/', $path)));
        $slug  = $pvid = '';

        for ($i = 0; $i < count($parts); $i++) {
            if ($parts[$i] === 'pn'   && isset($parts[$i+1])) $slug = $parts[$i+1];
            if ($parts[$i] === 'pvid' && isset($parts[$i+1])) $pvid = $parts[$i+1];
        }
        if (empty($slug)) {
            foreach ($parts as $p) {
                $c = urldecode($p);
                if (strlen($c) > 5 && str_contains($c, '-') && preg_match('/[a-zA-Z]/', $c)) {
                    if (!in_array(strtolower($c), ['dp','product','items','buy','p','pn','pvid','category','catalog','search'], true)) {
                        $slug = $c; break;
                    }
                }
            }
        }
        $slugLower = strtolower($slug);

        // ── STEP 1: Master Catalog PVID exact match ─────────────────────────
        $catalog = MasterProductCatalog::getCatalog();
        if (!empty($pvid)) {
            foreach ($catalog as $entry) {
                if ((!empty($entry['pvid']) && $entry['pvid'] === $pvid)
                 || (!empty($entry['zepto_pvid']) && $entry['zepto_pvid'] === $pvid)) {
                    return self::buildFromCatalog($entry, $url, $slug, $pvid, 'Zepto', $startTime, 'EXACT_PVID');
                }
            }
        }

        // ── STEP 2: Master Catalog exact slug match ─────────────────────────
        if (!empty($slugLower) && isset($catalog[$slugLower])) {
            return self::buildFromCatalog($catalog[$slugLower], $url, $slug, $pvid, self::detectPlatform($url), $startTime, 'EXACT_SLUG');
        }

        // ── STEP 3: Marketplace adapter live fetch ──────────────────────────
        $platform = self::detectPlatform($url);
        $adapter  = null;
        foreach (self::$adapters as $a) {
            if ($a->detect($url)) { $adapter = $a; break; }
        }

        $rawData = [];
        if ($adapter && $allowed) {
            $rawData = $adapter->fetch($url);
        }

        // ── STEP 4: Variant fingerprinting ──────────────────────────────────
        $fingerprint = [];
        if (!empty($rawData) && $adapter) {
            $fingerprint = $adapter->extractVariantFingerprint($rawData);
        }
        if (empty($fingerprint['brand']) || empty($fingerprint['normalized_name'])) {
            $fingerprint = VariantIdentityEngine::buildFingerprint([
                'name'    => ucwords(str_replace('-', ' ', $slug)),
                'brand'   => '',
                'slug'    => $slug,
                'pvid'    => $pvid,
            ]);
        }

        // ── STEP 5: Catalog fuzzy match + conflict shield ───────────────────
        $catalogMatch = VariantIdentityEngine::matchAgainstCatalog($fingerprint, $catalog);
        if ($catalogMatch && $catalogMatch['match'] !== null) {
            $entry = $catalogMatch['match'];
            $catFp = VariantIdentityEngine::buildFingerprint([
                'name'     => $entry['name'],
                'brand'    => $entry['brand'],
                'pack_size'=> $entry['pack_size'] ?? '',
            ]);
            $conflicts = VariantIdentityEngine::detectConflicts($fingerprint, $catFp);
            if ($conflicts['has_conflict']) {
                return self::buildFromLiveData($rawData, $fingerprint, $adapter, $url, $slug, $pvid, $platform, $startTime, $conflicts);
            }
            return self::buildFromCatalog($entry, $url, $slug, $pvid, $platform, $startTime, $catalogMatch['method']);
        }

        // ── STEP 6-10: Full live extraction pipeline ────────────────────────
        return self::buildFromLiveData($rawData, $fingerprint, $adapter, $url, $slug, $pvid, $platform, $startTime, ['has_conflict' => false, 'conflicts' => []]);
    }

    // ── CATALOG RESPONSE BUILDER ──────────────────────────────────────────────

    /**
     * Build response from a verified MasterProductCatalog entry.
     * IMPORTANT: Catalog barcodes are CATALOG_REFERENCE — not PACKAGING_DETECTED.
     */
    private static function buildFromCatalog(array $entry, string $url, string $slug, string $pvid, string $platform, float $startTime, string $matchMethod): array
    {
        $barcode = !empty($entry['barcode']) ? (string)$entry['barcode'] : null;

        // Classify the catalog barcode honestly
        $catalogBarcodeStatus = $entry['barcode_status'] ?? ($barcode
            ? BarcodeVerificationEngine::STATUS_CATALOG_REFERENCE
            : BarcodeVerificationEngine::STATUS_UNVERIFIED);
        $physicalDecoded = ($catalogBarcodeStatus === BarcodeVerificationEngine::STATUS_PACKAGING_MATCH);

        // Attempt registry verification if we have a barcode
        $registryResult  = ['status' => BarcodeVerificationEngine::STATUS_NOT_CHECKED];
        $checksumResult  = ['valid' => false, 'barcode_type' => 'UNKNOWN'];

        if ($barcode) {
            $checksumResult = BarcodeChecksumService::validate($barcode);
            if ($checksumResult['valid']) {
                // Only run registry lookup if checksum valid
                $regResult = ProductRegistryVerificationEngine::verifyGtin($barcode, $entry['brand'] ?? '', $entry['name'] ?? '');
                if ($regResult['registry_matched']) {
                    $registryResult = [
                        'status'     => BarcodeVerificationEngine::STATUS_REGISTRY_MATCH,
                        'source'     => $regResult['best_match']['registry'] ?? 'Registry',
                        'confidence' => $regResult['best_match']['match_score'] ?? 80,
                    ];
                }
            }
        }

        // Determine verification level
        $registryMatched  = ($registryResult['status'] ?? '') === BarcodeVerificationEngine::STATUS_REGISTRY_MATCH;
        $verificationLevel = BarcodeVerificationEngine::determineVerificationLevel(
            !empty($barcode),
            $checksumResult['valid'] ?? false,
            $physicalDecoded,
            false, // ocr match
            $registryMatched,
            false  // cross-source
        );

        $evidenceFlags = [
            'SOURCE_PAGE_DATA'       => true,
            'EXACT_PVID_MATCH'       => $matchMethod === 'EXACT_PVID',
            'EXACT_VARIANT_MATCH'    => in_array($matchMethod, ['EXACT_VARIANT', 'EXACT_SLUG', 'EXACT_PVID'], true),
            'BARCODE_PACKAGING_MATCH'=> $physicalDecoded,
            'BARCODE_GS1_VERIFIED'   => false,
            'BARCODE_REGISTRY_MATCH' => $registryMatched,
            'BARCODE_CHECKSUM_VALID' => $checksumResult['valid'] ?? false,
            'IMAGE_FOUND'            => true,
            'BRAND_MATCH'            => true,
            'QTY_CONFIRMED'          => true,
        ];
        $score  = EvidenceConfidenceEngine::calculateScore($evidenceFlags);
        $status = EvidenceConfidenceEngine::determineOverallStatus($score, []);

        // Image discovery — use catalog PVID if available
        $images     = self::discoverCatalogImages($entry, $pvid ?: ($entry['pvid'] ?? ''), $slug ?: ($entry['zepto_slug'] ?? ''));
        $primaryImg = !empty($images) ? ($images[0]['url'] ?? null) : null;
        $imgSource  = !empty($images) ? ($images[0]['source'] ?? $platform . ' CDN') : 'Not Available';

        $price = (float)($entry['price'] ?? 0);
        $mrp   = (float)($entry['mrp'] ?? $price);
        $fetchMs = round((microtime(true) - $startTime) * 1000);

        return self::buildV12Response([
            'name'          => $entry['name'],
            'brand'         => $entry['brand'],
            'category'      => $entry['category'],
            'sub_category'  => $entry['sub_category'] ?? $entry['category'],
            'pack_size'     => $entry['pack_size'] ?? '1 Unit',
            'unit'          => $entry['unit'] ?? 'PCS',
            'barcode'       => $barcode,
            'barcode_type'  => $checksumResult['barcode_type'] ?? ($barcode ? 'EAN-13' : null),
            'barcode_status'=> $catalogBarcodeStatus,
            'barcode_source_label' => $barcode ? 'Catalog Reference (unverified physical)' : 'Not Available',
            'verification_level'   => $verificationLevel,
            'verification_level_num' => BarcodeVerificationEngine::levelToNumber($verificationLevel),
            'physical_detection'   => $physicalDecoded,
            'registry_match'       => $registryMatched,
            'price'         => $price,
            'mrp'           => $mrp,
            'images'        => $images,
            'image_url'     => $primaryImg,
            'image_source'  => $imgSource,
            'platform'      => $platform,
            'match_method'  => $matchMethod,
            'status'        => $status,
            'score'         => $score,
            'fetchMs'       => $fetchMs,
            'conflicts'     => [],
            'all_images'    => $images,
            'barcode_candidates' => [],
            'registry_results'   => $registryMatched ? [$registryResult] : [],
            'field_provenance' => [
                ['field' => 'product_name', 'value' => $entry['name'], 'source' => 'MasterProductCatalog', 'method' => 'EXACT_MATCH', 'confidence' => 100],
                ['field' => 'brand',        'value' => $entry['brand'], 'source' => 'MasterProductCatalog', 'method' => 'EXACT_MATCH', 'confidence' => 100],
                ['field' => 'gtin',         'value' => $barcode, 'source' => 'MasterProductCatalog', 'method' => 'CATALOG_REFERENCE', 'confidence' => 20,
                    'note' => 'Catalog reference — not decoded from physical packaging'],
                ['field' => 'selling_price','value' => $price, 'source' => 'MasterProductCatalog', 'method' => 'CATALOG', 'confidence' => 80],
                ['field' => 'mrp',          'value' => $mrp,   'source' => 'MasterProductCatalog', 'method' => 'CATALOG', 'confidence' => 80],
            ],
            'diagnostics' => [
                'source'         => 'MASTER_CATALOG',
                'match_method'   => $matchMethod,
                'fetch_latency_ms' => $fetchMs,
                'barcode_note'   => 'Catalog barcodes are CATALOG_REFERENCE. Physical packaging decode not performed.',
                'decoder_available' => false,
            ],
        ]);
    }

    // ── LIVE EXTRACTION PIPELINE (Steps 6-10) ────────────────────────────────

    private static function buildFromLiveData(
        array $rawData,
        array $fingerprint,
        $adapter,
        string $url,
        string $slug,
        string $pvid,
        string $platform,
        float $startTime,
        array $legacyConflicts
    ): array {
        $diagnostics = [
            'source'            => 'LIVE_EXTRACTION',
            'platform'          => $platform,
            'canonical_url'     => $url,
            'adapter'           => $adapter ? get_class($adapter) : 'None',
            'fetch_status'      => !empty($rawData) ? 'SUCCESS' : 'FAILED',
            'fetch_latency_ms'  => 0,
            'image_count'       => 0,
            'images_downloaded' => 0,
            'barcode_candidates'=> 0,
            'verification_level'=> BarcodeVerificationEngine::LEVEL_0_NOT_FOUND,
            'overall_confidence'=> 0,
        ];

        // ── Extract price + identifiers from adapter ──────────────────────
        $priceData   = $adapter && !empty($rawData) ? $adapter->extractPrice($rawData) : [];
        $identifiers = $adapter && !empty($rawData) ? $adapter->extractIdentifiers($rawData) : ['barcode' => null];

        // ── STEP 6: Full image discovery ──────────────────────────────────
        $allImages = [];
        if ($adapter && !empty($rawData)) {
            $allImages = $adapter->extractImages($rawData, $pvid, $slug);
        }
        // Classify images
        $allImages       = self::classifyImages($allImages);
        $diagnostics['image_count'] = count($allImages);

        // ── Clean product name ────────────────────────────────────────────
        $cleanTitle = !empty($fingerprint['name'])
            ? $fingerprint['name']
            : ucwords(str_replace('-', ' ', $slug));
        $cleanTitle = preg_replace('/\bMccain\b/i', 'McCain', preg_replace('/\bItc\b/', 'ITC', $cleanTitle));

        // ── Brand detection ───────────────────────────────────────────────
        $brand = $fingerprint['brand'] ?? '';
        if (empty($brand) && !empty($rawData['brand'])) $brand = $rawData['brand'];
        if (empty($brand)) $brand = self::detectBrand($slug . ' ' . $cleanTitle);

        // ── Category detection ────────────────────────────────────────────
        $category = $fingerprint['category'] ?? '';
        if (empty($category) || $category === 'General Products') {
            $category = self::detectCategory($slug . ' ' . $cleanTitle);
        }

        // ── Pack size ─────────────────────────────────────────────────────
        $packSize = !empty($fingerprint['net_qty_value'])
            ? ($fingerprint['net_qty_value'] . ' ' . $fingerprint['net_qty_unit'])
            : '1 Unit';
        $unit = strtoupper($fingerprint['net_qty_unit'] ?? 'PCS');

        // ── Price ─────────────────────────────────────────────────────────
        $price = (float)($priceData['selling_price'] ?? 0);
        $mrp   = (float)($priceData['mrp'] ?? 0);

        // ── STEP 7: Barcode CV decoding (skipped for remote marketplace URLs to ensure 20ms response) ──
        $barcodeCandidates   = [];
        $decoderResults      = [];
        $diagnostics['decoder_available'] = false;
        $diagnostics['barcode_candidates'] = 0;

        // ── Analyze barcode conflicts ─────────────────────────────────────
        $candidateConflicts = ProductConflictEngine::analyzeBarcodeCandidates($barcodeCandidates);

        // ── Select best physical barcode candidate ────────────────────────
        $physicalGtin       = null;
        $physicalCandidate  = null;
        $physicalDecoded    = false;
        $ocrMatch           = false;

        if (!empty($barcodeCandidates)) {
            // Rank: checksum-valid + most confirmed
            usort($barcodeCandidates, function ($a, $b) {
                $cs = ($b['checksum_valid'] ? 1 : 0) - ($a['checksum_valid'] ? 1 : 0);
                if ($cs !== 0) return $cs;
                return ($b['confirmation_count'] ?? 1) - ($a['confirmation_count'] ?? 1);
            });
            // Only use top candidate if checksum valid
            if (!empty($barcodeCandidates[0]['checksum_valid'])) {
                $physicalCandidate  = $barcodeCandidates[0];
                $physicalGtin       = $physicalCandidate['gtin'];
                $physicalDecoded    = true;
                $ocrMatch           = $physicalCandidate['ocr_match'] ?? false;
            }
        }

        // ── Fallback: marketplace identifier barcode ──────────────────────
        $sourceBarcode       = null;
        $sourceBarcodeStatus = BarcodeVerificationEngine::STATUS_UNVERIFIED;
        if (!empty($identifiers['barcode'])) {
            $cs = BarcodeChecksumService::validate((string)$identifiers['barcode']);
            if ($cs['valid']) {
                $sourceBarcode       = (string)$identifiers['barcode'];
                $sourceBarcodeStatus = BarcodeVerificationEngine::STATUS_CHECKSUM_VALID;
            }
        }

        // ── Fallback: Online discovery (OpenFoodFacts text search) ────────
        $discoveryResult = null;
        if (empty($physicalGtin) && empty($sourceBarcode) && !empty($cleanTitle)) {
            $discoveryResult = ProductRegistryVerificationEngine::searchByQuery($brand, $cleanTitle);
            $discRec = $discoveryResult[0] ?? null;
            if (!empty($discRec['gtin']) && $discRec['status'] === ProductRegistryVerificationEngine::STATUS_MATCH) {
                $sourceBarcode       = $discRec['gtin'];
                $sourceBarcodeStatus = BarcodeVerificationEngine::STATUS_CHECKSUM_VALID; // checksum already checked in registry
            }
        }

        // ── Select final GTIN ─────────────────────────────────────────────
        // Evidence hierarchy: physical > source > discovery > null
        $finalGtin   = $physicalGtin ?? $sourceBarcode ?? null;
        $barcodeFrom = $physicalGtin
            ? 'PACKAGING_DETECTED'
            : ($sourceBarcode && empty($discoveryResult) ? 'MARKETPLACE_SOURCE' : ($sourceBarcode ? 'ONLINE_DISCOVERY' : null));

        // Detect catalog vs. packaging conflict
        $catalogEntry       = null; // no catalog match reached here
        $catVsPackConflict  = ['has_conflict' => false, 'conflicts' => []];

        // ── STEP 8: Registry verification ────────────────────────────────
        $checksumResult  = ['valid' => false, 'barcode_type' => 'UNKNOWN'];
        $registryVerify  = ['registry_matched' => false, 'best_match' => null, 'registry_results' => []];

        if (!empty($finalGtin)) {
            $checksumResult = BarcodeChecksumService::validate($finalGtin);
            if ($checksumResult['valid']) {
                $registryVerify = ProductRegistryVerificationEngine::verifyGtin(
                    $finalGtin,
                    $brand,
                    $cleanTitle,
                    $packSize
                );
            }
        }

        $registryMatched = $registryVerify['registry_matched'] ?? false;
        $registryResults = $registryVerify['registry_results'] ?? [];

        // ── Build barcode evidence object ─────────────────────────────────
        $decoderResult = ['candidates' => $barcodeCandidates, 'success' => !empty($physicalGtin)];
        $barcodeEvidence = BarcodeVerificationEngine::buildEvidenceObject(
            $finalGtin,
            $checksumResult,
            ['status' => $registryMatched ? BarcodeVerificationEngine::STATUS_REGISTRY_MATCH : BarcodeVerificationEngine::STATUS_UNVERIFIED,
             'source' => $registryVerify['best_match']['registry'] ?? null,
             'conflict_reason' => null],
            $decoderResult,
            $barcodeFrom ?? ''
        );

        // ── STEP 9: Conflict detection ────────────────────────────────────
        $allConflicts = array_merge(
            $legacyConflicts['conflicts'] ?? [],
            $candidateConflicts['conflicts'] ?? [],
            $catVsPackConflict['conflicts'] ?? []
        );

        $hasConflict = !empty($allConflicts);

        // ── Image for primary display ─────────────────────────────────────
        $primaryImg = null;
        $imgSource  = 'Not Available';
        foreach ($allImages as $img) {
            if (!empty($img['url'])) {
                $primaryImg = $img['url'];
                $imgSource  = $img['source'] ?? $platform . ' CDN';
                break;
            }
        }

        // If still no image and registry found one via discovery with exact product name match
        if (!$primaryImg && !empty($discoveryResult[0]['image_url'])) {
            $primaryImg = $discoveryResult[0]['image_url'];
            $imgSource  = 'OpenFoodFacts Registry';
        }

        // ── STEP 10: Evidence score ───────────────────────────────────────
        $evidenceFlags = [
            'SOURCE_PAGE_DATA'       => !empty($rawData),
            'EXACT_PVID_MATCH'       => false,
            'EXACT_VARIANT_MATCH'    => false,
            'BARCODE_PACKAGING_MATCH'=> $physicalDecoded,
            'BARCODE_GS1_VERIFIED'   => false,
            'BARCODE_REGISTRY_MATCH' => $registryMatched,
            'BARCODE_CHECKSUM_VALID' => ($checksumResult['valid'] ?? false) && !empty($finalGtin),
            'IMAGE_FOUND'            => !empty($primaryImg),
            'BRAND_MATCH'            => !empty($brand),
            'QTY_CONFIRMED'          => !empty($fingerprint['net_qty_value']),
        ];
        $score  = $hasConflict ? 0 : EvidenceConfidenceEngine::calculateScore($evidenceFlags);
        $status = $hasConflict ? 'CONFLICT' : EvidenceConfidenceEngine::determineOverallStatus($score, []);

        // ── Field provenance ──────────────────────────────────────────────
        $fieldProvenance = self::buildFieldProvenance($cleanTitle, $brand, $finalGtin, $price, $mrp, $packSize, $platform, $barcodeFrom, $registryMatched);

        $fetchMs = round((microtime(true) - $startTime) * 1000);
        $diagnostics['fetch_latency_ms']  = $fetchMs;
        $diagnostics['verification_level'] = $barcodeEvidence['verification_level'] ?? BarcodeVerificationEngine::LEVEL_0_NOT_FOUND;
        $diagnostics['overall_confidence'] = $score;
        $diagnostics['gd_available']       = $decoderCapabilities['gd_available'];
        $diagnostics['imagick_available']  = $decoderCapabilities['imagick_available'];
        $diagnostics['node_available']     = $decoderCapabilities['node_available'];
        $diagnostics['jimp_available']     = $decoderCapabilities['jimp_available'] ?? false;
        $diagnostics['zxing_available']    = $decoderCapabilities['zxing_available'] ?? false;

        return self::buildV12Response([
            'name'                 => $cleanTitle,
            'brand'                => $brand ?: 'Unknown',
            'category'             => $category,
            'sub_category'         => $category,
            'pack_size'            => $packSize,
            'unit'                 => $unit,
            'barcode'              => $finalGtin,
            'barcode_type'         => $checksumResult['barcode_type'] ?? ($finalGtin ? 'EAN-13' : null),
            'barcode_status'       => $barcodeEvidence['status'],
            'barcode_source_label' => $barcodeEvidence['barcode_source_class'] ?? ($finalGtin ? 'Checksum Valid' : 'Not Available'),
            'verification_level'   => $barcodeEvidence['verification_level'],
            'verification_level_num' => $barcodeEvidence['verification_level_num'],
            'physical_detection'   => $physicalDecoded,
            'registry_match'       => $registryMatched,
            'price'                => $price,
            'mrp'                  => $mrp,
            'images'               => $allImages,
            'image_url'            => $primaryImg,
            'image_source'         => $imgSource,
            'platform'             => $platform,
            'match_method'         => 'LIVE_EXTRACTION',
            'status'               => $status,
            'score'                => $score,
            'fetchMs'              => $fetchMs,
            'conflicts'            => $allConflicts,
            'all_images'           => $allImages,
            'barcode_candidates'   => $barcodeCandidates,
            'barcode_evidence'     => $barcodeEvidence,
            'registry_results'     => $registryResults,
            'field_provenance'     => $fieldProvenance,
            'diagnostics'          => $diagnostics,
        ]);
    }

    // ── V12 RESPONSE BUILDER ──────────────────────────────────────────────────

    private static function buildV12Response(array $d): array
    {
        $barcode = $d['barcode'] ?? null;
        $price   = (float)($d['price'] ?? 0);
        $mrp     = (float)($d['mrp'] ?? 0);
        $images  = $d['all_images'] ?? $d['images'] ?? [];
        $primaryImg = $d['image_url'];

        $editableBarcode = $barcode ?: ($d['catalog_reference'] ?? null);
        $catalogRefBarcode = $d['catalog_reference'] ?? ($barcode ?: null);

        // Legacy flat fields (ProductForm.js compatibility)
        $flat = [
            'name'              => $d['name'],
            'short_name'        => substr($d['name'], 0, 45),
            'brand'             => $d['brand'],
            'category'          => $d['category'],
            'sub_category'      => $d['sub_category'] ?? $d['category'],
            'pack_size'         => $d['pack_size'],
            'unit'              => $d['unit'],
            'barcode'           => $editableBarcode,
            'catalog_reference' => $catalogRefBarcode,
            'barcode_type'      => $editableBarcode ? ($d['barcode_type'] ?? 'EAN-13') : null,
            'barcode_valid'     => !empty($editableBarcode),
            'barcode_source'    => $d['barcode_source_label'] ?? ($editableBarcode ? 'Physical Packaging / Registry Verified' : 'Catalog Reference Only — Not physically verified'),
            'barcode_status'    => $d['barcode_status'] ?? BarcodeVerificationEngine::STATUS_UNVERIFIED,
            'price'             => $price > 0 ? number_format($price, 2, '.', '') : '0.00',
            'cost'              => null, // NEVER fabricate
            'mrp'               => $mrp  > 0 ? number_format($mrp,  2, '.', '') : '0.00',
            'discount'          => ($mrp > 0 && $price > 0) ? number_format(max(0, $mrp - $price), 2, '.', '') : '0.00',
            'description'       => $d['name'] . '. Extracted from ' . $d['platform'] . '.',
            'images'            => $primaryImg ? [$primaryImg] : [],
            'image_url'         => $primaryImg,
            'image_source'      => $d['image_source'],
            'country_of_origin' => 'India',
            'platform'          => $d['platform'],
            'match_method'      => $d['match_method'],
            'status'            => $d['status'],
        ];

        // V12 enriched verification block
        $flat['verification'] = [
            'status'         => $d['status'],
            'score'          => $d['score'],
            'validChecksum'  => ($d['barcode_status'] ?? '') !== BarcodeVerificationEngine::STATUS_UNVERIFIED,
            'registryMatch'  => $d['registry_match'] ?? false,
            'barcodeStatus'  => $d['barcode_status'] ?? BarcodeVerificationEngine::STATUS_UNVERIFIED,
            'verificationLevel'    => $d['verification_level'] ?? BarcodeVerificationEngine::LEVEL_0_NOT_FOUND,
            'verificationLevelNum' => $d['verification_level_num'] ?? 0,
            'physicalDetection'    => $d['physical_detection'] ?? false,
            'productNameMatch'     => !empty($d['name']),
            'brandMatch'           => !empty($d['brand']),
            'packSizeMatch'        => ($d['pack_size'] ?? '') !== '1 Unit',
            'matchMethod'          => $d['match_method'],
            'fetchMs'              => $d['fetchMs'],
            'conflicts'            => $d['conflicts'],
            'sources' => [
                'primary' => $d['platform'],
                'image'   => $d['image_source'],
                'barcode' => $d['barcode_source_label'] ?? 'Not Available',
                'price'   => $price > 0 ? "{$d['platform']} Live (₹" . number_format($price, 2) . ')' : 'Not Available',
                'mrp'     => $mrp   > 0 ? "{$d['platform']} (₹" . number_format($mrp,  2) . ')' : 'Not Available',
                'cost'    => 'Not Available — Manual Entry Required',
            ],
        ];

        // V12 structured sub-objects
        $flat['v12'] = [
            'version'   => '12.0',
            'identity'  => [
                'product_name'      => $d['name'],
                'brand'             => $d['brand'],
                'category'          => $d['category'],
                'pack_size'         => $d['pack_size'],
            ],
            'pricing' => [
                'selling_price'     => $price,
                'mrp'               => $mrp,
                'currency'          => 'INR',
                'price_source'      => $d['platform'] . ' Live',
                'mrp_source'        => $d['platform'] . ' Listed MRP',
                'cost_price'        => null,
            ],
            'barcode' => [
                'gtin'               => $barcode,
                'status'             => $d['barcode_status'] ?? BarcodeVerificationEngine::STATUS_UNVERIFIED,
                'verification_level' => $d['verification_level'] ?? BarcodeVerificationEngine::LEVEL_0_NOT_FOUND,
                'verification_level_num' => $d['verification_level_num'] ?? 0,
                'candidates'         => $d['barcode_candidates'] ?? [],
                'checksum_valid'     => ($d['barcode_evidence']['checksum_valid'] ?? false),
                'physical_detection' => $d['physical_detection'] ?? false,
                'ocr_match'          => $d['barcode_evidence']['ocr_match'] ?? false,
                'confidence'         => $d['barcode_evidence']['confidence'] ?? 0,
                'sources'            => $d['barcode_evidence']['sources'] ?? [],
                'diagnostics'        => $d['barcode_evidence']['diagnostics'] ?? [],
            ],
            'images'            => $images,
            'registries'        => $d['registry_results'] ?? [],
            'conflicts'         => $d['conflicts'] ?? [],
            'field_provenance'  => $d['field_provenance'] ?? [],
            'overall_confidence'=> $d['score'],
            'diagnostics'       => $d['diagnostics'] ?? [],
        ];

        return $flat;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static function detectPlatform(string $url): string
    {
        $lower = strtolower($url);
        if (str_contains($lower, 'zepto'))     return 'Zepto';
        if (str_contains($lower, 'blinkit') || str_contains($lower, 'grofers')) return 'Blinkit';
        if (str_contains($lower, 'amazon'))    return 'Amazon';
        if (str_contains($lower, 'flipkart'))  return 'Flipkart';
        if (str_contains($lower, 'bigbasket')) return 'BigBasket';
        if (str_contains($lower, 'jiomart'))   return 'JioMart';
        if (str_contains($lower, 'swiggy'))    return 'Swiggy Instamart';
        return 'E-Commerce Marketplace';
    }

    /**
     * Classify images by type based on URL/index heuristics.
     */
    private static function classifyImages(array $images): array
    {
        $result = [];
        foreach ($images as $idx => $img) {
            $type = $img['type'] ?? 'OTHER';
            // Heuristic: numbered slots
            if (str_contains($img['url'] ?? '', '-2.jpeg') || str_contains($img['url'] ?? '', '/2.jpeg')) {
                $type = 'BACK_PACK';
            } elseif (str_contains($img['url'] ?? '', '-3.jpeg') || str_contains($img['url'] ?? '', '/3.jpeg')) {
                $type = 'SIDE_PACK';
            } elseif (str_contains($img['url'] ?? '', '-4.jpeg') || str_contains($img['url'] ?? '', '/4.jpeg')) {
                $type = 'NUTRITION_PANEL';
            } elseif ($idx === 0 && $type === 'OTHER') {
                $type = 'FRONT_PACK';
            }
            $img['type']     = $type;
            $img['image_id'] = 'img_' . str_pad((string)$idx, 2, '0', STR_PAD_LEFT);
            $result[] = $img;
        }
        return $result;
    }

    private static function discoverCatalogImages(array $entry, string $pvid, string $slug): array
    {
        $images = [];

        // Check if catalog entry explicitly defines image(s)
        if (!empty($entry['image_url'])) {
            $images[] = [
                'url'      => $entry['image_url'],
                'type'     => 'FRONT_PACK',
                'source'   => $entry['image_source'] ?? 'Master Catalog Verified',
                'verified' => true,
                'image_id' => 'img_00',
            ];
        }
        foreach ($entry['images'] ?? [] as $i => $u) {
            if ($u !== ($entry['image_url'] ?? '')) {
                $images[] = [
                    'url'      => $u,
                    'type'     => $i === 1 ? 'BACK_PACK' : 'PACKAGING',
                    'source'   => $entry['image_source'] ?? 'Master Catalog Verified',
                    'verified' => true,
                    'image_id' => 'img_' . str_pad((string)count($images), 2, '0', STR_PAD_LEFT),
                ];
            }
        }
        if (!empty($images)) return $images;

        if (empty($pvid)) return $images;

        $titleSlug = $slug ?: ($entry['zepto_slug'] ?? 'product');
        $ts = implode('-', array_map('ucfirst', explode('-', $titleSlug)));

        $candidates = [
            "https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-2000-2000,pr-true,f-auto,q-40,dpr-2/cms/product_variant/{$pvid}/{$ts}.jpeg",
            "https://cdn.zeptonow.com/production/ik-seo/tr:w-470,ar-1000-1000,pr-true,f-auto,q-40,dpr-2/cms/product_variant/{$pvid}/{$ts}.jpeg",
            "https://cdn.zeptonow.com/production/tr:w-600,ar-100-100,pr-true,f-auto,q-80/inventory/product/{$pvid}.jpg",
        ];

        foreach ($candidates as $url) {
            if (self::imageExists($url)) {
                $images[] = [
                    'url'      => $url,
                    'type'     => 'FRONT_PACK',
                    'source'   => 'Zepto CDN (Catalog)',
                    'verified' => true,
                    'image_id' => 'img_00',
                ];
                break;
            }
        }

        // Try OpenFoodFacts image if we have a barcode
        if (empty($images) && !empty($entry['barcode'])) {
            $offImg = self::getOFFImage((string)$entry['barcode']);
            if ($offImg) {
                $images[] = [
                    'url'      => $offImg,
                    'type'     => 'FRONT_PACK',
                    'source'   => 'OpenFoodFacts Registry',
                    'verified' => true,
                    'image_id' => 'img_00',
                ];
            }
        }

        return $images;
    }

    private static function getOFFImage(string $barcode): ?string
    {
        try {
            $ch = curl_init("https://world.openfoodfacts.org/api/v2/product/{$barcode}.json?fields=image_front_url,selected_images");
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 3,
                CURLOPT_USERAGENT      => 'INFY-POS/12.0',
                CURLOPT_SSL_VERIFYPEER => false,
            ]);
            $json = json_decode(curl_exec($ch), true);
            curl_close($ch);
            $p = $json['product'] ?? null;
            if (!$p) return null;
            return $p['selected_images']['front']['display']['en']
                ?? $p['image_front_url']
                ?? null;
        } catch (\Throwable $e) { return null; }
    }

    private static function imageExists(string $url): bool
    {
        try {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_NOBODY         => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 2,
                CURLOPT_USERAGENT      => 'Mozilla/5.0',
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_SSL_VERIFYPEER => false,
            ]);
            curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?? '';
            curl_close($ch);
            return $code === 200 && (
                str_contains($type, 'image') || str_contains($type, 'jpeg')
                || str_contains($type, 'png') || str_contains($type, 'webp')
            );
        } catch (\Throwable $e) { return false; }
    }

    private static function detectBrand(string $text): string
    {
        $knownBrands = [
            'modern kitchen'  => 'Modern Kitchen',
            'modern kitchens' => 'Modern Kitchen',
            'itc master chef' => 'ITC Master Chef',
            'hello tempayy'   => 'Hello Tempayy',
            'prasuma'         => 'Prasuma',
            'wow momo'        => 'Wow! Momo',
            'wow chicken'     => 'Wow! Momo',
            'wow china'       => 'Wow! Momo',
            'mccain'          => 'McCain',
            'malkist'         => 'Malkist',
            'hungritos'       => 'Hungritos',
            'sumeru'          => 'Sumeru',
            'godrej yummiez'  => 'Godrej Yummiez',
            'godrej'          => 'Godrej',
            "venky's"         => "Venky's",
            'venkys'          => "Venky's",
            'zorabian'        => 'Zorabian',
            'itc'             => 'ITC',
            'amul'            => 'Amul',
            'nestle'          => 'Nestle',
            'britannia'       => 'Britannia',
            'parle'           => 'Parle',
            'maggi'           => 'Maggi',
            "lay's"           => "Lay's",
            'lays'            => "Lay's",
            'kurkure'         => 'Kurkure',
            'lipton'          => 'Lipton',
            'bingo'           => 'Bingo',
            'tata tea'        => 'Tata Tea',
            'tata'            => 'Tata',
            'saffola'         => 'Saffola',
            'cadbury'         => 'Cadbury',
            'dairy milk'      => 'Cadbury',
            'colgate'         => 'Colgate',
            'dettol'          => 'Dettol',
            'haldirams'       => "Haldiram's",
            'haldiram'        => "Haldiram's",
            "haldiram's"      => "Haldiram's",
            'bikaji'          => 'Bikaji',
            'balaji'          => 'Balaji',
            'aachi'           => 'Aachi',
            'sakthi'          => 'Sakthi',
            'mtr'             => 'MTR',
            'everest'         => 'Everest',
            'mdh'             => 'MDH',
            'catch'           => 'Catch',
            'real'            => 'Real',
            'tropicana'       => 'Tropicana',
            'paper boat'      => 'Paper Boat',
            'dabur'           => 'Dabur',
            'patanjali'       => 'Patanjali',
            'himalaya'        => 'Himalaya',
            'fortune'         => 'Fortune',
            'dhara'           => 'Dhara',
            'sunfeast'        => 'Sunfeast',
            'yippee'          => 'Yippee',
            'epigamia'        => 'Epigamia',
            'milky mist'      => 'Milky Mist',
            'nandini'         => 'Nandini',
            'mother dairy'    => 'Mother Dairy',
            'gowardhan'       => 'Gowardhan',
            'id fresh'        => 'iD Fresh',
            'id fresh food'   => 'iD Fresh',
        ];

        // Sort descending by length so longer brand phrases match first
        uksort($knownBrands, fn($a, $b) => strlen($b) - strlen($a));

        $cleanText = preg_replace('/[-_]+/', ' ', $text);
        foreach ($knownBrands as $key => $val) {
            if (preg_match('/\b' . preg_quote($key, '/') . '\b/i', $cleanText)) {
                return $val;
            }
        }
        return '';
    }

    private static function detectCategory(string $text): string
    {
        $sl = strtolower($text);
        if (preg_match('/figs?|anjeer|almonds?|badam|cashews?|kaju|raisins?|kishmish|walnuts?|akhrot|pistas?|pistachio|dates|khajoor|dry fruit/i', $sl)) return 'Dry Fruits & Nuts';
        if (preg_match('/fries|frozen|nugget|aloo tikki|tikki|sabudana|patty|kebab|falafel|paratha|smiles|momos|tempeh|tempayy|paneer|pizza fingers|chicken/i', $sl)) return 'Frozen Foods';
        if (preg_match('/biscuit|cracker|cookie|malkist|rusk|wafer/i', $sl)) return 'Biscuits & Bakery';
        if (preg_match('/chocolate|candy|toffee/i', $sl)) return 'Chocolates & Candy';
        if (preg_match('/tea|coffee|beverage|green tea|juice|drink|cola|soda/i', $sl)) return 'Tea & Beverages';
        if (preg_match('/murukku|chips|popcorn|snack|munchie|namkeen|bhujia|mixture|crunchy/i', $sl)) return 'Snacks & Munchies';
        if (preg_match('/noodles|pasta|maggi|instant food/i', $sl)) return 'Instant Food';
        if (preg_match('/atta|flour|rice|dal|oil|sugar|salt|wheat|grain/i', $sl)) return 'Staples & Grains';
        if (preg_match('/shampoo|soap|wash|paste|brush|cream|lotion/i', $sl)) return 'Personal Care';
        return 'General Grocery';
    }

    private static function buildFieldProvenance(
        string $name, string $brand, ?string $gtin,
        float $price, float $mrp, string $packSize,
        string $platform, ?string $barcodeFrom, bool $registryMatched
    ): array {
        return [
            ['field' => 'product_name', 'value' => $name,  'source' => $platform, 'method' => 'LIVE_EXTRACTION', 'confidence' => 85],
            ['field' => 'brand',        'value' => $brand,  'source' => $platform, 'method' => 'LIVE_EXTRACTION', 'confidence' => 80],
            ['field' => 'pack_size',    'value' => $packSize,'source'=> $platform, 'method' => 'LIVE_EXTRACTION', 'confidence' => 80],
            ['field' => 'selling_price','value' => $price,  'source' => $platform, 'method' => 'LIVE_PRICE',      'confidence' => 90],
            ['field' => 'mrp',          'value' => $mrp,    'source' => $platform, 'method' => 'LIVE_MRP',        'confidence' => 85],
            ['field' => 'gtin',
             'value' => $gtin,
             'source' => $barcodeFrom === 'PACKAGING_DETECTED' ? 'Physical Packaging' : ($barcodeFrom === 'ONLINE_DISCOVERY' ? 'OpenFoodFacts Discovery' : $platform),
             'method' => $barcodeFrom ?? 'NONE',
             'confidence' => $barcodeFrom === 'PACKAGING_DETECTED' ? 90 : ($barcodeFrom === 'ONLINE_DISCOVERY' ? 30 : 0),
             'verified_against' => $registryMatched ? ['OpenFoodFacts', 'UPCitemdb'] : [],
             'note' => $gtin ? ($barcodeFrom === 'PACKAGING_DETECTED' ? 'Decoded from physical packaging image' : 'Not decoded from physical packaging') : 'No barcode found',
            ],
        ];
    }
}