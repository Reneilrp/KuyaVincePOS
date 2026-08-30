<?php

namespace SunmiPos\Backend;

use Illuminate\Support\ServiceProvider;

class PosServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
        $this->loadRoutesFrom(__DIR__ . '/routes/api.php');
    }

    public function register(): void
    {
        //
    }
}
