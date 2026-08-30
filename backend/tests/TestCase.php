<?php

namespace SunmiPos\Backend\Tests;

use Orchestra\Testbench\TestCase as BaseTestCase;
use SunmiPos\Backend\Database\Seeders\PosDatabaseSeeder;
use SunmiPos\Backend\PosServiceProvider;

abstract class TestCase extends BaseTestCase
{
    protected function getPackageProviders($app): array
    {
        return [
            PosServiceProvider::class,
        ];
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', [
            'driver'   => 'sqlite',
            'database' => ':memory:',
            'prefix'   => '',
        ]);
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
        $this->seed(PosDatabaseSeeder::class);
    }
}
