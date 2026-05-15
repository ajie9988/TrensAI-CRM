<?php

use Illuminate\Support\Facades\Route;
use Modules\Analytics\Http\Controllers\AnalyticsController;

Route::prefix('v1/analytics')->middleware(['api', 'auth:sanctum', 'tenant'])->group(function () {
    Route::get('/overview', [AnalyticsController::class, 'overview']);
    Route::get('/messages', [AnalyticsController::class, 'messages']);
    Route::get('/contacts/top', [AnalyticsController::class, 'topContacts']);
    Route::get('/broadcasts', [AnalyticsController::class, 'broadcasts']);
});
