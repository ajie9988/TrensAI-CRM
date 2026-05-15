<?php

namespace Modules\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ai_enabled' => 'nullable|boolean',
            'ai_provider' => 'nullable|string|in:openai,anthropic,gemini,ollama',
            'ai_model' => 'nullable|string',
            'ai_system_prompt' => 'nullable|string|max:2000',
            'auto_reply' => 'nullable|boolean',
            'business_hours_enabled' => 'nullable|boolean',
            'business_hours' => 'nullable|array',
            'timezone' => 'nullable|string|timezone',
            'language' => 'nullable|string|in:id,en',
            'notification_email' => 'nullable|email',
        ];
    }
}
