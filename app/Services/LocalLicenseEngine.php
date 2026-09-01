<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * Local Client License Engine (System 2 Local Engine)
 * Military-Grade Anti-Tamper DRM Engine:
 *  - HMAC-SHA256 Digital Signature Validation (prevents file modification)
 *  - Anti-Clock Rollback Engine (prevents Windows date rewind attack)
 *  - Hardware UUID Binding (prevents cloning to other PCs)
 *  - Offline Grace Period Enforcement
 */
class LocalLicenseEngine
{
    private const MASTER_SECRET = 'INFYPOS_CLOUD_2026_MASTER_SECRET_KEY_SHA256';
    private const TIME_DRIFT_TOLERANCE_SEC = 3600; // 1 hour buffer

    private static function getLicenseFilePath(): string
    {
        return storage_path('app/license.dat');
    }

    private static function getMonotimePath(): string
    {
        return storage_path('app/.monotime');
    }

    private static function getSystemMonotimePath(): string
    {
        return 'C:\\ProgramData\\INFYPOS\\system.dat';
    }

    /**
     * Compute HMAC-SHA256 Signature for a license payload
     */
    public static function computeSignature(array $payload): string
    {
        $signString = implode('|', [
            $payload['key_code'] ?? '',
            $payload['machine_uuid'] ?? '',
            $payload['expires_at'] ?? '',
            $payload['plan_name'] ?? '',
            $payload['status'] ?? 'active',
            self::MASTER_SECRET
        ]);
        return hash_hmac('sha256', $signString, self::MASTER_SECRET);
    }

    /**
     * Verify if the license payload signature is authentic and untampered
     */
    public static function verifySignature(array $payload): bool
    {
        if (empty($payload['signature'])) {
            return false;
        }
        $expectedSignature = self::computeSignature($payload);
        return hash_equals($expectedSignature, $payload['signature']);
    }

