<?php

declare(strict_types=1);

namespace App\Services\ProductIntelligence;

/**
 * BarcodeChecksumService — v12.0
 *
 * GS1 Mod-10 checksum validation.
 * Supports: EAN-13, EAN-8, UPC-A, UPC-E, GTIN-14.
 *
 * IMPORTANT:
 * checksum_valid = true means FORMAT_VALID only.
 * It does NOT mean REAL_PRODUCT or PHYSICAL_VERIFIED.
 */
class BarcodeChecksumService
{
    /**
     * Validate a barcode string using GS1 Mod-10.
     * Returns structured result with barcode_type and expected_check_digit.
     */
    public static function validate(string $raw): array
    {
        $digits = preg_replace('/\D/', '', $raw);

        if (empty($digits)) {
            return self::fail($raw, 'EMPTY_INPUT', 'No numeric digits found');
        }

        $len = strlen($digits);

        return match (true) {
            $len === 13 => self::validateEAN13($digits),
            $len === 8  => self::validateEAN8($digits),
            $len === 12 => self::validateUPCA($digits),
            $len === 14 => self::validateGTIN14($digits),
            $len === 6  => self::validateUPCE($digits),
            default     => self::fail($digits, 'UNSUPPORTED_LENGTH', "Length {$len} not standard (need 8,12,13,14)"),
        };
    }

    public static function validateEAN13(string $digits): array
    {
        if (strlen($digits) !== 13) {
            return self::fail($digits, 'LENGTH_ERROR', 'EAN-13 requires exactly 13 digits');
        }
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $sum += (int)$digits[$i] * ($i % 2 === 0 ? 1 : 3);
        }
        $expected = (10 - ($sum % 10)) % 10;
        $actual   = (int)$digits[12];
        $isValid  = ($expected === $actual);
        $errMsg   = $isValid ? null : "Checksum mismatch. Expected check digit {$expected}, got {$actual}.";
        return [
            'valid'                => $isValid,
            'barcode'              => $digits,
            'barcode_type'         => 'EAN-13',
            'digits'               => $digits,
            'check_digit'          => $actual,
            'expected_check_digit' => $expected,
            'actual_check_digit'   => $actual,
            'error'                => $errMsg,
            'error_message'        => $errMsg,
            'verification_note'    => $isValid ? 'FORMAT_VALID — physical evidence still required' : 'FORMAT_INVALID — checksum mismatch',
        ];
    }

    public static function validateEAN8(string $digits): array
    {
        if (strlen($digits) !== 8) {
            return self::fail($digits, 'LENGTH_ERROR', 'EAN-8 requires exactly 8 digits');
        }
        $sum = 0;
        for ($i = 0; $i < 7; $i++) {
            $sum += (int)$digits[$i] * ($i % 2 === 0 ? 3 : 1);
        }
        $expected = (10 - ($sum % 10)) % 10;
        $actual   = (int)$digits[7];
        $isValid  = ($expected === $actual);
        $errMsg   = $isValid ? null : "Checksum mismatch. Expected check digit {$expected}, got {$actual}.";
        return [
            'valid'                => $isValid,
            'barcode'              => $digits,
            'barcode_type'         => 'EAN-8',
            'digits'               => $digits,
            'check_digit'          => $actual,
            'expected_check_digit' => $expected,
            'actual_check_digit'   => $actual,
            'error'                => $errMsg,
            'error_message'        => $errMsg,
            'verification_note'    => $isValid ? 'FORMAT_VALID — physical evidence still required' : 'FORMAT_INVALID — checksum mismatch',
        ];
    }

    public static function validateUPCA(string $digits): array
    {
        if (strlen($digits) !== 12) {
            return self::fail($digits, 'LENGTH_ERROR', 'UPC-A requires exactly 12 digits');
        }
        $sum = 0;
        for ($i = 0; $i < 11; $i++) {
            $sum += (int)$digits[$i] * ($i % 2 === 0 ? 3 : 1);
        }
        $expected = (10 - ($sum % 10)) % 10;
        $actual   = (int)$digits[11];
        $isValid  = ($expected === $actual);
        $errMsg   = $isValid ? null : "Checksum mismatch. Expected check digit {$expected}, got {$actual}.";
        return [
            'valid'                => $isValid,
            'barcode'              => $digits,
            'barcode_type'         => 'UPC-A',
            'digits'               => $digits,
            'check_digit'          => $actual,
            'expected_check_digit' => $expected,
            'actual_check_digit'   => $actual,
            'error'                => $errMsg,
            'error_message'        => $errMsg,
            'verification_note'    => $isValid ? 'FORMAT_VALID — physical evidence still required' : 'FORMAT_INVALID — checksum mismatch',
        ];
    }

    public static function validateGTIN14(string $digits): array
    {
        if (strlen($digits) !== 14) {
            return self::fail($digits, 'LENGTH_ERROR', 'GTIN-14 requires exactly 14 digits');
        }
        $sum = 0;
        for ($i = 0; $i < 13; $i++) {
            $sum += (int)$digits[$i] * ($i % 2 === 0 ? 3 : 1);
        }
        $expected = (10 - ($sum % 10)) % 10;
        $actual   = (int)$digits[13];
        $isValid  = ($expected === $actual);
        $errMsg   = $isValid ? null : "Checksum mismatch. Expected check digit {$expected}, got {$actual}.";
        return [
            'valid'                => $isValid,
            'barcode'              => $digits,
            'barcode_type'         => 'GTIN-14',
            'digits'               => $digits,
            'check_digit'          => $actual,
            'expected_check_digit' => $expected,
            'actual_check_digit'   => $actual,
            'error'                => $errMsg,
            'error_message'        => $errMsg,
            'verification_note'    => $isValid ? 'FORMAT_VALID — physical evidence still required' : 'FORMAT_INVALID — checksum mismatch',
        ];
    }

    public static function validateUPCE(string $digits): array
    {
        // UPC-E is 6 digits (compressed) — checksum requires expansion
        return [
            'valid'             => strlen($digits) === 6,
            'barcode'           => $digits,
            'barcode_type'      => 'UPC-E',
            'digits'            => $digits,
            'error'             => strlen($digits) === 6 ? null : 'UPC-E requires 6 digits',
            'error_message'     => strlen($digits) === 6 ? null : 'UPC-E requires 6 digits',
            'verification_note' => 'UPC-E expanded checksum not supported yet — FORMAT_ASSUMED',
        ];
    }

    private static function fail(string $raw, string $code, string $msg): array
    {
        return [
            'valid'             => false,
            'barcode'           => $raw,
            'barcode_type'      => 'UNKNOWN',
            'digits'            => $raw,
            'error_code'        => $code,
            'error'             => $msg,
            'error_message'     => $msg,
            'verification_note' => 'FORMAT_INVALID',
        ];
    }
}
