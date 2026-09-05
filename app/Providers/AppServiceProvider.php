<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Purchase;
use App\Observers\PurchaseObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if ($this->app->isLocal() && class_exists(\Barryvdh\LaravelIdeHelper\IdeHelperServiceProvider::class)) {
            $this->app->register(\Barryvdh\LaravelIdeHelper\IdeHelperServiceProvider::class);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $host = app()->runningInConsole() ? '' : (request() ? request()->getHttpHost() : '');
        $isCloudOrRender = str_contains($host, 'render.com') ||
                            str_contains($host, 'trycloudflare.com') ||
                            (!app()->runningInConsole() && request() && request()->header('x-forwarded-proto') === 'https') ||
                            env('RENDER') ||
                            env('PORTAL_MODE') === 'supplier';

        if ($isCloudOrRender) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
            config(['database.default' => 'pgsql']);
        }

        // ── Real-time Supabase Sync ──────────────────────────────────────────
        // Only register on LOCAL POS (not on Render — Render reads from Supabase, doesn't write)
        // When admin creates/updates a PO locally → instantly pushed to Supabase → supplier sees it
        if (!$isCloudOrRender && env('SUPABASE_DB_PASSWORD')) {
            Purchase::observe(PurchaseObserver::class);
        }
    }
}
