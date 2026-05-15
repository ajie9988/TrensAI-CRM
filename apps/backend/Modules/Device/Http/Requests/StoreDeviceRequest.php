<?php

namespace Modules\Device\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone_number' => 'required|string|unique:devices,phone_number',
            'device_name' => 'nullable|string|max:100',
            'webhook_url' => 'nullable|url|max:500',
        ];
    }
}
