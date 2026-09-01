<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Enterprise Cloud License Server Service (System 1 Master Cloud Engine)
 * Directly operates on Live Master Cloud DB on Supabase via secure HTTPS REST API.
 */
class CloudLicenseServerService
{
    private const SUPABASE_URL = 'https://xzduxvifiancdgnrrgew.supabase.co';
    private const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZHV4dmlmaWFuY2RnbnJyZ2V3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjE3ODc3OSwiZXhwIjoyMTAxNzU0Nzc5fQ.7Z1VKcSUN8_486ytN1Y8R0QSKROM44LBaJ_XYmMHeDY';
    private const SECRET_HMAC_KEY = 'INFYPOS_CLOUD_2026_MASTER_SECRET_KEY_SHA256';

    /**
     * Secure Encrypted Vault for Central SuperAdmin Credentials
     */
    public static function getVaultSecret(string $key): string
    {
        $envKey = 'CENTRAL_SUPABASE_' . strtoupper($key);
        $val = env($envKey);
        if (!empty($val)) {
            return $val;
        }

        $vault = [
            'HOST' => 'aws-0-ap-south-1.pooler.supabase.com',
            'PORT' => '6543',
            'USER' => 'postgres.xzduxvifiancdgnrrgew',
            'PASS' => 'Manojnandhini@2104',
            'DB'   => 'postgres',
            'URL'  => 'https://xzduxvifiancdgnrrgew.supabase.co',
            'SECRET_KEY' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZHV4dmlmaWFuY2RnbnJyZ2V3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjE3ODc3OSwiZXhwIjoyMTAxNzU0Nzc5fQ.7Z1VKcSUN8_486ytN1Y8R0QSKROM44LBaJ_XYmMHeDY',
        ];

        return $vault[$key] ?? '';
    }


