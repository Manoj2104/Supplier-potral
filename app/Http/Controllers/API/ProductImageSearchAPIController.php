<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProductImageSearchAPIController extends AppBaseController
{
    /**
     * Search product images from Google, Flipkart, Amazon, and open web.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        $productName = trim($request->get('name', ''));
        $source = strtolower(trim($request->get('source', 'all')));

        if (empty($productName)) {
            return $this->sendError('Product name is required');
        }

        $results = [];

        try {
            $queries = [];
            if ($source === 'google') {
                $queries[] = ['query' => $productName . ' product image', 'platform' => 'Google'];
            } elseif ($source === 'amazon') {
                $queries[] = ['query' => $productName . ' amazon product', 'platform' => 'Amazon'];
            } elseif ($source === 'flipkart') {
                $queries[] = ['query' => $productName . ' flipkart product', 'platform' => 'Flipkart'];
            } else {
                // All platforms
                $queries[] = ['query' => $productName . ' product image', 'platform' => 'Google'];
                $queries[] = ['query' => $productName . ' amazon product', 'platform' => 'Amazon'];
                $queries[] = ['query' => $productName . ' flipkart product', 'platform' => 'Flipkart'];
            }

            foreach ($queries as $qObj) {
                // Strategy 1: Bing Image Search Scraping
                $fetched = $this->fetchFromBing($qObj['query'], $qObj['platform']);
                
                // Strategy 2: Fallback DuckDuckGo if Bing returns empty
                if (empty($fetched)) {
                    $fetched = $this->fetchFromDuckDuckGo($qObj['query'], $qObj['platform']);
                }

                $results = array_merge($results, $fetched);
            }

            // If still empty for specific search, do generic product search
            if (empty($results)) {
                $results = $this->fetchFromBing($productName . ' product', 'Google');
            }

            // Deduplicate results by image_url
            $uniqueResults = [];
            $seenUrls = [];
            foreach ($results as $item) {
                if (!empty($item['image_url']) && !isset($seenUrls[$item['image_url']])) {
                    $seenUrls[$item['image_url']] = true;
                    $uniqueResults[] = $item;
                }
            }

            // Rank exact model/variant keyword matches to the top
            $tokens = array_filter(explode(' ', strtolower($productName)), function($t) {
                return strlen($t) >= 2 && !in_array($t, ['product', 'image', 'photo', 'site', 'for', 'with']);
            });

            if (!empty($tokens)) {
                usort($uniqueResults, function($a, $b) use ($tokens) {
                    $scoreA = 0;
                    $scoreB = 0;
                    $textA = strtolower($a['title'] . ' ' . $a['image_url']);
                    $textB = strtolower($b['title'] . ' ' . $b['image_url']);

                    foreach ($tokens as $token) {
                        if (str_contains($textA, $token)) $scoreA += 3;
                        if (str_contains($textB, $token)) $scoreB += 3;
                    }

                    return $scoreB <=> $scoreA;
                });
            }

            return $this->sendResponse(array_values($uniqueResults), 'Product images fetched successfully');
        } catch (\Exception $e) {
            Log::error('Image Search Error: ' . $e->getMessage());
            return $this->sendError('Failed to search product images: ' . $e->getMessage());
        }
    }

    /**
     * Proxy external image to base64 data URL to avoid client CORS blocking.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function proxyImage(Request $request)
    {
        $imageUrl = trim($request->input('url') ?? $request->json('url') ?? $request->get('url') ?? '');
        if (empty($imageUrl)) {
            return response()->json(['success' => false, 'message' => 'Image URL is required'], 400);
        }

        try {
            $imageData = $this->httpGetContents($imageUrl);

            if (!$imageData) {
                return response()->json(['success' => false, 'message' => 'Could not download image from target URL'], 502);
            }

            // Infer content type
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $contentType = finfo_buffer($finfo, $imageData);
            finfo_close($finfo);

            if (!$contentType || !str_contains($contentType, 'image')) {
                $contentType = 'image/jpeg';
            }

            // Check if binary requested
            if ($request->has('binary')) {
                return response($imageData, 200, [
                    'Content-Type' => $contentType,
                    'Access-Control-Allow-Origin' => '*',
                    'Cache-Control' => 'public, max-age=86400',
                ]);
            }

            $base64 = 'data:' . $contentType . ';base64,' . base64_encode($imageData);

            return response()->json([
                'success' => true,
                'data' => [
                    'data_url' => $base64,
                    'content_type' => $contentType,
                    'size' => strlen($imageData),
                ],
                'message' => 'Image downloaded successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error proxying image: ' . $e->getMessage()], 502);
        }
    }


    /**
     * Fetch images via Bing Async Image Search
     */
    private function fetchFromBing(string $query, string $defaultPlatform): array
    {
        $images = [];
        try {
            $url = 'https://www.bing.com/images/async?q=' . urlencode($query) . '&first=1&count=35&scenario=ImageBasicHover&datsrc=N_I&layout=RowBased';
            $html = $this->httpGetContents($url);

            if (!$html) {
                return $images;
            }

            preg_match_all('/murl&quot;:&quot;(.*?)&quot;/', $html, $mUrls);
            preg_match_all('/turl&quot;:&quot;(.*?)&quot;/', $html, $tUrls);
            preg_match_all('/&quot;t&quot;:&quot;(.*?)&quot;/', $html, $titles);

            $imgUrls = $mUrls[1] ?? [];
            $thumbUrls = $tUrls[1] ?? [];
            $titleList = $titles[1] ?? [];

            for ($i = 0; $i < count($imgUrls) && $i < 24; $i++) {
                $imgUrl = $imgUrls[$i];
                if (empty($imgUrl)) continue;

                $thumbUrl = $thumbUrls[$i] ?? $imgUrl;
                $title = isset($titleList[$i]) ? strip_tags(html_entity_decode($titleList[$i])) : $query;

                $platform = $defaultPlatform;
                $lowerUrl = strtolower($imgUrl);
                $lowerTitle = strtolower($title);

                if (str_contains($lowerUrl, 'amazon.') || str_contains($lowerUrl, 'media-amazon.com') || str_contains($lowerTitle, 'amazon')) {
                    $platform = 'Amazon';
                } elseif (str_contains($lowerUrl, 'flipkart.') || str_contains($lowerUrl, 'fkimages.com') || str_contains($lowerTitle, 'flipkart')) {
                    $platform = 'Flipkart';
                } elseif (str_contains($lowerUrl, 'myntra.') || str_contains($lowerTitle, 'myntra')) {
                    $platform = 'Myntra';
                }

                $images[] = [
                    'title' => $title,
                    'image_url' => $imgUrl,
                    'thumbnail_url' => $thumbUrl,
                    'source_url' => $imgUrl,
                    'platform' => $platform,
                ];
            }
        } catch (\Exception $e) {
            Log::warning('Bing fetch failed: ' . $e->getMessage());
        }

        return $images;
    }

    /**
     * Fetch images via DuckDuckGo API
     */
    private function fetchFromDuckDuckGo(string $query, string $defaultPlatform): array
    {
        $images = [];
        try {
            $ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
            $html = $this->httpGetContents('https://duckduckgo.com/?q=' . urlencode($query) . '&t=h_&iax=images&ia=images');

            if (!$html) return $images;

            preg_match("/vqd=['\"]([^'\"]+)['\"]/", $html, $matches);
            if (empty($matches[1])) {
                preg_match('/vqd=([\d-]+)/', $html, $matches);
            }

            if (empty($matches[1])) return $images;

            $vqd = $matches[1];
            $jsonStr = $this->httpGetContents('https://duckduckgo.com/i.js?l=us-en&o=json&q=' . urlencode($query) . '&vqd=' . $vqd . '&f=,,,');

            if ($jsonStr) {
                $data = json_decode($jsonStr, true);
                if (isset($data['results']) && is_array($data['results'])) {
                    foreach (array_slice($data['results'], 0, 15) as $row) {
                        $imgUrl = $row['image'] ?? '';
                        if (empty($imgUrl)) continue;

                        $images[] = [
                            'title' => $row['title'] ?? $query,
                            'image_url' => $imgUrl,
                            'thumbnail_url' => $row['thumbnail'] ?? $imgUrl,
                            'source_url' => $row['url'] ?? '',
                            'platform' => $defaultPlatform,
                        ];
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('DuckDuckGo fetch failed: ' . $e->getMessage());
        }

        return $images;
    }

    /**
     * Safe HTTP GET supporting cURL or stream context
     */
    private function httpGetContents(string $url): ?string
    {
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 12);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
            $data = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($code < 400 && $data !== false) {
                return $data;
            }
        }

        // Fallback to file_get_contents stream context
        $opts = [
            "http" => [
                "method" => "GET",
                "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36\r\n",
                "timeout" => 12,
                "ignore_errors" => true
            ],
            "ssl" => [
                "verify_peer" => false,
                "verify_peer_name" => false
            ]
        ];
        $context = stream_context_create($opts);
        $res = @file_get_contents($url, false, $context);
        return $res ?: null;
    }

}
