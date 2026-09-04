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
        Schema::table('suppliers', function (Blueprint $table) {
            if (!Schema::hasColumn('suppliers', 'supabase_user_id')) {
                $table->string('supabase_user_id', 100)->nullable()->after('address');
            }
            if (!Schema::hasColumn('suppliers', 'sync_status')) {
                $table->string('sync_status', 50)->default('pending')->after('supabase_user_id');
            }
            if (!Schema::hasColumn('suppliers', 'sync_error')) {
                $table->text('sync_error')->nullable()->after('sync_status');
            }
            if (!Schema::hasColumn('suppliers', 'last_synced_at')) {
                $table->timestamp('last_synced_at')->nullable()->after('sync_error');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['supabase_user_id', 'sync_status', 'sync_error', 'last_synced_at']);
        });
    }
};
