<?php

namespace App\DTOs;

class CreateMessageDTO
{
    public function __construct(
        public int $tenant_id,
        public int $conversation_id,
        public int $device_id,
        public int $contact_id,
        public ?int $user_id,
        public string $message_id,
        public string $direction,
        public string $type,
        public string $content,
        public ?array $media = null,
        public ?string $reply_to_message_id = null,
        public string $status = 'pending',
    ) {}

    public function toArray(): array
    {
        return [
            'tenant_id' => $this->tenant_id,
            'conversation_id' => $this->conversation_id,
            'device_id' => $this->device_id,
            'contact_id' => $this->contact_id,
            'user_id' => $this->user_id,
            'message_id' => $this->message_id,
            'direction' => $this->direction,
            'type' => $this->type,
            'content' => $this->content,
            'media' => $this->media,
            'reply_to_message_id' => $this->reply_to_message_id,
            'status' => $this->status,
        ];
    }
}
