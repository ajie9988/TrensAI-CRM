<?php

namespace Modules\Chat\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Chat\Repositories\ChatRepository;
use Modules\Chat\Repositories\ChatRepositoryInterface;

class ChatServiceProvider extends ServiceProvider
{
    public function boot(): void {}

    public function register(): void
    {
        $this->app->bind(ChatRepositoryInterface::class, ChatRepository::class);
    }
}
