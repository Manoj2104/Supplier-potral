<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('warehouse_bins', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('max_capacity');
        });
    }

    public function down(): void
    {
        Schema::table('warehouse_bins', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
