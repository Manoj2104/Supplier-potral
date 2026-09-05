<?php

namespace App\Console\Commands;

use App\Services\CloudDatabaseSyncService;
use Illuminate\Console\Command;

class SyncCloudDatabaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'db:sync-cloud {--push : Push local changes to cloud only} {--pull : Pull cloud changes to local only}';

    /**
     * The console command description.
     */
    protected $description = 'Bidirectional Offline-First Cloud Database Sync (Local MySQL <-> Supabase PostgreSQL)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Checking Cloud Database connection...');

        if (!CloudDatabaseSyncService::isCloudReachable()) {
            $this->warn('Cloud Database is currently offline/unreachable. Operating in local offline-first mode.');
            return self::SUCCESS;
        }

        $this->info('Cloud Database connected! Starting sync...');
        $isPush = $this->option('push');
        $isPull = $this->option('pull');

        if ($isPush) {
            $res = CloudDatabaseSyncService::pushLocalToCloud();
            $this->info('Push complete: ' . json_encode($res));
        } elseif ($isPull) {
            $res = CloudDatabaseSyncService::pullCloudToLocal();
            $this->info('Pull complete: ' . json_encode($res));
        } else {
            $res = CloudDatabaseSyncService::syncAll();
            $this->info('Bidirectional sync complete: ' . json_encode($res));
        }

        return self::SUCCESS;
    }
}
