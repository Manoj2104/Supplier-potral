<?php

declare(strict_types=1);

namespace App\Services\ProductIntelligence;

/**
 * BarcodeDecoderService — v12.0
 *
 * Abstraction layer over all available barcode decoding backends.
 * Detects what is available on the server and uses the best option.
 *
 * Backends (in priority order):
 *   1. Node.js + jimp + @zxing/library  (available on this server)
 *   2. zbarimg CLI                       (not installed)
 *   3. PHP GD pixel analysis             (GD not installed)
 *   4. DECODER_UNAVAILABLE
 *
 * Returns structured candidates — NEVER fabricates barcodes.
 */
class BarcodeDecoderService
{
    // Capability cache (computed once per request)
    private static ?array $capabilities = null;

    // Path to the Node.js decoder script
    private const CV_SCRIPT = __DIR__ . '/cv_barcode_reader.js';

    // Node.js binary
    private const NODE_BIN = 'node';

    // Timeout for decoding one image (seconds)
    private const DECODE_TIMEOUT_SEC = 3;

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Decode barcodes from a remote image URL.
     * Returns structured result with candidates array.
     */
    public static function decodeFromUrl(string $imageUrl): array
    {
        return self::decode(['image_url' => $imageUrl]);
    }

    /**
     * Decode barcodes from a local image file path.
     */
    public static function decodeFromPath(string $imagePath): array
    {
        return self::decode(['image_path' => $imagePath]);
    }

    /**
     * Probe what decoding capabilities are available on this server.
     */
    public static function detectCapabilities(): array
    {
        if (self::$capabilities !== null) {
            return self::$capabilities;
        }

        $caps = [
            'gd_available'         => extension_loaded('gd'),
            'imagick_available'    => extension_loaded('imagick'),
            'python_available'     => false,
            'zbar_available'       => false,
            'node_available'       => false,
            'jimp_available'       => false,
            'zxing_available'      => false,
            'cv_script_exists'     => file_exists(self::CV_SCRIPT),
            'best_backend'         => 'UNAVAILABLE',
        ];

        // Check node
        $nodeOut = shell_exec('node --version 2>&1');
        if ($nodeOut && preg_match('/^v\d+/', trim($nodeOut))) {
            $caps['node_available'] = true;
        }

        // Check jimp via quick node probe
        if ($caps['node_available'] && $caps['cv_script_exists']) {
            $probe = self::runNodeDecoder(['image_url' => ''], 5);
            // If error is DECODER_UNAVAILABLE, jimp missing. Otherwise jimp is up.
            if ($probe && ($probe['error'] ?? '') === 'NO_IMAGE_SOURCE') {
                $caps['jimp_available']  = true;
                $caps['zxing_available'] = true;
            } elseif ($probe && ($probe['error'] ?? '') !== 'DECODER_UNAVAILABLE') {
                $caps['jimp_available']  = true;
                $caps['zxing_available'] = true;
            }
        }

        // Determine best backend
        if ($caps['zxing_available'] && $caps['jimp_available']) {
            $caps['best_backend'] = 'NODE_ZXING_JIMP';
        } elseif ($caps['gd_available']) {
            $caps['best_backend'] = 'PHP_GD_CHECKSUM_ONLY';
        } else {
            $caps['best_backend'] = 'UNAVAILABLE';
        }

        self::$capabilities = $caps;
        return $caps;
    }

    // ── Private Dispatch ──────────────────────────────────────────────────────

    private static function decode(array $input): array
    {
        $caps = self::detectCapabilities();

        if ($caps['best_backend'] === 'NODE_ZXING_JIMP') {
            return self::runNodeDecoder($input, self::DECODE_TIMEOUT_SEC);
        }

        // No decoder available — return honest diagnostic
        return [
            'success'    => false,
            'error'      => 'DECODER_UNAVAILABLE',
            'message'    => 'No barcode decoder available on server. Install jimp: npm install jimp',
            'candidates' => [],
            'diagnostics' => array_merge($caps, ['note' => 'Manual scan or upload required']),
        ];
    }

    private static function runNodeDecoder(array $input, int $timeoutSec): array
    {
        if (!file_exists(self::CV_SCRIPT)) {
            return [
                'success'    => false,
                'error'      => 'CV_SCRIPT_MISSING',
                'candidates' => [],
                'diagnostics' => ['script' => self::CV_SCRIPT],
            ];
        }

        $json    = json_encode($input, JSON_UNESCAPED_UNICODE);
        $script  = escapeshellarg(self::CV_SCRIPT);
        $cmd     = self::NODE_BIN . ' ' . $script;

        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $proc = proc_open($cmd, $descriptors, $pipes);
        if (!is_resource($proc)) {
            return ['success' => false, 'error' => 'PROC_OPEN_FAILED', 'candidates' => []];
        }

        // Write input
        fwrite($pipes[0], $json);
        fclose($pipes[0]);

        // Read output with timeout
        $stdout = '';
        $stderr = '';
        $start  = microtime(true);
        stream_set_blocking($pipes[1], false);
        stream_set_blocking($pipes[2], false);

        while (microtime(true) - $start < $timeoutSec) {
            $read = [$pipes[1], $pipes[2]];
            $write = null;
            $except = null;
            if (stream_select($read, $write, $except, 0, 100000) > 0) {
                foreach ($read as $r) {
                    $chunk = fread($r, 8192);
                    if ($r === $pipes[1]) $stdout .= $chunk;
                    else                   $stderr .= $chunk;
                }
            }
            $status = proc_get_status($proc);
            if (!$status['running']) break;
        }

        // Final read
        $stdout .= stream_get_contents($pipes[1]);
        $stderr .= stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        proc_close($proc);

        $result = json_decode(trim($stdout), true);
        if (!$result) {
            return [
                'success'    => false,
                'error'      => 'NODE_INVALID_OUTPUT',
                'raw_stdout' => substr($stdout, 0, 500),
                'raw_stderr' => substr($stderr, 0, 500),
                'candidates' => [],
            ];
        }

        return $result;
    }
}
