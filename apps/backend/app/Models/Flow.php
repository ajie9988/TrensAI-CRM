<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Flow extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'device_id',
        'created_by_user_id',
        'name',
        'description',
        'nodes',
        'edges',
        'trigger_type',
        'trigger_value',
        'is_active',
        'settings',
        'execution_count',
    ];

    protected $casts = [
        'nodes' => 'json',
        'edges' => 'json',
        'settings' => 'json',
        'is_active' => 'boolean',
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

    public function flowLogs(): HasMany
    {
        return $this->hasMany(FlowLog::class);
    }
}
