<?php

namespace Modules\Tenant\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Tenant\Services\TenantService;

class TenantServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../Routes/api.php');
    }

    public function register(): void
    {
        $this->app->singleton(TenantService::class);
    }
}
