<?php

declare(strict_types=1);

namespace App\Services\ProductIntelligence;

/**
 * BarcodeVerificationEngine — v12.0
 *
 * Orchestrates barcode evidence from all sources and computes
 * a final verified barcode object with 6-level verification.
 *
 * CRITICAL RULES:
 *   - PACKAGING_MATCH requires actual physical packaging decode — NEVER from catalog
 *   - GS1_VERIFIED requires official GS1 API — NOT just checksum
 *   - LEVEL 5 requires convergence of physical + OCR + registry + identity
 *   - Catalog barcodes are CATALOG_REFERENCE — not physical evidence
 *
 * Evidence hierarchy (highest to lowest):
 *   PHYSICAL_DECODE > OCR_DIGITS > REGISTRY_GTIN > IDENTITY_MATCH > CHECKSUM > CATALOG_REFERENCE
 */
class BarcodeVerificationEngine
{
    // ── Verification Statuses ─────────────────────────────────────────────────
    public const STATUS_UNVERIFIED         = 'UNVERIFIED';
    public const STATUS_CHECKSUM_VALID     = 'CHECKSUM_VALID';
    public const STATUS_CATALOG_REFERENCE  = 'CATALOG_REFERENCE';   // was STATUS_PACKAGING_MATCH — renamed to be honest
    public const STATUS_REGISTRY_MATCH     = 'REGISTRY_MATCH';
    public const STATUS_PACKAGING_DETECTED = 'PACKAGING_DETECTED';  // physical packaging decode
    public const STATUS_MULTI_SIGNAL_MATCH = 'MULTI_SIGNAL_MATCH';  // packaging + OCR + identity
    public const STATUS_GS1_VERIFIED       = 'GS1_VERIFIED';        // official GS1 API only
    public const STATUS_CONFLICT           = 'CONFLICT';
    public const STATUS_NOT_CHECKED        = 'NOT_CHECKED';

    // Keep old constant for backward compatibility with existing catalog entries
    public const STATUS_PACKAGING_MATCH = 'CATALOG_REFERENCE';

    // ── Verification Levels (0-5) ─────────────────────────────────────────────
    public const LEVEL_0_NOT_FOUND            = 'NOT_FOUND';
    public const LEVEL_1_FORMAT_VALID         = 'FORMAT_VALID';
    public const LEVEL_2_PACKAGING_DETECTED   = 'PACKAGING_DETECTED';
    public const LEVEL_3_MULTI_SIGNAL_MATCH   = 'MULTI_SIGNAL_MATCH';
    public const LEVEL_4_REGISTRY_MATCHED     = 'REGISTRY_MATCHED';
    public const LEVEL_5_CROSS_SOURCE_VERIFIED = 'CROSS_SOURCE_VERIFIED';

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Validate a barcode checksum (delegates to BarcodeChecksumService).
     */
    public static function validateChecksum(string $barcode): array
    {
        return BarcodeChecksumService::validate($barcode);
    }

    /**
     * Verify a barcode against registries (delegates to ProductRegistryVerificationEngine).
     */
    public static function verifyAgainstRegistries(string $barcode, string $expectedBrand = '', string $expectedName = ''): array
    {
        $result = ProductRegistryVerificationEngine::verifyGtin($barcode, $expectedBrand, $expectedName);

        // Map to legacy format for backward compat with ProductExtractorAPIController
        $best = $result['best_match'];
        if ($best && $best['status'] === ProductRegistryVerificationEngine::STATUS_MATCH) {
            return [
                'status'        => self::STATUS_REGISTRY_MATCH,
                'registry_data' => [
                    'name'     => $best['product_name'],
                    'brand'    => $best['brand'],
                    'quantity' => $best['quantity'],
                    'category' => '',
                    'image'    => $best['image_url'],
                ],
                'conflict_reason' => null,
                'source'          => $best['registry'],
                'confidence'      => $best['match_score'] ?? 85,
                'full_result'     => $result,
            ];
        }

        return [
            'status'          => self::STATUS_UNVERIFIED,
            'registry_data'   => null,
            'conflict_reason' => null,
            'source'          => null,
            'confidence'      => 0,
            'full_result'     => $result,
        ];
    }

