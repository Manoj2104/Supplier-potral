<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

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
        $host = request()->getHttpHost();
        $isCloudOrRender = str_contains($host, 'render.com') ||
                            str_contains($host, 'trycloudflare.com') ||
                            request()->header('x-forwarded-proto') === 'https' ||
                            env('RENDER') ||
                            env('PORTAL_MODE') === 'supplier';

        if ($isCloudOrRender) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
            config(['database.default' => 'pgsql']);
        }
    }
}
