<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $addIndexSafely = function (string $table, array $columns, string $indexName) {
            if (!Schema::hasTable($table)) return;

            try {
                Schema::table($table, function (Blueprint $t) use ($columns, $indexName) {
                    $t->index($columns, $indexName);
                });
            } catch (\Throwable $e) {
                // Index already exists or handled
            }
        };

        // 1. Products Table Indexes
        $addIndexSafely('products', ['product_category_id'], 'idx_products_cat_id');
        $addIndexSafely('products', ['brand_id'], 'idx_products_brand_id');
        $addIndexSafely('products', ['main_product_id'], 'idx_products_main_prod_id');
        $addIndexSafely('products', ['code'], 'idx_products_code');
        $addIndexSafely('products', ['updated_at'], 'idx_products_updated_at');

        // 2. Sales Table Indexes
        $addIndexSafely('sales', ['customer_id'], 'idx_sales_customer_id');
        $addIndexSafely('sales', ['warehouse_id'], 'idx_sales_warehouse_id');
        $addIndexSafely('sales', ['date'], 'idx_sales_date');
        $addIndexSafely('sales', ['status'], 'idx_sales_status');

        // 3. Purchases Table Indexes
        $addIndexSafely('purchases', ['supplier_id'], 'idx_purchases_supplier_id');
        $addIndexSafely('purchases', ['warehouse_id'], 'idx_purchases_warehouse_id');
        $addIndexSafely('purchases', ['date'], 'idx_purchases_date');
        $addIndexSafely('purchases', ['status'], 'idx_purchases_status');

        // 4. Sale Items & Purchase Items Indexes
        $addIndexSafely('sale_items', ['sale_id', 'product_id'], 'idx_sale_items_sale_prod');
        $addIndexSafely('purchase_items', ['purchase_id', 'product_id'], 'idx_purch_items_purch_prod');

        // 5. Manage Stocks Table Indexes
        $addIndexSafely('manage_stocks', ['product_id', 'warehouse_id'], 'idx_manage_stocks_prod_wh');
        $addIndexSafely('manage_stocks', ['quantity'], 'idx_manage_stocks_qty');

        // 6. Supplier ASNs & Cartons Indexes
        $addIndexSafely('supplier_asns', ['supplier_id', 'status'], 'idx_supplier_asns_sup_status');
        $addIndexSafely('lpn_cartons', ['supplier_id', 'status'], 'idx_lpn_cartons_sup_status');
    }

    public function down(): void
    {
    }
};
