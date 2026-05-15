<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantAIConfig extends Model
{
    protected $table = 'tenant_ai_configs';

    protected $fillable = [
        'tenant_id',
        'name',
        'ai_provider',
        'ai_model',
        'api_key',
        'base_url',
        'system_instruction',
        'temperature',
        'max_output_tokens',
        'is_active',
    ];

    protected $casts = [
        'temperature' => 'float',
        'max_output_tokens' => 'integer',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Scope for active configuration
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the active config for a tenant or fall back to default
     */
    public static function getActiveConfig(int $tenantId): self
    {
        $active = self::where('tenant_id', $tenantId)->where('is_active', true)->first();
        
        if (!$active) {
            // Fallback to first one or create default
            $active = self::where('tenant_id', $tenantId)->first();
            
            if (!$active) {
                $active = self::create([
                    'tenant_id' => $tenantId,
                    'name' => 'Default Config',
                    'ai_provider' => 'gemini',
                    'ai_model' => 'gemini-2.5-flash',
                    'system_instruction' => 'You are a helpful customer service assistant.',
                    'temperature' => 0.7,
                    'max_output_tokens' => 2000,
                    'is_active' => true,
                ]);
            }
        }
        
        return $active;
    }
}
