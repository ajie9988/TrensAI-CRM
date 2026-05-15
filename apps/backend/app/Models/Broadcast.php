<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Broadcast extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'device_id',
        'created_by_user_id',
        'name',
        'message',
        'target_contacts',
        'target_tags',
        'status',
        'scheduled_at',
        'total_contacts',
        'sent_count',
        'failed_count',
        'delay_ms',
        'settings',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'target_contacts' => 'json',
        'target_tags' => 'json',
        'settings' => 'json',
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
