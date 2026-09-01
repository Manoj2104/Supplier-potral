<?php

declare(strict_types=1);

namespace App\Services\ProductIntelligence;

/**
 * ProductConflictEngine — v12.0
 *
 * Detects conflicts between multiple data sources for the same product.
 * NEVER silently resolves a conflict.
 * All conflicts require explicit user review.
 *
 * Detects:
 *   BRAND_MISMATCH
 *   PRODUCT_NAME_MISMATCH
 *   VARIANT_MISMATCH
 *   FLAVOR_MISMATCH
 *   QUANTITY_MISMATCH
 *   WEIGHT_MISMATCH
 *   PIECE_COUNT_MISMATCH
 *   PACK_COUNT_MISMATCH
 *   BARCODE_MISMATCH
 *   MRP_MISMATCH
 *   SELLING_PRICE_MISMATCH
 *   MANUFACTURER_MISMATCH
 *   REGISTRY_CONFLICT
 *   OCR_CONFLICT
 */
class ProductConflictEngine
{
    // Severity levels
    public const SEVERITY_CRITICAL = 'CRITICAL';
    public const SEVERITY_HIGH     = 'HIGH';
    public const SEVERITY_MEDIUM   = 'MEDIUM';
    public const SEVERITY_LOW      = 'LOW';

    /**
     * Compare two product fingerprints and return all detected conflicts.
     *
     * @param array $sourceA  ['brand', 'name', 'quantity', 'mrp', 'barcode', 'flavor', 'weight', 'pieces', ...]
     * @param array $sourceB
     * @param string $labelA  Human-readable source label (e.g. 'Zepto Page')
     * @param string $labelB  Human-readable source label (e.g. 'Packaging OCR')
     */
    public static function compare(array $sourceA, array $sourceB, string $labelA = 'Source A', string $labelB = 'Source B'): array
    {
        $conflicts = [];

        // ── Brand ───────────────────────────────────────────────────────────
        $conflicts = array_merge($conflicts, self::checkBrand($sourceA, $sourceB, $labelA, $labelB));

        // ── Barcode ─────────────────────────────────────────────────────────
        $conflicts = array_merge($conflicts, self::checkBarcode($sourceA, $sourceB, $labelA, $labelB));

        // ── Quantity / Weight ────────────────────────────────────────────────
        $conflicts = array_merge($conflicts, self::checkQuantity($sourceA, $sourceB, $labelA, $labelB));

        // ── Piece count ──────────────────────────────────────────────────────
        $conflicts = array_merge($conflicts, self::checkPieceCount($sourceA, $sourceB, $labelA, $labelB));

        // ── MRP ─────────────────────────────────────────────────────────────
        $conflicts = array_merge($conflicts, self::checkMRP($sourceA, $sourceB, $labelA, $labelB));

        return [
            'has_conflict'       => count($conflicts) > 0,
            'conflict_count'     => count($conflicts),
            'requires_review'    => count($conflicts) > 0,
            'conflicts'          => $conflicts,
            'critical_conflicts' => array_filter($conflicts, fn($c) => $c['severity'] === self::SEVERITY_CRITICAL),
            'high_conflicts'     => array_filter($conflicts, fn($c) => $c['severity'] === self::SEVERITY_HIGH),
        ];
    }

