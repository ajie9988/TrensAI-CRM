<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\TenantAIConfig;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AIConfigController extends Controller
{
    /**
     * Get AI configuration for current tenant
     */
    public function show(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_id') ?? Auth::user()->tenant_id;
        
        $config = TenantAIConfig::forTenant($tenantId);

        return response()->json([
            'data' => [
                'id' => $config->id,
                'tenant_id' => $config->tenant_id,
                'ai_provider' => $config->ai_provider,
                'ai_model' => $config->ai_model,
                'system_instruction' => $config->system_instruction,
                'temperature' => $config->temperature,
                'max_output_tokens' => $config->max_output_tokens,
            ],
        ]);
    }

    /**
     * Update AI configuration
     */
    public function update(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_id') ?? Auth::user()->tenant_id;

        $validated = $request->validate([
            'ai_provider' => 'sometimes|string|in:gemini,openai,anthropic,ollama',
            'ai_model' => 'sometimes|string',
            'system_instruction' => 'sometimes|string|max:5000',
            'temperature' => 'sometimes|numeric|min:0|max:1',
            'max_output_tokens' => 'sometimes|integer|min:100|max:10000',
        ]);

        $config = TenantAIConfig::forTenant($tenantId);
        $config->update($validated);

        return response()->json([
            'data' => [
                'id' => $config->id,
                'tenant_id' => $config->tenant_id,
                'ai_provider' => $config->ai_provider,
                'ai_model' => $config->ai_model,
                'system_instruction' => $config->system_instruction,
                'temperature' => $config->temperature,
                'max_output_tokens' => $config->max_output_tokens,
            ],
        ]);
    }

    /**
     * Get AI config for ai-engine (public endpoint for internal service)
     * Called by ai-engine to fetch tenant-specific system instruction
     */
    public function getForAIEngine(Request $request): JsonResponse
    {
        $tenantId = $request->query('tenant_id');

        if (!$tenantId) {
            return response()->json(['error' => 'tenant_id is required'], 422);
        }

        $config = TenantAIConfig::where('tenant_id', $tenantId)->first();

        if (!$config) {
            // Return defaults if config not found
            $config = TenantAIConfig::forTenant($tenantId);
        }

        return response()->json([
            'provider' => $config->ai_provider,
            'model' => $config->ai_model,
            'system_instruction' => $config->system_instruction,
            'temperature' => $config->temperature,
            'max_output_tokens' => $config->max_output_tokens,
        ]);
    }
}
