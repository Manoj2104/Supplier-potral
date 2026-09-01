<?php

declare(strict_types=1);

namespace App\Services\ProductIntelligence;

class EvidenceConfidenceEngine
{
    public const STATUS_VERIFIED = 'VERIFIED';
    public const STATUS_HIGH_CONFIDENCE = 'HIGH_CONFIDENCE';
    public const STATUS_PARTIALLY_VERIFIED = 'PARTIALLY_VERIFIED';
    public const STATUS_UNVERIFIED = 'UNVERIFIED';
    public const STATUS_CONFLICT = 'CONFLICT';

    public static function calculateScore(array $evidenceFlags): int
    {
        $score = 0;

        if (!empty($evidenceFlags['SOURCE_PAGE_DATA'])) {
            $score += 25;
        }

        if (!empty($evidenceFlags['EXACT_PVID_MATCH'])) {
            $score += 25;
        } elseif (!empty($evidenceFlags['EXACT_VARIANT_MATCH'])) {
            $score += 20;
        }

        if (!empty($evidenceFlags['BARCODE_PACKAGING_MATCH'])) {
            $score += 30;
        } elseif (!empty($evidenceFlags['BARCODE_GS1_VERIFIED'])) {
            $score += 35;
        } elseif (!empty($evidenceFlags['BARCODE_REGISTRY_MATCH'])) {
            $score += 20;
        } elseif (!empty($evidenceFlags['BARCODE_CHECKSUM_VALID'])) {
            $score += 5;
        }

        if (!empty($evidenceFlags['IMAGE_FOUND'])) {
            $score += 5;
        }

        if (!empty($evidenceFlags['BRAND_MATCH'])) {
            $score += 10;
        }

        if (!empty($evidenceFlags['QTY_CONFIRMED'])) {
            $score += 5;
        }

        return min(100, max(0, $score));
    }


    public static function determineOverallStatus(int $score, array $conflicts = []): string
    {
        if (!empty($conflicts)) {
            return self::STATUS_CONFLICT;
        }

        if ($score >= 80) {
            return self::STATUS_VERIFIED;
        }

        if ($score >= 60) {
            return self::STATUS_HIGH_CONFIDENCE;
        }

        if ($score >= 35) {
            return self::STATUS_PARTIALLY_VERIFIED;
        }

        return self::STATUS_UNVERIFIED;
    }

    public static function buildFieldConfidenceMatrix(array $data, array $evidenceFlags, array $conflicts = []): array
    {
        $hasConflict = !empty($conflicts);
        $hasBarcode = !empty($data['barcode']);
        $isCatalogMatch = in_array($data['match_method'] ?? '', ['EXACT_PVID', 'EXACT_SLUG', 'EXACT_VARIANT'], true);
        $isPackagingBarcode = in_array($data['barcode_status'] ?? '', [BarcodeVerificationEngine::STATUS_PACKAGING_MATCH, BarcodeVerificationEngine::STATUS_GS1_VERIFIED], true);
        $isRegistryMatch = ($data['barcode_status'] ?? '') === BarcodeVerificationEngine::STATUS_REGISTRY_MATCH;

        $identityScore = $hasConflict ? 0 : ($isCatalogMatch ? 98 : (!empty($data['name']) && !empty($data['brand']) && $data['brand'] !== 'Unknown' ? 95 : 60));
        $packagingScore = !empty($data['pack_size']) && $data['pack_size'] !== '1 Unit' ? 96 : 40;
        $quantityScore = !empty($data['pack_size']) && $data['pack_size'] !== '1 Unit' ? 99 : 30;
        $pricingScore = !empty($data['price']) && (float)$data['price'] > 0 ? 92 : 0;
        $mrpScore = !empty($data['mrp']) && (float)$data['mrp'] > 0 ? 96 : 0;
        
        $barcodeScore = 0;
        if ($hasBarcode) {
            if ($isPackagingBarcode) {
                $barcodeScore = 99;
            } elseif ($isRegistryMatch) {
                $barcodeScore = 94;
            } else {
                $barcodeScore = 60; // checksum valid only
            }
        }

        $registryScore = $isRegistryMatch || $isPackagingBarcode ? 95 : 0;

        $overallScore = self::calculateScore($evidenceFlags);
        if ($hasConflict) {
            $overallScore = 0;
        }

        return [
            'identity' => $identityScore,
            'packaging' => $packagingScore,
            'quantity' => $quantityScore,
            'pricing' => $pricingScore,
            'mrp' => $mrpScore,
            'barcode' => $barcodeScore,
            'registry' => $registryScore,
            'overall' => $overallScore
        ];
    }

    public static function buildFieldEvidence(string $field, mixed $value, string $source, float $confidence, string $status, array $verifiedAgainst = []): array
    {
        return [
            'field' => $field,
            'value' => $value,
            'source' => $source,
            'confidence' => $confidence,
            'status' => $status,
            'verified_against' => $verifiedAgainst,
        ];
    }
}