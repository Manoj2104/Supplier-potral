<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Active Database: " . config('database.connections.mysql.database') . "\n";
echo "Products count: " . \App\Models\Product::count() . "\n";
foreach (\App\Models\Product::all() as $p) {
    echo " - Product: {$p->name} (Code: {$p->code})\n";
}

echo "Customers count: " . \App\Models\Customer::count() . "\n";
foreach (\App\Models\Customer::all() as $c) {
    echo " - Customer: {$c->name}\n";
}
