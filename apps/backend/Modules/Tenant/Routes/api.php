<?php

use Illuminate\Support\Facades\Route;
use Modules\Tenant\Http\Controllers\TenantController;

Route::prefix('v1/tenant')->middleware(['api', 'auth:sanctum', 'tenant'])->group(function () {
    Route::get('/', [TenantController::class, 'show']);
    Route::put('/', [TenantController::class, 'update']);
    Route::get('/stats', [TenantController::class, 'stats']);
});
