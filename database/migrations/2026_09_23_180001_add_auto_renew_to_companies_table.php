<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('companies') && !Schema::hasColumn('companies', 'auto_renew')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->boolean('auto_renew')->default(false)->after('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('companies') && Schema::hasColumn('companies', 'auto_renew')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->dropColumn('auto_renew');
            });
        }
    }
};
