<?php

namespace Modules\Plugin\Services;

use Illuminate\Support\Facades\Cache;

class PluginService
{
    private array $builtInPlugins = [
        'openai' => [
            'name' => 'OpenAI Integration',
            'description' => 'Connect GPT-4, GPT-3.5 and other OpenAI models',
            'version' => '1.0.0',
            'config_keys' => ['api_key', 'org_id'],
        ],
        'anthropic' => [
            'name' => 'Anthropic Claude',
            'description' => 'Connect Claude 3 and Claude Instant models',
            'version' => '1.0.0',
            'config_keys' => ['api_key'],
        ],
        'gemini' => [
            'name' => 'Google Gemini',
            'description' => 'Connect Google Gemini Pro and Ultra',
            'version' => '1.0.0',
            'config_keys' => ['api_key'],
        ],
        'ollama' => [
            'name' => 'Ollama (Local LLM)',
            'description' => 'Run local LLMs via Ollama',
            'version' => '1.0.0',
            'config_keys' => ['base_url', 'model'],
        ],
        'google_sheets' => [
            'name' => 'Google Sheets',
            'description' => 'Sync contacts and data with Google Sheets',
            'version' => '1.0.0',
            'config_keys' => ['credentials_json', 'spreadsheet_id'],
        ],
        'webhook' => [
            'name' => 'Webhook / Zapier',
            'description' => 'Send events to external webhooks',
            'version' => '1.0.0',
            'config_keys' => ['url', 'secret'],
        ],
    ];

    public function listPlugins(int $tenantId): array
    {
        $enabled = $this->getEnabledPlugins($tenantId);

        return array_map(function (string $key, array $plugin) use ($enabled) {
            return array_merge($plugin, [
                'key' => $key,
                'enabled' => in_array($key, $enabled),
            ]);
        }, array_keys($this->builtInPlugins), $this->builtInPlugins);
    }

    public function enablePlugin(int $tenantId, string $key): void
    {
        $enabled = $this->getEnabledPlugins($tenantId);
        if (!in_array($key, $enabled)) {
            $enabled[] = $key;
            $this->setEnabledPlugins($tenantId, $enabled);
        }
    }

    public function disablePlugin(int $tenantId, string $key): void
    {
        $enabled = $this->getEnabledPlugins($tenantId);
        $this->setEnabledPlugins($tenantId, array_values(array_diff($enabled, [$key])));
    }

    public function getPluginConfig(int $tenantId, string $key): array
    {
        return Cache::get("tenant.plugin.{$tenantId}.{$key}", []);
    }

    public function updatePluginConfig(int $tenantId, string $key, array $config): array
    {
        // Only store keys defined by the plugin
        $allowedKeys = $this->builtInPlugins[$key]['config_keys'] ?? [];
        $filtered = array_intersect_key($config, array_flip($allowedKeys));

        Cache::forever("tenant.plugin.{$tenantId}.{$key}", $filtered);

        return $filtered;
    }

    private function getEnabledPlugins(int $tenantId): array
    {
        return Cache::get("tenant.plugins.enabled.{$tenantId}", []);
    }

    private function setEnabledPlugins(int $tenantId, array $plugins): void
    {
        Cache::forever("tenant.plugins.enabled.{$tenantId}", $plugins);
    }
}
