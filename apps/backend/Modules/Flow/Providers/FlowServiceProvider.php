<?php

namespace Modules\Flow\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Flow\Repositories\FlowRepository;
use Modules\Flow\Repositories\FlowRepositoryInterface;
use Modules\Flow\Services\FlowService;

class FlowServiceProvider extends ServiceProvider
{
    public function boot(): void {}

    public function register(): void
    {
        $this->app->bind(FlowRepositoryInterface::class, FlowRepository::class);
        $this->app->singleton(FlowService::class);
    }
}
