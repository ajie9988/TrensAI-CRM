<?php

namespace Modules\Broadcast\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBroadcastRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'device_id' => 'required|integer|exists:devices,id',
            'name' => 'required|string|max:255',
            'message' => 'required|string|max:4096',
            'target_contacts' => 'nullable|array',
            'target_contacts.*' => 'integer|exists:contacts,id',
            'target_tags' => 'nullable|array',
            'target_tags.*' => 'string',
            'scheduled_at' => 'nullable|date|after:now',
            'delay_ms' => 'nullable|integer|min:500|max:10000',
        ];
    }
}
