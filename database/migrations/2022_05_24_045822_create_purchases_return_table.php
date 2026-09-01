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
        Schema::create('purchases_return', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->unsignedBigInteger('supplier_id');
            $table->foreign('supplier_id')->references('id')
                ->on('suppliers')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->unsignedBigInteger('warehouse_id');
            $table->foreign('warehouse_id')->references('id')
                ->on('warehouses')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->float('tax_rate')->nullable();
            $table->float('tax_amount')->nullable();
            $table->float('discount')->nullable();
            $table->float('shipping')->nullable();
            $table->float('grand_total')->nullable();
            $table->float('received_amount')->nullable();
            $table->float('paid_amount')->nullable();
            $table->integer('payment_type')->nullable();
            $table->integer('status')->nullable();
            $table->integer('payment_status')->nullable();
            $table->text('notes')->nullable();
            $table->string('reference_code')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases_return');
    }
};
