<?php

namespace Modules\Device\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Device\Repositories\DeviceRepository;
use Modules\Device\Repositories\DeviceRepositoryInterface;
use Modules\Device\Services\DeviceService;

class DeviceServiceProvider extends ServiceProvider
{
    public function boot(): void {}

    public function register(): void
    {
        $this->app->bind(DeviceRepositoryInterface::class, DeviceRepository::class);
        $this->app->singleton(DeviceService::class);
    }
}
