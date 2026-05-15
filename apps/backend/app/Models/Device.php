<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Device extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'phone_number',
        'device_name',
        'status',
        'session_id',
        'session_data',
        'webhook_url',
        'last_connected_at',
        'last_activity_at',
        'settings',
        'is_ai_enabled',
    ];

    protected $casts = [
        'session_data' => 'json',
        'settings' => 'json',
        'is_ai_enabled' => 'boolean',
        'last_connected_at' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function broadcasts(): HasMany
    {
        return $this->hasMany(Broadcast::class);
    }

    public function flows(): HasMany
    {
        return $this->hasMany(Flow::class);
    }
}
