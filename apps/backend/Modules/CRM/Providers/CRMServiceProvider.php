<?php

namespace Modules\CRM\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\CRM\Services\CRMService;

class CRMServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../Routes/api.php');
    }

    public function register(): void
    {
        $this->app->singleton(CRMService::class);
    }
}
