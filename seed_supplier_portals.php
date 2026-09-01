<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\SupplierPortal;
use Illuminate\Support\Facades\Hash;

// Ensure Warehouse 1 exists
\App\Models\Warehouse::firstOrCreate(['id' => 1], [
    'name' => 'Main Warehouse',
    'phone' => '9876543210',
    'country' => 'India',
    'city' => 'Chennai',
    'email' => 'warehouse@nandhini.com',
    'zip' => '600001'
]);

// Ensure Supplier 1 & 2 exist
\App\Models\Supplier::firstOrCreate(['id' => 1], [
    'name' => 'Apex Appliance Distributors',
    'email' => 'apex@appliances.com',
    'phone' => '9876543210',
    'country' => 'India',
    'city' => 'Chennai',
    'address' => '104 Industrial Estate'
]);

\App\Models\Supplier::firstOrCreate(['id' => 2], [
    'name' => 'Supreme Wholesale Electronics',
    'email' => 'supreme@wholesale.com',
    'phone' => '9876543211',
    'country' => 'India',
    'city' => 'Chennai',
    'address' => '55 Tech Park'
]);

// Check if already exists
$existing = SupplierPortal::where('supplier_id', 1)->first();
if ($existing) {
    echo "Portal account already exists: " . $existing->supplier_code . "\n";
} else {
    $portal = SupplierPortal::create([
        'supplier_id'   => 1,
        'username'      => 'apex@appliances.com',
        'password'      => Hash::make('Supplier@2026'),
        'supplier_code' => 'SUP-00001',
        'phone'         => '9876543210',
        'status'        => 'active',
        'kyc_status'    => 'verified',
    ]);
    echo "Created portal account: " . $portal->supplier_code . " for Apex Appliance Distributors\n";
}

// Create second
$existing2 = SupplierPortal::where('supplier_id', 2)->first();
if (!$existing2) {
    $portal2 = SupplierPortal::create([
        'supplier_id'   => 2,
        'username'      => 'supreme@wholesale.com',
        'password'      => Hash::make('Supplier@2026'),
        'supplier_code' => 'SUP-00002',
        'phone'         => '9876543211',
        'status'        => 'active',
        'kyc_status'    => 'pending',
    ]);
    echo "Created portal account: " . $portal2->supplier_code . " for Supreme Electronics\n";
}

echo "Done!\n";
