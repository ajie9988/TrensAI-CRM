<?php

use Illuminate\Support\Facades\Route;
use Modules\Plugin\Http\Controllers\PluginController;

Route::prefix('v1/plugins')->middleware(['api', 'auth:sanctum', 'tenant'])->group(function () {
    Route::get('/', [PluginController::class, 'index']);
    Route::post('/{key}/enable', [PluginController::class, 'enable']);
    Route::post('/{key}/disable', [PluginController::class, 'disable']);
    Route::get('/{key}/config', [PluginController::class, 'getConfig']);
    Route::put('/{key}/config', [PluginController::class, 'updateConfig']);
});
