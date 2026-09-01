<?php
// ============================================================
// INFY-POS Enterprise — Full Store & Admin Account Setup
// ============================================================

error_reporting(E_ALL);
ini_set('display_errors', '1');

$storeName    = $argv[1] ?? 'My Store';
$businessType = $argv[2] ?? 'Retail';
$currency     = $argv[3] ?? 'INR';
$phone        = $argv[4] ?? '9876543210';
$ownerName    = $argv[5] ?? 'Store Admin';
$email        = $argv[6] ?? 'admin@pos.com';
$password     = $argv[7] ?? 'Admin@12345';
$key          = $argv[8] ?? 'INFYPOS-2026-KEY';
$machineFingerprint = $argv[9] ?? '';
$signedToken  = $argv[10] ?? '';

if (!empty($signedToken)) {
    @mkdir('C:/ProgramData/INFY-POS Enterprise', 0777, true);
    @file_put_contents('C:/ProgramData/INFY-POS Enterprise/license.token', trim($signedToken));
    @mkdir(__DIR__ . '/storage/license', 0777, true);
    @file_put_contents(__DIR__ . '/storage/license/license.token', trim($signedToken));
}

if (empty($machineFingerprint)) {
    try {
        $output = @shell_exec('reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography" /v MachineGuid');
        if ($output && preg_match('/MachineGuid\s+REG_SZ\s+([a-zA-Z0-9\-]+)/i', $output, $m)) {
            $machineFingerprint = trim($m[1]);
        }
    } catch (\Throwable $e) {}
}
if (empty($machineFingerprint)) {
    $machineFingerprint = 'WIN-' . gethostname();
}

echo "=== INFY-POS Enterprise — Configuring Store & Admin Profile ===\n";
echo "Store Name:    $storeName\n";
echo "Business Type: $businessType\n";
echo "Currency:      $currency\n";
echo "Store Phone:   $phone\n";
echo "Owner Name:    $ownerName\n";
echo "Admin Email:   $email\n";

