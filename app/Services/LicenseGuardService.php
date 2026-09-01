<?php

namespace App\Services;

class LicenseGuardService
{
    private static ?string $cachedGuid = null;
    private static ?array $cachedValidation = null;
    private static int $lastValidationTime = 0;
    private static ?string $cachedToken = null;
    private static int $lastTokenTime = 0;

    private const PUBLIC_KEY_PEM = "-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArmMzMZXbsIPVaSz43ERI
i52sSaoWmPT3h6fH2UIb6nMTAsTchW786mrYSN3yTbjij/HW0rhcmb2//fEz/XWx
ECcYILdOnZ6T+q2Dehi5297N/gHUVK33Xl0w9FqdZWzBe32tfYE+1J28VQUcdaaC
h45yHJwqvFuMisArS0JbbosFl8A+iRtroURlgpMLoht7i3Jae7Xr2wVA2bg5c3RM
bdcrbeoxKYL4ZrvipmpE6DPn1OyHRjtIsCm2KaKlqyNTydFav9pBckve4jCoYWJO
FqpJQbjhxVqPuJm+AkjRv2d7TK+c+58BlW74NN5a5+fpYyuT2r9i+rSoVy0oNPRR
KwIDAQAB
-----END PUBLIC KEY-----";

    /**
     * Authoritatively validates the local machine licensing state in PHP.
     */
    public static function validate(): array
    {
        $now = time();
        if (self::$cachedValidation !== null && ($now - self::$lastValidationTime) < 30) {
            return self::$cachedValidation;
        }

        try {
            $token = self::getLicenseToken();

            if (empty($token)) {
                return [
                    'valid' => false,
                    'error_code' => 'MISSING_LICENSE',
                    'message' => 'No active license token found on this machine.'
                ];
            }

            $parts = explode('.', $token);
            if (count($parts) !== 2) {
                return ['valid' => false, 'error_code' => 'TOKEN_FORMAT_INVALID', 'message' => 'Invalid license token format.'];
            }

            $payloadJson = base64_decode(strtr($parts[0], '-_', '+/'));
            $signature   = base64_decode(strtr($parts[1], '-_', '+/'));

            $ok = openssl_verify($payloadJson, $signature, self::PUBLIC_KEY_PEM, OPENSSL_ALGO_SHA256);
            if ($ok !== 1) {
                return ['valid' => false, 'error_code' => 'SIGNATURE_INVALID', 'message' => 'License cryptographic signature verification failed. Token was modified or forged.'];
            }

            $claims = json_decode($payloadJson, true);
            if (!$claims) {
                return ['valid' => false, 'error_code' => 'TOKEN_PARSE_ERROR', 'message' => 'Corrupted license claims.'];
            }

            // 1. Verify Device Identity Match
            $currentGuid = self::getLocalMachineGuid();
            if (!empty($claims['device_binding']) && !empty($currentGuid)) {
                if (stripos($claims['device_binding'], $currentGuid) === false && stripos($currentGuid, $claims['device_binding']) === false) {
                    return [
                        'valid' => false,
                        'error_code' => 'DEVICE_MISMATCH',
                        'message' => 'This license is bound to another hardware device and cannot run on this machine.'
                    ];
                }
            }

            // 2. Status check
            $status = strtolower($claims['status'] ?? 'active');
            if ($status !== 'active' && $status !== 'trial') {
                return [
                    'valid' => false,
                    'error_code' => 'LICENSE_' . strtoupper($status),
                    'message' => "License is {$status}. Access blocked."
                ];
            }

            // 3. Clock Rollback Detection (Monotonic Time Tracker)
            $now = time();
            $lastTrustedTime = self::getHighestRecordedTime();
            $issuedAt = (int)($claims['issued_at'] ?? 0);

            if (($issuedAt > 0 && $now < ($issuedAt - 300)) || ($lastTrustedTime > 0 && $now < ($lastTrustedTime - 3600))) {
                return [
                    'valid' => false,
                    'error_code' => 'CLOCK_ROLLBACK_DETECTED',
                    'message' => 'System clock rollback detected! Please correct your computer date & time.'
                ];
            }
            self::recordMonotime($now);

            // 4. Expiry verification
            $grace = ($claims['grace_days'] ?? 7) * 86400;
            $expiresAt = (int)($claims['expires_at'] ?? 0);
            if ($expiresAt > 0 && $now > ($expiresAt + $grace)) {
                return [
                    'valid' => false,
                    'error_code' => 'LICENSE_EXPIRED',
                    'message' => 'Your INFY-POS license has expired. Please renew your subscription.'
                ];
            }

            $result = [
                'valid' => true,
                'status' => $status,
                'claims' => $claims
            ];
            self::$cachedValidation = $result;
            self::$lastValidationTime = $now;

            return $result;

        } catch (\Throwable $e) {
            return ['valid' => false, 'error_code' => 'VALIDATION_EXCEPTION', 'message' => $e->getMessage()];
        }
    }

    public static function getLocalMachineGuid(): string
    {
        if (self::$cachedGuid !== null) {
            return self::$cachedGuid;
        }

        try {
            $output = @shell_exec('reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography" /v MachineGuid');
            if ($output && preg_match('/MachineGuid\s+REG_SZ\s+([a-zA-Z0-9\-]+)/i', $output, $m)) {
                self::$cachedGuid = strtolower(trim($m[1]));
                return self::$cachedGuid;
            }
        } catch (\Throwable $e) {}

        self::$cachedGuid = strtolower('win-' . gethostname());
        return self::$cachedGuid;
    }

    private static function getStoragePath(string $subpath = ''): string
    {
        if (function_exists('storage_path')) {
            return storage_path($subpath);
        }
        return realpath(__DIR__ . '/../../storage') . ($subpath ? '/' . ltrim($subpath, '/\\') : '');
    }

    private static function getLicenseToken(): ?string
    {
        $now = time();
        if (self::$cachedToken !== null && ($now - self::$lastTokenTime) < 30) {
            return self::$cachedToken;
        }

        $tokenFile = 'C:/ProgramData/INFY-POS Enterprise/license.token';
        if (file_exists($tokenFile)) {
            $content = trim(file_get_contents($tokenFile));
            if (!empty($content)) {
                self::$cachedToken = $content;
                self::$lastTokenTime = $now;
                return $content;
            }
        }

        // Check storage directory
        $storageFile = self::getStoragePath('license/license.token');
        if (file_exists($storageFile)) {
            $content = trim(file_get_contents($storageFile));
            if (!empty($content)) {
                self::$cachedToken = $content;
                self::$lastTokenTime = $now;
                return $content;
            }
        }

        return null;
    }

    private static function getHighestRecordedTime(): int
    {
        $times = [0];
        $paths = [
            self::getStoragePath('framework/cache/timetrack.dat'),
            'C:/ProgramData/INFY-POS Enterprise/timetrack_php.dat'
        ];
        foreach ($paths as $path) {
            if (file_exists($path)) {
                $val = (int)trim(@file_get_contents($path));
                if ($val > 0) $times[] = $val;
            }
        }
        return max($times);
    }

    public static function recordMonotime(int $timestamp = null): void
    {
        $now = $timestamp ?: time();
        $highest = self::getHighestRecordedTime();
        if ($now >= $highest) {
            $paths = [
                self::getStoragePath('framework/cache/timetrack.dat'),
                'C:/ProgramData/INFY-POS Enterprise/timetrack_php.dat'
            ];
            foreach ($paths as $path) {
                @mkdir(dirname($path), 0777, true);
                @file_put_contents($path, (string)$now);
            }
        }
    }
}