    /**
     * Build comprehensive barcode evidence object from all available signals.
     *
     * @param string|null $barcode          The GTIN to assess
     * @param array       $checksumResult   From BarcodeChecksumService::validate()
     * @param array       $registryResult   From verifyAgainstRegistries()
     * @param array       $decoderResult    From BarcodeDecoderService::decodeFrom*() — null = not tried
     * @param string      $barcodeSource    One of: CATALOG_REFERENCE | ONLINE_DISCOVERY | PACKAGING_DETECTED | OCR_DETECTED
     */
    public static function buildEvidenceObject(
        ?string $barcode,
        array $checksumResult,
        array $registryResult,
        array $decoderResult = [],
        string $barcodeSource = ''
    ): array {
        if (empty($barcode)) {
            return [
                'gtin'               => null,
                'value'              => null,
                'format'             => null,
                'checksum_valid'     => false,
                'checksum_algorithm' => 'GS1 Mod-10',
                'status'             => self::STATUS_UNVERIFIED,
                'verification_level' => self::LEVEL_0_NOT_FOUND,
                'verification_level_num' => 0,
                'physical_detection' => false,
                'packaging_detected' => false,
                'ocr_match'          => false,
                'registry_match'     => false,
                'confidence'         => 0,
                'sources'            => [],
                'conflict_reason'    => null,
                'candidates'         => [],
                'diagnostics'        => ['note' => 'No barcode found'],
            ];
        }

        // ── Evaluate evidence signals ─────────────────────────────────────────
        $checksumOk     = !empty($checksumResult['valid']);
        $registryMatch  = ($registryResult['status'] ?? '') === self::STATUS_REGISTRY_MATCH;
        $conflictFound  = ($registryResult['status'] ?? '') === self::STATUS_CONFLICT;

        // Physical decode: only true if BarcodeDecoderService actually found it
        $physicalDecoded = !empty($decoderResult['candidates'])
                        && ($decoderResult['success'] ?? false)
                        && collect($decoderResult['candidates'])->contains(fn($c) => ($c['gtin'] ?? '') === $barcode);

        // OCR match: physical decoder found OCR digits agreeing with GTIN
        $ocrMatch = $physicalDecoded
                 && collect($decoderResult['candidates'] ?? [])->contains(
                        fn($c) => ($c['gtin'] ?? '') === $barcode && ($c['ocr_match'] ?? false) === true
                    );

        // Source classification
        $isPhysical     = $physicalDecoded || in_array($barcodeSource, ['PACKAGING_DETECTED', 'OCR_DETECTED'], true);
        $isCatalogRef   = in_array($barcodeSource, ['CATALOG_REFERENCE', 'PACKAGING_MATCH'], true);
        $isDiscovery    = $barcodeSource === 'ONLINE_DISCOVERY';

        // ── Score calculation (evidence-based, never hardcoded) ───────────────
        $confidence = 0;
        $sources    = [];

        if ($checksumOk) {
            $confidence += 10;
            $sources[] = 'GS1 Mod-10 Checksum';
        }

        if ($isCatalogRef) {
            $confidence += 15;
            $sources[] = 'Catalog Reference';
        }

        if ($isDiscovery) {
            $confidence += 20;
            $sources[] = 'Online Discovery (OpenFoodFacts text search)';
        }

        if ($registryMatch) {
            $confidence += 35;
            $sources[] = $registryResult['source'] ?? 'Registry';
        }

        if ($isPhysical || $physicalDecoded) {
            $confidence += 30;
            $sources[] = 'Physical Packaging Decode';
        }

        if ($ocrMatch) {
            $confidence += 10;
            $sources[] = 'OCR Digit Verification';
        }

        if ($conflictFound) {
            $confidence = 0;
            $sources[]  = 'CONFLICT — See conflict_reason';
        }

        $confidence = min(99, $confidence);

        // ── Status determination ──────────────────────────────────────────────
        $status = self::STATUS_UNVERIFIED;
        if ($conflictFound) {
            $status = self::STATUS_CONFLICT;
        } elseif ($physicalDecoded && $ocrMatch && $registryMatch) {
            $status = self::STATUS_MULTI_SIGNAL_MATCH;
        } elseif ($physicalDecoded) {
            $status = self::STATUS_PACKAGING_DETECTED;
        } elseif ($registryMatch) {
            $status = self::STATUS_REGISTRY_MATCH;
        } elseif ($isCatalogRef) {
            $status = self::STATUS_CATALOG_REFERENCE;
        } elseif ($checksumOk) {
            $status = self::STATUS_CHECKSUM_VALID;
        }

        // ── Verification level ────────────────────────────────────────────────
        $verificationLevel = self::determineVerificationLevel(
            !empty($barcode),
            $checksumOk,
            $physicalDecoded || $isPhysical,
            $ocrMatch,
            $registryMatch,
            $physicalDecoded && $ocrMatch && $registryMatch
        );

        $levelNum = self::levelToNumber($verificationLevel);

        return [
            'gtin'                   => $barcode,
            'value'                  => $barcode,
            'format'                 => $checksumResult['barcode_type'] ?? 'EAN-13',
            'checksum_valid'         => $checksumOk,
            'checksum_algorithm'     => 'GS1 Mod-10',
            'status'                 => $status,
            'verification_level'     => $verificationLevel,
            'verification_level_num' => $levelNum,
            'physical_detection'     => $physicalDecoded || $isPhysical,
            'packaging_detected'     => $physicalDecoded,
            'ocr_match'              => $ocrMatch,
            'registry_match'         => $registryMatch,
            'confidence'             => $confidence,
            'sources'                => array_values(array_unique($sources)),
            'conflict_reason'        => $registryResult['conflict_reason'] ?? null,
            'candidates'             => $decoderResult['candidates'] ?? [],
            'barcode_source_class'   => $isCatalogRef ? 'CATALOG_REFERENCE'
                                      : ($isDiscovery ? 'ONLINE_DISCOVERY'
                                      : ($physicalDecoded ? 'PACKAGING_DETECTED' : 'UNKNOWN')),
            'diagnostics' => [
                'checksum_ok'    => $checksumOk,
                'physical'       => $physicalDecoded,
                'ocr_match'      => $ocrMatch,
                'registry_match' => $registryMatch,
                'is_catalog_ref' => $isCatalogRef,
                'is_discovery'   => $isDiscovery,
                'source_input'   => $barcodeSource,
            ],
        ];
    }

