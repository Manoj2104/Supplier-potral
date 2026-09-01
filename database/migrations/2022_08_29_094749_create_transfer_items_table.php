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
        Schema::create('transfer_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('transfer_id');
            $table->foreign('transfer_id')
                ->references('id')->on('transfers')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->unsignedBigInteger('product_id');
            $table->foreign('product_id')->references('id')
                ->on('products')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            $table->float('product_price')->nullable();
            $table->float('net_unit_price')->nullable();
            $table->integer('tax_type');
            $table->float('tax_value')->nullable();
            $table->float('tax_amount')->nullable();
            $table->integer('discount_type');
            $table->float('discount_value')->nullable();
            $table->float('discount_amount')->nullable();
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
        Schema::dropIfExists('transfer_items');
    }
};
