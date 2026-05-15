<?php

namespace Modules\Chat\Repositories;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Collection;

class ChatRepository implements ChatRepositoryInterface
{
    public function getConversations(int $tenantId, ?int $deviceId, int $limit): Collection
    {
        return Conversation::query()
            ->where('tenant_id', $tenantId)
            ->when($deviceId, fn($q) => $q->where('device_id', $deviceId))
            ->with(['contact', 'assignedUser', 'messages' => fn($q) => $q->latest()->limit(1)])
            ->latest('last_message_at')
            ->take($limit)
            ->get();
    }

    public function getMessages(int $conversationId, int $limit, ?int $offset): Collection
    {
        return Message::query()
            ->where('conversation_id', $conversationId)
            ->latest()
            ->when($offset, fn($q) => $q->skip($offset))
            ->take($limit)
            ->get();
    }

    public function createMessage(array $data): Message
    {
        $message = Message::create($data);

        Conversation::find($data['conversation_id'])?->update([
            'last_message_at' => now(),
            'unread_count' => $data['direction'] === 'incoming' ? 1 : 0,
        ]);

        return $message;
    }

    public function findConversation(int $id): ?Conversation
    {
        return Conversation::find($id);
    }
}
