<?php

use Illuminate\Support\Facades\Route;
use Modules\Settings\Http\Controllers\SettingsController;

Route::prefix('v1/settings')->middleware(['api', 'auth:sanctum', 'tenant'])->group(function () {
    Route::get('/', [SettingsController::class, 'index']);
    Route::put('/', [SettingsController::class, 'update']);
    Route::get('/{key}', [SettingsController::class, 'getSetting']);
});
