<?php

namespace Modules\Flow\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFlowRequest extends FormRequest
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
            'description' => 'nullable|string|max:1000',
            'nodes' => 'required|json',
            'edges' => 'required|json',
            'trigger_type' => 'required|in:message,keyword,webhook,schedule,tag,contact_field',
            'trigger_value' => 'nullable|string|max:255',
        ];
    }
}
