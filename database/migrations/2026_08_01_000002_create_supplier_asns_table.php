<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_asns', function (Blueprint $table) {
            $table->id();
            $table->string('asn_number')->unique();
            $table->unsignedBigInteger('purchase_id');
            $table->foreign('purchase_id')->references('id')->on('purchases')->onDelete('cascade');
            $table->unsignedBigInteger('supplier_id');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('cascade');
            $table->string('vehicle_number')->nullable();
            $table->string('driver_name')->nullable();
            $table->string('driver_mobile')->nullable();
            $table->string('transport_company')->nullable();
            $table->string('lr_number')->nullable();
            $table->string('invoice_number')->nullable();
            $table->string('eway_bill')->nullable();
            $table->date('dispatch_date')->nullable();
            $table->date('expected_arrival')->nullable();
            $table->text('remarks')->nullable();
            $table->string('invoice_pdf')->nullable();
            $table->string('packing_list')->nullable();
            $table->string('lr_copy')->nullable();
            $table->json('images')->nullable();
            $table->enum('status', ['draft', 'pending', 'accepted', 'rejected', 'in_transit', 'arrived', 'completed'])->default('draft');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_asns');
    }
};
