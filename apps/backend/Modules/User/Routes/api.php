<?php

use Illuminate\Support\Facades\Route;
use Modules\User\Http\Controllers\UserController;

Route::prefix('v1/users')->middleware(['api', 'auth:sanctum', 'tenant'])->group(function () {
    Route::get('/', [UserController::class, 'index']);
    Route::post('/', [UserController::class, 'store']);
    Route::get('/roles', [UserController::class, 'roles']);
    Route::get('/{id}', [UserController::class, 'show']);
    Route::put('/{id}', [UserController::class, 'update']);
    Route::delete('/{id}', [UserController::class, 'destroy']);
    Route::put('/{id}/role', [UserController::class, 'changeRole']);
    Route::post('/{id}/toggle-status', [UserController::class, 'toggleStatus']);
});
