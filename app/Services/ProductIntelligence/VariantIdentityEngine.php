<?php

declare(strict_types=1);

namespace App\Services\ProductIntelligence;

/**
 * VariantIdentityEngine
 *
 * Deterministic variant fingerprinting, conflict detection, and catalog matching
 * for the INFY-POS Product Intelligence Engine v10.0.
 *
 * NO fuzzy-match final decisions. Hard-rule cascade only.
 */
class VariantIdentityEngine
{
    // ---------------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------------

    /** Flavor / variant keywords we detect from product names */
    private const FLAVOR_KEYWORDS = [
        'airfryer', 'air fryer', 'smiles', 'french fries', 'fries',
        'masala', 'cheese', 'golden', 'tikki', 'nuggets', 'wedges',
        'popcorn', 'crackers', 'classic', 'herbed', 'spicy', 'salted',
        'unsalted', 'honey', 'almond', 'strawberry', 'vanilla',
        'chocolate', 'green tea', 'lemon',
    ];


    /** Marketing / filler words stripped during name normalization */
    private const MARKETING_WORDS = [
        'crispy', 'ready to cook', 'no added', 'premium', 'extra',
        'fresh', 'pure', 'natural', 'organic', 'special', 'new',
        'improved', 'original', 'authentic', 'real', 'genuine',
        'best', 'super', 'ultra', 'mini', 'jumbo', 'family', 'pack',
        'value', 'economy', 'deluxe', 'lite', 'light',
    ];

    /** Brand noise words stripped during brand normalization */
    private const BRAND_NOISE = [
        'ltd', 'pvt', 'limited', 'private', 'foods', 'india',
        'international', 'enterprises', 'company', 'co',
    ];

    /** Regex: captures (multiplier x)? qty unit from a string */
    private const QTY_PATTERN = '/(\d+(?:\.\d+)?)\s*(?:x\s*(\d+(?:\.\d+)?)\s*)?\s*(g|gm|gram|grams|kg|ml|l|ltr|litre|liter|pcs|pieces|count|tablets|bags|sachets|pads|capsules)\b/i';

    /** Pack-count pattern: "pack of 6", "6 x 100g" (the leading multiplier) */
    private const PACK_PATTERN = '/(?:pack\s+of\s+|(\d+)\s*x\s*)/i';

    // ---------------------------------------------------------------------------
    // Public API
    // ---------------------------------------------------------------------------

    /**
     * Build a variant identity fingerprint from raw product data.
     *
     * @param  array $data  Associative array with any of:
     *                      name, brand, pack_size, category, manufacturer,
     *                      pvid, slug, platform_id
     * @return array        Structured fingerprint
     */
    public static function buildFingerprint(array $data): array
    {
        $rawName      = (string) ($data['name']      ?? '');
        $rawBrand     = (string) ($data['brand']     ?? '');
        $rawPackSize  = (string) ($data['pack_size'] ?? '');

        // ── Quantity extraction (pack_size preferred, fallback to name) ──────
        $qtySource = $rawPackSize !== '' ? $rawPackSize : $rawName;
        $qty       = self::extractQtyFromString($qtySource);

        // ── Flavor detection ─────────────────────────────────────────────────
        $flavor = self::detectFlavor($rawName);

        // ── Brand normalization ───────────────────────────────────────────────
        $normalizedBrand = self::normalizeBrand($rawBrand);

        // ── Name normalization ────────────────────────────────────────────────
        $normalizedName = self::normalizeName($rawName);

        return [
            'brand'           => $normalizedBrand,
            'normalized_name' => $normalizedName,
            'flavor'          => $flavor,
            'net_qty_value'   => $qty['value'],
            'net_qty_unit'    => $qty['unit'],
            'pack_count'      => $qty['pack_count'],
            'total_qty_grams' => $qty['total_grams'],
            'category'        => (string) ($data['category']     ?? ''),
            'manufacturer'    => (string) ($data['manufacturer'] ?? ''),
            'pvid'            => (string) ($data['pvid']         ?? ''),
            'slug'            => (string) ($data['slug']         ?? ''),
            'platform_id'     => (string) ($data['platform_id'] ?? ''),
        ];
    }

