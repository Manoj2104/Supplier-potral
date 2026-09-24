<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('payment_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('payment_settings', 'system_upi_id')) {
                $table->string('system_upi_id')->default('infypos@upi')->after('system_payment_verification');
            }
        });
    }

    public function down()
    {
        Schema::table('payment_settings', function (Blueprint $table) {
            if (Schema::hasColumn('payment_settings', 'system_upi_id')) {
                $table->dropColumn('system_upi_id');
            }
        });
    }
};
