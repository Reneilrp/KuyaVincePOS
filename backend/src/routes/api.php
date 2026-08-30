<?php

use Illuminate\Support\Facades\Route;
use SunmiPos\Backend\Http\Controllers\AnalyticsController;
use SunmiPos\Backend\Http\Controllers\AuthController;
use SunmiPos\Backend\Http\Controllers\BatchSyncController;
use SunmiPos\Backend\Http\Controllers\BranchController;
use SunmiPos\Backend\Http\Controllers\CheckoutController;
use SunmiPos\Backend\Http\Controllers\DeviceProvisioningController;
use SunmiPos\Backend\Http\Controllers\InventoryController;
use SunmiPos\Backend\Http\Controllers\PayrollController;
use SunmiPos\Backend\Http\Controllers\ProductCatalogController;
use SunmiPos\Backend\Http\Controllers\ShiftController;
use SunmiPos\Backend\Http\Controllers\TimeclockController;

Route::prefix('api/v1')->group(function () {
    // 1-Tap End-of-Day Batch Synchronization
    Route::post('/sync/batch-push', [BatchSyncController::class, 'handleDailyBatchPush']);
    Route::get('/sync/branch-status', [BatchSyncController::class, 'getBranchSyncStatus']);

    // Branch Management
    Route::get('/branches', [BranchController::class, 'index']);
    Route::post('/branches', [BranchController::class, 'store']);
    Route::get('/branches/{id}', [BranchController::class, 'show']);
    Route::put('/branches/{id}', [BranchController::class, 'update']);

    // Sunmi Device Provisioning & Heartbeat
    Route::get('/devices/setup-branches', [DeviceProvisioningController::class, 'getBranches']);
    Route::post('/devices/pair', [DeviceProvisioningController::class, 'pairDevice']);
    Route::get('/devices', [DeviceProvisioningController::class, 'listDevices']);
    Route::post('/devices/heartbeat', [DeviceProvisioningController::class, 'heartbeat']);

    // Auth & Staff List
    Route::post('/auth/cashier-pin', [AuthController::class, 'cashierPinLogin']);
    Route::post('/auth/admin-login', [AuthController::class, 'adminLogin']);
    Route::get('/staff', [AuthController::class, 'listStaffByBranch']);

    // Catalog & Products
    Route::get('/catalog', [ProductCatalogController::class, 'getCatalog']);
    Route::post('/products', [ProductCatalogController::class, 'storeProduct']);

    // Inventory & Restocking
    Route::get('/inventory/matrix', [InventoryController::class, 'getMultiBranchMatrix']);
    Route::post('/inventory/restock', [InventoryController::class, 'restock']);
    Route::post('/inventory/adjust', [InventoryController::class, 'adjust']);

    // Checkout & Orders
    Route::post('/checkout', [CheckoutController::class, 'processCheckout']);

    // Register Shifts & Z-Readings
    Route::post('/shifts/open', [ShiftController::class, 'openShift']);
    Route::post('/shifts/{id}/close', [ShiftController::class, 'closeShift']);

    // Staff Timeclock
    Route::post('/timeclock/in', [TimeclockController::class, 'clockIn']);
    Route::post('/timeclock/out', [TimeclockController::class, 'clockOut']);
    Route::get('/timeclock/active', [TimeclockController::class, 'getActiveStaff']);

    // Payroll System
    Route::post('/payroll/calculate', [PayrollController::class, 'calculatePayroll']);
    Route::post('/payroll/approve', [PayrollController::class, 'approvePayroll']);

    // Real-Time Analytics & Laptop Overview
    Route::get('/analytics/overview', [AnalyticsController::class, 'getOverview']);
});