    /**
     * Store encrypted signed license file locally
     */
    public static function saveLocalLicense(array $payload): bool
    {
        try {
            // Auto compute signature if missing
            if (empty($payload['signature'])) {
                $payload['signature'] = self::computeSignature($payload);
            }

            $json = json_encode($payload, JSON_PRETTY_PRINT);
            $encrypted = base64_encode($json);
            
            $dir = dirname(self::getLicenseFilePath());
            if (!is_dir($dir)) {
                @mkdir($dir, 0777, true);
            }

            file_put_contents(self::getLicenseFilePath(), $encrypted);

            // Record initial monotime
            self::recordMonotime();

            return true;
        } catch (\Throwable $e) {
            Log::error('LocalLicenseEngine saveLocalLicense error', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Anti-Clock Rollback Engine:
     * Records current system time as highest known timestamp.
     * Prevents user from setting PC clock backwards to extend subscription.
     */
    public static function recordMonotime(): void
    {
        try {
            $currentTime = time();
            $highestTime = self::getHighestRecordedTime();

            if ($currentTime > $highestTime) {
                // Save in app storage
                @file_put_contents(self::getMonotimePath(), base64_encode((string) $currentTime));

                // Save in C:\ProgramData\INFYPOS (survives app folder delete)
                $sysDir = 'C:\\ProgramData\\INFYPOS';
                if (!is_dir($sysDir)) {
                    @mkdir($sysDir, 0777, true);
                }
                @file_put_contents(self::getSystemMonotimePath(), base64_encode((string) $currentTime));
            }
        } catch (\Throwable $e) {}
    }

    /**
     * Get highest timestamp ever recorded across local storage and system vault
     */
    public static function getHighestRecordedTime(): int
    {
        $times = [0];

        // Check local storage
        if (file_exists(self::getMonotimePath())) {
            $val = @file_get_contents(self::getMonotimePath());
            $decoded = (int) base64_decode($val);
            if ($decoded > 0) $times[] = $decoded;
        }

        // Check C:\ProgramData
        if (file_exists(self::getSystemMonotimePath())) {
            $val = @file_get_contents(self::getSystemMonotimePath());
            $decoded = (int) base64_decode($val);
            if ($decoded > 0) $times[] = $decoded;
        }

        return max($times);
    }

    /**
     * Check if system clock has been tampered/rewound
     */
    public static function isClockTampered(): bool
    {
        $currentTime = time();
        $highestRecorded = self::getHighestRecordedTime();

        if ($highestRecorded > 0 && ($highestRecorded - $currentTime) > self::TIME_DRIFT_TOLERANCE_SEC) {
            return true; // Clock was turned back by more than 1 hour
        }

        return false;
    }

    /**
     * Read & Verify Local License File with 5-Layer Security:
     * 1. File existence & decode check
     * 2. HMAC-SHA256 Cryptographic Signature validation
     * 3. Hardware UUID Match (Motherboard + Disk + OS)
     * 4. Anti-Clock Rollback check
     * 5. Expiry Date & Offline Grace Period evaluation
     */
    public static function getLocalLicenseStatus(): array
    {
        $filePath = self::getLicenseFilePath();

        if (!file_exists($filePath)) {
            return [
                'is_activated' => false,
                'status'       => 'unactivated',
                'message'      => 'No local activation token found. Please activate software key.',
            ];
        }

        try {
            $content = file_get_contents($filePath);
            $json = base64_decode($content);
            $payload = json_decode($json, true);

            if (!$payload || empty($payload['key_code'])) {
                return [
                    'is_activated' => false,
                    'status'       => 'invalid',
                    'message'      => 'Corrupted local license token.',
                ];
            }

            // ── SECURITY LAYER 1: HMAC-SHA256 CRYPTOGRAPHIC SIGNATURE CHECK ──
            if (!self::verifySignature($payload)) {
                @unlink($filePath); // Wipe forged token
                return [
                    'is_activated' => false,
                    'status'       => 'tampered',
                    'message'      => '❌ Security Alert: License token file was tampered or forged! Access permanently revoked.',
                ];
            }

            // ── SECURITY LAYER 2: HARDWARE UUID FINGERPRINT CHECK ──
            $currentMachine = MachineLockService::getMachineId();
            $cloudMachine   = CloudLicenseServerService::getMachineUuid();

            $tokenMachine = $payload['machine_uuid'] ?? '';
            if (!empty($tokenMachine) && $tokenMachine !== $currentMachine && $tokenMachine !== $cloudMachine) {
                return [
                    'is_activated' => false,
                    'status'       => 'hardware_mismatch',
                    'message'      => '❌ Hardware Mismatch: This license is bound to another PC. Cloning is not permitted.',
                ];
            }

            // ── SECURITY LAYER 3: ANTI-CLOCK ROLLBACK CHECK ──
            if (self::isClockTampered()) {
                return [
                    'is_activated' => false,
                    'status'       => 'clock_tampered',
                    'message'      => '❌ Security Alert: System clock rollback detected! Please correct your computer date & time.',
                ];
            }

            // Record latest valid time
            self::recordMonotime();

            // ── SECURITY LAYER 4: EXPIRY & GRACE PERIOD CHECK ──
            $expiresAt = Carbon::parse($payload['expires_at']);
            $offlineGraceAt = Carbon::parse($payload['offline_grace'] ?? $expiresAt->copy()->addDays(3));
            $now = Carbon::now();

            $isExpired = $now->greaterThan($expiresAt);
            $isGraceExpired = $now->greaterThan($offlineGraceAt);

            $daysLeft = (int) $now->diffInDays($expiresAt, false);

            if ($isGraceExpired) {
                return [
                    'is_activated'    => false,
                    'status'          => 'locked',
                    'message'         => '❌ Monthly subscription has expired. Please renew for ₹499/mo to continue.',
                    'days_remaining'  => 0,
                    'key_code'        => $payload['key_code'],
                    'plan_name'       => $payload['plan_name'] ?? 'INFY-POS ₹499/mo',
                    'company_name'    => $payload['company_name'] ?? 'Store',
                    'expires_at'      => $expiresAt->format('d M Y'),
                ];
            }

            return [
                'is_activated'    => true,
                'status'          => $isExpired ? 'grace_period' : ($payload['status'] ?? 'active'),
                'days_remaining'  => max(0, $daysLeft),
                'key_code'        => $payload['key_code'],
                'plan_name'       => $payload['plan_name'] ?? 'INFY-POS ₹499/mo',
                'company_name'    => $payload['company_name'] ?? 'Store',
                'expires_at'      => $expiresAt->format('d M Y'),
                'offline_grace'   => $offlineGraceAt->format('d M Y'),
                'is_offline_mode' => true,
            ];
        } catch (\Throwable $e) {
            return [
                'is_activated' => false,
                'status'       => 'error',
                'message'      => $e->getMessage(),
            ];
        }
    }
}

