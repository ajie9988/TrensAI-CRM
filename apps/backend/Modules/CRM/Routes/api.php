<?php

use Illuminate\Support\Facades\Route;
use Modules\CRM\Http\Controllers\CRMController;

Route::prefix('v1/crm')->middleware(['api', 'auth:sanctum', 'tenant'])->group(function () {
    Route::get('/pipeline', [CRMController::class, 'pipeline']);
    Route::get('/summary', [CRMController::class, 'summary']);
    Route::put('/contacts/{contactId}/stage', [CRMController::class, 'moveStage']);
    Route::get('/contacts/{contactId}/timeline', [CRMController::class, 'timeline']);
});