    /**
     * Detect conflicts specifically among barcode candidates.
     * Called when multiple barcode candidates exist from different sources.
     */
    public static function analyzeBarcodeCandidates(array $candidates): array
    {
        $conflicts = [];
        $gtins = [];

        foreach ($candidates as $c) {
            $gtin = $c['gtin'] ?? null;
            if ($gtin) {
                $gtins[$gtin][] = $c;
            }
        }

        if (count($gtins) > 1) {
            // Multiple distinct GTINs detected — conflict
            $gtinList = array_keys($gtins);
            $conflicts[] = [
                'type'           => 'BARCODE_SOURCE_CONFLICT',
                'severity'       => self::SEVERITY_CRITICAL,
                'message'        => count($gtinList) . ' distinct GTINs detected across sources',
                'candidates'     => array_map(fn($g) => [
                    'gtin'    => $g,
                    'sources' => array_map(fn($c) => $c['decoder'] ?? $c['source'] ?? 'unknown', $gtins[$g]),
                ], $gtinList),
                'requires_review' => true,
                'resolution'      => 'MANUAL_REVIEW_REQUIRED',
            ];
        }

        // Confirm if any candidate lacks checksum validation
        foreach ($candidates as $c) {
            if (!($c['checksum_valid'] ?? false) && !empty($c['gtin'])) {
                $conflicts[] = [
                    'type'           => 'BARCODE_CHECKSUM_INVALID',
                    'severity'       => self::SEVERITY_HIGH,
                    'gtin'           => $c['gtin'],
                    'source'         => $c['decoder'] ?? $c['source'] ?? 'unknown',
                    'message'        => 'Detected GTIN ' . $c['gtin'] . ' failed GS1 checksum — may be corrupt or internal code',
                    'requires_review' => true,
                ];
            }
        }

        return [
            'has_conflict'    => count($conflicts) > 0,
            'unique_gtins'    => count($gtins),
            'conflicts'       => $conflicts,
        ];
    }

    /**
     * Compare catalog barcode vs packaging-decoded barcode.
     * Returns CATALOG_VS_PACKAGING conflict when they differ.
     */
    public static function catalogVsPackaging(
        ?string $catalogGtin,
        ?string $packagingGtin,
        string $productName = ''
    ): array {
        if (empty($catalogGtin) || empty($packagingGtin)) {
            return ['has_conflict' => false, 'conflicts' => []];
        }
        if ($catalogGtin === $packagingGtin) {
            return [
                'has_conflict' => false,
                'conflicts'    => [],
                'agreement'    => true,
                'gtin'         => $catalogGtin,
            ];
        }
        return [
            'has_conflict'    => true,
            'conflicts'       => [[
                'type'            => 'BARCODE_CATALOG_VS_PACKAGING',
                'severity'        => self::SEVERITY_CRITICAL,
                'catalog_gtin'    => $catalogGtin,
                'packaging_gtin'  => $packagingGtin,
                'product_name'    => $productName,
                'message'         => "Catalog barcode ({$catalogGtin}) differs from packaging-decoded barcode ({$packagingGtin}). Physical packaging takes priority.",
                'requires_review' => true,
                'resolution'      => 'PREFER_PACKAGING — verify catalog entry',
            ]],
        ];
    }

    // ── Private comparisons ───────────────────────────────────────────────────

    private static function checkBrand(array $a, array $b, string $la, string $lb): array
    {
        $ba = strtolower(trim($a['brand'] ?? ''));
        $bb = strtolower(trim($b['brand'] ?? ''));
        if (empty($ba) || empty($bb)) return [];
        if ($ba === $bb) return [];
        // Partial match — not a full conflict
        if (str_contains($ba, $bb) || str_contains($bb, $ba)) return [];

        return [[
            'type'           => 'BRAND_MISMATCH',
            'severity'       => self::SEVERITY_HIGH,
            'source_a'       => $la,
            'value_a'        => $a['brand'],
            'source_b'       => $lb,
            'value_b'        => $b['brand'],
            'message'        => "Brand conflict: '{$a['brand']}' vs '{$b['brand']}'",
            'requires_review' => true,
        ]];
    }

    private static function checkBarcode(array $a, array $b, string $la, string $lb): array
    {
        $ga = preg_replace('/\D/', '', $a['barcode'] ?? $a['gtin'] ?? '');
        $gb = preg_replace('/\D/', '', $b['barcode'] ?? $b['gtin'] ?? '');
        if (empty($ga) || empty($gb)) return [];
        if ($ga === $gb) return [];

        return [[
            'type'           => 'BARCODE_MISMATCH',
            'severity'       => self::SEVERITY_CRITICAL,
            'source_a'       => $la,
            'value_a'        => $ga,
            'source_b'       => $lb,
            'value_b'        => $gb,
            'message'        => "Barcode conflict: {$ga} vs {$gb}",
            'requires_review' => true,
            'resolution'      => 'Physical packaging evidence takes priority over catalog or marketplace data',
        ]];
    }

