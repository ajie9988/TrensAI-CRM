<?php

namespace Modules\Settings\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;

class SettingsService
{
    public function getSettings(int $tenantId): array
    {
        return Cache::remember("tenant.settings.{$tenantId}", 300, function () use ($tenantId) {
            $tenant = Tenant::findOrFail($tenantId);
            return $tenant->settings ?? [];
        });
    }

    public function updateSettings(int $tenantId, array $data): array
    {
        $tenant = Tenant::findOrFail($tenantId);
        $current = $tenant->settings ?? [];

        $merged = array_merge($current, $data);
        $tenant->update(['settings' => $merged]);

        Cache::forget("tenant.settings.{$tenantId}");

        return $merged;
    }

    public function getSetting(int $tenantId, string $key, mixed $default = null): mixed
    {
        $settings = $this->getSettings($tenantId);
        return data_get($settings, $key, $default);
    }

    public function getDefaultSettings(): array
    {
        return [
            'ai_enabled' => false,
            'ai_provider' => 'openai',
            'ai_model' => 'gpt-4o-mini',
            'ai_system_prompt' => 'You are a helpful customer service assistant.',
            'auto_reply' => false,
            'business_hours_enabled' => false,
            'business_hours' => [
                'monday' => ['open' => '09:00', 'close' => '17:00', 'enabled' => true],
                'tuesday' => ['open' => '09:00', 'close' => '17:00', 'enabled' => true],
                'wednesday' => ['open' => '09:00', 'close' => '17:00', 'enabled' => true],
                'thursday' => ['open' => '09:00', 'close' => '17:00', 'enabled' => true],
                'friday' => ['open' => '09:00', 'close' => '17:00', 'enabled' => true],
                'saturday' => ['open' => '09:00', 'close' => '13:00', 'enabled' => false],
                'sunday' => ['open' => '09:00', 'close' => '13:00', 'enabled' => false],
            ],
            'timezone' => 'Asia/Jakarta',
            'language' => 'id',
            'notification_email' => null,
            'webhook_secret' => null,
        ];
    }
}
