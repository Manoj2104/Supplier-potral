<?php
require_once 'c:/xampp/htdocs/pos/vendor/autoload.php';
$app = require_once 'c:/xampp/htdocs/pos/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$testUrls = [
    'Zepto Catch Jeera' => 'https://www.zepto.com/pn/catch-jeera-whole/pvid/857b2613-87f3-4d3c-a26f-2a7fbac6e6a2',
    'Zepto Daily Good'  => 'https://www.zepto.com/pn/daily-good-figs-anjeer/pvid/87cbbebf-fa0d-4cc6-aaa4-4c010f8db815',
];

function extractLiveUrl($url) {
    $crawlers = [
        'WhatsApp/2.21.12.21 i',
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    ];

    foreach ($crawlers as $ua) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 4,
            CURLOPT_USERAGENT => $ua,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_HTTPHEADER => [
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language: en-IN,en;q=0.9',
            ]
        ]);
        $html = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code >= 200 && $code < 400 && strlen($html) > 1000) {
            $img = null;
            $title = null;
            $price = null;

            // 1. OG Image
            if (preg_match('/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
                $img = $m[1];
            } elseif (preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']/i', $html, $m)) {
                $img = $m[1];
            } elseif (preg_match('/<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
                $img = $m[1];
            }

            // 2. Title
            if (preg_match('/<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']/i', $html, $m)) {
                $title = html_entity_decode($m[1], ENT_QUOTES);
            } elseif (preg_match('/<title[^>]*>(.*?)<\/title>/i', $html, $m)) {
                $title = html_entity_decode($m[1], ENT_QUOTES);
            }

            // 3. Price
            if (preg_match('/(?:₹|Rs\.?|INR)\s*([0-9]+(?:\.[0-9]{1,2})?)/i', $html, $m)) {
                $price = $m[1];
            }

            if ($img) {
                return [
                    'success' => true,
                    'title' => $title,
                    'image' => $img,
                    'price' => $price,
                    'ua' => $ua
                ];
            }
        }
    }
    return ['success' => false];
}

foreach ($testUrls as $name => $url) {
    echo "Testing $name...\n";
    $res = extractLiveUrl($url);
    print_r($res);
}
