<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Chat\ChatController;
use App\Http\Controllers\Contact\ContactController;
use App\Http\Controllers\Device\DeviceController;
use App\Http\Controllers\Broadcast\BroadcastController;
use App\Http\Controllers\Flow\FlowController;
use Modules\User\Http\Controllers\UserController;
use Modules\Settings\Http\Controllers\SettingsController;
use Modules\Tenant\Http\Controllers\TenantController;
use Modules\AI\Http\Controllers\AIController;
use Modules\Analytics\Http\Controllers\AnalyticsController;
use Modules\CRM\Http\Controllers\CRMController;
use Modules\Automation\Http\Controllers\AutomationController;
use Modules\Plugin\Http\Controllers\PluginController;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Chat stream uses EventSource and authenticates using Sanctum token or Bearer token.
    Route::get('/chat/stream', [ChatController::class, 'stream'])->middleware(['sse.sanctum', 'tenant']);

    // Protected routes
    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'getCurrentUser']);

        // Chat
        Route::get('/chat/conversations', [ChatController::class, 'getConversations']);
        Route::get('/chat/conversations/{id}/messages', [ChatController::class, 'getMessages']);
        Route::post('/chat/conversations/{id}/messages', [ChatController::class, 'sendMessage']);
        Route::put('/chat/conversations/{id}/read', [ChatController::class, 'markConversationAsRead']);
        Route::put('/chat/messages/{id}/read', [ChatController::class, 'markAsRead']);
        Route::put('/chat/conversations/{id}/assign', [ChatController::class, 'assignConversation']);
        Route::post('/chat/upload', [ChatController::class, 'uploadMedia']);

        // Contacts
        Route::get('/contacts', [ContactController::class, 'index']);
        Route::post('/contacts', [ContactController::class, 'store']);
        Route::get('/contacts/{id}', [ContactController::class, 'show']);
        Route::put('/contacts/{id}', [ContactController::class, 'update']);
        Route::delete('/contacts/{id}', [ContactController::class, 'destroy']);
        Route::post('/contacts/{id}/tags', [ContactController::class, 'addTag']);
        Route::delete('/contacts/{id}/tags/{tag}', [ContactController::class, 'removeTag']);

        // Devices
        Route::get('/devices', [DeviceController::class, 'index']);
        Route::post('/devices', [DeviceController::class, 'store']);
        Route::get('/devices/{id}', [DeviceController::class, 'show']);
        Route::put('/devices/{id}', [DeviceController::class, 'update']);
        Route::delete('/devices/{id}', [DeviceController::class, 'destroy']);
        Route::get('/devices/{id}/qr', [DeviceController::class, 'getQRCode']);
        Route::post('/devices/{id}/reconnect', [DeviceController::class, 'reconnect']);
        Route::post('/devices/{id}/disconnect', [DeviceController::class, 'disconnect']);
        Route::post('/devices/{id}/toggle-ai', [DeviceController::class, 'toggleAI']);

        // Broadcasts
        Route::get('/broadcasts', [BroadcastController::class, 'index']);
        Route::post('/broadcasts', [BroadcastController::class, 'store']);
        Route::get('/broadcasts/{id}', [BroadcastController::class, 'show']);
        Route::put('/broadcasts/{id}', [BroadcastController::class, 'update']);
        Route::delete('/broadcasts/{id}', [BroadcastController::class, 'destroy']);
        Route::post('/broadcasts/{id}/send', [BroadcastController::class, 'send']);
        Route::get('/broadcasts/{id}/status', [BroadcastController::class, 'getStatus']);

        // Flows
        Route::get('/flows', [FlowController::class, 'index']);
        Route::post('/flows', [FlowController::class, 'store']);
        Route::get('/flows/{id}', [FlowController::class, 'show']);
        Route::put('/flows/{id}', [FlowController::class, 'update']);
        Route::delete('/flows/{id}', [FlowController::class, 'destroy']);
        Route::post('/flows/{id}/execute', [FlowController::class, 'execute']);
        Route::post('/flows/{id}/activate', [FlowController::class, 'activate']);
        Route::post('/flows/{id}/deactivate', [FlowController::class, 'deactivate']);
        Route::get('/flows/{id}/logs', [FlowController::class, 'getLogs']);

        // Users
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/roles', [UserController::class, 'roles']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::put('/users/{id}/role', [UserController::class, 'changeRole']);
        Route::post('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);

        // Settings
        Route::get('/settings', [SettingsController::class, 'index']);
        Route::put('/settings', [SettingsController::class, 'update']);
        Route::get('/settings/{key}', [SettingsController::class, 'getSetting']);

        // Tenant
        Route::get('/tenant', [TenantController::class, 'show']);
        Route::put('/tenant', [TenantController::class, 'update']);
        Route::get('/tenant/stats', [TenantController::class, 'stats']);

        // AI
        Route::get('/ai/providers', [AIController::class, 'providers']);
        Route::get('/ai/logs', [AIController::class, 'logs']);
        Route::post('/ai/chat', [AIController::class, 'chat']);
        Route::post('/ai/summarize', [AIController::class, 'summarize']);
        Route::post('/ai/generate-reply', [AIController::class, 'generateReply']);
        
        // AI Config Management
        Route::get('/ai/configs', [AIController::class, 'indexConfigs']);
        Route::post('/ai/configs', [AIController::class, 'storeConfig']);
        Route::put('/ai/configs/{id}', [AIController::class, 'updateConfig']);
        Route::delete('/ai/configs/{id}', [AIController::class, 'destroyConfig']);
        Route::post('/ai/configs/{id}/toggle-active', [AIController::class, 'toggleActiveConfig']);

        // Analytics
        Route::get('/analytics/overview', [AnalyticsController::class, 'overview']);
        Route::get('/analytics/messages', [AnalyticsController::class, 'messages']);
        Route::get('/analytics/contacts/top', [AnalyticsController::class, 'topContacts']);
        Route::get('/analytics/broadcasts', [AnalyticsController::class, 'broadcasts']);

        // CRM
        Route::get('/crm/pipeline', [CRMController::class, 'pipeline']);
        Route::get('/crm/summary', [CRMController::class, 'summary']);
        Route::put('/crm/contacts/{contactId}/stage', [CRMController::class, 'moveStage']);
        Route::get('/crm/contacts/{contactId}/timeline', [CRMController::class, 'timeline']);

        // Automation
        Route::get('/automation/triggers', [AutomationController::class, 'triggers']);
        Route::get('/automation/actions', [AutomationController::class, 'actions']);
        Route::post('/automation/webhook', [AutomationController::class, 'processWebhook']);

        // Plugins
        Route::get('/plugins', [PluginController::class, 'index']);
        Route::post('/plugins/{key}/enable', [PluginController::class, 'enable']);
        Route::post('/plugins/{key}/disable', [PluginController::class, 'disable']);
        Route::get('/plugins/{key}/config', [PluginController::class, 'getConfig']);
        Route::put('/plugins/{key}/config', [PluginController::class, 'updateConfig']);
    });

    // AI Engine Internal Config
    Route::get('/tenant-ai-config/{tenantId}', [AIController::class, 'getTenantConfig']);

    // Webhook routes (external)
    Route::post('/webhooks/whatsapp', [ChatController::class, 'handleWebhook']);
    Route::post('/webhooks/ai', [ChatController::class, 'handleAIWebhook']);
});
