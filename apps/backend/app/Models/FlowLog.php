<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlowLog extends Model
{
    public $timestamps = true;
    
    protected $table = 'flow_logs';

    protected $fillable = [
        'tenant_id',
        'flow_id',
        'contact_id',
        'execution_data',
        'status',
        'error_message',
    ];

    protected $casts = [
        'execution_data' => 'json',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function flow(): BelongsTo
    {
        return $this->belongsTo(Flow::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
