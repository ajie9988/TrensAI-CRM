<?php

use Illuminate\Support\Facades\Route;
use Modules\AI\Http\Controllers\AIController;

Route::prefix('v1/ai')->middleware(['api', 'auth:sanctum', 'tenant'])->group(function () {
    Route::get('/providers', [AIController::class, 'providers']);
    Route::get('/logs', [AIController::class, 'logs']);
    Route::post('/chat', [AIController::class, 'chat']);
    Route::post('/summarize', [AIController::class, 'summarize']);
    Route::post('/generate-reply', [AIController::class, 'generateReply']);
});
