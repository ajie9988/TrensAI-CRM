<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AILog extends Model
{
    public $timestamps = true;
    
    protected $table = 'ai_logs';

    protected $fillable = [
        'tenant_id',
        'contact_id',
        'message_id',
        'provider',
        'model',
        'prompt',
        'response',
        'tokens_used',
        'cost',
        'status',
    ];

    protected $casts = [
        'cost' => 'decimal:6',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }
}