    /**
     * Hard conflict detection between a URL-sourced fingerprint and a catalog
     * fingerprint.
     *
     * @param  array $urlFingerprint     Fingerprint built from the scraped URL
     * @param  array $catalogFingerprint Fingerprint built from master catalog
     * @return array {has_conflict, conflicts[]}
     */
    public static function detectConflicts(
        array $urlFingerprint,
        array $catalogFingerprint
    ): array {
        $conflicts = [];

        // ── Brand conflict ────────────────────────────────────────────────────
        $urlBrand     = $urlFingerprint['brand']     ?? '';
        $catalogBrand = $catalogFingerprint['brand'] ?? '';

        if (
            $urlBrand !== ''
            && $catalogBrand !== ''
            && $urlBrand !== $catalogBrand
        ) {
            $conflicts[] = [
                'field'         => 'brand',
                'url_value'     => $urlBrand,
                'catalog_value' => $catalogBrand,
                'severity'      => 'HARD',
            ];
        }

        // ── Quantity conflict (>5% difference in total grams) ─────────────────
        $urlGrams     = (float) ($urlFingerprint['total_qty_grams']     ?? 0);
        $catalogGrams = (float) ($catalogFingerprint['total_qty_grams'] ?? 0);

        if ($urlGrams > 0 && $catalogGrams > 0) {
            $pctDiff = abs($urlGrams - $catalogGrams) / max($urlGrams, $catalogGrams);
            if ($pctDiff > 0.05) {
                $conflicts[] = [
                    'field'         => 'total_qty_grams',
                    'url_value'     => $urlGrams,
                    'catalog_value' => $catalogGrams,
                    'severity'      => 'HARD',
                ];
            }
        }

        // ── Flavor conflict ───────────────────────────────────────────────────
        $urlFlavor     = $urlFingerprint['flavor']     ?? '';
        $catalogFlavor = $catalogFingerprint['flavor'] ?? '';

        if (
            $urlFlavor !== ''
            && $catalogFlavor !== ''
            && $urlFlavor !== $catalogFlavor
        ) {
            $conflicts[] = [
                'field'         => 'flavor',
                'url_value'     => $urlFlavor,
                'catalog_value' => $catalogFlavor,
                'severity'      => 'HARD',
            ];
        }

        return [
            'has_conflict' => count($conflicts) > 0,
            'conflicts'    => $conflicts,
        ];
    }

    /**
     * Match a fingerprint against a catalog (array of catalog entries).
     *
     * Matching is strictly deterministic – priority cascade:
     *   L1 Exact slug key  → confidence 100
     *   L2 Exact PVID      → confidence 100
     *   L3 brand+name+qty  → confidence  95
     *   L4 brand+name+flavor → confidence 80
     *   L5 (fuzzy)         → NOT implemented, returns null
     *
     * Brand mismatch is an immediate disqualifier for any candidate entry.
     *
     * @param  array $fingerprint Fingerprint to match
     * @param  array $catalog     Keyed array of catalog entries (key = slug)
     * @return array|null
     */
    public static function matchAgainstCatalog(
        array $fingerprint,
        array $catalog
    ): ?array {
        $slug  = $fingerprint['slug']  ?? '';
        $pvid  = $fingerprint['pvid']  ?? '';
        $brand = $fingerprint['brand'] ?? '';

        // ── Level 1: Exact slug key ───────────────────────────────────────────
        if ($slug !== '' && isset($catalog[$slug])) {
            $entry = $catalog[$slug];
            if (self::brandsCompatible($brand, self::normalizeBrand((string) ($entry['brand'] ?? '')))) {
                return [
                    'match'      => $entry,
                    'method'     => 'EXACT_SLUG',
                    'confidence' => 100,
                ];
            }
        }

        // ── Level 2: Exact PVID ───────────────────────────────────────────────
        if ($pvid !== '') {
            foreach ($catalog as $entry) {
                $entryBrand = self::normalizeBrand((string) ($entry['brand'] ?? ''));
                if (!self::brandsCompatible($brand, $entryBrand)) {
                    continue; // brand mismatch → skip
                }
                if ((string) ($entry['pvid'] ?? '') === $pvid) {
                    return [
                        'match'      => $entry,
                        'method'     => 'EXACT_PVID',
                        'confidence' => 100,
                    ];
                }
            }
        }

        // ── Level 3: brand + normalized_name + qty_value + qty_unit ──────────
        $normalizedName = $fingerprint['normalized_name'] ?? '';
        $netQtyValue    = $fingerprint['net_qty_value']   ?? 0.0;
        $netQtyUnit     = $fingerprint['net_qty_unit']    ?? '';

        foreach ($catalog as $entry) {
            $entryBrand = self::normalizeBrand((string) ($entry['brand'] ?? ''));
            if (!self::brandsCompatible($brand, $entryBrand)) {
                continue;
            }

            $entryName = self::normalizeName((string) ($entry['name'] ?? $entry['normalized_name'] ?? ''));
            if (
                $entryName === $normalizedName
                && (float) ($entry['net_qty_value'] ?? 0) === (float) $netQtyValue
                && (string) ($entry['net_qty_unit'] ?? '') === $netQtyUnit
            ) {
                return [
                    'match'      => $entry,
                    'method'     => 'EXACT_VARIANT',
                    'confidence' => 95,
                ];
            }
        }

        // ── Level 4: brand + normalized_name + same flavor ───────────────────
        $flavor = $fingerprint['flavor'] ?? '';

        foreach ($catalog as $entry) {
            $entryBrand = self::normalizeBrand((string) ($entry['brand'] ?? ''));
            if (!self::brandsCompatible($brand, $entryBrand)) {
                continue;
            }

            $entryName   = self::normalizeName((string) ($entry['name'] ?? $entry['normalized_name'] ?? ''));
            $entryFlavor = (string) ($entry['flavor'] ?? '');

            if (
                $entryName === $normalizedName
                && $entryFlavor === $flavor
            ) {
                return [
                    'match'      => $entry,
                    'method'     => 'BRAND_VARIANT',
                    'confidence' => 80,
                ];
            }
        }

        // ── Level 5: Fuzzy (candidate generation only, never final) ──────────
        // Not implemented — return null to indicate no deterministic match.
        return null;
    }

