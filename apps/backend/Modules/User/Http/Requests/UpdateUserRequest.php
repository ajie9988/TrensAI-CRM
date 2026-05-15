<?php

namespace Modules\User\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('id');

        return [
            'name' => 'nullable|string|max:255',
            'email' => "nullable|email|unique:users,email,{$userId}",
            'password' => 'nullable|string|min:8|confirmed',
        ];
    }
}
