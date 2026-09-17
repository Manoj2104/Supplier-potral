<?php
// ============================================================
// INFY-POS Enterprise — setup_store.php
// Post-installation store + admin account initialization.
//
// Called by INFY-POS-Setup.iss after:
//   - MySQL is confirmed READY (polled, not just started)
//   - php artisan migrate --force completed
//   - php artisan optimize:clear completed
//
// Responsibilities:
//   1. Fix .env for production (APP_NAME, APP_ENV, APP_KEY, etc.)
//   2. Connect to local MySQL (retry 60s)
//   3. Wipe old demo/stale data, INSERT fresh store + admin
//   4. Verify admin password with password_verify() — exit(1) on failure
//   5. Assign admin role
//   6. Update settings table
//   7. Persist setup_params.json (no plaintext password)
//   8. Supabase cloud sync (optional, non-blocking)
//   9. Run artisan config:cache
//
// Exit codes:
//   0 = success (admin verified)
//   1 = failure (admin creation/verification failed — installer MUST stop)
// ============================================================

error_reporting(E_ALL);
ini_set('display_errors', '1');

// ── Arguments from installer ─────────────────────────────────
$storeName          = $argv[1] ?? '';
$businessType       = $argv[2] ?? 'General Retail Store';
$currency           = $argv[3] ?? 'INR';
$phone              = $argv[4] ?? '';
$ownerName          = $argv[5] ?? '';
$email              = $argv[6] ?? '';
$password           = $argv[7] ?? '';
$key                = $argv[8] ?? '';
$machineFingerprint = $argv[9] ?? '';
$signedToken        = $argv[10] ?? '';

// ── Installer log ────────────────────────────────────────────
$logDir  = 'C:/ProgramData/INFY-POS Enterprise/logs';
$logFile = $logDir . '/installer.log';
@mkdir($logDir, 0777, true);

function logInstaller(string $msg): void {
    global $logFile;
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $msg . PHP_EOL;
    @file_put_contents($logFile, $line, FILE_APPEND);
    echo $msg . PHP_EOL;
}

logInstaller('=== setup_store.php started ===');
logInstaller("Store: $storeName | Email: $email | Currency: $currency");

// ── Validate required inputs ─────────────────────────────────
if (empty($storeName) || empty($email) || empty($password)) {
    logInstaller('ERROR: Missing required arguments (store name, email, or password).');
    exit(1);
}
if (strpos($email, '@') === false) {
    logInstaller("ERROR: Invalid admin email: $email");
    exit(1);
}
if (strlen($password) < 6) {
    logInstaller('ERROR: Password too short (minimum 6 characters).');
    exit(1);
}

// ── Write license.token ──────────────────────────────────────
if (!empty($signedToken)) {
    $progData = 'C:/ProgramData/INFY-POS Enterprise';
    @mkdir($progData, 0777, true);
    @file_put_contents($progData . '/license.token', trim($signedToken));
    @mkdir(__DIR__ . '/storage/license', 0777, true);
    @file_put_contents(__DIR__ . '/storage/license/license.token', trim($signedToken));
    logInstaller('✓ License token saved.');
}

// ── Resolve machine fingerprint ──────────────────────────────
if (empty($machineFingerprint)) {
    $out = @shell_exec('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid 2>nul');
    if ($out && preg_match('/MachineGuid\s+REG_SZ\s+([a-zA-Z0-9\-]+)/i', $out, $m)) {
        $machineFingerprint = trim($m[1]);
    }
}
if (empty($machineFingerprint)) {
    $machineFingerprint = 'WIN-' . gethostname();
}

// ============================================================
// STEP 1 — Fix .env for production
// ============================================================
logInstaller('--- Step 1: Configuring .env for production ---');
$envPath = __DIR__ . '/.env';

$envUpdates = [
    'APP_NAME'  => '"' . str_replace('"', '', $storeName) . '"',
    'APP_ENV'   => 'production',
    'APP_DEBUG' => 'false',
    'APP_URL'   => 'http://127.0.0.1:8000',
    'PORTAL_MODE' => 'pos',
    'DB_CONNECTION' => 'mysql',
    'DB_HOST'   => '127.0.0.1',
    'DB_PORT'   => '3307',
    'DB_DATABASE' => 'pos',
    'DB_USERNAME' => 'root',
    'DB_PASSWORD' => '',
    'LOG_LEVEL' => 'error',
];


