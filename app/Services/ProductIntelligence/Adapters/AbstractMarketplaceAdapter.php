<?php

declare(strict_types=1);

namespace App\Services\ProductIntelligence\Adapters;

abstract class AbstractMarketplaceAdapter
{
    protected string $platform = 'Unknown';
    protected int $fetchTimeoutSeconds = 6;

    abstract public function detect(string $url): bool;
    abstract public function fetch(string $url): array;
    abstract public function extractVariantFingerprint(array $rawData): array;
    abstract public function extractImages(array $rawData, string $pvid = '', string $slug = ''): array;
    abstract public function extractPrice(array $rawData): array;
    abstract public function extractIdentifiers(array $rawData): array;

    public function extractEmbeddedData(string $html): array
    {
        $result = [];

        preg_match_all('/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>(.*?)<\/script>/si', $html, $ldMatches);
        foreach ($ldMatches[1] as $raw) {
            $decoded = json_decode(trim($raw), true);
            if ($decoded) $result['json_ld'][] = $decoded;
        }

        if (preg_match('/<script[^>]*id=["\']__NEXT_DATA__["\'][^>]*>(.*?)<\/script>/si', $html, $m)) {
            $decoded = json_decode(trim($m[1]), true);
            if ($decoded) $result['next_data'] = $decoded;
        }

        preg_match_all('/<meta[^>]*property=["\']og:([^"\']+)["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i', $html, $ogMatches, PREG_SET_ORDER);
        foreach ($ogMatches as $og) {
            $result['og'][$og[1]] = html_entity_decode($og[2], ENT_QUOTES);
        }

        if (preg_match('/<title>(.*?)<\/title>/si', $html, $m)) {
            $result['page_title'] = html_entity_decode(trim($m[1]), ENT_QUOTES);
        }

        return $result;
    }

    protected function safeGet(string $url, int $timeout = 6): ?string
    {
        $agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        ];
        try {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => $timeout,
                CURLOPT_USERAGENT      => $agents[array_rand($agents)],
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS      => 3,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_HTTPHEADER     => [
                    'Accept: text/html,application/xhtml+xml,application/json,*/*;q=0.8',
                    'Accept-Language: en-IN,en;q=0.9',
                    'Cache-Control: no-cache',
                ],
            ]);
            $body = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            return ($code >= 200 && $code < 400 && $body) ? $body : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function imageExists(string $url): bool
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
            return $code === 200 && (str_contains($type, 'image') || str_contains($type, 'jpeg') || str_contains($type, 'png') || str_contains($type, 'webp'));
        } catch (\Throwable $e) {
            return false;
        }
    }

    protected function slugToTitle(string $slug): string
    {
        if (empty($slug)) return '';
        $t = ucwords(str_replace(['-', '_', '%20'], ' ', urldecode($slug)));
        $t = preg_replace('/\bMccain\b/i', 'McCain', $t);
        $t = preg_replace('/\bItc\b/', 'ITC', $t);
        $t = preg_replace('/\bIii\b/', 'III', $t);
        $t = preg_replace('/\bIi\b/', 'II', $t);
        return trim(preg_replace('/\s+/', ' ', $t));
    }

    public function getPlatformName(): string
    {
        return $this->platform;
    }
}