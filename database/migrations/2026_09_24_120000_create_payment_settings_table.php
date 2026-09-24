<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('payment_settings')) {
            Schema::create('payment_settings', function (Blueprint $table) {
                $table->id();
                $table->string('active_provider', 32)->default('razorpay'); // 'razorpay' or 'system'
                $table->boolean('razorpay_enabled')->default(true);
                $table->boolean('system_payment_enabled')->default(false);
                $table->string('razorpay_mode', 16)->default('test'); // 'test' or 'live'
                $table->string('razorpay_key_id')->nullable();
                $table->text('razorpay_key_secret_encrypted')->nullable();
                $table->text('razorpay_webhook_secret_encrypted')->nullable();
                $table->string('razorpay_plan_id')->nullable()->default('plan_INFYPOS_MONTHLY_499');
                $table->string('merchant_name')->nullable()->default('INFY-POS Enterprise');
                $table->string('system_payment_mode', 32)->default('system');
                $table->string('system_payment_verification', 32)->default('automatic'); // 'automatic' or 'manual'
                $table->string('currency', 10)->default('INR');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
                $table->timestamps();
            });

            // Seed singleton default configuration
            $keySecret = env('RAZORPAY_KEY_SECRET', 'IJV3Oz9jY2oreUMtxVr77iOI');
            $whSecret  = env('RAZORPAY_WEBHOOK_SECRET', 'rzp_whsec_infypos2026_webhook');

            DB::table('payment_settings')->insert([
                'active_provider'                   => 'razorpay',
                'razorpay_enabled'                  => true,
                'system_payment_enabled'            => false,
                'razorpay_mode'                     => env('RAZORPAY_MODE', 'test'),
                'razorpay_key_id'                   => env('RAZORPAY_KEY_ID', 'rzp_test_TfUvXTbtZxl0LL'),
                'razorpay_key_secret_encrypted'     => Crypt::encryptString($keySecret),
                'razorpay_webhook_secret_encrypted' => Crypt::encryptString($whSecret),
                'razorpay_plan_id'                  => 'plan_INFYPOS_MONTHLY_499',
                'merchant_name'                     => 'INFY-POS Enterprise',
                'system_payment_mode'               => 'system',
                'system_payment_verification'       => 'automatic',
                'currency'                          => 'INR',
                'created_at'                        => now(),
                'updated_at'                        => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_settings');
    }
};
