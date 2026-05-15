<?php

namespace Modules\Chat\Repositories;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Collection;

interface ChatRepositoryInterface
{
    public function getConversations(int $tenantId, ?int $deviceId, int $limit): Collection;
    public function getMessages(int $conversationId, int $limit, ?int $offset): Collection;
    public function createMessage(array $data): Message;
    public function findConversation(int $id): ?Conversation;
}