    /**
     * Normalize a product name.
     *
     * Removes: weight annotations, marketing filler words, punctuation,
     * excess whitespace. Returns lowercase.
     *
     * @param  string $name Raw product name
     * @return string
     */
    public static function normalizeName(string $name): string
    {
        $name = mb_strtolower($name, 'UTF-8');

        // Remove qty annotations like "420g", "750 g", "1 kg", "500ml"
        $name = preg_replace(
            '/\d+(?:\.\d+)?\s*(?:g|gm|gram|grams|kg|ml|l|ltr|litre|liter|pcs|pieces|count|tablets|bags|sachets|pads|capsules)\b/',
            '',
            $name
        );

        // Remove marketing words (whole-word match)
        foreach (self::MARKETING_WORDS as $word) {
            $name = preg_replace('/\b' . preg_quote($word, '/') . '\b/', '', $name);
        }

        // Remove punctuation (keep letters, digits, spaces)
        $name = preg_replace('/[^a-z0-9\s]/', ' ', $name);

        // Collapse whitespace
        $name = preg_replace('/\s+/', ' ', $name);

        return trim($name);
    }

    /**
     * Extract quantity information from an arbitrary string.
     *
     * Handles:
     *  - '420 g', '1 kg', '500ml'
     *  - '6 x 100g', '1 pack (420g)', '25 bags'
     *
     * @param  string $input
     * @return array {value, unit, pack_count, total_grams, raw}
     */
    public static function extractQtyFromString(string $input): array
    {
        $defaultResult = [
            'value'       => 0.0,
            'unit'        => '',
            'pack_count'  => 1,
            'total_grams' => 0.0,
            'raw'         => '',
        ];

        if ($input === '') {
            return $defaultResult;
        }

        $packCount = 1;

        // Detect multiplier pattern "N x [qty]"  e.g. "6 x 100g"
        if (preg_match('/(\d+)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(g|gm|gram|grams|kg|ml|l|ltr|litre|liter|pcs|pieces|count|tablets|bags|sachets|pads|capsules)\b/i', $input, $m)) {
            $packCount  = (int) $m[1];
            $rawValue   = (float) $m[2];
            $rawUnit    = strtolower($m[3]);
            $raw        = $m[0];

            [$normalizedValue, $normalizedUnit] = self::normalizeUnit($rawValue, $rawUnit);

            return [
                'value'       => $normalizedValue,
                'unit'        => $normalizedUnit,
                'pack_count'  => $packCount,
                'total_grams' => self::toGrams($normalizedValue, $normalizedUnit) * $packCount,
                'raw'         => $raw,
            ];
        }

        // Detect "pack of N" and then the qty in the string
        if (preg_match('/pack\s+of\s+(\d+)/i', $input, $pm)) {
            $packCount = (int) $pm[1];
        }

        // Standard qty pattern
        if (preg_match(self::QTY_PATTERN, $input, $m)) {
            $rawValue = (float) $m[1];
            $rawUnit  = strtolower($m[3]);
            $raw      = $m[0];

            [$normalizedValue, $normalizedUnit] = self::normalizeUnit($rawValue, $rawUnit);

            return [
                'value'       => $normalizedValue,
                'unit'        => $normalizedUnit,
                'pack_count'  => $packCount,
                'total_grams' => self::toGrams($normalizedValue, $normalizedUnit) * $packCount,
                'raw'         => $raw,
            ];
        }

        return $defaultResult;
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    /**
     * Detect the primary flavor/variant keyword present in a name.
     * Multi-word flavors are checked first (longest match wins).
     */
    private static function detectFlavor(string $name): string
    {
        $lower = mb_strtolower($name, 'UTF-8');

        // Sort descending by word length so multi-word wins
        $sorted = self::FLAVOR_KEYWORDS;
        usort($sorted, static fn ($a, $b) => strlen($b) - strlen($a));

        foreach ($sorted as $keyword) {
            if (str_contains($lower, $keyword)) {
                return $keyword;
            }
        }

        return '';
    }

    /**
     * Normalize a brand string.
     * Strips noise words, lowercases, trims.
     */
    private static function normalizeBrand(string $brand): string
    {
        $brand = mb_strtolower($brand, 'UTF-8');

        // Strip noise words (whole-word)
        foreach (self::BRAND_NOISE as $noise) {
            $brand = preg_replace('/\b' . preg_quote($noise, '/') . '\b/', '', $brand);
        }

        // Remove punctuation except hyphens and spaces
        $brand = preg_replace('/[^a-z0-9\s\-]/', ' ', $brand);

        return trim(preg_replace('/\s+/', ' ', $brand));
    }

    /**
     * Determine whether two normalized brand strings are compatible.
     * Empty brand on either side → compatible (insufficient data).
     */
    private static function brandsCompatible(string $a, string $b): bool
    {
        if ($a === '' || $b === '') {
            return true;
        }

        if ($a === $b) {
            return true;
        }

        // Stem trailing s / possessives (haldirams vs haldiram, lays vs lay)
        $stemA = rtrim($a, 's');
        $stemB = rtrim($b, 's');
        if ($stemA !== '' && $stemA === $stemB) {
            return true;
        }

        // Sub-brand compatibility (e.g. "godrej" in "godrej yummiez", "itc" in "itc master chef")
        if ((strlen($a) >= 4 && str_contains($b, $a)) || (strlen($b) >= 4 && str_contains($a, $b))) {
            return true;
        }

        return false;
    }

    /**
     * Normalize qty value + unit.
     * gram/grams/gm → g; kg stays kg; litre/liter/ltr → ml; l → ml; pcs/pieces/count → pcs
     *
     * @return array [float $value, string $unit]
     */
    private static function normalizeUnit(float $value, string $rawUnit): array
    {
        return match (true) {
            in_array($rawUnit, ['gram', 'grams', 'gm'], true) => [$value, 'g'],
            $rawUnit === 'kg'                                  => [$value, 'kg'],
            in_array($rawUnit, ['litre', 'liter', 'ltr', 'l'], true) => [$value, 'ml'],
            in_array($rawUnit, ['pcs', 'pieces', 'count'], true)     => [$value, 'pcs'],
            default                                            => [$value, $rawUnit],
        };
    }

    /**
     * Convert a qty value+unit to grams (for comparison).
     * Non-weight/volume units (pcs, bags, etc.) are returned as-is (no conversion).
     */
    private static function toGrams(float $value, string $unit): float
    {
        return match ($unit) {
            'g'  => $value,
            'kg' => $value * 1000.0,
            'ml' => $value,           // volume: 1 ml ≈ 1 g for comparison purposes
            default => $value,        // pcs, bags, tablets — return face value
        };
    }
}
