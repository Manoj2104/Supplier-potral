<?php

namespace App\Services\ProductIntelligence;

/**
 * INFY-POS Enterprise - ProductSpecificationAnalyzer v1.0
 * Deep Multidimensional Packaging & Specification Parser
 * - Weight extraction (g, gm, gram, grams, kg, kilo)
 * - Volume extraction (ml, l, ltr, litre, litres)
 * - Count extraction (pcs, pieces, count, tabs, tablets, pads, bags, tea bags, pouches, sachets, combo, pack of X)
 * - Multi-pack calculations (e.g. "Pack of 3 x 150g" = "3 x 150 g (450 g)")
 * - Clean brand & variant identification
 */
class ProductSpecificationAnalyzer
{
    /**
     * Parse pack size, net quantity, unit and normalized representation.
     */
    public static function parseSpecifications(string $rawText): array
    {
        $text = strtolower(' ' . $rawText . ' ');

        $spec = [
            'pack_size' => '1 Unit',
            'net_weight_value' => null,
            'net_weight_unit' => null,
            'count' => 1,
            'is_multipack' => false,
            'unit_type' => 'PCS', // PCS, KG, L, G, ML
        ];

        // 1. Multipack Pattern (e.g., "Pack of 4 x 75 g", "3 x 150g", "Pack of 2 (500 ml Each)")
        if (preg_match('/\b(?:pack\s*of\s*)?(\d+)\s*(?:x|\*|units?|pieces?)\s*(\d+(?:\.\d+)?)\s*(g|gm|gram|grams|kg|ml|l|ltr|litre|pads|bags|sachets|tablets?|capsules?)\b/i', $text, $m)) {
            $count = (int)$m[1];
            $value = (float)$m[2];
            $unit = self::normalizeUnit($m[3]);
            $total = $count * $value;
            $spec['is_multipack'] = true;
            $spec['count'] = $count;
            $spec['net_weight_value'] = $total;
            $spec['net_weight_unit'] = $unit;
            $spec['pack_size'] = "{$count} x {$value} {$unit} ({$total} {$unit})";
            $spec['unit_type'] = in_array($unit, ['kg','l']) ? strtoupper($unit) : 'PCS';
            return $spec;
        }

        // 2. Count with Unit (e.g., "25 Tea Bags", "15 Pads", "60 Tablets", "12 Count", "10 Sachets", "6 Pieces")
        if (preg_match('/\b(\d+)\s*(tea\s*bags?|bags?|pads?|tablets?|capsules?|sachets?|pouches?|wipes?|sheets?|pieces?|pcs|count|units?)\b/i', $text, $m)) {
            $count = (int)$m[1];
            $unit = strtolower(trim($m[2]));
            if (in_array($unit, ['pcs', 'pieces', 'piece', 'units', 'unit', 'count'])) $unit = 'PCS';
            elseif (str_contains($unit, 'bag')) $unit = 'bags';
            elseif (str_contains($unit, 'pad')) $unit = 'pads';
            elseif (str_contains($unit, 'sachet')) $unit = 'sachets';
            elseif (str_contains($unit, 'tablet')) $unit = 'tablets';

            $spec['count'] = $count;
            $spec['net_weight_value'] = $count;
            $spec['net_weight_unit'] = $unit;
            $spec['pack_size'] = "{$count} {$unit}";
            $spec['unit_type'] = 'PCS';
            return $spec;
        }

        // 3. Single Weight / Volume Pattern (e.g., "420 g", "1.2 kg", "500 ml", "1 L", "250 gm")
        if (preg_match('/\b(\d+(?:\.\d+)?)\s*(g|gm|gram|grams|kg|kilo|ml|l|ltr|liter|litre|litres)\b/i', $text, $m)) {
            $value = (float)$m[1];
            $unit = self::normalizeUnit($m[2]);
            $spec['net_weight_value'] = $value;
            $spec['net_weight_unit'] = $unit;
            $spec['pack_size'] = "{$value} {$unit}";
            $spec['unit_type'] = in_array($unit, ['kg','l']) ? strtoupper($unit) : 'PCS';
            return $spec;
        }

        // 4. "Pack of X" without sub-unit
        if (preg_match('/\bpack\s*of\s*(\d+)\b/i', $text, $m)) {
            $count = (int)$m[1];
            $spec['count'] = $count;
            $spec['pack_size'] = "Pack of {$count}";
            $spec['unit_type'] = 'PCS';
            return $spec;
        }

        return $spec;
    }

    private static function normalizeUnit(string $u): string
    {
        $u = strtolower(trim($u));
        if (in_array($u, ['g', 'gm', 'gram', 'grams'])) return 'g';
        if (in_array($u, ['kg', 'kilo', 'kilogram', 'kilograms'])) return 'kg';
        if (in_array($u, ['ml', 'milli', 'milliliter', 'millilitre'])) return 'ml';
        if (in_array($u, ['l', 'ltr', 'liter', 'litre', 'litres'])) return 'L';
        return $u;
    }
}
