<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Message $message)
    {}

    public function broadcastOn(): array
    {
        return [
            new Channel('conversation.' . $this->message->conversation_id),
            new Channel('tenant.' . $this->message->tenant_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'message_id' => $this->message->message_id,
            'conversation_id' => $this->message->conversation_id,
            'contact_id' => $this->message->contact_id,
            'content' => $this->message->content,
            'type' => $this->message->type,
            'direction' => $this->message->direction,
            'created_at' => $this->message->created_at,
        ];
    }
}