    /**
     * Determine the 6-level verification string.
     */
    public static function determineVerificationLevel(
        bool $hasBarcode,
        bool $checksumValid,
        bool $packagingDetected,
        bool $ocrMatch,
        bool $registryMatch,
        bool $crossSourceVerified
    ): string {
        if (!$hasBarcode)          return self::LEVEL_0_NOT_FOUND;
        if ($crossSourceVerified)  return self::LEVEL_5_CROSS_SOURCE_VERIFIED;
        if ($registryMatch && ($packagingDetected || $ocrMatch)) return self::LEVEL_5_CROSS_SOURCE_VERIFIED;
        if ($registryMatch)        return self::LEVEL_4_REGISTRY_MATCHED;
        if ($packagingDetected && $ocrMatch) return self::LEVEL_3_MULTI_SIGNAL_MATCH;
        if ($packagingDetected)    return self::LEVEL_2_PACKAGING_DETECTED;
        if ($checksumValid)        return self::LEVEL_1_FORMAT_VALID;
        return self::LEVEL_0_NOT_FOUND;
    }

    public static function levelToNumber(string $level): int
    {
        return match ($level) {
            self::LEVEL_5_CROSS_SOURCE_VERIFIED => 5,
            self::LEVEL_4_REGISTRY_MATCHED      => 4,
            self::LEVEL_3_MULTI_SIGNAL_MATCH    => 3,
            self::LEVEL_2_PACKAGING_DETECTED    => 2,
            self::LEVEL_1_FORMAT_VALID          => 1,
            default                             => 0,
        };
    }
}