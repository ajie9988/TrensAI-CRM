<?php

namespace Modules\Broadcast\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Broadcast\Repositories\BroadcastRepository;
use Modules\Broadcast\Repositories\BroadcastRepositoryInterface;
use Modules\Broadcast\Services\BroadcastService;

class BroadcastServiceProvider extends ServiceProvider
{
    public function boot(): void {}

    public function register(): void
    {
        $this->app->bind(BroadcastRepositoryInterface::class, BroadcastRepository::class);
        $this->app->singleton(BroadcastService::class);
    }
}
