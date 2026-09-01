<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for INFY-POS Enterprise Hybrid SaaS Architecture.
     */
    public function up(): void
    {
        // 1. Companies Table (Tenants)
        if (!Schema::hasTable('companies')) {
            Schema::create('companies', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('owner_name')->nullable();
                $table->string('email')->unique();
                $table->string('phone')->nullable();
                $table->string('business_type')->default('Supermarket');
                $table->string('gst_number')->nullable();
                $table->string('country')->default('India');
                $table->string('state')->nullable();
                $table->string('city')->nullable();
                $table->string('currency')->default('INR');
                $table->string('language')->default('en');
                $table->string('timezone')->default('Asia/Kolkata');
                $table->string('store_name')->nullable();
                $table->text('address')->nullable();
                $table->string('pin_code')->nullable();
                $table->string('logo_url')->nullable();
                $table->string('status')->default('trial'); // trial, active, grace_period, expired
                $table->timestamp('trial_ends_at')->nullable();
                $table->timestamp('subscription_ends_at')->nullable();
                $table->string('referral_code')->nullable();
                $table->timestamps();
            });
        }

        // 2. Activation Keys Table
        if (!Schema::hasTable('activation_keys')) {
            Schema::create('activation_keys', function (Blueprint $table) {
                $table->id();
                $table->string('key_code')->unique();
                $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
                $table->string('machine_fingerprint')->nullable();
                $table->string('plan_name')->default('INFY-POS PREMIUM');
                $table->decimal('price', 10, 2)->default(499.00);
                $table->string('status')->default('unused'); // unused, active, revoked, expired
                $table->timestamp('activated_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }

        // 3. Company Subscriptions Table
        if (!Schema::hasTable('company_subscriptions')) {
            Schema::create('company_subscriptions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
                $table->string('plan_name')->default('INFY-POS PREMIUM');
                $table->decimal('amount', 10, 2)->default(499.00);
                $table->string('payment_gateway')->default('Razorpay');
                $table->string('razorpay_payment_id')->nullable();
                $table->string('razorpay_order_id')->nullable();
                $table->string('status')->default('active'); // active, expired, pending
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->string('invoice_number')->nullable();
                $table->timestamps();
            });
        }

        // 4. Connected Devices Table
        if (!Schema::hasTable('saas_devices')) {
            Schema::create('saas_devices', function (Blueprint $table) {
                $table->id();
                $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
                $table->string('device_name');
                $table->string('device_type')->default('Desktop/Laptop'); // Laptop, PDA, Tablet
                $table->string('machine_uuid')->nullable();
                $table->string('ip_address')->nullable();
                $table->string('os_version')->nullable();
                $table->timestamp('last_login_at')->nullable();
                $table->string('status')->default('active'); // active, revoked
                $table->timestamps();
            });
        }

        // 5. Audit Logs Table
        if (!Schema::hasTable('saas_audit_logs')) {
            Schema::create('saas_audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('action');
                $table->text('details')->nullable();
                $table->string('ip_address')->nullable();
                $table->timestamps();
            });
        }

        // 6. Support Tickets Table
        if (!Schema::hasTable('saas_tickets')) {
            Schema::create('saas_tickets', function (Blueprint $table) {
                $table->id();
                $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
                $table->string('subject');
                $table->text('message');
                $table->string('priority')->default('medium'); // low, medium, high, urgent
                $table->string('status')->default('open'); // open, in_progress, resolved, closed
                $table->timestamps();
            });
        }

        // Add company_id column to users table if missing
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'company_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('company_id')->nullable()->after('id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('saas_tickets');
        Schema::dropIfExists('saas_audit_logs');
        Schema::dropIfExists('saas_devices');
        Schema::dropIfExists('company_subscriptions');
        Schema::dropIfExists('activation_keys');
        Schema::dropIfExists('companies');

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'company_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('company_id');
            });
        }
    }
};