if (file_exists($envPath)) {
    $envContent = file_get_contents($envPath);
    foreach ($envUpdates as $envKey => $envVal) {
        if (preg_match('/^' . preg_quote($envKey, '/') . '\s*=.*/m', $envContent)) {
            $envContent = preg_replace(
                '/^' . preg_quote($envKey, '/') . '\s*=.*/m',
                $envKey . '=' . $envVal,
                $envContent
            );
        } else {
            $envContent .= PHP_EOL . $envKey . '=' . $envVal;
        }
    }
    file_put_contents($envPath, $envContent);
    logInstaller("✓ .env updated: APP_NAME=$storeName, APP_ENV=production, APP_DEBUG=false");
} else {
    logInstaller('⚠ .env not found — will use defaults.');
}

// ── Generate & Guarantee fresh APP_KEY ──────────────────────
logInstaller('--- Step 1b: Generating fresh APP_KEY ---');
$currentKey = '';
if (file_exists($envPath)) {
    $envC = file_get_contents($envPath);
    if (preg_match('/^APP_KEY\s*=\s*(.+)$/m', $envC, $km)) {
        $currentKey = trim($km[1]);
    }
}

if (empty($currentKey) || $currentKey === 'base64:' || strlen($currentKey) < 20) {
    // Generate high-entropy 256-bit AES key in pure PHP (zero external process dependency)
    $freshKey = 'base64:' . base64_encode(random_bytes(32));
    $envC = file_get_contents($envPath);
    if (preg_match('/^APP_KEY\s*=.*/m', $envC)) {
        $envC = preg_replace('/^APP_KEY\s*=.*/m', 'APP_KEY=' . $freshKey, $envC);
    } else {
        $envC = 'APP_KEY=' . $freshKey . PHP_EOL . $envC;
    }
    file_put_contents($envPath, $envC);
    logInstaller("✓ Generated cryptographically secure APP_KEY in pure PHP: $freshKey");
} else {
    logInstaller("✓ APP_KEY already present and valid.");
}

// Also run artisan key:generate with full path as double-check
$artisanPath = __DIR__ . '/artisan';
if (file_exists($artisanPath)) {
    $keyOutput = @shell_exec("\"C:\\xampp\\php\\php.exe\" \"$artisanPath\" key:generate --force 2>&1");
    if ($keyOutput) {
        logInstaller('✓ artisan key:generate: ' . trim($keyOutput));
    }
}

// ============================================================
// STEP 2 — Connect to MySQL (retry 60 seconds)
// ============================================================
logInstaller('--- Step 2: Connecting to MySQL ---');
$host     = '127.0.0.1';
$db       = 'pos';
$dbUser   = 'root';
$dbPass   = '';
$pdo      = null;
$port     = 3307;
$tryPorts = [3307];           // NEVER fall back to 3306 — a pre-installed MySQL84 service
                               // may be listening there and would silently receive the admin user,
                               // while Laravel's .env points to XAMPP MySQL on 3307 → login fails.

$maxRetry = 120;   // 120 × 500ms = 60 seconds

for ($attempt = 0; $attempt < $maxRetry && !$pdo; $attempt++) {
    foreach ($tryPorts as $p) {
        try {
            $testPdo = new PDO(
                "mysql:host=$host;port=$p",
                $dbUser, $dbPass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
            );
            $pdo  = $testPdo;
            $port = $p;
            logInstaller("✓ MySQL connected on port $port (attempt " . ($attempt + 1) . ")");
            break 2;
        } catch (\Throwable $ex) { /* retry */ }
    }
    if ($attempt < $maxRetry - 1) {
        if ($attempt % 10 === 0) logInstaller("  Waiting for MySQL... attempt " . ($attempt + 1));
        usleep(500000);
    }
}

if (!$pdo) {
    logInstaller('FATAL: Unable to connect to MySQL after 60 seconds. Admin account cannot be created.');
    logInstaller('ADMIN_CREATION_FAILED');
    exit(1);
}

// Update .env DB_PORT to whichever port actually connected
if ($port !== 3307) {
    $envContent2 = file_get_contents($envPath);
    $envContent2 = preg_replace('/^DB_PORT\s*=.*/m', "DB_PORT=$port", $envContent2);
    file_put_contents($envPath, $envContent2);
    logInstaller("✓ Updated .env DB_PORT to $port");
}

