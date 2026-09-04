<?php

namespace App\Services;

use App\Models\Supplier;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;
use PDO;
use Throwable;

class SupplierSyncService
{
    private static function getSupabaseConfig(): array
    {
        return [
            'url' => rtrim(env('SUPABASE_URL', 'https://ejbygpiozuaomomshazl.supabase.co'), '/'),
            'secret_key' => env('SUPABASE_SECRET_KEY', ''),
            'db_host' => env('SUPABASE_DB_HOST', env('DB_HOST', 'db.ejbygpiozuaomomshazl.supabase.co')),
            'db_port' => env('SUPABASE_DB_PORT', env('DB_PORT', '5432')),
            'db_database' => env('SUPABASE_DB_DATABASE', env('DB_DATABASE', 'postgres')),
            'db_user' => env('SUPABASE_DB_USERNAME', env('DB_USERNAME', 'postgres')),
            'db_pass' => env('SUPABASE_DB_PASSWORD', env('DB_PASSWORD', '')),
        ];
    }

    private static function getSupabasePdo(): ?PDO
    {
        $cfg = self::getSupabaseConfig();
        try {
            $dsn = sprintf(
                'pgsql:host=%s;port=%s;dbname=%s;sslmode=require',
                $cfg['db_host'],
                $cfg['db_port'],
                $cfg['db_database']
            );
            return new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 6,
            ]);
        } catch (Throwable $e) {
            Log::warning('Supabase Direct PDO Connection failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Send HTTP request to Supabase Auth Admin API
     */
    private static function authAdminRequest(string $endpoint, string $method = 'GET', ?array $payload = null): array
    {
        $cfg = self::getSupabaseConfig();
        $url = $cfg['url'] . '/auth/v1/' . ltrim($endpoint, '/');

        $headers = [
            'apikey: ' . $cfg['secret_key'],
            'Authorization: Bearer ' . $cfg['secret_key'],
            'Content-Type: application/json',
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => strtoupper($method),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        if (!empty($payload)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if (!empty($error)) {
            throw new Exception("Supabase Auth API network error: $error");
        }

        $decoded = json_decode($response, true) ?? [];
        return [
            'status' => $httpCode,
            'data' => $decoded,
            'raw' => $response,
        ];
    }

    /**
     * Find existing Supabase Auth user by email
     */
    public static function findAuthUserByEmail(string $email): ?array
    {
        try {
            // First check via PDO in auth.users
            $pdo = self::getSupabasePdo();
            if ($pdo) {
                $stmt = $pdo->prepare('SELECT id, email, created_at FROM auth.users WHERE LOWER(email) = LOWER(:email) LIMIT 1');
                $stmt->execute([':email' => $email]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($user) {
                    return $user;
                }
            }

            // Fallback to Admin API
            $res = self::authAdminRequest('admin/users');
            if ($res['status'] === 200 && !empty($res['data']['users'])) {
                foreach ($res['data']['users'] as $u) {
                    if (strtolower($u['email'] ?? '') === strtolower($email)) {
                        return $u;
                    }
                }
            }
        } catch (Throwable $e) {
            Log::warning('SupplierSyncService::findAuthUserByEmail error: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Provision or link Supabase Auth user
     */
    public static function provisionAuthUser(Supplier $supplier, ?string $password = null): string
    {
        $email = strtolower(trim($supplier->email));

        // 1. Check if user already exists (Idempotent)
        $existing = self::findAuthUserByEmail($email);
        if ($existing && !empty($existing['id'])) {
            if (!empty($password)) {
                self::authAdminRequest("admin/users/{$existing['id']}", 'PUT', [
                    'password' => $password,
                ]);
            }
            return $existing['id'];
        }

        // 2. Create Auth user securely
        $supplierCode = 'SUP-' . str_pad($supplier->id, 5, '0', STR_PAD_LEFT);
        $userData = [
            'email' => $email,
            'email_confirm' => true,
            'user_metadata' => [
                'name' => $supplier->name,
                'supplier_code' => $supplierCode,
                'local_supplier_id' => $supplier->id,
            ],
        ];

        if (!empty($password)) {
            $userData['password'] = $password;
        } else {
            // Strong cryptographic random password
            $userData['password'] = bin2hex(random_bytes(16)) . '!A1';
        }

        $res = self::authAdminRequest('admin/users', 'POST', $userData);

        if ($res['status'] >= 200 && $res['status'] < 300 && !empty($res['data']['id'])) {
            return $res['data']['id'];
        }

        $errMsg = $res['data']['message'] ?? $res['data']['msg'] ?? $res['raw'] ?? 'Unknown Supabase error';
        throw new Exception("Supabase Auth provisioning failed ($errMsg)");
    }

    /**
     * Main Sync Function: Synchronizes local supplier to Supabase Auth & PostgreSQL
     */
    public static function syncSupplier(Supplier $supplier, ?string $password = null): array
    {
        try {
            $supplierCode = 'SUP-' . str_pad($supplier->id, 5, '0', STR_PAD_LEFT);

            // Step 1: Provision Supabase Auth User
            $authUserId = self::provisionAuthUser($supplier, $password);

            // Step 2: Upsert into Supabase suppliers table
            $pdo = self::getSupabasePdo();
            if (!$pdo) {
                throw new Exception('Cannot connect to Supabase PostgreSQL database');
            }

            // Check if supplier profile exists in Supabase by local_supplier_id or auth_user_id
            $checkStmt = $pdo->prepare('SELECT id FROM suppliers WHERE local_supplier_id = :local_id OR auth_user_id = :auth_id OR LOWER(email) = LOWER(:email) LIMIT 1');
            $checkStmt->execute([
                ':local_id' => $supplier->id,
                ':auth_id' => $authUserId,
                ':email' => $supplier->email,
            ]);
            $existingSupabaseSupplier = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingSupabaseSupplier) {
                $supabaseSupplierId = $existingSupabaseSupplier['id'];
                $updateStmt = $pdo->prepare('
                    UPDATE suppliers 
                    SET auth_user_id = :auth_id,
                        local_supplier_id = :local_id,
                        supplier_code = :supplier_code,
                        name = :name,
                        email = :email,
                        phone = :phone,
                        country = :country,
                        city = :city,
                        address = :address,
                        company_name = :company_name,
                        status = :status,
                        updated_at = NOW()
                    WHERE id = :id
                ');
                $updateStmt->execute([
                    ':id' => $supabaseSupplierId,
                    ':auth_id' => $authUserId,
                    ':local_id' => $supplier->id,
                    ':supplier_code' => $supplierCode,
                    ':name' => $supplier->name,
                    ':email' => $supplier->email,
                    ':phone' => $supplier->phone,
                    ':country' => $supplier->country ?? 'India',
                    ':city' => $supplier->city ?? '',
                    ':address' => $supplier->address ?? '',
                    ':company_name' => $supplier->name,
                    ':status' => 'active',
                ]);
            } else {
                $insertStmt = $pdo->prepare('
                    INSERT INTO suppliers (
                        auth_user_id, local_supplier_id, supplier_code, name, email, phone, 
                        country, city, address, company_name, status, created_at, updated_at
                    ) VALUES (
                        :auth_id, :local_id, :supplier_code, :name, :email, :phone,
                        :country, :city, :address, :company_name, :status, NOW(), NOW()
                    ) RETURNING id
                ');
                $insertStmt->execute([
                    ':auth_id' => $authUserId,
                    ':local_id' => $supplier->id,
                    ':supplier_code' => $supplierCode,
                    ':name' => $supplier->name,
                    ':email' => $supplier->email,
                    ':phone' => $supplier->phone,
                    ':country' => $supplier->country ?? 'India',
                    ':city' => $supplier->city ?? '',
                    ':address' => $supplier->address ?? '',
                    ':company_name' => $supplier->name,
                    ':status' => 'active',
                ]);
                $supabaseSupplierId = $insertStmt->fetchColumn();
            }

            // Step 2b: Upsert into Supabase supplier_portals table so SupplierAuthController can authenticate immediately
            try {
                $checkPortalStmt = $pdo->prepare('SELECT id FROM supplier_portals WHERE supplier_id = :sup_id OR LOWER(username) = LOWER(:email) LIMIT 1');
                $checkPortalStmt->execute([
                    ':sup_id' => $supabaseSupplierId,
                    ':email' => $supplier->email,
                ]);
                $existingPortal = $checkPortalStmt->fetch(PDO::FETCH_ASSOC);

                $rawPass = preg_replace('/[^0-9]/', '', $supplier->phone) ?: '12345678';
                $hashedPass = \Illuminate\Support\Facades\Hash::make($rawPass);

                if ($existingPortal) {
                    $updatePortalStmt = $pdo->prepare('
                        UPDATE supplier_portals 
                        SET supplier_code = :supplier_code,
                            phone = :phone,
                            status = \'active\',
                            kyc_status = \'verified\',
                            updated_at = NOW()
                        WHERE id = :id
                    ');
                    $updatePortalStmt->execute([
                        ':id' => $existingPortal['id'],
                        ':supplier_code' => $supplierCode,
                        ':phone' => $supplier->phone,
                    ]);
                } else {
                    $insertPortalStmt = $pdo->prepare('
                        INSERT INTO supplier_portals (
                            supplier_id, username, password, supplier_code, phone,
                            status, kyc_status, created_at, updated_at
                        ) VALUES (
                            :supplier_id, :username, :password, :supplier_code, :phone,
                            \'active\', \'verified\', NOW(), NOW()
                        )
                    ');
                    $insertPortalStmt->execute([
                        ':supplier_id' => $supabaseSupplierId,
                        ':username' => strtolower($supplier->email),
                        ':password' => $hashedPass,
                        ':supplier_code' => $supplierCode,
                        ':phone' => $supplier->phone,
                    ]);
                }
            } catch (Throwable $pe) {
                Log::warning('SupplierSyncService: Could not sync supplier_portals table: ' . $pe->getMessage());
            }

            // Step 3: Update local MySQL record with sync state
            $supplier->update([
                'supabase_user_id' => $authUserId,
                'sync_status' => 'synced',
                'sync_error' => null,
                'last_synced_at' => Carbon::now(),
            ]);

            return [
                'success' => true,
                'supabase_supplier_id' => $supabaseSupplierId,
                'auth_user_id' => $authUserId,
                'sync_status' => 'synced',
            ];

        } catch (Throwable $e) {
            Log::error('SupplierSyncService::syncSupplier failed for Supplier #' . $supplier->id . ': ' . $e->getMessage());

            // Mark failure locally without breaking or losing local record
            $supplier->update([
                'sync_status' => 'failed',
                'sync_error' => substr($e->getMessage(), 0, 500),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'sync_status' => 'failed',
            ];
        }
    }
}
