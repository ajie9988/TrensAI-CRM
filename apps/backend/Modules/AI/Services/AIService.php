<?php

namespace Modules\AI\Services;

use App\Models\AILog;
use Illuminate\Support\Facades\Http;

class AIService
{
    private string $engineUrl;

    public function __construct()
    {
        $this->engineUrl = config('services.ai_engine.url', env('AI_ENGINE_URL', 'http://ai-engine:3002'));
    }

    public function chat(int $tenantId, string $provider, string $model, array $messages, array $options = [], ?int $contactId = null): array
    {
        $config = \App\Models\TenantAIConfig::getActiveConfig($tenantId);

        $response = Http::timeout(30)->post("{$this->engineUrl}/chat", [
            'tenant_id' => $tenantId,
            'config' => $config,
            'provider' => $provider,
            'model' => $model,
            'messages' => $messages,
            'options' => $options,
        ]);

        $result = $response->json();

        $this->log($tenantId, $provider, $model, $messages, $result, $contactId);

        return $result;
    }

    public function summarize(int $tenantId, string $text, ?string $provider = null, ?int $contactId = null): array
    {
        $config = \App\Models\TenantAIConfig::getActiveConfig($tenantId);
        $provider = $provider ?: $config->ai_provider;
        $model = $config->ai_model;

        return $this->chat($tenantId, $provider, $model, [
            ['role' => 'system', 'content' => 'Summarize the following conversation concisely.'],
            ['role' => 'user', 'content' => $text],
        ], [], $contactId);
    }

    public function generateReply(int $tenantId, string $incomingMessage, array $context = [], ?string $provider = null, ?int $contactId = null): array
    {
        $config = \App\Models\TenantAIConfig::getActiveConfig($tenantId);
        
        $systemPrompt = $config->system_instruction;
        $provider = $provider ?: $config->ai_provider;
        $model = $config->ai_model;

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        foreach ($context as $msg) {
            $messages[] = ['role' => $msg['role'], 'content' => $msg['content']];
        }

        $messages[] = ['role' => 'user', 'content' => $incomingMessage];

        return $this->chat($tenantId, $provider, $model, $messages, [
            'temperature' => $config->temperature,
            'max_tokens' => $config->max_output_tokens,
        ], $contactId);
    }

    public function getAvailableProviders(): array
    {
        try {
            $response = Http::timeout(5)->get("{$this->engineUrl}/providers");
            return $response->json() ?? [];
        } catch (\Exception) {
            return ['openai', 'anthropic', 'gemini', 'ollama'];
        }
    }

    public function getLogs(int $tenantId, int $perPage = 50)
    {
        return AILog::where('tenant_id', $tenantId)
            ->latest()
            ->paginate($perPage);
    }

    private function log(int $tenantId, string $provider, string $model, array $messages, array $result, ?int $contactId = null): void
    {
        AILog::create([
            'tenant_id' => $tenantId,
            'contact_id' => $contactId,
            'provider' => $provider,
            'model' => $model,
            'prompt' => json_encode($messages),
            'response' => json_encode($result),
            'tokens_used' => $result['usage']['total_tokens'] ?? 0,
            'cost' => $result['usage']['cost'] ?? 0,
            'status' => isset($result['error']) ? 'failed' : 'success',
        ]);
    }
}
