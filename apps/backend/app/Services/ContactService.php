<?php

namespace App\Services;

use App\Models\Contact;
use Illuminate\Pagination\Paginator;

class ContactService
{
    public function getContacts(int $tenantId, int $page = 1, int $limit = 50): Paginator
    {
        return Contact::query()
            ->where('tenant_id', $tenantId)
            ->latest()
            ->simplePaginate($limit, ['*'], 'page', $page);
    }

    public function createContact(int $tenantId, array $data): Contact
    {
        return Contact::create(array_merge($data, ['tenant_id' => $tenantId]));
    }

    public function updateContact(int $contactId, array $data): Contact
    {
        $contact = Contact::find($contactId);
        $contact->update($data);
        return $contact;
    }

    public function addTag(int $contactId, string $tag): Contact
    {
        $contact = Contact::find($contactId);
        $tags = $contact->tags ?? [];
        
        if (!in_array($tag, $tags)) {
            $tags[] = $tag;
            $contact->update(['tags' => $tags]);
        }

        return $contact;
    }

    public function removeTag(int $contactId, string $tag): Contact
    {
        $contact = Contact::find($contactId);
        $tags = $contact->tags ?? [];
        
        $contact->update(['tags' => array_diff($tags, [$tag])]);

        return $contact;
    }

    public function searchByPhone(int $tenantId, string $phone): ?Contact
    {
        return Contact::where('tenant_id', $tenantId)
            ->where('phone_number', $phone)
            ->first();
    }
}
