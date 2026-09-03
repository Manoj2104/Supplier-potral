<?php

declare(strict_types=1);

namespace App\Http\Controllers\API;

require_once app_path('Services/ProductIntelligence/MarketplaceAdapters.php');
require_once app_path('Services/ProductIntelligence/BarcodeVerificationEngine.php');
require_once app_path('Services/ProductIntelligence/BarcodeChecksumService.php');
require_once app_path('Services/ProductIntelligence/BarcodeDecoderService.php');
require_once app_path('Services/ProductIntelligence/ProductRegistryVerificationEngine.php');
require_once app_path('Services/ProductIntelligence/ProductConflictEngine.php');

use App\Http\Controllers\AppBaseController;
use App\Models\Product;
use App\Services\ProductIntelligence\MarketplaceAdapterRegistry;
use App\Services\ProductIntelligence\BarcodeVerificationEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductExtractorAPIController extends AppBaseController
{
    private const ALLOWED_DOMAINS = [
        'zepto.com', 'blinkit.com', 'grofers.com', 'amazon.in', 'amzn.in',
        'flipkart.com', 'bigbasket.com', 'jiomart.com', 'swiggy.com',
        'world.openfoodfacts.org', 'in.openfoodfacts.org', 'api.upcitemdb.com'
    ];

    public function extract(Request $request): JsonResponse
    {
        $requestId = 'req_' . time() . '_' . substr(md5(uniqid('', true)), 0, 8);
        $mode = trim((string)($request->input('mode') ?? $request->json('mode') ?? 'auto'));
        $rawUrl = trim((string)($request->input('url') ?? $request->json('url') ?? ''));
        $rawBarcode = preg_replace('/[^0-9]/', '', trim((string)($request->input('barcode') ?? $request->json('barcode') ?? '')));
        $rawSearch = trim((string)($request->input('search') ?? $request->json('search') ?? ''));
        $uploadedImages = $request->file('images') ?? ($request->file('image') ? [$request->file('image')] : []);

        if ($mode === 'auto') {
            if (!empty($rawBarcode)) $mode = 'barcode';
            elseif (!empty($rawUrl)) $mode = 'url';
            elseif (!empty($uploadedImages)) $mode = 'image';
            elseif (!empty($rawSearch)) $mode = 'search';
        }

        try {
            // ── MODE: BARCODE ──────────────────────────────────────────────────────
            if ($mode === 'barcode') {
                if (empty($rawBarcode) || strlen($rawBarcode) < 6) {
                    return $this->buildResponse($requestId, 'INVALID_BARCODE', null, 0, ['Barcode must be at least 6 digits.'], 'Invalid barcode.');
                }

                $checksumResult = BarcodeVerificationEngine::validateChecksum($rawBarcode);
                if (!$checksumResult['valid']) {
                    return $this->buildResponse(
                        $requestId, 'INVALID_CHECKSUM', null, 0,
                        ['Barcode checksum validation failed. Please verify the barcode digits.'],
                        'Invalid checksum. Expected check digit: ' . ($checksumResult['expected_check_digit'] ?? 'N/A'),
                        null, ['checksum' => $checksumResult]
                    );
                }

                $registryResult = BarcodeVerificationEngine::verifyAgainstRegistries($rawBarcode);
                $barcodeEvidence = BarcodeVerificationEngine::buildEvidenceObject($rawBarcode, $checksumResult, $registryResult);
                
                if (!empty($registryResult['registry_data']['name'])) {
                    $rd = $registryResult['registry_data'];
                    $product = [
                        'name' => $rd['name'],
                        'short_name' => \App\Services\ProductIntelligence\UniversalShoppingExtractor::generateSmartShortName($rd['name']),
                        'brand' => $rd['brand'] ?? 'Unknown',
                        'category' => $rd['category'] ?? 'General Products',
                        'sub_category' => $rd['category'] ?? 'General',
                        'pack_size' => $rd['quantity'] ?? '1 Unit',
                        'unit' => 'PCS',
                        'barcode' => $rawBarcode,
                        'barcode_type' => $checksumResult['barcode_type'],
                        'barcode_valid' => true,
                        'barcode_source' => $registryResult['source'],
                        'barcode_status' => $barcodeEvidence['status'],
                        'price' => '0.00',
                        'cost' => null,
                        'mrp' => '0.00',
                        'images' => $rd['image'] ? [$rd['image']] : [],
                        'image_url' => $rd['image'] ?? null,
                        'platform' => 'Barcode Registry',
                        'status' => 'VERIFIED',
                        'verification' => [
                            'status' => 'VERIFIED',
                            'score' => $barcodeEvidence['confidence'],
                            'validChecksum' => true,
                            'registryMatch' => true,
                            'barcodeStatus' => $barcodeEvidence['status'],
                            'matchMethod' => 'BARCODE_REGISTRY',
                            'conflicts' => [],
                            'sources' => [
                                'barcode' => $registryResult['source'],
                                'price' => 'Not Available — Manual Entry Required',
                                'cost' => 'Not Available — Manual Entry Required',
                            ]
                        ]
                    ];
                    $existing = $this->checkExistingProduct($rawBarcode, $rd['name']);
                    return $this->buildResponse($requestId, 'VERIFIED', $product, $barcodeEvidence['confidence'], [], 'Product verified from registry.', $existing, ['barcode_evidence' => $barcodeEvidence]);
                }
                
                $product = [
                    'name' => '',
                    'brand' => '',
                    'category' => 'General Products',
                    'pack_size' => '1 Unit',
                    'unit' => 'PCS',
                    'barcode' => $rawBarcode,
                    'barcode_type' => $checksumResult['barcode_type'],
                    'barcode_valid' => true,
                    'barcode_source' => 'Checksum Valid — Not in Registry',
                    'barcode_status' => BarcodeVerificationEngine::STATUS_CHECKSUM_VALID,
                    'price' => '0.00',
                    'cost' => null,
                    'mrp' => '0.00',
                    'images' => [],
                    'image_url' => null,
                    'platform' => 'Barcode Input',
                    'status' => 'PARTIALLY_VERIFIED',
                    'verification' => [
                        'status' => 'PARTIALLY_VERIFIED',
                        'score' => 20,
                        'validChecksum' => true,
                        'registryMatch' => false,
                        'barcodeStatus' => BarcodeVerificationEngine::STATUS_CHECKSUM_VALID,
                        'conflicts' => [],
                        'sources' => ['barcode' => 'Checksum Valid Only', 'price' => 'Not Available']
                    ]
                ];
                $existing = $this->checkExistingProduct($rawBarcode, null);
                return $this->buildResponse(
                    $requestId, 'PARTIALLY_VERIFIED', $product, 20,
                    ['Barcode checksum valid but product not found in registry. Please enter product details manually.'],
                    'Barcode checksum valid.', $existing, ['barcode_evidence' => $barcodeEvidence]
                );
            }

            // ── MODE: URL ──────────────────────────────────────────────────────────
            if ($mode === 'url') {
                if (empty($rawUrl)) {
                    return $this->buildResponse($requestId, 'INVALID_REQUEST', null, 0, ['Please enter a product URL.'], 'Missing URL.');
                }
                
                // Fix partial or missing protocol URLs
                if (preg_match('/^(?:https?:\/\/)?(?:www\.)?(?:zepto|xto)\.com/i', $rawUrl) || (str_contains($rawUrl, '/pn/') && str_contains($rawUrl, '/pvid/'))) {
                    if (!preg_match('/^https?:\/\//i', $rawUrl)) {
                        $rawUrl = 'https://' . preg_replace('/^(?:xto|zepto)\.com/i', 'www.zepto.com', $rawUrl);
                    } else {
                        $rawUrl = preg_replace('/https?:\/\/(?:www\.)?xto\.com/i', 'https://www.zepto.com', $rawUrl);
                    }
                } elseif (!str_starts_with($rawUrl, 'http://') && !str_starts_with($rawUrl, 'https://')) {
                    $rawUrl = 'https://' . $rawUrl;
                }
                
                $host = strtolower(parse_url($rawUrl, PHP_URL_HOST) ?? '');
                $ssrfBlocked = in_array($host, ['localhost', '127.0.0.1', '0.0.0.0', '::1'], true)
                    || str_starts_with($host, '192.168.')
                    || str_starts_with($host, '10.')
                    || str_starts_with($host, '172.');
                if ($ssrfBlocked) {
                    return $this->buildResponse($requestId, 'RESTRICTED_URL', null, 0, ['Local/private network URLs are blocked.'], 'SSRF blocked.');
                }
                
                $normalizedUrl = $this->normalizeUrl($rawUrl);
                
                // Primary: Universal Social/Headless Shopping Extractor (fast, robust, live images)
                $result = null;
                try {
                    $result = \App\Services\ProductIntelligence\UniversalShoppingExtractor::extract($normalizedUrl);
                } catch (\Throwable $e) {
                    Log::warning('Universal extractor error: ' . $e->getMessage());
                }

                if (!$result || empty($result['name'])) {
                    $result = MarketplaceAdapterRegistry::resolve($normalizedUrl);
                }
                if ($result) {
                    $existing = $this->checkExistingProduct($result['barcode'] ?? null, $result['name']);
                    $result['requestId']    = $requestId;
                    $result['canonical_url']= $normalizedUrl;
                    $v12Data = $result['v12'] ?? [];
                    return $this->buildResponse(
                        $requestId,
                        $result['status'] ?? 'HIGH_CONFIDENCE',
                        $result,
                        $result['verification']['score'] ?? 60,
                        [],
                        'Product extracted from ' . ($result['platform'] ?? 'source'),
                        $existing,
                        [
                            'match_method'      => $result['match_method'] ?? 'LIVE_EXTRACTION',
                            'barcode_evidence'  => $v12Data['barcode'] ?? null,
                            'all_images'        => $v12Data['images'] ?? ($result['images'] ?? []),
                            'conflicts'         => $v12Data['conflicts'] ?? [],
                            'field_provenance'  => $v12Data['field_provenance'] ?? [],
                            'diagnostics'       => $v12Data['diagnostics'] ?? [],
                            'registries'        => $v12Data['registries'] ?? [],
                            'barcode_candidates'=> $v12Data['barcode']['candidates'] ?? [],
                            'v12'               => $v12Data,
                        ]
                    );
                }
                return $this->buildResponse($requestId, 'UNVERIFIED', null, 0, ['Unable to extract product information from this URL.'], 'Extraction failed.');
            }

            // ── MODE: IMAGE ──────────────────────────────────────────────────────
            if ($mode === 'image') {
                $savedImages = [];
                $savedPaths  = [];
                foreach ($uploadedImages as $file) {
                    if ($file && $file->isValid()) {
                        $filename = 'pi_' . time() . '_' . rand(1000, 9999) . '.' . $file->getClientOriginalExtension();
                        $dest = public_path('uploads/products');
                        if (!file_exists($dest)) { @mkdir($dest, 0777, true); }
                        $file->move($dest, $filename);
                        $savedImages[] = asset('uploads/products/' . $filename);
                        $savedPaths[]  = public_path('uploads/products/' . $filename);
                    }
                }
                if (empty($savedImages)) {
                    return $this->buildResponse($requestId, 'INVALID_REQUEST', null, 0, ['Please upload a valid packaging photo.'], 'No image uploaded.');
                }

                // Run real barcode decoder on uploaded images
                $barcodeCandidates = [];
                $finalGtin = null;
                $physicalDecoded = false;
                $decoderCaps = \App\Services\ProductIntelligence\BarcodeDecoderService::detectCapabilities();

                if ($decoderCaps['best_backend'] !== 'UNAVAILABLE') {
                    foreach ($savedPaths as $imgPath) {
                        $result = \App\Services\ProductIntelligence\BarcodeDecoderService::decodeFromPath($imgPath);
                        foreach ($result['candidates'] ?? [] as $c) {
                            $c['image_source'] = 'Uploaded Packaging Photo';
                            $c['source'] = 'PACKAGING_DETECTED';
                            $barcodeCandidates[] = $c;
                        }
                    }
                    usort($barcodeCandidates, fn($a,$b) => ($b['checksum_valid']?1:0)-($a['checksum_valid']?1:0));
                    if (!empty($barcodeCandidates[0]['checksum_valid'])) {
                        $finalGtin = $barcodeCandidates[0]['gtin'];
                        $physicalDecoded = true;
                    }
                }

                $registryMatched = false;
                $registryResults = [];
                $checksumResult  = ['valid' => false, 'barcode_type' => 'UNKNOWN'];
                $rd = null;
                if ($finalGtin) {
                    $checksumResult = \App\Services\ProductIntelligence\BarcodeChecksumService::validate($finalGtin);
                    $regVerify = \App\Services\ProductIntelligence\ProductRegistryVerificationEngine::verifyGtin($finalGtin);
                    $registryMatched = $regVerify['registry_matched'];
                    $registryResults = $regVerify['registry_results'];
                    if ($regVerify['best_match'] && !empty($regVerify['best_match']['product_name'])) {
                        $rd = $regVerify['best_match'];
                    }
                }

                $barcodeEvidence = BarcodeVerificationEngine::buildEvidenceObject(
                    $finalGtin, $checksumResult,
                    ['status' => $registryMatched ? 'REGISTRY_MATCH' : 'UNVERIFIED', 'source' => null, 'conflict_reason' => null],
                    ['candidates' => $barcodeCandidates, 'success' => $physicalDecoded],
                    $physicalDecoded ? 'PACKAGING_DETECTED' : ''
                );

                $score = $physicalDecoded ? ($registryMatched ? 75 : 45) : 15;
                $statusStr = $physicalDecoded ? ($registryMatched ? 'VERIFIED' : 'PARTIALLY_VERIFIED') : 'PARTIALLY_VERIFIED';
                $warnings = [];
                if (!$decoderCaps['jimp_available']) {
                    $warnings[] = 'Barcode decoder unavailable — scan or enter barcode manually';
                } elseif (!$finalGtin) {
                    $warnings[] = 'No barcode detected — try uploading back packaging with barcode visible';
                }

                $product = [
                    'name'          => $rd ? ($rd['product_name'] ?? '') : '',
                    'brand'         => $rd ? ($rd['brand'] ?? '') : '',
                    'category'      => 'General Products',
                    'pack_size'     => $rd ? ($rd['quantity'] ?? '1 Unit') : '1 Unit',
                    'unit'          => 'PCS',
                    'barcode'       => $finalGtin,
                    'barcode_valid' => !empty($finalGtin),
                    'barcode_source'=> $finalGtin ? 'Decoded from Packaging Photo' : 'Not Detected',
                    'barcode_status'=> $barcodeEvidence['status'],
                    'price'         => '0.00',
                    'cost'          => null,
                    'mrp'           => '0.00',
                    'images'        => $savedImages,
                    'image_url'     => $savedImages[0],
                    'platform'      => 'Packaging Photo Upload',
                    'status'        => $statusStr,
                    'verification'  => [
                        'status'               => $statusStr,
                        'score'                => $score,
                        'validChecksum'        => $checksumResult['valid'] ?? false,
                        'registryMatch'        => $registryMatched,
                        'barcodeStatus'        => $barcodeEvidence['status'],
                        'verificationLevel'    => $barcodeEvidence['verification_level'],
                        'verificationLevelNum' => $barcodeEvidence['verification_level_num'],
                        'physicalDetection'    => $physicalDecoded,
                        'conflicts'            => [],
                        'sources'              => [
                            'primary' => 'Packaging Photo Upload',
                            'barcode' => $finalGtin ? 'Decoded from Packaging Photo' : 'Not Detected — Enter Manually',
                            'price'   => 'Not Available — Enter Manually',
                            'cost'    => 'Not Available — Manual Entry Required',
                        ],
                    ],
                    'v12' => [
                        'version'     => '12.0',
                        'barcode'     => $barcodeEvidence,
                        'registries'  => $registryResults,
                        'diagnostics' => ['decoder' => $decoderCaps['best_backend'], 'candidates_found' => count($barcodeCandidates)],
                    ],
                ];
                return $this->buildResponse($requestId, $statusStr, $product, $score, $warnings, 'Photo processed.', null, [
                    'images'            => $savedImages,
                    'barcode_evidence'  => $barcodeEvidence,
                    'barcode_candidates'=> $barcodeCandidates,
                ]);
            }

            // ── MODE: SEARCH ──────────────────────────────────────────────────────
            if ($mode === 'search') {
                if (empty($rawSearch)) {
                    return $this->buildResponse($requestId, 'INVALID_REQUEST', null, 0, ['Please enter a product name.'], 'Missing search query.');
                }
                $result = $this->lookupByName($rawSearch);
                if ($result) {
                    $existing = $this->checkExistingProduct($result['barcode'] ?? null, $result['name']);
                    return $this->buildResponse($requestId, $result['status'], $result, $result['verification']['score'] ?? 70, [], 'Product found via catalog search.', $existing);
                }
                return $this->buildResponse($requestId, 'UNVERIFIED', null, 0, ['No product found for: ' . $rawSearch], 'Not found.');
            }

            return $this->buildResponse($requestId, 'INVALID_REQUEST', null, 0, ['Please provide a URL, Barcode, Image, or Name.'], 'Missing input.');

        } catch (\Throwable $e) {
            Log::error('ProductExtractor Error: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            return $this->buildResponse($requestId, 'ERROR', null, 0, [$e->getMessage()], 'Extraction failed. Please try again.');
        }
    }

    private function normalizeUrl(string $url): string
    {
        $parsed = parse_url($url);
        $keep = [];
        if (!empty($parsed['query'])) {
            parse_str($parsed['query'], $params);
            foreach (['pvid', 'id', 'variant', 'v', 'p'] as $safe) {
                if (isset($params[$safe])) {
                    $keep[$safe] = $params[$safe];
                }
            }
        }
        $base = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '') . ($parsed['path'] ?? '');
        return $base . (!empty($keep) ? '?' . http_build_query($keep) : '');
    }

    private function buildResponse(string $requestId, string $status, ?array $product, int $confidence = 0, array $warnings = [], string $message = '', ?array $existingProduct = null, array $meta = []): JsonResponse
    {
        $isSuccess = $product !== null && !in_array($status, ['ERROR', 'RESTRICTED_URL', 'INVALID_REQUEST', 'INVALID_BARCODE', 'INVALID_CHECKSUM'], true);
        return response()->json([

            'success' => $isSuccess,
            'requestId' => $requestId,
            'status' => $status,
            'data' => $product,
            'verification' => $product['verification'] ?? [
                'status' => $status,
                'score' => $confidence,
                'validChecksum' => false,
                'registryMatch' => false,
                'barcodeStatus' => BarcodeVerificationEngine::STATUS_UNVERIFIED,
                'conflicts' => [],
                'sources' => ['primary' => 'Input']
            ],
            'confidence' => $confidence,
            'warnings' => $warnings,
            'existingProduct' => $existingProduct,
            'message' => $message,
            'meta' => $meta,
        ]);
    }

    private function checkExistingProduct(?string $barcode, ?string $name): ?array
    {
        try {
            if (!empty($barcode)) {
                $p = Product::where('code', $barcode)->first();
                if ($p) {
                    return ['id' => $p->id, 'name' => $p->name, 'code' => $p->code, 'product_price' => $p->product_price];
                }
            }
            if (!empty($name)) {
                $p = Product::where('name', 'LIKE', '%' . trim($name) . '%')->first();
                if ($p) {
                    return ['id' => $p->id, 'name' => $p->name, 'code' => $p->code, 'product_price' => $p->product_price];
                }
            }
        } catch (\Throwable $e) {}
        return null;
    }

    private function lookupByName(string $query): ?array
    {
        try {
            $url = 'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' . urlencode($query) . '&search_simple=1&action=process&json=1&page_size=1&fields=code,product_name,brands,categories,quantity,image_front_url';
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 4,
                CURLOPT_USERAGENT => 'INFY-POS/10.0',
                CURLOPT_SSL_VERIFYPEER => false
            ]);
            $json = json_decode(curl_exec($ch), true);
            curl_close($ch);
            if (!empty($json['products'][0])) {
                $p = $json['products'][0];
                $barcode = $p['code'] ?? null;
                $barcodeValid = false;
                if ($barcode) {
                    $cr = BarcodeVerificationEngine::validateChecksum($barcode);
                    $barcodeValid = $cr['valid'];
                    if (!$barcodeValid) {
                        $barcode = null;
                    }
                }
                $title = $p['product_name'] ?? ucwords($query);
                $brand = $p['brands'] ?? 'Unknown';
                if (str_contains($brand, ',')) {
                    $brand = trim(explode(',', $brand)[0]);
                }
                return [
                    'name' => $title,
                    'short_name' => \App\Services\ProductIntelligence\UniversalShoppingExtractor::generateSmartShortName($title),
                    'brand' => $brand,
                    'category' => $p['categories'] ?? 'General Products',
                    'pack_size' => $p['quantity'] ?? '1 Unit',
                    'unit' => 'PCS',
                    'barcode' => $barcode,
                    'barcode_valid' => $barcodeValid,
                    'barcode_source' => $barcode ? 'OpenFoodFacts Registry' : 'Unverified',
                    'barcode_status' => $barcode ? BarcodeVerificationEngine::STATUS_REGISTRY_MATCH : BarcodeVerificationEngine::STATUS_UNVERIFIED,
                    'price' => '0.00',
                    'cost' => null,
                    'mrp' => '0.00',
                    'images' => $p['image_front_url'] ? [$p['image_front_url']] : [],
                    'image_url' => $p['image_front_url'] ?? null,
                    'platform' => 'OpenFoodFacts Registry',
                    'status' => $barcode ? 'VERIFIED' : 'HIGH_CONFIDENCE',
                    'verification' => [
                        'status' => $barcode ? 'VERIFIED' : 'HIGH_CONFIDENCE',
                        'score' => $barcode ? 75 : 55,
                        'validChecksum' => $barcodeValid,
                        'registryMatch' => !empty($barcode),
                        'barcodeStatus' => $barcode ? BarcodeVerificationEngine::STATUS_REGISTRY_MATCH : BarcodeVerificationEngine::STATUS_UNVERIFIED,
                        'conflicts' => [],
                        'sources' => [
                            'primary' => 'OpenFoodFacts Registry',
                            'barcode' => $barcode ? 'OpenFoodFacts' : 'Not Available',
                            'price' => 'Not Available — Enter Manually',
                            'cost' => 'Not Available — Manual Entry Required',
                        ]
                    ]
                ];
            }
        } catch (\Throwable $e) {
            Log::error('Name lookup: ' . $e->getMessage());
        }
        return null;
    }
}