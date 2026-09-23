<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for Production-Grade Razorpay Subscriptions & Webhook idempotency.
     */
    public function up(): void
    {
        // 1. Webhook Event Log Table (Strict Idempotency)
        if (!Schema::hasTable('razorpay_webhook_events')) {
            Schema::create('razorpay_webhook_events', function (Blueprint $table) {
                $table->id();
                $table->string('event_id')->unique();
                $table->string('event_type')->index();
                $table->string('payload_hash')->index();
                $table->longText('payload')->nullable();
                $table->string('processing_status')->default('processed')->index();
                $table->text('error_message')->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->timestamps();
            });
        }

        // 2. Subscription Payments Table
        if (!Schema::hasTable('subscription_payments')) {
            Schema::create('subscription_payments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->unsignedBigInteger('company_id')->index();
                $table->unsignedBigInteger('subscription_id')->nullable()->index();
                $table->string('razorpay_payment_id')->unique();
                $table->string('razorpay_order_id')->nullable()->index();
                $table->string('razorpay_subscription_id')->nullable()->index();
                $table->string('razorpay_signature')->nullable();
                $table->decimal('amount', 10, 2)->default(499.00);
                $table->string('currency', 10)->default('INR');
                $table->string('status')->default('captured')->index(); // captured, failed, refunded
                $table->string('method')->nullable(); // upi, card, netbanking, wallet
                $table->string('email')->nullable();
                $table->string('contact')->nullable();
                $table->timestamp('captured_at')->nullable();
                $table->text('failure_reason')->nullable();
                $table->json('raw_reference')->nullable();
                $table->timestamps();
            });
        }

        // 3. Extend Company Subscriptions Table
        if (Schema::hasTable('company_subscriptions')) {
            Schema::table('company_subscriptions', function (Blueprint $table) {
                if (!Schema::hasColumn('company_subscriptions', 'razorpay_subscription_id')) {
                    $table->string('razorpay_subscription_id')->nullable()->index()->after('razorpay_order_id');
                }
                if (!Schema::hasColumn('company_subscriptions', 'razorpay_plan_id')) {
                    $table->string('razorpay_plan_id')->nullable()->after('razorpay_subscription_id');
                }
                if (!Schema::hasColumn('company_subscriptions', 'razorpay_customer_id')) {
                    $table->string('razorpay_customer_id')->nullable()->after('razorpay_plan_id');
                }
                if (!Schema::hasColumn('company_subscriptions', 'billing_interval')) {
                    $table->string('billing_interval')->default('monthly')->after('amount');
                }
                if (!Schema::hasColumn('company_subscriptions', 'auto_renewal')) {
                    $table->boolean('auto_renewal')->default(true)->after('billing_interval');
                }
                if (!Schema::hasColumn('company_subscriptions', 'current_period_start')) {
                    $table->timestamp('current_period_start')->nullable()->after('starts_at');
                }
                if (!Schema::hasColumn('company_subscriptions', 'current_period_end')) {
                    $table->timestamp('current_period_end')->nullable()->after('ends_at');
                }
                if (!Schema::hasColumn('company_subscriptions', 'next_billing_at')) {
                    $table->timestamp('next_billing_at')->nullable()->after('current_period_end');
                }
                if (!Schema::hasColumn('company_subscriptions', 'grace_period_until')) {
                    $table->timestamp('grace_period_until')->nullable()->after('next_billing_at');
                }
                if (!Schema::hasColumn('company_subscriptions', 'last_payment_id')) {
                    $table->string('last_payment_id')->nullable()->after('grace_period_until');
                }
                if (!Schema::hasColumn('company_subscriptions', 'cancelled_at')) {
                    $table->timestamp('cancelled_at')->nullable()->after('last_payment_id');
                }
                if (!Schema::hasColumn('company_subscriptions', 'ended_at')) {
                    $table->timestamp('ended_at')->nullable()->after('cancelled_at');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
        Schema::dropIfExists('razorpay_webhook_events');
    }
};
