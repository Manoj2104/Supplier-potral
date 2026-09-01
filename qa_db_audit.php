<?php
require __DIR__ . '/bootstrap/app.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n=== INFY-POS COMPLETE DATABASE AUDIT ===\n\n";

$tables = [
    'products', 'sales', 'purchases', 'customers', 'suppliers',
    'expenses', 'transfers', 'quotations', 'adjustments', 'manage_stocks',
    'warehouses', 'users', 'roles', 'sales_returns', 'purchase_returns',
    'sale_items', 'purchase_items', 'expense_categories', 'brands',
    'product_categories', 'units', 'transfer_items',
    'warehouse_bins', 'bin_inventories', 'supplier_asns'
];

echo "=== TABLE ROW COUNTS ===\n";
foreach ($tables as $table) {
    try {
        $count = DB::table($table)->count();
        echo "$table: $count\n";
    } catch (\Exception $e) {
        echo "$table: ERROR\n";
    }
}

echo "\n=== SAMPLE PRODUCTS (first 5) ===\n";
try {
    $products = DB::table('products')
        ->leftJoin('product_categories', 'products.category_id', '=', 'product_categories.id')
        ->select('products.id', 'products.name', 'products.code', 'products.product_price', 'products.product_cost', 'product_categories.name as category')
        ->limit(5)->get();
    foreach ($products as $p) {
        echo "  ID:{$p->id} | {$p->name} | Code:{$p->code} | Price:{$p->product_price} | Cost:{$p->product_cost} | Cat:{$p->category}\n";
    }
} catch(\Exception $e) { echo "ERROR: " . $e->getMessage() . "\n"; }

echo "\n=== MANAGE_STOCKS (stock levels) ===\n";
try {
    $stocks = DB::table('manage_stocks')
        ->leftJoin('products', 'manage_stocks.product_id', '=', 'products.id')
        ->leftJoin('warehouses', 'manage_stocks.warehouse_id', '=', 'warehouses.id')
        ->select('products.name as product', 'manage_stocks.quantity', 'warehouses.name as warehouse')
        ->limit(10)->get();
    foreach ($stocks as $s) {
        echo "  Product:{$s->product} | Qty:{$s->quantity} | Warehouse:{$s->warehouse}\n";
    }
} catch(\Exception $e) { echo "ERROR: " . $e->getMessage() . "\n"; }

echo "\n=== RECENT SALES (last 5) ===\n";
try {
    $sales = DB::table('sales')
        ->leftJoin('customers', 'sales.customer_id', '=', 'customers.id')
        ->select('sales.id', 'sales.reference_code', 'sales.grand_total', 'sales.paid_amount', 'sales.payment_status', 'sales.status', 'customers.name as customer')
        ->orderBy('sales.id', 'desc')->limit(5)->get();
    foreach ($sales as $s) {
        echo "  ID:{$s->id} | Ref:{$s->reference_code} | Total:{$s->grand_total} | Paid:{$s->paid_amount} | PayStatus:{$s->payment_status} | Status:{$s->status} | Customer:{$s->customer}\n";
    }
} catch(\Exception $e) { echo "ERROR: " . $e->getMessage() . "\n"; }

