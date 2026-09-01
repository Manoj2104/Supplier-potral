<?php
// ============================================================
// INFY-POS Enterprise — Performance Index Migration
//
// Adds carefully selected indexes based on actual query patterns:
//   - POS barcode scan (hottest query path)
//   - Product name search
//   - Sales reports (by customer, warehouse, date, status)
//   - Stock lookup by product+warehouse
//   - Purchase queries by supplier and date
//
// SAFE: Uses CREATE INDEX IF NOT EXISTS — idempotent.
// Run this ONCE after deployment using:
//   php artisan migrate
// ============================================================

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Uses raw SQL for IF NOT EXISTS support (Laravel's Schema builder
     * doesn't have hasIndex for all drivers).
     */
    public function up(): void
    {
        // ── products table ──────────────────────────────────────
        // The hottest query: POS barcode scan
        $this->addIndexIfNotExists('products', 'products_code_index',         ['code']);
        $this->addIndexIfNotExists('products', 'products_barcode_index',      ['barcode']);
        $this->addIndexIfNotExists('products', 'products_name_index',         ['name']);
        $this->addIndexIfNotExists('products', 'products_category_id_index',  ['category_id']);
        $this->addIndexIfNotExists('products', 'products_brand_id_index',     ['brand_id']);

        // ── sales table ─────────────────────────────────────────
        // Used heavily in reports, Day-End register, and customer history
        $this->addIndexIfNotExists('sales', 'sales_customer_id_index',   ['customer_id']);
        $this->addIndexIfNotExists('sales', 'sales_warehouse_id_index',  ['warehouse_id']);
        $this->addIndexIfNotExists('sales', 'sales_created_at_index',    ['created_at']);
        $this->addIndexIfNotExists('sales', 'sales_payment_status_index', ['payment_status']);
        $this->addIndexIfNotExists('sales', 'sales_status_index',         ['status']);

        // Composite: status + date — used in report filters
        $this->addIndexIfNotExists('sales', 'sales_status_created_index', ['status', 'created_at']);

        // ── sale_items table ────────────────────────────────────
        // Joined on sale_id for every invoice render
        $this->addIndexIfNotExists('sale_items', 'sale_items_sale_id_index',    ['sale_id']);
        $this->addIndexIfNotExists('sale_items', 'sale_items_product_id_index', ['product_id']);

        // ── manage_stocks table ─────────────────────────────────
        // Critical: stock lookup on barcode scan
        // Query: WHERE product_id = ? AND warehouse_id = ?
        $this->addIndexIfNotExists('manage_stocks', 'manage_stocks_product_warehouse_index',
            ['product_id', 'warehouse_id']);

        // ── purchases table ─────────────────────────────────────
        $this->addIndexIfNotExists('purchases', 'purchases_supplier_id_index', ['supplier_id']);
        $this->addIndexIfNotExists('purchases', 'purchases_warehouse_id_index', ['warehouse_id']);
        $this->addIndexIfNotExists('purchases', 'purchases_created_at_index',  ['created_at']);
        $this->addIndexIfNotExists('purchases', 'purchases_status_index',       ['status']);

        // ── purchase_items table ─────────────────────────────────
        $this->addIndexIfNotExists('purchase_items', 'purchase_items_purchase_id_index', ['purchase_id']);
        $this->addIndexIfNotExists('purchase_items', 'purchase_items_product_id_index',  ['product_id']);

        // ── customers table ─────────────────────────────────────
        $this->addIndexIfNotExists('customers', 'customers_name_index',  ['name']);
        $this->addIndexIfNotExists('customers', 'customers_phone_index', ['phone']);
        $this->addIndexIfNotExists('customers', 'customers_email_index', ['email']);

        // ── suppliers table ─────────────────────────────────────
        $this->addIndexIfNotExists('suppliers', 'suppliers_name_index', ['name']);

        // ── expenses table ──────────────────────────────────────
        $this->addIndexIfNotExists('expenses', 'expenses_created_at_index',    ['created_at']);
        $this->addIndexIfNotExists('expenses', 'expenses_category_id_index',   ['expense_category_id']);
        $this->addIndexIfNotExists('expenses', 'expenses_warehouse_id_index',  ['warehouse_id']);

        // ── transfers table ─────────────────────────────────────
        $this->addIndexIfNotExists('transfers', 'transfers_from_warehouse_index', ['from_warehouse_id']);
        $this->addIndexIfNotExists('transfers', 'transfers_to_warehouse_index',   ['to_warehouse_id']);
        $this->addIndexIfNotExists('transfers', 'transfers_created_at_index',     ['created_at']);

        // ── quotations table ────────────────────────────────────
        $this->addIndexIfNotExists('quotations', 'quotations_customer_id_index', ['customer_id']);
        $this->addIndexIfNotExists('quotations', 'quotations_created_at_index',  ['created_at']);

        // ── sales_returns table ─────────────────────────────────
        $this->addIndexIfNotExists('sales_returns', 'sales_returns_sale_id_index',   ['sale_id']);
        $this->addIndexIfNotExists('sales_returns', 'sales_returns_created_at_index', ['created_at']);

        // ── purchase_returns table ──────────────────────────────
        $this->addIndexIfNotExists('purchase_returns', 'purchase_returns_purchase_id_index', ['purchase_id']);

        // ── warehouse_bins, bin_inventories ─────────────────────
        $this->addIndexIfNotExists('bin_inventories', 'bin_inventories_product_bin_index', ['product_id', 'bin_id']);
    }

    /**
     * Reverse the migrations — drop all added indexes.
     */
    public function down(): void
    {
        $indexesToDrop = [
            'products'          => ['products_code_index', 'products_barcode_index', 'products_name_index', 'products_category_id_index', 'products_brand_id_index'],
            'sales'             => ['sales_customer_id_index', 'sales_warehouse_id_index', 'sales_created_at_index', 'sales_payment_status_index', 'sales_status_index', 'sales_status_created_index'],
            'sale_items'        => ['sale_items_sale_id_index', 'sale_items_product_id_index'],
            'manage_stocks'     => ['manage_stocks_product_warehouse_index'],
            'purchases'         => ['purchases_supplier_id_index', 'purchases_warehouse_id_index', 'purchases_created_at_index', 'purchases_status_index'],
            'purchase_items'    => ['purchase_items_purchase_id_index', 'purchase_items_product_id_index'],
            'customers'         => ['customers_name_index', 'customers_phone_index', 'customers_email_index'],
            'suppliers'         => ['suppliers_name_index'],
            'expenses'          => ['expenses_created_at_index', 'expenses_category_id_index', 'expenses_warehouse_id_index'],
            'transfers'         => ['transfers_from_warehouse_index', 'transfers_to_warehouse_index', 'transfers_created_at_index'],
            'quotations'        => ['quotations_customer_id_index', 'quotations_created_at_index'],
            'sales_returns'     => ['sales_returns_sale_id_index', 'sales_returns_created_at_index'],
            'purchase_returns'  => ['purchase_returns_purchase_id_index'],
            'bin_inventories'   => ['bin_inventories_product_bin_index'],
        ];

        foreach ($indexesToDrop as $table => $indexes) {
            foreach ($indexes as $index) {
                try {
                    if (Schema::hasTable($table)) {
                        Schema::table($table, fn(Blueprint $t) => $t->dropIndex($index));
                    }
                } catch (\Throwable) {
                    // Index may not exist — silently skip
                }
            }
        }
    }

    // ── Helper ─────────────────────────────────────────────────

    /**
     * Adds a regular (non-unique) index only if it doesn't already exist.
     * Idempotent — safe to run multiple times.
     */
    private function addIndexIfNotExists(string $table, string $indexName, array $columns): void
    {
        try {
            if (!Schema::hasTable($table)) return;

            // Check if index already exists via information_schema
            $exists = DB::select(
                "SELECT COUNT(*) as cnt FROM information_schema.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = ?
                   AND INDEX_NAME = ?",
                [$table, $indexName]
            );

            if (($exists[0]->cnt ?? 0) > 0) return; // Already exists

            Schema::table($table, function (Blueprint $t) use ($columns, $indexName) {
                $t->index($columns, $indexName);
            });
        } catch (\Throwable $e) {
            // Log and continue — don't break migration for a non-critical index
            \Illuminate\Support\Facades\Log::warning(
                "Performance index '{$indexName}' on '{$table}' could not be created: " . $e->getMessage()
            );
        }
    }
};
