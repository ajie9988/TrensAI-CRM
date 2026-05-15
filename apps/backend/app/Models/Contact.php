<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'phone_number',
        'name',
        'email',
        'avatar_url',
        'tags',
        'notes',
        'custom_fields',
        'status',
        'last_message_at',
        'message_count',
    ];

    protected $casts = [
        'tags' => 'json',
        'custom_fields' => 'json',
        'last_message_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function aiLogs(): HasMany
    {
        return $this->hasMany(AILog::class);
    }
}