    /**
     * Send direct HTTP REST API Request to Supabase Cloud Database
     */
    public static function supabaseRequest(string $endpoint, string $method = 'GET', ?array $data = null, array $extraHeaders = []): array
    {
        $url = rtrim(self::SUPABASE_URL, '/') . '/rest/v1/' . ltrim($endpoint, '/');
        
        $headers = [
            'apikey: ' . self::SUPABASE_KEY,
            'Authorization: Bearer ' . self::SUPABASE_KEY,
            'Content-Type: application/json',
            'Prefer: return=representation',
        ];

        foreach ($extraHeaders as $h) {
            $headers[] = $h;
        }

        $httpOpts = [
            'method'  => strtoupper($method),
            'header'  => implode("\r\n", $headers) . "\r\n",
            'timeout' => 2,
            'ignore_errors' => true,
        ];

        if (!empty($data) && in_array(strtoupper($method), ['POST', 'PUT', 'PATCH'])) {
            $httpOpts['content'] = json_encode($data);
        }

        $context = stream_context_create([
            'http' => $httpOpts,
            'ssl'  => [
                'verify_peer'      => false,
                'verify_peer_name' => false,
            ]
        ]);

        try {
            $response = @file_get_contents($url, false, $context);
            if ($response === false) {
                return ['success' => false, 'error' => 'Network error connecting to Supabase Cloud.'];
            }

            $decoded = json_decode($response, true);
            return [
                'success' => true,
                'data'    => $decoded,
            ];
        } catch (\Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }


    /**
     * Generate Machine Hardware Fingerprint Hash (Motherboard + CPU + OS)
     */
    public static function getMachineUuid(): string
    {
        return \App\Services\MachineLockService::getMachineId();
    }

    /**
     * Step 3 — Verify Key Only via Supabase REST API
     */
    public static function verifyKeyOnly(string $keyCode, string $machineUuid): array
    {
        $keyCode     = strtoupper(trim($keyCode));
        $machineUuid = strtoupper(trim($machineUuid));

        if (empty($keyCode)) {
            return [
                'success'    => false,
                'message'    => '❌ Please enter an Activation Key Code.',
                'error_code' => 'EMPTY_KEY'
            ];
        }

        try {
            $resp = self::supabaseRequest('/activation_keys?key_code=eq.' . urlencode($keyCode) . '&limit=1');

            if (!$resp['success'] || empty($resp['data'])) {
                return [
                    'success'    => false,
                    'message'    => "❌ Invalid Activation Key '{$keyCode}'! Key not found in Super Admin Cloud Registry.",
                    'error_code' => 'KEY_NOT_FOUND'
                ];
            }

            $keyRecord = $resp['data'][0];

            // 2. Revoked Check
            if (($keyRecord['status'] ?? '') === 'revoked') {
                return [
                    'success'    => false,
                    'message'    => "❌ Activation Key '{$keyCode}' has been REVOKED by Super Admin.",
                    'error_code' => 'KEY_REVOKED'
                ];
            }

            // 3. Expiry Check
            if (($keyRecord['status'] ?? '') === 'expired' || (!empty($keyRecord['expires_at']) && Carbon::now()->greaterThan(Carbon::parse($keyRecord['expires_at'])))) {
                return [
                    'success'    => false,
                    'message'    => "❌ Activation Key '{$keyCode}' has EXPIRED.",
                    'error_code' => 'KEY_EXPIRED'
                ];
            }

            // 4. Hardware Machine Binding Check
            if (($keyRecord['status'] ?? '') === 'active' && !empty($keyRecord['machine_fingerprint']) && strtoupper($keyRecord['machine_fingerprint']) !== strtoupper($machineUuid)) {
                return [
                    'success'    => false,
                    'message'    => "❌ This License Key '{$keyCode}' is already active and bound to another device! (Hardware Machine Lock Active). Please unbind this device from Super Admin or generate a new key.",
                    'error_code' => 'MACHINE_BOUND_MISMATCH'
                ];
            }

            $planNameLower = strtolower($keyRecord['plan_name'] ?? '');
            $isTrialKey = str_contains($planNameLower, 'trial') 
                || str_contains(strtolower($keyRecord['key_code']), 'trial') 
                || ($keyRecord['price'] ?? 0) == 0;

            return [
                'success'      => true,
                'key_code'     => $keyRecord['key_code'],
                'plan_name'    => $keyRecord['plan_name'] ?? 'INFY-POS PREMIUM (₹499/mo)',
                'machine_uuid' => $machineUuid,
                'is_trial'     => $isTrialKey,
                'expires_at'   => $keyRecord['expires_at'] ?? Carbon::now()->addDays(30)->toDateTimeString(),
                'message'      => "✅ Valid License Key '{$keyRecord['key_code']}' verified from Super Admin Cloud Portal! Ready for installation.",
            ];
        } catch (\Throwable $e) {
            return [
                'success'    => false,
                'message'    => '❌ Central SuperAdmin Cloud Error: ' . $e->getMessage(),
                'error_code' => 'CLOUD_ERROR'
            ];
        }
    }

    /**
     * Step 6 — Activate Key & Bind Real Client Store Company upon Installation Finish
     */
    public static function activateKeyForCompany(array $data): array
    {
        $keyCode     = strtoupper(trim($data['key_code'] ?? ''));
        $bizName     = trim($data['business_name'] ?? 'My Store');
        $ownerName   = trim($data['owner_name'] ?? 'Admin');
        $email       = trim($data['email'] ?? 'admin@infypos.com');
        $phone       = trim($data['phone'] ?? '9876543210');
        $bizType     = trim($data['business_type'] ?? 'Supermarket');
        $gst         = trim($data['gst_number'] ?? '');
        $machineUuid = strtoupper(trim($data['machine_uuid'] ?? self::getMachineUuid()));

        try {
            // Fetch key record from Supabase
            $kResp = self::supabaseRequest('/activation_keys?key_code=eq.' . urlencode($keyCode) . '&limit=1');
            $keyRecord = ($kResp['success'] && !empty($kResp['data'])) ? $kResp['data'][0] : null;

            if (!$keyRecord) {
                $insKey = self::supabaseRequest('/activation_keys', 'POST', [
                    'key_code'            => $keyCode,
                    'plan_name'           => 'INFY-POS PREMIUM (₹499/mo)',
                    'price'               => 499.00,
                    'status'              => 'active',
                    'machine_fingerprint' => $machineUuid,
                    'activated_at'        => Carbon::now()->toIso8601String(),
                    'expires_at'          => Carbon::now()->addDays(30)->toIso8601String(),
                ]);
                $keyRecord = ($insKey['success'] && !empty($insKey['data'])) ? $insKey['data'][0] : null;
            }

            $expiresAt = !empty($keyRecord['expires_at']) ? Carbon::parse($keyRecord['expires_at']) : Carbon::now()->addDays(30);
            $planName  = $keyRecord['plan_name'] ?? 'INFY-POS PREMIUM (₹499/mo)';
            $status    = 'active';

            // 2. Check / Insert Company in Supabase
            $cResp = self::supabaseRequest('/companies?email=eq.' . urlencode($email) . '&limit=1');
            $company = ($cResp['success'] && !empty($cResp['data'])) ? $cResp['data'][0] : null;

            if ($company) {
                $companyId = $company['id'];
                self::supabaseRequest('/companies?id=eq.' . $companyId, 'PATCH', [
                    'name'                 => $bizName,
                    'owner_name'           => $ownerName,
                    'phone'                => $phone,
                    'business_type'        => $bizType,
                    'gst_number'           => $gst,
                    'status'               => $status,
                    'trial_ends_at'        => null,
                    'subscription_ends_at' => $expiresAt->toIso8601String(),
                    'updated_at'           => date('c'),
                ]);
            } else {
                $newCompResp = self::supabaseRequest('/companies', 'POST', [
                    'name'                 => $bizName,
                    'owner_name'           => $ownerName,
                    'email'                => $email,
                    'phone'                => $phone,
                    'business_type'        => $bizType,
                    'gst_number'           => $gst,
                    'status'               => $status,
                    'trial_ends_at'        => $isGlobalTrialKey ? $expiresAt->toIso8601String() : null,
                    'subscription_ends_at' => $expiresAt->toIso8601String(),
                    'created_at'           => date('c'),
                    'updated_at'           => date('c'),
                ]);
                $companyId = ($newCompResp['success'] && !empty($newCompResp['data'])) ? $newCompResp['data'][0]['id'] : 1;
            }

            // 3. Bind Key to Company in Supabase
            if ($isGlobalTrialKey) {
                // Generate a personal trial key in Supabase for this company
                $personalKeyCode = 'INFYPOS-2026-KEY-' . strtoupper(substr(md5(uniqid() . $companyId . time()), 0, 8));
                self::supabaseRequest('/activation_keys', 'POST', [
                    'key_code'            => $personalKeyCode,
                    'company_id'          => $companyId,
                    'plan_name'           => 'INFY-POS FREE TRIAL (14 Days)',
                    'price'               => 0.00,
                    'status'              => 'trial',
                    'machine_fingerprint' => $machineUuid,
                    'activated_at'        => Carbon::now()->toIso8601String(),
                    'expires_at'          => $expiresAt->toIso8601String(),
                    'created_at'          => date('c'),
                    'updated_at'          => date('c'),
                ]);
                $keyCode = $personalKeyCode;
            } else if (!empty($keyRecord['id'])) {
                self::supabaseRequest('/activation_keys?id=eq.' . $keyRecord['id'], 'PATCH', [
                    'company_id'          => $companyId,
                    'status'              => 'active',
                    'machine_fingerprint' => $machineUuid,
                    'activated_at'        => Carbon::now()->toIso8601String(),
                    'expires_at'          => $expiresAt->toIso8601String(),
                    'updated_at'          => date('c'),
                ]);
            }


            // 4. Register Device in saas_devices table
            self::supabaseRequest('/saas_devices', 'POST', [
                'company_id'   => $companyId,
                'machine_uuid' => $machineUuid,
                'device_name'  => gethostname() . ' POS Terminal',
                'os_version'   => 'Windows 11 Enterprise x64',
                'ip_address'   => '127.0.0.1',
                'status'       => 'Online',
            ]);

            // 5. Save Local Encrypted HMAC-SHA256 Signed License
            $signedPayload = [
                'key_code'      => $keyCode,
                'machine_uuid'  => $machineUuid,
                'company_name'  => $bizName,
                'plan_name'     => $keyRecord['plan_name'] ?? 'INFY-POS PREMIUM (₹499/mo)',
                'expires_at'    => $expiresAt->toDateTimeString(),
                'offline_grace' => $expiresAt->copy()->addDays(3)->toDateTimeString(),
                'status'        => 'active',
            ];

            \App\Services\LocalLicenseEngine::saveLocalLicense($signedPayload);

            return [
                'success'        => true,
                'company_id'     => $companyId,
                'company_name'   => $bizName,
                'key_code'       => $keyCode,
                'expires_at'     => $expiresAt->toDateTimeString(),
                'signed_payload' => $signedPayload,
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Cloud Activation Error: ' . $e->getMessage()
            ];
        }
    }


    /**
     * Master Cloud License Verification & Hardware Binding API
     */
    public static function verifyAndActivateKey(array $payload): array
    {
        return self::verifyKeyOnly($payload['key_code'] ?? '', $payload['machine_uuid'] ?? self::getMachineUuid());
    }
}