// ============================================================
// STEP 3 — Create database and initialize schema
// ============================================================
logInstaller('--- Step 3: Database initialization ---');
try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$db`");
    logInstaller("✓ Database '$db' ready.");

    // Check if existing real data is present (non-empty companies table)
    $existingData = false;
    try {
        $chk = $pdo->query("SELECT COUNT(*) AS cnt FROM companies")->fetch();
        if (($chk['cnt'] ?? 0) > 0) {
            $existingData = true;
            logInstaller("⚠ Existing store data detected. Will replace with new installation data.");
        }
    } catch (\Throwable $e) { /* table doesn't exist yet */ }

    // Import schema if 'companies' table not present (fallback to SQL dump)
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'companies'")->fetch();
    if (!$tableCheck) {
        $sqlPath   = __DIR__ . '/database/pos.sql';
        $mysqlBin  = 'C:\\xampp\\mysql\\bin\\mysql.exe';
        if (file_exists($sqlPath) && file_exists($mysqlBin)) {
            $importCmd = "\"$mysqlBin\" --port=$port -u $dbUser $db < \"$sqlPath\" 2>&1";
            $importOut = @shell_exec($importCmd);
            logInstaller("✓ Schema imported from pos.sql. " . trim($importOut ?? ''));
        }
    }

    // Guarantee personal_access_tokens table exists for Sanctum auth
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
          `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
          `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
          `tokenable_id` bigint UNSIGNED NOT NULL,
          `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
          `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
          `abilities` text COLLATE utf8mb4_unicode_ci,
          `last_used_at` timestamp NULL DEFAULT NULL,
          `expires_at` timestamp NULL DEFAULT NULL,
          `created_at` timestamp NULL DEFAULT NULL,
          `updated_at` timestamp NULL DEFAULT NULL,
          PRIMARY KEY (`id`),
          UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
          KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    logInstaller("✓ personal_access_tokens table verified.");

    // Run Laravel migrations against port
    $artisanPath = __DIR__ . '/artisan';
    if (file_exists($artisanPath)) {
        $migrateCmd = "\"C:\\xampp\\php\\php.exe\" \"$artisanPath\" migrate --force 2>&1";
        $migrateOut = @shell_exec($migrateCmd);
        logInstaller("✓ Migrations: " . trim($migrateOut ?? ''));
    }

} catch (\Throwable $e) {
    logInstaller('FATAL: Database initialization failed: ' . $e->getMessage());
    exit(1);
}

// ============================================================
// STEP 4 — Wipe stale data + INSERT fresh store & admin
// ============================================================
logInstaller('--- Step 4: Creating fresh store and admin account ---');
try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

    // Wipe store users and company — DO NOT wipe role_has_permissions or roles/permissions!
    foreach (['users', 'companies', 'model_has_roles', 'model_has_permissions'] as $tbl) {
        try { $pdo->exec("DELETE FROM `$tbl`"); } catch (\Throwable $e) {}
    }
    try { $pdo->exec("ALTER TABLE companies AUTO_INCREMENT = 1"); } catch (\Throwable $e) {}
    try { $pdo->exec("ALTER TABLE users AUTO_INCREMENT = 1"); } catch (\Throwable $e) {}

    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Insert company
    $pdo->prepare("
        INSERT INTO companies
            (id, name, owner_name, email, phone, business_type, country, currency,
             language, timezone, status, subscription_ends_at, created_at, updated_at)
        VALUES
            (1, :name, :owner, :email, :phone, :btype, 'India', :currency,
             'en', 'Asia/Kolkata', 'active', DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW())
    ")->execute([
        ':name' => $storeName, ':owner' => $ownerName, ':email' => $email,
        ':phone' => $phone, ':btype' => $businessType, ':currency' => $currency,
    ]);
    logInstaller("✓ Company created: $storeName");

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

    // Insert admin user
    $pdo->prepare("
        INSERT INTO users
            (id, company_id, first_name, last_name, email, phone, password, status, language, created_at, updated_at)
        VALUES
            (1, 1, :first_name, '', :email, :phone, :password, 1, 'en', NOW(), NOW())
    ")->execute([
        ':first_name' => $ownerName,
        ':email'      => $email,
        ':phone'      => $phone,
        ':password'   => $hashedPassword,
    ]);
    logInstaller("✓ Admin user created: $email");

} catch (\Throwable $e) {
    logInstaller('FATAL: Store/admin creation failed: ' . $e->getMessage());
    logInstaller('ADMIN_CREATION_FAILED');
    exit(1);
}

// ============================================================
// STEP 5 — VERIFY admin password with password_verify()
// ============================================================
logInstaller('--- Step 5: Verifying admin credentials ---');
try {
    $verifyStmt = $pdo->prepare("SELECT password FROM users WHERE email = ? LIMIT 1");
    $verifyStmt->execute([$email]);
    $verifyRow = $verifyStmt->fetch();

    if (!$verifyRow) {
        logInstaller("FATAL: Admin user not found in database after creation (email: $email)");
        logInstaller('ADMIN_CREATION_FAILED');
        exit(1);
    }

    if (!password_verify($password, $verifyRow['password'])) {
        logInstaller('FATAL: Password hash verification failed — bcrypt mismatch.');
        logInstaller('ADMIN_CREATION_FAILED');
        exit(1);
    }

    logInstaller("✓ ADMIN_VERIFIED — password_verify() passed for: $email");

} catch (\Throwable $e) {
    logInstaller('FATAL: Admin verification exception: ' . $e->getMessage());
    logInstaller('ADMIN_CREATION_FAILED');
    exit(1);
}

// ============================================================
// STEP 5b — Register company in Super Admin portal
// ============================================================
logInstaller('--- Step 5b: Registering company in Super Admin portal ---');
try {
    $superAdminUrl = 'https://super-admin-pos-billing-software.onrender.com/api.php?action=register-company';
    $ch = curl_init($superAdminUrl);
    $postData = json_encode([
        'store_name'        => $storeName,
        'owner_name'        => $ownerName,
        'email'             => $email,
        'phone'             => $phone,
        'business_type'     => $businessType,
        'currency'          => $currency,
        'plan_name'         => 'INFY-POS FREE TRIAL (14 Days)',
        'activation_key'    => $key,
        'machine_fingerprint' => $machineFingerprint,
        'status'            => 'active',
        'installed_at'      => date('c'),
    ]);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_POSTFIELDS     => $postData,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'User-Agent: INFY-POS-Setup/1.0',
        ],
    ]);
    $saResponse = curl_exec($ch);
    $saHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($saHttpCode >= 200 && $saHttpCode < 300) {
        logInstaller("✓ Super Admin registration: HTTP $saHttpCode — " . substr($saResponse ?? '', 0, 120));
    } else {
        logInstaller("⚠ Super Admin registration returned HTTP $saHttpCode (non-blocking): " . substr($saResponse ?? '', 0, 120));
    }
} catch (\Throwable $t) {
    logInstaller('⚠ Super Admin registration skipped (offline or error): ' . $t->getMessage());
}


// ============================================================
logInstaller('--- Step 6: Assigning admin role & permissions ---');
try {
    $roleRow = $pdo->query("SELECT id FROM roles WHERE name = 'admin' LIMIT 1")->fetch();
    $roleId  = $roleRow['id'] ?? 1;

    $existRole = $pdo->prepare("SELECT role_id FROM model_has_roles WHERE model_id = 1 AND model_type = 'App\\\\Models\\\\User'");
    $existRole->execute();
    if (!$existRole->fetch()) {
        $pdo->prepare("INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', 1)")
            ->execute([$roleId]);
        logInstaller("✓ Admin role assigned (role_id: $roleId)");
    } else {
        logInstaller("✓ Admin role already assigned.");
    }

    // Ensure all system permissions are assigned to admin role
    $pdo->exec("
        INSERT IGNORE INTO role_has_permissions (permission_id, role_id)
        SELECT id, $roleId FROM permissions
    ");
    logInstaller("✓ All system permissions assigned to admin role.");
} catch (\Throwable $e) {
    logInstaller('⚠ Role assignment warning: ' . $e->getMessage() . ' (continuing)');
}

// ============================================================
// STEP 7 — Update settings table
// ============================================================
try {
    $stmtS = $pdo->prepare("
        INSERT INTO settings (`key`, `value`, created_at, updated_at)
        VALUES (:k, :v, NOW(), NOW())
        ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()
    ");
    foreach (['company_name' => $storeName, 'email' => $email, 'phone' => $phone, 'developed' => $storeName] as $k => $v) {
        $stmtS->execute([':k' => $k, ':v' => $v]);
    }
    logInstaller('✓ Settings table updated.');
} catch (\Throwable $e) {
    logInstaller('⚠ Settings update warning: ' . $e->getMessage());
}

// ============================================================
// STEP 8 — Clear demo transactions
// ============================================================
try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    foreach ([
        'sales','sale_items','sales_returns','sale_return_items',
        'purchases','purchase_items','purchase_returns','purchase_return_items',
        'expenses','pos_registers','pos_register_details',
        'customer_payments','supplier_payments',
        'holds','hold_items','quotations','quotation_items',
    ] as $tbl) {
        try { $pdo->exec("TRUNCATE TABLE `$tbl`"); } catch (\Throwable $t) {}
    }
    try {
        $pdo->exec("TRUNCATE TABLE customers");
        $pdo->exec("INSERT INTO customers (id,name,email,phone,country,city,address,created_at,updated_at) VALUES (1,'Walk-in Customer','walkin@pos.local','0000000000','India','Store','Counter',NOW(),NOW())");
        $pdo->exec("TRUNCATE TABLE products");
        $pdo->exec("TRUNCATE TABLE main_products");
        $pdo->exec("TRUNCATE TABLE manage_stocks");
    } catch (\Throwable $t) {}
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    logInstaller('✓ Demo transactions cleared. Fresh start.');
} catch (\Throwable $e) {
    logInstaller('⚠ Demo clear warning: ' . $e->getMessage());
}

// ============================================================
// STEP 9 — Record activation key locally
// ============================================================
if (!empty($key) && strlen($key) > 8) {
    try {
        $pdo->prepare("
            INSERT INTO activation_keys
                (company_id, key_code, plan_name, price, status, activated_at, expires_at, created_at, updated_at)
            VALUES (1, :key, 'INFY-POS PREMIUM (30 Days)', 499.00, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                status = 'active', company_id = 1,
                activated_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY), updated_at = NOW()
        ")->execute([':key' => $key]);
        logInstaller("✓ Activation key recorded locally: $key");
    } catch (\Throwable $e) {
        logInstaller('⚠ Activation key record warning: ' . $e->getMessage());
    }
}

// ============================================================
// STEP 10 — Clear Laravel sessions
// ============================================================
$sessDir = __DIR__ . '/storage/framework/sessions';
if (is_dir($sessDir)) {
    foreach (glob($sessDir . '/*') as $f) {
        if (is_file($f) && basename($f) !== '.gitignore') @unlink($f);
    }
    logInstaller('✓ Old sessions cleared.');
}

// ============================================================
// STEP 11 — Write setup_params.json (NO plaintext password)
// ============================================================
$installId = strtoupper(bin2hex(random_bytes(8)));
$params = json_encode([
    'store_setup_complete' => true,
    'store_name'          => $storeName,
    'login_id'            => $email,
    'owner_name'          => $ownerName,
    'phone'               => $phone,
    'business_type'       => $businessType,
    'currency'            => $currency,
    'installation_id'     => $installId,
    'machine_id'          => $machineFingerprint,
    'installed_at'        => date('c'),
], JSON_PRETTY_PRINT);
@file_put_contents('C:/ProgramData/INFY-POS Enterprise/setup_params.json', $params);
logInstaller("✓ setup_params.json saved (installation_id: $installId)");

// ============================================================
// STEP 12 — Run artisan config:cache
// ============================================================
logInstaller('--- Step 12: Running config:cache ---');
@unlink(__DIR__ . '/bootstrap/cache/config.php');
$cacheOut = @shell_exec("\"C:\\xampp\\php\\php.exe\" \"$artisanPath\" config:cache 2>&1");
logInstaller('config:cache: ' . trim($cacheOut ?? '(no output)'));

// ============================================================
// STEP 13 — Supabase cloud sync (optional, non-blocking)
// ============================================================
if (!empty($storeName) && $storeName !== 'INFY-POS Enterprise') {
    try {
        $sbUrl = 'https://xzduxvifiancdgnrrgew.supabase.co/rest/v1';
        $sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZHV4dmlmaWFuY2RnbnJyZ2V3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjE3ODc3OSwiZXhwIjoyMTAxNzU0Nzc5fQ.7Z1VKcSUN8_486ytN1Y8R0QSKROM44LBaJ_XYmMHeDY';

        $ch = curl_init("$sbUrl/companies?email=eq." . urlencode($email));
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8,
            CURLOPT_HTTPHEADER => ["apikey: $sbKey", "Authorization: Bearer $sbKey"]]);
        $res   = json_decode(curl_exec($ch), true);
        curl_close($ch);
        $compId = $res[0]['id'] ?? null;

        if (!$compId) {
            $ch = curl_init("$sbUrl/companies");
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 8,
                CURLOPT_POSTFIELDS => json_encode(['name' => $storeName, 'owner_name' => $ownerName,
                    'email' => $email, 'phone' => $phone, 'business_type' => $businessType, 'status' => 'active',
                    'created_at' => date('c'), 'updated_at' => date('c')]),
                CURLOPT_HTTPHEADER => ["apikey: $sbKey", "Authorization: Bearer $sbKey",
                    "Content-Type: application/json", "Prefer: return=representation"]]);
            $created = json_decode(curl_exec($ch), true);
            curl_close($ch);
            logInstaller('✓ Supabase cloud sync: store created.');
        } else {
            logInstaller("✓ Supabase cloud sync: store updated (ID: $compId).");
        }
    } catch (\Throwable $t) {
        logInstaller('⚠ Supabase sync skipped (offline): ' . $t->getMessage());
    }
}

logInstaller('=== setup_store.php COMPLETE — exit 0 ===');
exit(0);
