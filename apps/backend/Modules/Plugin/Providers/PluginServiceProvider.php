<?php

namespace Modules\Plugin\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Plugin\Services\PluginService;

class PluginServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../Routes/api.php');
    }

    public function register(): void
    {
        $this->app->singleton(PluginService::class);
    }
}
