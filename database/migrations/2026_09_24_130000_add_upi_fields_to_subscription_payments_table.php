<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('subscription_payments', function (Blueprint $table) {
            if (!Schema::hasColumn('subscription_payments', 'order_id')) {
                $table->string('order_id')->nullable()->after('subscription_id');
            }
            if (!Schema::hasColumn('subscription_payments', 'gst_amount')) {
                $table->decimal('gst_amount', 10, 2)->default(89.82)->after('amount');
            }
            if (!Schema::hasColumn('subscription_payments', 'total_amount')) {
                $table->decimal('total_amount', 10, 2)->default(588.82)->after('gst_amount');
            }
            if (!Schema::hasColumn('subscription_payments', 'upi_reference')) {
                $table->string('upi_reference')->nullable()->after('provider');
            }
            if (!Schema::hasColumn('subscription_payments', 'utr')) {
                $table->string('utr')->nullable()->after('upi_reference');
            }
            if (!Schema::hasColumn('subscription_payments', 'screenshot_path')) {
                $table->string('screenshot_path')->nullable()->after('utr');
            }
            if (!Schema::hasColumn('subscription_payments', 'verification_status')) {
                $table->string('verification_status')->default('verified')->after('status');
            }
            if (!Schema::hasColumn('subscription_payments', 'verified_by')) {
                $table->unsignedBigInteger('verified_by')->nullable()->after('verification_status');
            }
            if (!Schema::hasColumn('subscription_payments', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('verified_by');
            }
            if (!Schema::hasColumn('subscription_payments', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('failure_reason');
            }
        });
    }

    public function down()
    {
        Schema::table('subscription_payments', function (Blueprint $table) {
            $cols = [
                'order_id', 'gst_amount', 'total_amount', 'upi_reference', 'utr',
                'screenshot_path', 'verification_status', 'verified_by', 'verified_at', 'rejection_reason'
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('subscription_payments', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