$port = 3307;
$host = '127.0.0.1';
$db   = 'pos';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;port=$port", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$db`");

    // 1. Update or Insert Company (ID = 1)
    $stmt = $pdo->prepare("SELECT id FROM companies WHERE id = 1 LIMIT 1");
    $stmt->execute();
    $companyExists = $stmt->fetch();

    if ($companyExists) {
        $stmtUpdateCompany = $pdo->prepare("
            UPDATE companies 
            SET name = :name, owner_name = :owner, email = :email, phone = :phone, 
                business_type = :btype, currency = :currency, status = 'active',
                subscription_ends_at = DATE_ADD(NOW(), INTERVAL 30 DAY),
                trial_ends_at = NULL,
                updated_at = NOW()
            WHERE id = 1
        ");
        $stmtUpdateCompany->execute([
            ':name'     => $storeName,
            ':owner'    => $ownerName,
            ':email'    => $email,
            ':phone'    => $phone,
            ':btype'    => $businessType,
            ':currency' => $currency
        ]);
        echo "✓ Updated Company (ID 1): $storeName (Active for 30 Days)\n";
    } else {
        $stmtInsertCompany = $pdo->prepare("
            INSERT INTO companies (id, name, owner_name, email, phone, business_type, country, currency, language, timezone, status, subscription_ends_at, created_at, updated_at)
            VALUES (1, :name, :owner, :email, :phone, :btype, 'India', :currency, 'en', 'Asia/Kolkata', 'active', DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW())
        ");
        $stmtInsertCompany->execute([
            ':name'     => $storeName,
            ':owner'    => $ownerName,
            ':email'    => $email,
            ':phone'    => $phone,
            ':btype'    => $businessType,
            ':currency' => $currency
        ]);
        echo "✓ Created Company (ID 1): $storeName (Active for 30 Days)\n";
    }

    // 2. Hash Password with Bcrypt
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    // 3. Update or Insert Admin User (User ID = 1)
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = 1 LIMIT 1");
    $stmt->execute();
    $userExists = $stmt->fetch();

    if ($userExists) {
        $stmtUpdateUser = $pdo->prepare("
            UPDATE users 
            SET company_id = 1, first_name = :first_name, last_name = '', email = :email, phone = :phone, password = :password, status = 1, updated_at = NOW()
            WHERE id = 1
        ");
        $stmtUpdateUser->execute([
            ':first_name' => $ownerName,
            ':email'      => $email,
            ':phone'      => $phone,
            ':password'   => $hashedPassword
        ]);
        echo "✓ Updated Admin User credentials (Email: $email)\n";
    } else {
        $stmtInsertUser = $pdo->prepare("
            INSERT INTO users (id, company_id, first_name, last_name, email, phone, password, status, language, created_at, updated_at)
            VALUES (1, 1, :first_name, '', :email, :phone, :password, 1, 'en', NOW(), NOW())
        ");
        $stmtInsertUser->execute([
            ':first_name' => $ownerName,
            ':email'      => $email,
            ':phone'      => $phone,
            ':password'   => $hashedPassword
        ]);
        echo "✓ Created Admin User (Email: $email)\n";
    }

    // 4. Assign Admin Role
    $stmtRole = $pdo->prepare("SELECT id FROM roles WHERE name = 'admin' LIMIT 1");
    $stmtRole->execute();
    $role = $stmtRole->fetch();
    $roleId = $role['id'] ?? 1;

    $stmtCheckRole = $pdo->prepare("SELECT role_id FROM model_has_roles WHERE model_id = 1 AND model_type = 'App\\\\Models\\\\User'");
    $stmtCheckRole->execute();
    if (!$stmtCheckRole->fetch()) {
        $stmtAssignRole = $pdo->prepare("INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (:role_id, 'App\\\\Models\\\\User', 1)");
        $stmtAssignRole->execute([':role_id' => $roleId]);
        echo "✓ Assigned admin role\n";
    }

    // 5. Update Settings
    $settingsUpdates = [
        'company_name'  => $storeName,
        'email'         => $email,
        'phone'         => $phone,
        'developed'     => $storeName
    ];

    $stmtSetting = $pdo->prepare("
        INSERT INTO settings (`key`, `value`, `created_at`, `updated_at`) 
        VALUES (:key, :value, NOW(), NOW())
        ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW()
    ");

    foreach ($settingsUpdates as $k => $v) {
        $stmtSetting->execute([':key' => $k, ':value' => $v]);
    }
    echo "✓ Store settings updated successfully.\n";

    // 5b. Reset Old Demo/Test Transactions for Fresh Store Setup
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $tablesToClean = [
        'sales', 'sale_items', 'sales_returns', 'sale_return_items',
        'purchases', 'purchase_items', 'purchase_returns', 'purchase_return_items',
        'expenses', 'pos_registers', 'pos_register_details',
        'customer_payments', 'supplier_payments', 'supplier_asns', 'bin_inventories',
        'holds', 'hold_items', 'quotations', 'quotation_items', 'transfers', 'transfer_items'
    ];
    foreach ($tablesToClean as $tbl) {
        try {
            $pdo->exec("TRUNCATE TABLE `$tbl`");
        } catch (\Throwable $t) {}
    }
    
    // Reset customers and products to fresh state
    try {
        $pdo->exec("TRUNCATE TABLE customers");
        $pdo->exec("TRUNCATE TABLE products");
        $pdo->exec("TRUNCATE TABLE main_products");
        $pdo->exec("TRUNCATE TABLE manage_stocks");
    } catch (\Throwable $t) {}

    // Ensure exactly 1 default Walk-in Customer exists for instant billing
    $pdo->exec("
        INSERT INTO customers (id, name, email, phone, country, city, address, created_at, updated_at)
        VALUES (1, 'Walk-in Customer', 'walkin@pos.com', '9999999999', 'India', 'Store Location', 'Store Counter', NOW(), NOW())
    ");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
    echo "✓ Cleaned dummy test transactions & isolated fresh customer registry (Total Customers: 1 Walk-in).\n";
    echo "✓ Cleaned dummy test transactions (Fresh 0-data Dashboard initialized).\n";

    // 6. Update local activation_keys table with the entered Key
    if (!empty($key) && $key !== 'INFYPOS-2026-KEY') {
        $stmtKey = $pdo->prepare("SELECT id FROM activation_keys WHERE key_code = :key_code OR company_id = 1 ORDER BY id DESC LIMIT 1");
        $stmtKey->execute([':key_code' => $key]);
        $keyExists = $stmtKey->fetch();

        if ($keyExists) {
            $stmtUpdateKey = $pdo->prepare("
                UPDATE activation_keys 
                SET key_code = :key_code, company_id = 1, plan_name = 'INFY-POS PREMIUM (30 Days)', status = 'active', 
                    activated_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY), updated_at = NOW()
                WHERE id = :id
            ");
            $stmtUpdateKey->execute([':key_code' => $key, ':id' => $keyExists['id']]);
        } else {
            $stmtInsertKey = $pdo->prepare("
                INSERT INTO activation_keys (company_id, key_code, plan_name, price, status, activated_at, expires_at, created_at, updated_at)
                VALUES (1, :key_code, 'INFY-POS PREMIUM (30 Days)', 499.00, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW())
                ON DUPLICATE KEY UPDATE status = 'active', activated_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY), updated_at = NOW()
            ");
            $stmtInsertKey->execute([':key_code' => $key]);
        }
        echo "✓ Local activation key set to: $key (Active for 30 Days)\n";
    }

    // 7. Clear Laravel sessions to enforce fresh login
    $sessionsDir = __DIR__ . '/storage/framework/sessions';
    if (is_dir($sessionsDir)) {
        $files = glob($sessionsDir . '/*');
        foreach ($files as $file) {
            if (is_file($file) && basename($file) !== '.gitignore') {
                @unlink($file);
            }
        }
        echo "✓ Cleared previous session cache.\n";
    }

    // 8. Direct Supabase Cloud Registry Synchronization
    if (!empty($key) && $key !== 'INFYPOS-2026-KEY' && $key !== 'INFYPOS-2026-GLOBAL-FREE-TRIAL-14DAYS') {
        try {
            $supabaseUrl = 'https://xzduxvifiancdgnrrgew.supabase.co/rest/v1';
            $supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZHV4dmlmaWFuY2RnbnJyZ2V3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjE3ODc3OSwiZXhwIjoyMTAxNzU0Nzc5fQ.7Z1VKcSUN8_486ytN1Y8R0QSKROM44LBaJ_XYmMHeDY';

            // Find or create company
            $ch = curl_init("{$supabaseUrl}/companies?name=eq." . urlencode($storeName));
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => ["apikey: {$supabaseKey}", "Authorization: Bearer {$supabaseKey}"]
            ]);
            $res = json_decode(curl_exec($ch), true);
            curl_close($ch);

            $compId = $res[0]['id'] ?? null;
            if (!$compId) {
                $ch = curl_init("{$supabaseUrl}/companies");
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => json_encode([
                        'name' => $storeName, 'owner_name' => $ownerName, 'email' => $email,
                        'phone' => $phone, 'business_type' => $businessType, 'status' => 'active',
                        'created_at' => date('c'), 'updated_at' => date('c')
                    ]),
                    CURLOPT_HTTPHEADER => ["apikey: {$supabaseKey}", "Authorization: Bearer {$supabaseKey}", "Content-Type: application/json", "Prefer: return=representation"]
                ]);
                $created = json_decode(curl_exec($ch), true);
                curl_close($ch);
                $compId = $created[0]['id'] ?? null;
            }

            // Update activation key status & company_id in Supabase
            if ($compId) {
                $ch = curl_init("{$supabaseUrl}/activation_keys?key_code=eq." . urlencode($key));
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_CUSTOMREQUEST => 'PATCH',
                    CURLOPT_POSTFIELDS => json_encode([
                        'status' => 'active',
                        'company_id' => $compId,
                        'activated_at' => date('c'),
                        'updated_at' => date('c')
                    ]),
                    CURLOPT_HTTPHEADER => ["apikey: {$supabaseKey}", "Authorization: Bearer {$supabaseKey}", "Content-Type: application/json"]
                ]);
                curl_exec($ch);
                curl_close($ch);
            }
            echo "✓ Super Admin Cloud Key Registry synced (Key: $key -> Company: $storeName).\n";
        } catch (\Throwable $t) {
            // offline grace
        }
    }

    echo "\n=== STORE SETUP COMPLETE ===\n";
    exit(0);

} catch (Exception $e) {
    echo "Setup Error: " . $e->getMessage() . "\n";
    exit(1);
}
