<?php

namespace Modules\Automation\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Automation\Services\AutomationService;

class AutomationServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../Routes/api.php');
    }

    public function register(): void
    {
        $this->app->singleton(AutomationService::class);
    }
}
