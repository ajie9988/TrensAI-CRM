<?php

namespace Modules\Contact\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Contact\Repositories\ContactRepository;
use Modules\Contact\Repositories\ContactRepositoryInterface;

class ContactServiceProvider extends ServiceProvider
{
    public function boot(): void {}

    public function register(): void
    {
        $this->app->bind(ContactRepositoryInterface::class, ContactRepository::class);
    }
}
