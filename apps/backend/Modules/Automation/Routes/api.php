<?php

use Illuminate\Support\Facades\Route;
use Modules\Automation\Http\Controllers\AutomationController;

Route::prefix('v1/automation')->middleware(['api', 'auth:sanctum', 'tenant'])->group(function () {
    Route::get('/triggers', [AutomationController::class, 'triggers']);
    Route::get('/actions', [AutomationController::class, 'actions']);
    Route::post('/webhook', [AutomationController::class, 'processWebhook']);
});