echo "\n=== RECENT PURCHASES (last 5) ===\n";
try {
    $purchases = DB::table('purchases')
        ->leftJoin('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
        ->select('purchases.id', 'purchases.reference_code', 'purchases.grand_total', 'purchases.status', 'suppliers.name as supplier')
        ->orderBy('purchases.id', 'desc')->limit(5)->get();
    foreach ($purchases as $p) {
        echo "  ID:{$p->id} | Ref:{$p->reference_code} | Total:{$p->grand_total} | Status:{$p->status} | Supplier:{$p->supplier}\n";
    }
} catch(\Exception $e) { echo "ERROR: " . $e->getMessage() . "\n"; }

echo "\n=== DATA INTEGRITY CHECKS ===\n";
// Orphan sale_items
try {
    $count = DB::table('sale_items')->leftJoin('sales', 'sale_items.sale_id', '=', 'sales.id')->whereNull('sales.id')->count();
    echo "Orphan sale_items (no parent sale): $count " . ($count > 0 ? "❌" : "✅") . "\n";
} catch(\Exception $e) { echo "sale_items check ERROR\n"; }

// Orphan purchase_items
try {
    $count = DB::table('purchase_items')->leftJoin('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')->whereNull('purchases.id')->count();
    echo "Orphan purchase_items (no parent purchase): $count " . ($count > 0 ? "❌" : "✅") . "\n";
} catch(\Exception $e) { echo "purchase_items check ERROR\n"; }

// Negative stock
try {
    $neg = DB::table('manage_stocks')->leftJoin('products', 'manage_stocks.product_id', '=', 'products.id')->where('manage_stocks.quantity', '<', 0)->select('products.name', 'manage_stocks.quantity')->get();
    if ($neg->isEmpty()) { echo "No negative stock ✅\n"; }
    else { foreach ($neg as $n) { echo "  NEGATIVE STOCK: {$n->name} = {$n->quantity} ❌\n"; } }
} catch(\Exception $e) { echo "Negative stock check ERROR\n"; }

// Duplicate product codes
try {
    $dups = DB::table('products')->select('code', DB::raw('count(*) as cnt'))->groupBy('code')->having('cnt', '>', 1)->get();
    if ($dups->isEmpty()) { echo "No duplicate product codes ✅\n"; }
    else { foreach ($dups as $d) { echo "  DUPLICATE CODE: {$d->code} appears {$d->cnt} times ❌\n"; } }
} catch(\Exception $e) { echo "Duplicate check ERROR\n"; }

// Sales with total = 0
try {
    $zeroSales = DB::table('sales')->where('grand_total', 0)->count();
    echo "Sales with grand_total=0: $zeroSales " . ($zeroSales > 0 ? "⚠️" : "✅") . "\n";
} catch(\Exception $e) { echo "Zero sales check ERROR\n"; }

echo "\n=== USERS & ROLES ===\n";
try {
    $users = DB::table('users')
        ->leftJoin('model_has_roles', function($j) {
            $j->on('model_has_roles.model_id', '=', 'users.id')
              ->where('model_has_roles.model_type', '=', 'App\\Models\\User');
        })
        ->leftJoin('roles', 'model_has_roles.role_id', '=', 'roles.id')
        ->select('users.id', 'users.name', 'users.email', 'roles.name as role')
        ->get();
    foreach ($users as $u) {
        echo "  User:{$u->name} | Email:{$u->email} | Role:{$u->role}\n";
    }
} catch(\Exception $e) { echo "Users check ERROR: " . $e->getMessage() . "\n"; }

echo "\n=== QUOTATIONS ===\n";
try {
    $quotations = DB::table('quotations')->select('id', 'reference_code', 'status', 'grand_total')->orderBy('id', 'desc')->limit(5)->get();
    foreach ($quotations as $q) {
        echo "  ID:{$q->id} | Ref:{$q->reference_code} | Status:{$q->status} | Total:{$q->grand_total}\n";
    }
} catch(\Exception $e) { echo "Quotations check ERROR\n"; }

echo "\n=== ADJUSTMENTS ===\n";
try {
    $adjs = DB::table('adjustments')->select('id', 'reference_code', 'created_at')->orderBy('id', 'desc')->limit(5)->get();
    foreach ($adjs as $a) {
        echo "  ID:{$a->id} | Ref:{$a->reference_code} | Date:{$a->created_at}\n";
    }
} catch(\Exception $e) { echo "Adjustments check ERROR\n"; }

echo "\n=== TRANSFERS ===\n";
try {
    $transfers = DB::table('transfers')->select('id', 'reference_code', 'status', 'created_at')->orderBy('id', 'desc')->limit(5)->get();
    foreach ($transfers as $t) {
        echo "  ID:{$t->id} | Ref:{$t->reference_code} | Status:{$t->status}\n";
    }
} catch(\Exception $e) { echo "Transfers check ERROR\n"; }

echo "\n=== EXPENSE CATEGORIES ===\n";
try {
    $cats = DB::table('expense_categories')->select('id', 'name')->get();
    foreach ($cats as $c) { echo "  {$c->id}: {$c->name}\n"; }
} catch(\Exception $e) { echo "Expense categories check ERROR\n"; }

echo "\n=== SALE RETURNS ===\n";
try {
    $returns = DB::table('sales_returns')->select('id', 'reference_code', 'grand_total', 'status')->orderBy('id', 'desc')->limit(5)->get();
    foreach ($returns as $r) {
        echo "  ID:{$r->id} | Ref:{$r->reference_code} | Total:{$r->grand_total} | Status:{$r->status}\n";
    }
} catch(\Exception $e) { echo "Sale returns check ERROR: " . $e->getMessage() . "\n"; }

echo "\n=== PURCHASE RETURNS ===\n";
try {
    $returns = DB::table('purchase_returns')->select('id', 'reference_code', 'grand_total', 'status')->orderBy('id', 'desc')->limit(5)->get();
    foreach ($returns as $r) {
        echo "  ID:{$r->id} | Ref:{$r->reference_code} | Total:{$r->grand_total} | Status:{$r->status}\n";
    }
} catch(\Exception $e) { echo "Purchase returns check ERROR: " . $e->getMessage() . "\n"; }

echo "\n=== AUDIT COMPLETE ===\n";
