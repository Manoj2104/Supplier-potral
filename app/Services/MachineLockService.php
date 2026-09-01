<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * MachineLockService
 *
 * Generates a unique machine fingerprint based on hardware.
 * Stores trial usage in C:\ProgramData\INFYPOS\ (outside app folder).
 * Survives: DB delete, ZIP reinstall, app folder delete, device restart.
 * Only a full hardware change (new motherboard/HDD) changes the fingerprint.
 */
class MachineLockService
{
    // Stored OUTSIDE the app directory — survives reinstall
    protected static string $lockDir  = 'C:\\ProgramData\\INFYPOS';
    protected static string $lockFile = 'C:\\ProgramData\\INFYPOS\\machine.lock';

    protected static ?string $cachedMachineId = null;

    // ─────────────────────────────────────────────────────────────
    //  Generate Machine Fingerprint
    //  Uses: MAC address + Disk Serial + Motherboard Serial + Hostname
    // ─────────────────────────────────────────────────────────────
    public static function getMachineId(): string
    {
        if (self::$cachedMachineId !== null) {
            return self::$cachedMachineId;
        }

        $parts = [];

        try {
            // MAC Address (most stable identifier)
            $mac = shell_exec('getmac /fo csv /nh 2>nul');
            if ($mac) {
                preg_match('/([0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2})/i', $mac, $m);
                if (!empty($m[1])) $parts[] = $m[1];
            }

            // Disk Drive Serial Number
            $disk = shell_exec('wmic diskdrive get SerialNumber /format:csv 2>nul');
            if ($disk) {
                $lines = array_filter(array_map('trim', explode("\n", $disk)));
                foreach ($lines as $line) {
                    if (str_contains($line, ',') && !str_contains(strtolower($line), 'serialnumber')) {
                        $parts[] = trim(explode(',', $line)[1] ?? '');
                        break;
                    }
                }
            }

            // Motherboard / Baseboard Serial
            $mb = shell_exec('wmic baseboard get SerialNumber /format:csv 2>nul');
            if ($mb) {
                $lines = array_filter(array_map('trim', explode("\n", $mb)));
                foreach ($lines as $line) {
                    if (str_contains($line, ',') && !str_contains(strtolower($line), 'serialnumber')) {
                        $parts[] = trim(explode(',', $line)[1] ?? '');
                        break;
                    }
                }
            }

            // CPU ID
            $cpu = shell_exec('wmic cpu get ProcessorId /format:csv 2>nul');
            if ($cpu) {
                $lines = array_filter(array_map('trim', explode("\n", $cpu)));
                foreach ($lines as $line) {
                    if (str_contains($line, ',') && !str_contains(strtolower($line), 'processorid')) {
                        $parts[] = trim(explode(',', $line)[1] ?? '');
                        break;
                    }
                }
            }

            // Hostname as fallback
            $parts[] = gethostname();

        } catch (\Throwable $e) {
            Log::warning('MachineLockService: hardware fingerprint error', ['error' => $e->getMessage()]);
            $parts[] = gethostname() ?: 'unknown';
        }

        // Filter empty, combine, hash
        $fingerprint = implode('|', array_filter($parts));
        self::$cachedMachineId = hash('sha256', $fingerprint ?: 'fallback-' . gethostname());
        return self::$cachedMachineId;
    }

    // ─────────────────────────────────────────────────────────────
    //  Check if this machine has already used the trial.
    //  Checks BOTH:
    //    1. Local lock file C:\ProgramData\INFYPOS\machine.lock
    //    2. Central Supabase Cloud DB (saas_devices registry)
    // ─────────────────────────────────────────────────────────────
    public static function hasUsedTrial(?string $currentTrialEndsAt = null): bool
    {
        $machineId = self::getMachineId();

        // 1. Check Local Lock File
        if (file_exists(self::$lockFile)) {
            try {
                $data = json_decode(file_get_contents(self::$lockFile), true);
                if ($data && !empty($data['trial_used']) && isset($data['machine_id']) && strcasecmp($data['machine_id'], $machineId) === 0) {
                    return true;
                }
            } catch (\Throwable $e) {}
        }

        // 2. Check Central Cloud Database (Supabase Registry)
        try {
            $cloudCheck = \App\Services\CloudLicenseServerService::supabaseRequest('/saas_devices?machine_uuid=ilike.' . urlencode($machineId) . '&limit=1');
            if ($cloudCheck['success'] && !empty($cloudCheck['data'])) {
                // Also reconstruct local lock file for offline speed
                self::registerTrialUsed('Registered Client Store', null);
                return true;
            }
        } catch (\Throwable $e) {
            Log::warning('MachineLockService: cloud trial check failed', ['error' => $e->getMessage()]);
        }

        return false;
    }


    // ─────────────────────────────────────────────────────────────
    //  Register trial usage for this machine
    //  Called when trial starts for the first time
    //  Stores trial_ends_at so future checks can detect reinstalls
    // ─────────────────────────────────────────────────────────────
    public static function registerTrialUsed(string $companyName = '', ?string $trialEndsAt = null): bool
    {
        try {
            // Create directory if not exists
            if (!is_dir(self::$lockDir)) {
                mkdir(self::$lockDir, 0755, true);
            }

            $trialStarted = now()->toDateTimeString();
            $machineId    = self::getMachineId();

            $data = [
                'machine_id'     => $machineId,
                'trial_used'     => true,
                'trial_started'  => $trialStarted,
                'trial_ends_at'  => $trialEndsAt ?? '',   // ← stored for reinstall detection
                'company'        => $companyName,
                'app'            => 'INFY-POS',
                'version'        => '1.0',
                'checksum'       => '',
            ];

            // Add checksum
            $data['checksum'] = hash('sha256', $machineId . $trialStarted . 'INFYPOS-SECRET-KEY-2026');

            file_put_contents(self::$lockFile, json_encode($data, JSON_PRETTY_PRINT));

            // Make file hidden on Windows
            shell_exec('attrib +H +S "' . self::$lockFile . '" 2>nul');

            return true;
        } catch (\Throwable $e) {
            Log::error('MachineLockService: failed to write lock file', ['error' => $e->getMessage()]);
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  Get lock file data (for admin/debug use)
    // ─────────────────────────────────────────────────────────────
    public static function getLockData(): ?array
    {
        if (!file_exists(self::$lockFile)) return null;
        return json_decode(file_get_contents(self::$lockFile), true);
    }

    // ─────────────────────────────────────────────────────────────
    //  Remove lock (admin override — used when subscription is purchased)
    // ─────────────────────────────────────────────────────────────
    public static function clearLock(): bool
    {
        if (file_exists(self::$lockFile)) {
            shell_exec('attrib -H -S "' . self::$lockFile . '" 2>nul');
            return unlink(self::$lockFile);
        }
        return true;
    }

    // ─────────────────────────────────────────────────────────────
    //  Check integrity (detect tampering)
    // ─────────────────────────────────────────────────────────────
    public static function isLockIntact(): bool
    {
        if (!file_exists(self::$lockFile)) return true;

        try {
            $data = json_decode(file_get_contents(self::$lockFile), true);
            if (!$data) return false;

            $expected = hash('sha256',
                ($data['machine_id'] ?? '') .
                ($data['trial_started'] ?? '') .
                'INFYPOS-SECRET-KEY-2026'
            );

            return hash_equals($expected, $data['checksum'] ?? '');
        } catch (\Throwable $e) {
            return false;
        }
    }
}
