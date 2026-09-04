<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Company;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\ActivationKey;
use App\Models\Setting;
use App\Services\LicenseService;
use Carbon\Carbon;
use PDO;
use PDOException;

class InstallerController extends Controller
{
    // ──────────────────────────────────────────────────
    // STEP 1 — Show Requirements
    // ──────────────────────────────────────────────────
    public function index(Request $request)
    {
        if (env('APP_ENV') === 'production' || str_contains($request->getHost(), 'render.com')) {
            return redirect('/#/app/dashboard');
        }

        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('users') 
                && \Illuminate\Support\Facades\Schema::hasTable('companies') 
                && \App\Models\User::count() > 0 
                && \App\Models\Company::count() > 0) {
                return redirect('/#/login');
            }
        } catch (\Throwable $e) {}

        $envData = $this->parseEnv();

        $requirements = [
            ['name' => 'PHP Version >= 8.1',          'pass' => version_compare(PHP_VERSION, '8.1.0', '>='), 'value' => PHP_VERSION],
            ['name' => 'PDO MySQL Extension',          'pass' => extension_loaded('pdo_mysql'),               'value' => extension_loaded('pdo_mysql') ? 'Enabled' : 'Missing'],
            ['name' => 'OpenSSL Extension',            'pass' => extension_loaded('openssl'),                 'value' => extension_loaded('openssl') ? 'Enabled' : 'Missing'],
            ['name' => 'Mbstring Extension',           'pass' => extension_loaded('mbstring'),                'value' => extension_loaded('mbstring') ? 'Enabled' : 'Missing'],
            ['name' => 'FileInfo Extension',           'pass' => extension_loaded('fileinfo'),                'value' => extension_loaded('fileinfo') ? 'Enabled' : 'Missing'],
            ['name' => 'Storage Directory Writable',   'pass' => is_writable(storage_path()),                 'value' => is_writable(storage_path()) ? 'Writable' : 'Not Writable'],
            ['name' => 'Bootstrap Cache Writable',     'pass' => is_writable(base_path('bootstrap/cache')),  'value' => is_writable(base_path('bootstrap/cache')) ? 'Writable' : 'Not Writable'],
            ['name' => '.env File Writable',           'pass' => is_writable(base_path('.env')),              'value' => is_writable(base_path('.env')) ? 'Writable' : 'Not Writable'],
        ];

        $allPass = collect($requirements)->every(fn($r) => $r['pass']);
        $machineFingerprint = LicenseService::getMachineFingerprint();
        $generatedKey = 'INFYPOS-2026-' . strtoupper(substr(md5(uniqid()), 0, 4)) . '-' . strtoupper(substr(md5(uniqid()), 4, 4));

        return view('installer.wizard', compact(
            'requirements', 'allPass', 'machineFingerprint', 'generatedKey', 'envData'
        ));
    }

    // ──────────────────────────────────────────────────
    // STEP 2 — Test Database Connection (real PDO)
    // ──────────────────────────────────────────────────
    public function testDbConnection(Request $request)
    {
        $host     = trim($request->input('host', 'localhost'));
        $port     = trim($request->input('port', '3307'));
        $database = trim($request->input('database', 'pos'));
        $username = trim($request->input('username', 'root'));
        $password = $request->input('password', '');
        $driver   = trim($request->input('driver', ''));

        // Smart Auto-detection
        $isExplicitMysql = in_array($port, ['3306', '3307']) || (in_array(strtolower($host), ['127.0.0.1', 'localhost']) && !in_array($port, ['5432', '6543']));
        $isExplicitPgsql = in_array($port, ['5432', '6543']) || str_contains(strtolower($host), 'supabase');

        if ($isExplicitMysql) {
            $isPgsql = false;
        } elseif ($isExplicitPgsql) {
            $isPgsql = true;
        } else {
            $isPgsql = ($driver === 'pgsql');
        }

        $dbDriver = $isPgsql ? 'pgsql' : 'mysql';

        try {
            $pdo = null;
            $dbLabel = '';

            if ($isPgsql) {
                try {
                    // Connect to PostgreSQL (Supabase)
                    $dsn = "pgsql:host={$host};port={$port};dbname={$database};sslmode=require";
                    $pdo = new PDO($dsn, $username, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 8]);
                    $dbLabel = "Supabase PostgreSQL Database (Port {$port})";
                } catch (\Throwable $pgEx) {
                    // If PostgreSQL fails due to SSL negotiation (connecting to a MySQL server like port 3307), auto-switch to MySQL!
                    if (str_contains($pgEx->getMessage(), 'SSL negotiation') || str_contains($pgEx->getMessage(), 'invalid response') || in_array($port, ['3306', '3307'])) {
                        $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
                        $pdo = new PDO($dsn, $username, $password, [PDO::ATTR_TIMEOUT => 5, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
                        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                        $dbDriver = 'mysql';
                        $dbLabel = "MySQL Database (Port {$port}) [Auto-switched from PostgreSQL]";
                    } else {
                        throw $pgEx;
                    }
                }
            } else {
                // Connect to MySQL
                $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
                $pdo = new PDO($dsn, $username, $password, [PDO::ATTR_TIMEOUT => 5, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $dbLabel = "MySQL Database (Port {$port})";
            }

            // Write connection parameters to .env
            $envPath = base_path('.env');
            if (file_exists($envPath)) {
                $envContent = file_get_contents($envPath);
                $replacements = [
                    'DB_CONNECTION' => $dbDriver,
                    'DB_HOST'       => $host,
                    'DB_PORT'       => $port,
                    'DB_DATABASE'   => $database,
                    'DB_USERNAME'   => $username,
                    'DB_PASSWORD'   => '"' . str_replace('"', '\"', $password) . '"',
                ];

                foreach ($replacements as $k => $v) {
                    if (preg_match("/^{$k}=.*/m", $envContent)) {
                        $envContent = preg_replace("/^{$k}=.*/m", "{$k}={$v}", $envContent);
                    } else {
                        $envContent .= "\n{$k}={$v}";
                    }
                }
                file_put_contents($envPath, $envContent);
            }

            // Reconnect runtime DB
            config([
                "database.connections.{$dbDriver}.host"     => $host,
                "database.connections.{$dbDriver}.port"     => $port,
                "database.connections.{$dbDriver}.database" => $database,
                "database.connections.{$dbDriver}.username" => $username,
                "database.connections.{$dbDriver}.password" => $password,
                'database.default'                           => $dbDriver,
            ]);
            DB::purge($dbDriver);
            DB::reconnect($dbDriver);

            return response()->json([
                'success' => true,
                'message' => "✅ {$dbLabel} Connected Successfully! Credentials saved to system environment.",
                'db_exists' => true,
                'driver'    => $dbDriver
            ]);

        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'Access denied') || str_contains($msg, 'password authentication failed')) {
                $msg .= " — Check username/password credentials.";
            } elseif (str_contains($msg, 'Connection refused') || str_contains($msg, "Can't connect")) {
                $msg .= " — Make sure database host and port are correct and accessible.";
            } elseif (str_contains($msg, 'SSL negotiation')) {
                $msg = "MySQL detected on port {$port}. Please click the 'Localhost XAMPP MySQL' tab above to connect.";
            }
            return response()->json(['success' => false, 'message' => '❌ ' . $msg]);
        }
    }

    // ──────────────────────────────────────────────────
    // BILLING COUNTER CLIENT — Test Main Server Connection
    // ──────────────────────────────────────────────────
    public function testServerConnection(Request $request)
    {
        $serverIp = trim($request->input('server_ip', ''));

        if (empty($serverIp)) {
            return response()->json(['success' => false, 'message' => '❌ Please enter the Main Server IP address.'], 400);
        }

        // Determine if it's local (same machine) or remote
        $isLocal = in_array($serverIp, ['localhost', '127.0.0.1', '::1']);

        if ($isLocal) {
            // Local machine — read from local DB
            try {
                $company = Company::first();
                if (!$company) {
                    return response()->json([
                        'success'  => false,
                        'message'  => '❌ Main Server database found, but no store has been set up yet. Please run Main Server Setup first.',
                    ], 400);
                }
                $warehouses = \App\Models\Warehouse::select('id', 'name')->get()->toArray();
                return response()->json([
                    'success'      => true,
                    'message'      => "✅ Connected to Local Main Server! Store: '{$company->name}'",
                    'company_name' => $company->name,
                    'server_ip'    => $serverIp,
                    'warehouses'   => $warehouses,
                ]);
            } catch (\Throwable $e) {
                return response()->json([
                    'success' => false,
                    'message' => '❌ Main Server database is not set up yet. Please complete Main Server Installation first on this machine.'
                ], 400);
            }
        }

        // Remote machine — try HTTP ping to server-info endpoint
        $port = $request->input('server_port', 8000);
        $apiUrl = "http://{$serverIp}:{$port}/api/installer/server-info";

        try {
            $ctx = stream_context_create(['http' => [
                'timeout' => 4,
                'ignore_errors' => true,
            ]]);
            $body = @file_get_contents($apiUrl, false, $ctx);

            if ($body === false) {
                return response()->json([
                    'success' => false,
                    'message' => "❌ Cannot reach Main Server at {$serverIp}:{$port}. Check: 1) Server is running 2) Same Wi-Fi/LAN 3) XAMPP Apache is ON on Main Server."
                ], 400);
            }

            $data = json_decode($body, true);
            if (!$data || empty($data['company_name'])) {
                return response()->json([
                    'success' => false,
                    'message' => "❌ Server at {$serverIp}:{$port} responded but is not an Infy-POS server. Verify the correct IP."
                ], 400);
            }

            return response()->json([
                'success'      => true,
                'message'      => "✅ Connected to Main Server [{$serverIp}:{$port}]! Store: '{$data['company_name']}'",
                'company_name' => $data['company_name'],
                'server_ip'    => $serverIp,
                'server_port'  => $port,
                'warehouses'   => $data['warehouses'] ?? [],
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => "❌ Connection error to {$serverIp}:{$port}. " . $e->getMessage()
            ], 400);
        }
    }

    // ──────────────────────────────────────────────────
    // DETECT REAL INSTALLED PRINTERS (Windows WMIC)
    // ──────────────────────────────────────────────────
    public function detectPrinters(Request $request)
    {
        $printers = [];

        try {
            // Use Windows WMIC to get installed printers
            $output = [];
            exec('wmic printer get Name /format:list 2>&1', $output);

            foreach ($output as $line) {
                $line = trim($line);
                if (str_starts_with($line, 'Name=')) {
                    $name = trim(substr($line, 5));
                    if (!empty($name)) {
                        $printers[] = [
                            'name'  => $name,
                            'value' => $name,
                            'type'  => $this->guessPrinterType($name),
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            // If wmic fails, return empty and let frontend show manual entry
        }

        // Always add Browser Web Print as last option
        $printers[] = [
            'name'  => 'Browser Web Print (Default — No Driver Needed)',
            'value' => 'WebPrint',
            'type'  => 'webprint',
        ];

        return response()->json([
            'success'  => true,
            'printers' => $printers,
            'count'    => count($printers),
        ]);
    }

    private function guessPrinterType(string $name): string
    {
        $n = strtolower($name);
        if (str_contains($n, 'thermal') || str_contains($n, 'pos') || str_contains($n, 'receipt')
            || str_contains($n, 'rp') || str_contains($n, 'xp-') || str_contains($n, 'epson tm')
            || str_contains($n, 'tvs') || str_contains($n, '80mm') || str_contains($n, '58mm')) {
            return 'thermal';
        }
        if (str_contains($n, 'pdf') || str_contains($n, 'fax') || str_contains($n, 'onenote')
            || str_contains($n, 'microsoft') || str_contains($n, 'xps')) {
            return 'virtual';
        }
        return 'standard';
    }

    // ──────────────────────────────────────────────────
    // FORGOT LICENSE KEY — Send OTP to Mobile/Email
    // ──────────────────────────────────────────────────
    public function sendFindKeyOtp(Request $request)
    {
        $contact = trim($request->input('contact', ''));

        if (empty($contact)) {
            return response()->json([
                'success' => false,
                'message' => '❌ Please enter your registered Mobile Number or Email Address.'
            ], 400);
        }

        $contact = strtolower(trim($contact));

        try {
            // Establish PDO connection to Central SuperAdmin Supabase Database
            $pdo = \App\Services\CloudLicenseServerService::getCloudPdo();

            // Check if contact exists in companies
            $stmt = $pdo->prepare("SELECT id FROM companies WHERE LOWER(email) = ? OR phone = ? LIMIT 1");
            $stmt->execute([$contact, $contact]);
            $company = $stmt->fetch();

            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => "❌ No registered account found with the contact details: '{$contact}'."
                ], 404);
            }

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '❌ Central SuperAdmin Cloud DB Error: ' . $e->getMessage()
            ], 500);
        }

        // Generate 6-digit OTP
        $otp = rand(100000, 999999);
        session(['find_key_otp' => $otp, 'find_key_contact' => $contact]);

        return response()->json([
            'success' => true,
            'message' => "📩 Verification OTP sent to {$contact}! (OTP Code: {$otp})",
            'demo_otp' => $otp
        ]);
    }

    // ──────────────────────────────────────────────────
    // FORGOT LICENSE KEY — Verify OTP and Retrieve Key
    // ──────────────────────────────────────────────────
    public function verifyFindKeyOtp(Request $request)
    {
        $inputOtp = trim($request->input('otp', ''));
        $savedOtp = session('find_key_otp');
        $contact  = session('find_key_contact', trim($request->input('contact', '')));

        if (empty($inputOtp) || ($savedOtp && $inputOtp != $savedOtp)) {
            return response()->json([
                'success' => false,
                'message' => '❌ Invalid OTP code entered. Please enter the correct 6-digit OTP.'
            ], 400);
        }

        $contact = strtolower(trim($contact));
        $key     = null;
        $companyName = null;
        $plan    = 'N/A';
        $expiresAt = 'Unlimited';

        try {
            // Establish PDO connection to Central SuperAdmin Supabase Database
            $pdo = \App\Services\CloudLicenseServerService::getCloudPdo();

            // 1. Find company by email or phone in Central Supabase DB
            $stmt = $pdo->prepare("SELECT * FROM companies WHERE LOWER(email) = ? OR phone = ? LIMIT 1");
            $stmt->execute([$contact, $contact]);
            $company = $stmt->fetch();

            if ($company) {
                $companyName = $company['name'];
                
                // 2. Find activation key associated with this company
                $kStmt = $pdo->prepare("SELECT * FROM activation_keys WHERE company_id = ? ORDER BY id DESC LIMIT 1");
                $kStmt->execute([$company['id']]);
                $key = $kStmt->fetch();

                if ($key) {
                    $plan = $key['plan_name'] ?? 'N/A';
                    $expiresAt = !empty($key['expires_at']) ? Carbon::parse($key['expires_at'])->format('d M Y') : 'Unlimited';
                }
            }

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '❌ Cloud Database not accessible: ' . $e->getMessage()
            ], 500);
        }

        if (!$key) {
            return response()->json([
                'success' => false,
                'message' => '❌ No active license key found for this registered account. Please contact Super Admin.'
            ], 404);
        }

        return response()->json([
            'success'      => true,
            'message'      => '✅ OTP Verified! Found active license key.',
            'key_code'     => $key['key_code'],
            'contact'      => $contact,
            'plan'         => $plan ?: 'Infy-POS License',
            'company_name' => $companyName,
            'expires_at'   => $expiresAt,
        ]);
    }

    // ──────────────────────────────────────────────────
    // RESTORE EXISTING CLOUD STORE — Step 1: Send OTP
    // ──────────────────────────────────────────────────
    public function sendRestoreOtp(Request $request)
    {
        $keyCode = strtoupper(trim($request->input('key_code', '')));
        $email   = strtolower(trim($request->input('email', '')));

        if (empty($keyCode) || empty($email)) {
            return response()->json([
                'success' => false,
                'message' => '❌ Activation Key Code and Registered Email ID are required.'
            ], 400);
        }

        try {
            // 1. Verify key exists in cloud
            $kResp = \App\Services\CloudLicenseServerService::supabaseRequest('/activation_keys?key_code=eq.' . urlencode($keyCode) . '&limit=1');
            if (!$kResp['success'] || empty($kResp['data'])) {
                return response()->json([
                    'success' => false,
                    'message' => "❌ Activation Key '{$keyCode}' not found in Cloud Registry."
                ], 404);
            }
            $key = $kResp['data'][0];

            // 2. Verify registered email matches company
            $cResp = \App\Services\CloudLicenseServerService::supabaseRequest('/companies?email=ilike.' . urlencode($email) . '&limit=1');
            if (!$cResp['success'] || empty($cResp['data'])) {
                return response()->json([
                    'success' => false,
                    'message' => "❌ Registered account for '{$email}' not found in Cloud Database."
                ], 404);
            }
            $company = $cResp['data'][0];

            if (!empty($key['company_id']) && $company['id'] != $key['company_id']) {
                return response()->json([
                    'success' => false,
                    'message' => "❌ Email '{$email}' does not match the registered owner of this License Key."
                ], 403);
            }

            // Generate 6-digit OTP
            $otp = rand(100000, 999999);
            session([
                'restore_otp'        => $otp,
                'restore_key'        => $keyCode,
                'restore_email'      => $email,
                'restore_company_id' => $company['id'],
            ]);

            return response()->json([
                'success'  => true,
                'message'  => "📩 Security OTP sent to {$email}! (Verification Code: {$otp})",
                'demo_otp' => $otp,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '❌ Cloud Server Connection Error: ' . $e->getMessage()
            ], 500);
        }
    }

    // ──────────────────────────────────────────────────
    // RESTORE EXISTING CLOUD STORE — Step 2: Verify OTP
    // ──────────────────────────────────────────────────
    public function verifyRestoreOtp(Request $request)
    {
        $inputOtp = trim($request->input('otp', ''));
        $savedOtp = session('restore_otp');
        $keyCode  = session('restore_key', strtoupper(trim($request->input('key_code', ''))));
        $email    = session('restore_email', strtolower(trim($request->input('email', ''))));

        if (empty($inputOtp) || ($savedOtp && $inputOtp != $savedOtp)) {
            return response()->json([
                'success' => false,
                'message' => '❌ Invalid 6-digit OTP code entered. Please try again.'
            ], 400);
        }

        try {
            // Fetch company details
            $cResp = \App\Services\CloudLicenseServerService::supabaseRequest('/companies?email=ilike.' . urlencode($email) . '&limit=1');
            $company = $cResp['data'][0] ?? [];

            // Fetch key details
            $kResp = \App\Services\CloudLicenseServerService::supabaseRequest('/activation_keys?key_code=eq.' . urlencode($keyCode) . '&limit=1');
            $key = $kResp['data'][0] ?? [];

            session(['restore_verified' => true]);

            return response()->json([
                'success'      => true,
                'message'      => '✅ Security OTP Verified! Store data and cloud backup ready for import.',
                'company_name' => $company['name'] ?? 'Registered Store',
                'owner_name'   => $company['owner_name'] ?? 'Store Owner',
                'email'        => $company['email'] ?? $email,
                'phone'        => $company['phone'] ?? '',
                'business_type'=> $company['business_type'] ?? 'Retail POS',
                'plan_name'    => $key['plan_name'] ?? 'INFY-POS PREMIUM',
                'expires_at'   => !empty($key['expires_at']) ? Carbon::parse($key['expires_at'])->format('d M Y') : 'Unlimited',
                'backup_ready' => true,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '❌ Cloud Server Connection Error: ' . $e->getMessage()
            ], 500);
        }
    }

    // ──────────────────────────────────────────────────
    // RESTORE EXISTING CLOUD STORE — Step 3: Execute Restore
    // ──────────────────────────────────────────────────
    public function executeRestore(Request $request)
    {
        set_time_limit(600);
        $keyCode = strtoupper(trim($request->input('key_code', session('restore_key', ''))));
        $email   = strtolower(trim($request->input('email', session('restore_email', ''))));
        $machineUuid = \App\Services\CloudLicenseServerService::getMachineUuid();

        try {
            // 1. Fetch Cloud Store Details
            $cResp = \App\Services\CloudLicenseServerService::supabaseRequest('/companies?email=ilike.' . urlencode($email) . '&limit=1');
            $companyData = $cResp['data'][0] ?? null;

            if (!$companyData) {
                return response()->json(['success' => false, 'message' => '❌ Store record not found in Cloud Database.'], 404);
            }

            // 2. Fetch Key
            $kResp = \App\Services\CloudLicenseServerService::supabaseRequest('/activation_keys?key_code=eq.' . urlencode($keyCode) . '&limit=1');
            $keyData = $kResp['data'][0] ?? [];

            // 3. Migrate Hardware Binding to this Machine UUID in Cloud
            \App\Services\CloudLicenseServerService::supabaseRequest('/activation_keys?key_code=eq.' . urlencode($keyCode), 'PATCH', [
                'machine_fingerprint' => $machineUuid,
                'status'              => 'active',
                'updated_at'          => Carbon::now()->toIso8601String(),
            ]);

            // Register/Update Device in saas_devices
            \App\Services\CloudLicenseServerService::supabaseRequest('/saas_devices', 'POST', [
                'company_id'    => $companyData['id'],
                'device_name'   => ($companyData['name'] ?? 'Main Store') . ' - POS Terminal',
                'machine_uuid'  => $machineUuid,
                'ip_address'    => '127.0.0.1',
                'os_version'    => 'Windows 11 Enterprise x64',
                'status'        => 'Online',
                'last_login_at' => Carbon::now()->toIso8601String(),
                'updated_at'    => Carbon::now()->toIso8601String(),
            ]);

            // 4. Initialize Local MySQL Database
            $env = $this->parseEnv();
            $dbHost = $env['DB_HOST'] ?? 'localhost';
            $dbPort = $env['DB_PORT'] ?? '3307';
            $dbName = $env['DB_DATABASE'] ?? 'pos';
            $dbUser = $env['DB_USERNAME'] ?? 'root';
            $dbPass = $env['DB_PASSWORD'] ?? '';

            // Ensure MySQL Database exists
            $rootPdo = new \PDO("mysql:host={$dbHost};port={$dbPort}", $dbUser, $dbPass, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
            $rootPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            $this->ensureDbConnection($dbHost, $dbPort, $dbName, $dbUser, $dbPass);

            // 5. Run Migrations and Seeds
            Artisan::call('migrate', ['--force' => true]);
            try {
                Artisan::call('db:seed', ['--force' => true]);
            } catch (\Throwable $e) {}

            // 6. Restore Local Company Profile from Cloud Snapshot
            $comp = Company::first() ?? new Company();
            $comp->name                 = $companyData['name'] ?? 'My Store';
            $comp->owner_name           = $companyData['owner_name'] ?? 'Admin';
            $comp->email                = $companyData['email'] ?? $email;
            $comp->phone                = $companyData['phone'] ?? '9876543210';
            $comp->business_type        = $companyData['business_type'] ?? 'Supermarket';
            $comp->status               = 'active';
            $comp->subscription_ends_at = $keyData['expires_at'] ?? Carbon::now()->addYear()->toDateTimeString();
            $comp->save();

            // Save ActivationKey in local DB
            $localKey = ActivationKey::firstOrNew(['key_code' => $keyCode]);
            $localKey->company_id          = $comp->id;
            $localKey->machine_fingerprint = $machineUuid;
            $localKey->plan_name           = $keyData['plan_name'] ?? 'INFY-POS PREMIUM';
            $localKey->price               = $keyData['price'] ?? 0;
            $localKey->status              = 'active';
            $localKey->expires_at          = $comp->subscription_ends_at;
            $localKey->save();


            // 7. Ensure Admin User is created / updated
            $adminUser = User::where('email', $email)->first();
            if (!$adminUser) {
                $adminUser = User::first() ?? new User();
            }
            $adminUser->first_name = $companyData['owner_name'] ?? 'Store Owner';
            $adminUser->last_name  = 'Admin';
            $adminUser->email      = $email;
            $adminUser->password   = Hash::make('123456');
            $adminUser->phone      = $companyData['phone'] ?? '9876543210';
            $adminUser->status     = 1;
            $adminUser->save();

            // 8. Ensure Primary Warehouse exists
            $wh = Warehouse::first();
            if (!$wh) {
                Warehouse::create([
                    'name'    => ($comp->name ?: 'Store') . ' Main Warehouse',
                    'email'   => $email,
                    'phone'   => $comp->phone,
                    'city'    => 'Chennai',
                    'country' => 'India',
                    'zip_code'=> '600001',
                ]);
            }

            // 9. Save Local License Dat & Machine Lock
            \App\Services\MachineLockService::registerTrialUsed($comp->name, $comp->subscription_ends_at);

            $licData = [
                'key_code'             => $keyCode,
                'company_name'         => $comp->name,
                'email'                => $email,
                'hardware_fingerprint' => $machineUuid,
                'status'               => 'active',
                'plan_name'            => $comp->plan_name,
                'subscription_ends_at' => $comp->subscription_ends_at,
                'restored_at'          => Carbon::now()->toDateTimeString(),
            ];
            file_put_contents(storage_path('app/license.dat'), json_encode($licData, JSON_PRETTY_PRINT));

            // Clean optimize cache
            try { Artisan::call('optimize:clear'); } catch (\Throwable $e) {}

            return response()->json([
                'success'      => true,
                'message'      => '🎉 Store & Cloud Database Backup successfully restored to this PC!',
                'company_name' => $comp->name,
                'email'        => $email,
                'password'     => '123456',
                'login_url'    => '/#/login',
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '❌ Restore Execution Error: ' . $e->getMessage()
            ], 500);
        }
    }



    public function verifyLicenseKey(Request $request)
    {
        $keyCode = strtoupper(trim($request->input('key_code', '')));
        $serverIp = trim($request->input('server_ip', ''));
        $serverPort = trim($request->input('server_port', '8000'));
        $mode = $request->input('mode', 'main');

        if (empty($keyCode)) {
            return response()->json([
                'success' => false,
                'message' => '❌ Please enter an Activation Key Code.',
            ]);
        }

        if ($mode === 'client' || !empty($serverIp)) {
            // Client counter mode: query the Main Server
            if (empty($serverIp)) {
                return response()->json([
                    'success' => false,
                    'message' => '❌ Main Server IP is required to verify the key.',
                ]);
            }

            // Determine if server is local (same machine) or remote
            $isLocal = in_array($serverIp, ['localhost', '127.0.0.1', '::1']);

            if ($isLocal) {
                try {
                    $key = ActivationKey::where('key_code', $keyCode)
                        ->whereIn('status', ['active', 'trial'])
                        ->first();

                    if ($key) {
                        return response()->json([
                            'success'     => true,
                            'key_code'    => $key->key_code,
                            'plan_name'   => $key->plan_name,
                            'fingerprint' => $key->machine_fingerprint,
                            'message'     => "✅ Valid License Key '{$key->key_code}' verified from local Main Server database!",
                        ]);
                    }
                } catch (\Throwable $e) {
                    // Fallback to API check
                }
            }

            // Query remote Main Server's API
            $apiUrl = "http://{$serverIp}:{$serverPort}/api/installer/verify-client-key";

            try {
                $ctx = stream_context_create(['http' => [
                    'method'  => 'POST',
                    'header'  => "Content-Type: application/json\r\n",
                    'content' => json_encode(['key_code' => $keyCode]),
                    'timeout' => 5,
                    'ignore_errors' => true,
                ]]);
                $body = @file_get_contents($apiUrl, false, $ctx);

                if ($body === false) {
                    return response()->json([
                        'success' => false,
                        'message' => "❌ Cannot connect to Main Server at {$serverIp}:{$serverPort} to verify key. Check network connection."
                    ], 400);
                }

                $data = json_decode($body, true);
                if (!$data) {
                    return response()->json([
                        'success' => false,
                        'message' => "❌ Main Server at {$serverIp}:{$serverPort} returned an invalid response."
                    ], 400);
                }

                return response()->json($data);

            } catch (\Throwable $e) {
                return response()->json([
                    'success' => false,
                    'message' => "❌ Connection error verifying key: " . $e->getMessage()
                ], 400);
            }
        }

        // Invoke Cloud License Server Service directly (Verify Key Only - No Company Assignment Yet)
        $res = \App\Services\CloudLicenseServerService::verifyKeyOnly(
            $keyCode,
            \App\Services\CloudLicenseServerService::getMachineUuid()
        );

        if ($res['success']) {
            // ── MACHINE LOCK CHECK ────────────────────────────────────
            // If this is a FREE TRIAL key AND this machine has already used a
            // free trial before, reject the installation.
            // Paid / Premium keys are always allowed regardless of machine lock.
            $planName   = strtolower($res['plan_name'] ?? '');
            $isTrialKey = str_contains($planName, 'trial') || str_contains($planName, 'free');

            if ($isTrialKey && \App\Services\MachineLockService::hasUsedTrial(null)) {
                return response()->json([
                    'success' => false,
                    'message' => implode(' ', [
                        '⚠️ Free Trial Already Used on This Machine!',
                        'This computer has already used its free 14-day trial.',
                        'Please use a Paid Activation Key (1 Year / Premium plan)',
                        'generated by Super Admin to continue installation.',
                    ]),
                    'machine_locked' => true,
                ], 422);
            }

            return response()->json([
                'success'     => true,
                'key_code'    => $res['key_code'],
                'plan_name'   => $res['plan_name'],
                'fingerprint' => $res['machine_uuid'],
                'is_trial'    => $isTrialKey,
                'trial_days'  => $isTrialKey ? 14 : 365,
                'company'     => $res['company'] ?? null,
                'message'     => "✅ Valid License Key '{$res['key_code']}' verified from Super Admin Cloud Portal! Ready for installation.",
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $res['message'],
        ], 422);
    }


    // ──────────────────────────────────────────────────
    // STEP 4 — Finalize: Write .env, Create DB, Migrate, Seed
    // ──────────────────────────────────────────────────
    public function finalizeSetup(Request $request)
    {
        $steps = [];
        try {
            $bizName   = is_string($request->input('business_name')) ? trim($request->input('business_name')) : 'My Store';
            $ownerName = is_string($request->input('owner_name')) ? trim($request->input('owner_name')) : 'Admin';
            $email     = is_string($request->input('email')) ? trim($request->input('email')) : 'admin@infy-pos.com';
            $phone     = is_string($request->input('phone')) ? trim($request->input('phone')) : '9876543210';
            $adminPass = is_string($request->input('admin_password')) ? trim($request->input('admin_password')) : '123456';
            $whName    = is_string($request->input('warehouse_name')) ? trim($request->input('warehouse_name')) : 'Main Store Warehouse';
            $city      = is_string($request->input('city')) ? trim($request->input('city')) : 'Chennai';
            $state     = is_string($request->input('state')) ? trim($request->input('state')) : 'Tamil Nadu';
            $zip       = is_string($request->input('zip')) ? trim($request->input('zip')) : '600001';
            $bizType   = is_string($request->input('business_type')) ? trim($request->input('business_type')) : 'Supermarket';
            $gst       = is_string($request->input('gst_number')) ? trim($request->input('gst_number')) : '';
            $keyCode   = is_string($request->input('key_code')) ? strtoupper(trim($request->input('key_code'))) : 'INFYPOS-2026-FREE-TRIAL';

            $dbHost   = is_string($request->input('db_host')) ? trim($request->input('db_host')) : 'localhost';
            $dbPort   = is_string($request->input('db_port')) ? trim($request->input('db_port')) : '3307';
            $dbName   = is_string($request->input('db_name')) ? trim($request->input('db_name')) : 'pos';
            $dbUser   = is_string($request->input('db_user')) ? trim($request->input('db_user')) : 'root';
            $dbPass   = is_string($request->input('db_pass')) ? trim($request->input('db_pass')) : '';

            set_time_limit(300); // 5 minutes max

            // ── 1. Create database if not exists ──────────────────
            $dsn = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
            $pdo = new PDO($dsn, $dbUser, $dbPass, [PDO::ATTR_TIMEOUT => 10]);
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $steps[] = "✅ Database '{$dbName}' ready.";

            // ── 2. Dynamic DB Connection (memory with persistent timeout) ──
            $this->ensureDbConnection($dbHost, $dbPort, $dbName, $dbUser, $dbPass);
            $steps[] = "✅ Database connection reloaded.";

            // ── 3. Defer .env update to shutdown function ─────────
            $envUpdates = [
                'APP_URL'       => 'http://127.0.0.1:8000',
                'APP_NAME'      => '"' . $bizName . '"',
                'DB_CONNECTION' => 'mysql',
                'DB_HOST'       => $dbHost,
                'DB_PORT'       => $dbPort,
                'DB_DATABASE'   => $dbName,
                'DB_USERNAME'   => $dbUser,
                'DB_PASSWORD'   => $dbPass,
            ];
            register_shutdown_function(function() use ($envUpdates) {
                $this->writeEnv($envUpdates);
            });
            $steps[] = "✅ Configuration (.env) updated.";

            // ── 4. Run Migrations via Artisan ─────────────────────
            try {
                $this->ensureDbConnection($dbHost, $dbPort, $dbName, $dbUser, $dbPass);
                Artisan::call('migrate', ['--force' => true]);
                $steps[] = "✅ Database tables created / updated.";
            } catch (\Exception $me) {
                $steps[] = "ℹ️ Migrations check: " . $me->getMessage();
            }

            // ── 5. Seed default settings & clean demo transactions ─
            try {
                $this->ensureDbConnection($dbHost, $dbPort, $dbName, $dbUser, $dbPass);
                Artisan::call('db:seed', ['--force' => true]);
                self::cleanDemoData();
                $steps[] = "✅ Application data initialized & demo transactions cleared.";
            } catch (\Exception $se) {
                $steps[] = "ℹ️ Seeding status: " . $se->getMessage();
            }

            // ── 6. Create Company (Auto-Reconnect Retry) ───────────
            $company = null;
            for ($attempt = 1; $attempt <= 3; $attempt++) {
                try {
                    $this->ensureDbConnection($dbHost, $dbPort, $dbName, $dbUser, $dbPass);
                    $company = Company::firstOrCreate(
                        ['email' => $email],
                        [
                            'name'          => $bizName,
                            'owner_name'    => $ownerName,
                            'phone'         => $phone,
                            'business_type' => $bizType,
                            'gst_number'    => $gst ?: null,
                            'currency'      => 'INR',
                            'status'        => 'trial',
                            'trial_ends_at' => Carbon::now()->addDays(14),
                        ]
                    );
                    if ($company) break;
                } catch (\Throwable $cEx) {
                    if ($attempt === 3) throw $cEx;
                    sleep(1);
                }
            }
            $steps[] = "✅ Business profile created: {$bizName}.";

            // ── 7. Bind Activation Key (Strict Validation) ────────
            if (empty($keyCode)) {
                $keyCode = 'INFYPOS-2026-FREE-TRIAL';
            }

            // Ensure key exists in database before activating & bind real Client Store Name upon completion
            // Use Cloud License Server Service (infypos_cloud DB) for strict validation & Store Name binding
            $cloudRes = \App\Services\CloudLicenseServerService::activateKeyForCompany([
                'key_code'      => $keyCode,
                'business_name' => $bizName,
                'owner_name'    => $ownerName,
                'email'         => $email,
                'phone'         => $phone,
                'business_type' => $bizType,
                'gst_number'    => $gst,
                'machine_uuid'  => \App\Services\CloudLicenseServerService::getMachineUuid(),
            ]);
            if (!$cloudRes['success']) {
                throw new \Exception($cloudRes['message']);
            }
            // Mark the key on local company record and sync expiration dates
            $planNameLower = strtolower($cloudRes['plan_name'] ?? '');
            $isTrialKey = str_contains($planNameLower, 'trial') || str_contains($planNameLower, 'free');

            if ($isTrialKey) {
                $trialEndsAt = Carbon::now()->addDays(14);
                $company->update([
                    'status'               => 'trial',
                    'trial_ends_at'        => $trialEndsAt,
                    'subscription_ends_at' => $trialEndsAt,
                ]);

                // Create activation key record in local DB
                $localKey = \App\Models\ActivationKey::updateOrCreate(
                    ['key_code' => $cloudRes['key_code'] ?? $keyCode],
                    [
                        'company_id'          => $company->id,
                        'machine_fingerprint' => \App\Services\LicenseService::getMachineFingerprint(),
                        'plan_name'           => 'INFY-POS FREE TRIAL (14 Days)',
                        'price'               => 0.00,
                        'status'              => 'trial',
                        'activated_at'        => now(),
                        'expires_at'          => $trialEndsAt,
                    ]
                );
            } else {
                $keyExpiresAt = !empty($cloudRes['expires_at']) ? Carbon::parse($cloudRes['expires_at']) : now()->addYear();
                $company->update([
                    'status'               => $cloudRes['status'] ?? 'active',
                    'trial_ends_at'        => null,
                    'subscription_ends_at' => $keyExpiresAt,
                ]);

                // Create activation key record in local DB
                $localKey = \App\Models\ActivationKey::updateOrCreate(
                    ['key_code' => $cloudRes['key_code'] ?? $keyCode],
                    [
                        'company_id'          => $company->id,
                        'machine_fingerprint' => \App\Services\LicenseService::getMachineFingerprint(),
                        'plan_name'           => $cloudRes['plan_name'] ?? 'INFY-POS PREMIUM',
                        'price'               => 499.00,
                        'status'              => 'active',
                        'activated_at'        => now(),
                        'expires_at'          => $keyExpiresAt,
                    ]
                );
            }


            // Generate secure encrypted license.key file in storage/app/
            \App\Services\LicenseService::saveLocalLicenseCache($company, $localKey);

            $steps[] = "✅ License key '{$keyCode}' verified, saved locally, and bound to machine fingerprint.";

            // ── 8. Configure Admin User Credentials ────────────────
            $adminUser = User::first();
            $ownerParts = explode(' ', trim($ownerName), 2);
            $fName = !empty($ownerParts[0]) ? $ownerParts[0] : 'Admin';
            $lName = $ownerParts[1] ?? '';

            if (!$adminUser) {
                $adminUser = User::create([
                    'first_name' => $fName,
                    'last_name'  => $lName,
                    'email'      => $email,
                    'password'   => Hash::make($adminPass),
                ]);
            } else {
                $adminUser->email      = $email;
                $adminUser->first_name = $fName;
                $adminUser->last_name  = $lName;
                $adminUser->password   = Hash::make($adminPass);
            }
            $adminUser->company_id = $company->id;
            $adminUser->save();

            // Assign admin role
            try {
                $adminRole = \Spatie\Permission\Models\Role::whereName('admin')->first();
                if ($adminRole && !$adminUser->hasRole('admin')) {
                    $adminUser->assignRole($adminRole);
                }
            } catch (\Exception $re) {}

            $steps[] = "✅ Admin account ready: {$email} / Password: {$adminPass}";

            // ── 9. Single Warehouse Setup & Clean Suppliers/Warehouses ──
            try {
                DB::statement('SET FOREIGN_KEY_CHECKS=0;');
                if (\Illuminate\Support\Facades\Schema::hasTable('warehouses')) DB::table('warehouses')->truncate();
                if (\Illuminate\Support\Facades\Schema::hasTable('suppliers')) DB::table('suppliers')->truncate();
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');

                $whObj = Warehouse::create([
                    'name'     => $whName ?: ($bizName . ' Warehouse'),
                    'phone'    => $phone,
                    'email'    => $email,
                    'city'     => $city,
                    'country'  => 'India',
                    'zip_code' => $zip,
                ]);
                $steps[] = "✅ Primary warehouse created: {$whObj->name}.";

                // Update settings table with exact installer values
                $addressStr = $city . ', ' . $state . ' ' . $zip . ', India';
                Setting::updateOrCreate(['key' => 'company_name'], ['value' => $bizName]);
                Setting::updateOrCreate(['key' => 'email'], ['value' => $email]);
                Setting::updateOrCreate(['key' => 'phone'], ['value' => $phone]);
                Setting::updateOrCreate(['key' => 'address'], ['value' => $addressStr]);
                Setting::updateOrCreate(['key' => 'developed'], ['value' => $bizName]);
                Setting::updateOrCreate(['key' => 'default_warehouse'], ['value' => $whObj->id]);
                $steps[] = "✅ System settings updated with store profile.";
            } catch (\Exception $we) {
                $steps[] = "ℹ️ Store setup: " . $we->getMessage();
            }

            return response()->json([
                'success'        => true,
                'message'        => 'INFY-POS Enterprise installed successfully!',
                'steps'          => $steps,
                'key_code'       => $keyCode,
                'admin_email'    => $email,
                'admin_password' => $adminPass,
                'trial_ends'     => Carbon::now()->addDays(14)->format('d M Y'),
                'login_url'      => '/#/login',
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '❌ Installation error: ' . $e->getMessage(),
                'steps'   => $steps,
            ]);
        }
    }

    // ──────────────────────────────────────────────────
    // Helper: Parse current .env values
    // ──────────────────────────────────────────────────
    private function parseEnv(): array
    {
        $envPath = base_path('.env');
        $data = ['DB_HOST' => 'localhost', 'DB_PORT' => '3307', 'DB_DATABASE' => 'pos', 'DB_USERNAME' => 'root', 'DB_PASSWORD' => ''];
        if (!file_exists($envPath)) return $data;

        foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            if (str_starts_with(trim($line), '#')) continue;
            if (!str_contains($line, '=')) continue;
            [$key, $val] = explode('=', $line, 2);
            $key = trim($key);
            $val = trim(trim($val), '"\'');
            if (in_array($key, array_keys($data))) $data[$key] = $val;
        }
        return $data;
    }

    // ──────────────────────────────────────────────────
    // Helper: Write key=value pairs to .env
    // ──────────────────────────────────────────────────
    private function writeEnv(array $values): void
    {
        $envPath = base_path('.env');
        if (!file_exists($envPath)) return;
        $content = file_get_contents($envPath);
        $changed = false;

        foreach ($values as $key => $newVal) {
            if (preg_match("/^{$key}=.*/m", $content, $matches)) {
                if ($matches[0] !== "{$key}={$newVal}") {
                    $content = preg_replace("/^{$key}=.*/m", "{$key}={$newVal}", $content);
                    $changed = true;
                }
            } else {
                $content .= "\n{$key}={$newVal}";
                $changed = true;
            }
        }

        if ($changed) {
            file_put_contents($envPath, $content);
        }
    }

    // ──────────────────────────────────────────────────
    // Helper: Truncate demo transactions on fresh install
    // ──────────────────────────────────────────────────
    public static function cleanDemoData(): void
    {
        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            $tables = [
                'purchases', 'purchase_items', 'purchase_returns', 'purchase_return_items',
                'supplier_asns', 'lpn_cartons', 'stock_grns', 'manage_stocks', 'bin_inventories',
                'sales', 'sale_items', 'sale_returns', 'sale_return_items', 'sales_payments',
                'expenses', 'quotations', 'quotation_items', 'adjustments', 'adjustment_items'
            ];
            foreach ($tables as $t) {
                if (\Illuminate\Support\Facades\Schema::hasTable($t)) {
                    DB::table($t)->truncate();
                }
            }
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } catch (\Exception $e) {}
    }

    // ──────────────────────────────────────────────────
    // Live Support Ticket Submission API
    // ──────────────────────────────────────────────────
    public function submitSupportTicket(Request $request)
    {
        $companyName = trim($request->input('company_name', 'Anonymous Store'));
        $email       = trim($request->input('email', ''));
        $phone       = trim($request->input('phone', ''));
        $subject     = trim($request->input('subject', 'Installer Issue'));
        $description = trim($request->input('description', ''));
        $screenshot  = $request->input('screenshot'); // Base64 longtext
        $priority    = trim($request->input('priority', 'Normal'));

        if (empty($email) || empty($description)) {
            return response()->json([
                'success' => false,
                'message' => '❌ Email Address and Complaint Description are required.'
            ], 400);
        }

        $ticketNo = 'TICK-' . rand(1000, 9999);

        try {
            // Establish PDO connection to Central SuperAdmin Supabase Database
            $pdo = \App\Services\CloudLicenseServerService::getCloudPdo();

            $stmt = $pdo->prepare("
                INSERT INTO support_tickets (ticket_no, company_name, email, phone, subject, description, screenshot, priority, status, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Open', NOW(), NOW())
            ");
            $stmt->execute([$ticketNo, $companyName, $email, $phone, $subject, $description, $screenshot, $priority]);

            return response()->json([
                'success' => true,
                'message' => "🎫 Support Ticket raised successfully! Ticket ID: {$ticketNo}. Live support team notified.",
                'ticket_no' => $ticketNo
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '❌ Failed to submit ticket to Central SuperAdmin Supabase DB: ' . $e->getMessage()
            ], 500);
        }
    }

    // ──────────────────────────────────────────────────
    // Direct Online Key Purchase & Cloud Registration API
    // ──────────────────────────────────────────────────
    public function purchasePremiumKey(Request $request)
    {
        $email       = trim($request->input('email', ''));
        $phone       = trim($request->input('phone', ''));
        $machineUuid = trim($request->input('machine_uuid', ''));

        if (empty($email) || empty($phone)) {
            return response()->json([
                'success' => false,
                'message' => '❌ Email address and mobile phone number are required.'
            ], 400);
        }

        try {
            $pdo = \App\Services\CloudLicenseServerService::getCloudPdo();

            // 1. Check/Register Company in Cloud DB to connect the key correctly
            $cStmt = $pdo->prepare("SELECT id FROM companies WHERE email = ? LIMIT 1");
            $cStmt->execute([$email]);
            $company = $cStmt->fetch();

            $nowStr = \Carbon\Carbon::now()->toDateTimeString();
            $expiresAt = \Carbon\Carbon::now()->addMonth()->toDateTimeString();

            if ($company) {
                $companyId = $company['id'];
                $uStmt = $pdo->prepare("UPDATE companies SET phone = ?, status = 'active', subscription_ends_at = ?, updated_at = NOW() WHERE id = ?");
                $uStmt->execute([$phone, $expiresAt, $companyId]);
            } else {
                $iStmt = $pdo->prepare("INSERT INTO companies (name, owner_name, email, phone, business_type, status, subscription_ends_at, created_at, updated_at) VALUES ('New Store Registration', 'Store Owner', ?, ?, 'Supermarket', 'active', ?, NOW(), NOW()) RETURNING id");
                $iStmt->execute([$email, $phone, $expiresAt]);
                $companyId = $iStmt->fetchColumn();
            }

            // 2. Generate a clean random unique Key Code
            $isUnique = false;
            $keyCode = '';
            while (!$isUnique) {
                $randomCode = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
                $keyCode = 'INFYPOS-2026-KEY-' . substr($randomCode, 0, 4) . '-' . substr($randomCode, 4, 4);

                $kCheck = $pdo->prepare("SELECT COUNT(*) FROM activation_keys WHERE key_code = ?");
                $kCheck->execute([$keyCode]);
                if ($kCheck->fetchColumn() == 0) {
                    $isUnique = true;
                }
            }

            // 3. Register Key in Cloud activation_keys table as 'unused' with 1 Month validity
            $stmt = $pdo->prepare("
                INSERT INTO activation_keys (key_code, company_id, machine_fingerprint, plan_name, price, status, expires_at, created_at, updated_at) 
                VALUES (?, ?, NULL, 'INFY-POS PREMIUM (Monthly)', 499.00, 'unused', ?, NOW(), NOW())
            ");
            $stmt->execute([$keyCode, $companyId, $expiresAt]);

            return response()->json([
                'success'    => true,
                'key_code'   => $keyCode,
                'plan_name'  => 'INFY-POS PREMIUM (Monthly)',
                'expires_at' => \Carbon\Carbon::now()->addMonth()->format('d M Y'),
                'message'    => "🎉 Premium Activation Key generated successfully in Super Admin cloud registry!"
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => '❌ Key generation database failure: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ensure MySQL Connection is Active and Healthy (Prevents 'MySQL server has gone away')
     */
    protected function ensureDbConnection($dbHost, $dbPort, $dbName, $dbUser, $dbPass)
    {
        set_time_limit(600);

        try {
            DB::connection()->getPdo();
            DB::statement('SELECT 1');
        } catch (\Throwable $t) {
            config([
                'database.connections.mysql.host'      => $dbHost,
                'database.connections.mysql.port'      => $dbPort,
                'database.connections.mysql.database'  => $dbName,
                'database.connections.mysql.username'  => $dbUser,
                'database.connections.mysql.password'  => $dbPass,
                'database.connections.mysql.options'   => [
                    \PDO::ATTR_ERRMODE            => \PDO::ERRMODE_EXCEPTION,
                    \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                    \PDO::ATTR_TIMEOUT            => 600,
                ],
            ]);
            DB::purge('mysql');
            DB::reconnect('mysql');
        }

        try {
            DB::statement("SET SESSION wait_timeout=28800");
            DB::statement("SET SESSION interactive_timeout=28800");
            DB::statement("SET SESSION max_allowed_packet=67108864");
        } catch (\Throwable $ex) {}
    }
}

