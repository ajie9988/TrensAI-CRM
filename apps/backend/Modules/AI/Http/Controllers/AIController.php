<?php

namespace Modules\AI\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\AI\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AIController extends Controller
{
    public function __construct(private AIService $aiService) {}

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => 'required|string|in:openai,anthropic,gemini,ollama',
            'model' => 'required|string',
            'messages' => 'required|array|min:1',
            'messages.*.role' => 'required|in:system,user,assistant',
            'messages.*.content' => 'required|string',
            'options' => 'nullable|array',
        ]);

        $tenantId = $request->get('tenant_id');
        $config = \App\Models\TenantAIConfig::getActiveConfig($tenantId);
        
        $result = $this->aiService->chat(
            $tenantId, 
            $validated['provider'] ?? $config->ai_provider, 
            $validated['model'] ?? $config->ai_model, 
            $validated['messages'], 
            array_merge([
                'temperature' => $config->temperature,
                'max_tokens' => $config->max_output_tokens,
            ], $validated['options'] ?? [])
        );

        return response()->json(['data' => $result]);
    }

    public function summarize(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string|min:10',
            'provider' => 'nullable|string',
        ]);

        $tenantId = $request->get('tenant_id');
        $result = $this->aiService->summarize($tenantId, $validated['text'], $validated['provider'] ?? 'openai');

        return response()->json(['data' => $result]);
    }

    public function generateReply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'context' => 'nullable|array',
            'provider' => 'nullable|string',
            'contact_id' => 'nullable|integer',
        ]);

        $tenantId = $request->get('tenant_id');
        $result = $this->aiService->generateReply(
            $tenantId, 
            $validated['message'], 
            $validated['context'] ?? [], 
            $validated['provider'] ?? 'openai',
            $validated['contact_id'] ?? null
        );

        return response()->json(['data' => $result]);
    }

    public function providers(): JsonResponse
    {
        return response()->json([
            'data' => $this->aiService->getAvailableProviders(),
        ]);
    }

    public function logs(Request $request): JsonResponse
    {
        $tenantId = $request->get('tenant_id');
        $logs = $this->aiService->getLogs($tenantId);

        return response()->json($logs);
    }

    public function getTenantConfig(int $tenantId): JsonResponse
    {
        $config = \App\Models\TenantAIConfig::getActiveConfig($tenantId);
        return response()->json(['data' => $config]);
    }

    public function indexConfigs(Request $request): JsonResponse
    {
        $tenantId = $request->get('tenant_id');
        $configs = \App\Models\TenantAIConfig::where('tenant_id', $tenantId)->get();
        return response()->json(['data' => $configs]);
    }

    public function storeConfig(Request $request): JsonResponse
    {
        $tenantId = $request->get('tenant_id');
        $validated = $request->validate([
            'name' => 'required|string',
            'ai_provider' => 'required|string',
            'ai_model' => 'required|string',
            'api_key' => 'nullable|string',
            'base_url' => 'nullable|string',
            'system_instruction' => 'nullable|string',
            'temperature' => 'numeric|min:0|max:1',
            'max_output_tokens' => 'integer|min:1',
            'is_active' => 'boolean',
        ]);

        if ($validated['is_active'] ?? false) {
            \App\Models\TenantAIConfig::where('tenant_id', $tenantId)->update(['is_active' => false]);
        }

        $config = \App\Models\TenantAIConfig::create(array_merge($validated, ['tenant_id' => $tenantId]));

        return response()->json(['data' => $config]);
    }

    public function updateConfig(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->get('tenant_id');
        $config = \App\Models\TenantAIConfig::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'ai_provider' => 'sometimes|required|string',
            'ai_model' => 'sometimes|required|string',
            'api_key' => 'nullable|string',
            'base_url' => 'nullable|string',
            'system_instruction' => 'nullable|string',
            'temperature' => 'numeric|min:0|max:1',
            'max_output_tokens' => 'integer|min:1',
            'is_active' => 'boolean',
        ]);

        if ($validated['is_active'] ?? false) {
            \App\Models\TenantAIConfig::where('tenant_id', $tenantId)->update(['is_active' => false]);
        }

        $config->update($validated);

        return response()->json(['data' => $config]);
    }

    public function destroyConfig(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->get('tenant_id');
        $config = \App\Models\TenantAIConfig::where('tenant_id', $tenantId)->findOrFail($id);
        
        if ($config->is_active) {
            return response()->json(['error' => 'Cannot delete active configuration'], 400);
        }

        $config->delete();

        return response()->json(['message' => 'Configuration deleted']);
    }

    public function toggleActiveConfig(Request $request, int $id): JsonResponse
    {
        $tenantId = $request->get('tenant_id');
        
        \App\Models\TenantAIConfig::where('tenant_id', $tenantId)->update(['is_active' => false]);
        
        $config = \App\Models\TenantAIConfig::where('tenant_id', $tenantId)->findOrFail($id);
        $config->update(['is_active' => true]);

        return response()->json(['data' => $config]);
    }
}
