<?php

namespace App\Http\Controllers\Contact;

use App\Http\Controllers\Controller;
use App\Services\ContactService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ContactController extends Controller
{
    public function __construct(private ContactService $contactService)
    {}

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->attributes->get('tenant_id');
        $page = $request->query('page', 1);
        $limit = $request->query('limit', 50);

        $contacts = $this->contactService->getContacts($tenantId, $page, $limit);

        return response()->json($contacts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone_number' => 'required|unique:contacts',
            'name' => 'nullable|string',
            'email' => 'nullable|email',
            'tags' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $tenantId = $request->attributes->get('tenant_id');
        $contact = $this->contactService->createContact($tenantId, $validated);

        return response()->json([
            'data' => $contact,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $contact = \App\Models\Contact::find($id);

        if (!$contact) {
            return response()->json(['message' => 'Contact not found'], 404);
        }

        return response()->json([
            'data' => $contact,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string',
            'email' => 'nullable|email',
            'notes' => 'nullable|string',
        ]);

        $contact = $this->contactService->updateContact($id, $validated);

        return response()->json([
            'data' => $contact,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        \App\Models\Contact::find($id)?->delete();

        return response()->json(['message' => 'Contact deleted']);
    }

    public function addTag(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'tag' => 'required|string',
        ]);

        $contact = $this->contactService->addTag($id, $validated['tag']);

        return response()->json([
            'data' => $contact,
        ]);
    }

    public function removeTag(int $id, string $tag): JsonResponse
    {
        $contact = $this->contactService->removeTag($id, $tag);

        return response()->json([
            'data' => $contact,
        ]);
    }
}
