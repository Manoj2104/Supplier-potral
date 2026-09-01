<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_id');
            $table->foreign('purchase_id')
                ->references('id')->on('purchases')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->unsignedBigInteger('product_id');
            $table->foreign('product_id')->references('id')
                ->on('products')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            $table->float('product_cost')->nullable();
            $table->float('net_unit_cost')->nullable();
            $table->integer('tax_type');
            $table->float('tax_value')->nullable();
            $table->float('tax_amount')->nullable();
            $table->integer('discount_type');
            $table->float('discount_value')->nullable();
            $table->float('discount_amount')->nullable();
            $table->integer('purchase_unit');
            $table->float('quantity')->nullable();
            $table->float('sub_total')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
    }
};