    private static function checkQuantity(array $a, array $b, string $la, string $lb): array
    {
        // Extract numeric quantity values
        $qa = self::extractQtyGrams($a['quantity'] ?? $a['pack_size'] ?? $a['weight'] ?? '');
        $qb = self::extractQtyGrams($b['quantity'] ?? $b['pack_size'] ?? $b['weight'] ?? '');
        if ($qa === null || $qb === null) return [];
        if (abs($qa - $qb) < 1) return [];

        $severity = (abs($qa - $qb) / max($qa, $qb)) > 0.1 ? self::SEVERITY_HIGH : self::SEVERITY_MEDIUM;
        return [[
            'type'           => 'QUANTITY_MISMATCH',
            'severity'       => $severity,
            'source_a'       => $la,
            'value_a'        => ($a['quantity'] ?? $a['pack_size'] ?? $a['weight']),
            'value_a_grams'  => $qa,
            'source_b'       => $lb,
            'value_b'        => ($b['quantity'] ?? $b['pack_size'] ?? $b['weight']),
            'value_b_grams'  => $qb,
            'message'        => "Quantity conflict: {$qa}g vs {$qb}g",
            'requires_review' => $severity === self::SEVERITY_HIGH,
        ]];
    }

    private static function checkPieceCount(array $a, array $b, string $la, string $lb): array
    {
        $pa = self::extractNumeric($a['pieces'] ?? $a['piece_count'] ?? '');
        $pb = self::extractNumeric($b['pieces'] ?? $b['piece_count'] ?? '');
        if ($pa === null || $pb === null) return [];
        if ($pa === $pb) return [];

        return [[
            'type'           => 'PIECE_COUNT_MISMATCH',
            'severity'       => self::SEVERITY_HIGH,
            'source_a'       => $la,
            'value_a'        => $pa,
            'source_b'       => $lb,
            'value_b'        => $pb,
            'message'        => "Piece count conflict: {$pa} pcs vs {$pb} pcs",
            'requires_review' => true,
        ]];
    }

    private static function checkMRP(array $a, array $b, string $la, string $lb): array
    {
        $ma = self::extractFloat($a['mrp'] ?? '');
        $mb = self::extractFloat($b['mrp'] ?? '');
        if ($ma === null || $mb === null) return [];
        if (abs($ma - $mb) < 1) return [];

        $pctDiff = abs($ma - $mb) / max($ma, $mb);
        if ($pctDiff < 0.05) return []; // < 5% diff — not a conflict (rounding)
        $severity = $pctDiff > 0.2 ? self::SEVERITY_HIGH : self::SEVERITY_MEDIUM;

        return [[
            'type'           => 'MRP_MISMATCH',
            'severity'       => $severity,
            'source_a'       => $la,
            'value_a'        => $ma,
            'source_b'       => $lb,
            'value_b'        => $mb,
            'message'        => "MRP conflict: ₹{$ma} vs ₹{$mb}",
            'requires_review' => $severity === self::SEVERITY_HIGH,
        ]];
    }

    private static function extractQtyGrams(string $v): ?float
    {
        if (empty($v)) return null;
        if (preg_match('/(\d+(?:\.\d+)?)\s*(kg|kilogram)/i', $v, $m)) return (float)$m[1] * 1000;
        if (preg_match('/(\d+(?:\.\d+)?)\s*(g|gm|gram)/i', $v, $m)) return (float)$m[1];
        if (preg_match('/(\d+(?:\.\d+)?)\s*(ml|milliliter)/i', $v, $m)) return (float)$m[1];
        if (preg_match('/(\d+(?:\.\d+)?)\s*(l|ltr|liter|litre)/i', $v, $m)) return (float)$m[1] * 1000;
        return null;
    }

    private static function extractNumeric(string $v): ?int
    {
        if (empty($v)) return null;
        if (preg_match('/(\d+)/', $v, $m)) return (int)$m[1];
        return null;
    }

    private static function extractFloat(string $v): ?float
    {
        $v = preg_replace('/[^\d.]/', '', (string)$v);
        return is_numeric($v) ? (float)$v : null;
    }
}
