<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lpn_cartons', function (Blueprint $table) {
            $table->id();
            $table->string('lpn_number')->unique();
            $table->string('carton_number')->default('Carton 1');
            $table->unsignedBigInteger('asn_id');
            $table->foreign('asn_id')->references('id')->on('supplier_asns')->onDelete('cascade');
            $table->unsignedBigInteger('purchase_id');
            $table->foreign('purchase_id')->references('id')->on('purchases')->onDelete('cascade');
            $table->unsignedBigInteger('supplier_id');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('cascade');
            $table->unsignedBigInteger('warehouse_id')->nullable();
            $table->string('carton_type')->default('Medium Box');
            $table->string('dimensions')->default('40 x 30 x 30 cm');
            $table->decimal('weight', 8, 2)->default(0.00); // KG
            $table->decimal('volume', 8, 3)->default(0.000); // m³
            $table->integer('max_capacity')->default(500);
            $table->string('status')->default('Ready for Dispatch');
            $table->boolean('is_printed')->default(false);
            $table->string('created_by')->default('Ramesh Kumar');
            $table->timestamps();
        });

        Schema::create('lpn_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lpn_carton_id');
            $table->foreign('lpn_carton_id')->references('id')->on('lpn_cartons')->onDelete('cascade');
            $table->unsignedBigInteger('product_id');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->string('sku')->nullable();
            $table->string('barcode')->nullable();
            $table->string('batch_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->integer('packed_quantity')->default(1);
            $table->integer('received_quantity')->default(0);
            $table->string('status')->default('packed');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lpn_items');
        Schema::dropIfExists('lpn_cartons');
    }
};
