<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('subscription_payments') && !Schema::hasColumn('subscription_payments', 'provider')) {
            Schema::table('subscription_payments', function (Blueprint $table) {
                $table->string('provider', 32)->default('razorpay')->after('subscription_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('subscription_payments') && Schema::hasColumn('subscription_payments', 'provider')) {
            Schema::table('subscription_payments', function (Blueprint $table) {
                $table->dropColumn('provider');
            });
        }
    }
};
