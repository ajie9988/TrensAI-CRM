"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import StatsCard from "@/components/StatsCard";
import { useGet, useMutate } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/lib/utils";
import { Users, Tag, UserPlus, Plus, Search, Pencil, Trash2 } from "lucide-react";

type Contact = {
    id: number;
    name: string | null;
    phone: string | null;
    phone_number?: string | null;
    email: string | null;
    tags: string[] | null;
    notes?: string | null;
    created_at: string;
};

interface ContactsResponse {
    data: Contact[];
    meta?: { total: number };
}

export default function ContactsPage() {
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContactId, setEditingContactId] = useState<number | null>(null);
    const [form, setForm] = useState({
        name: "",
        phone_number: "",
        email: "",
        notes: "",
    });
    const debouncedSearch = useDebounce(search, 400);

    const { data, isLoading } = useGet<ContactsResponse>(
        ["contacts", debouncedSearch],
        `/api/v1/contacts?q=${debouncedSearch}`
    );

    const createMutation = useMutate<{ data: Contact }, { phone_number: string; name?: string; email?: string; notes?: string }>(
        "post",
        "/api/v1/contacts",
        {
            invalidateKeys: [["contacts"]],
            onSuccess: () => {
                setIsModalOpen(false);
                setEditingContactId(null);
                setForm({ name: "", phone_number: "", email: "", notes: "" });
            },
        }
    );

    const updateMutation = useMutate<{ data: Contact }, { name?: string; email?: string; notes?: string }>(
        "put",
        () => `/api/v1/contacts/${editingContactId}`,
        {
            invalidateKeys: [["contacts"]],
            onSuccess: () => {
                setIsModalOpen(false);
                setEditingContactId(null);
                setForm({ name: "", phone_number: "", email: "", notes: "" });
            },
        }
    );

    const deleteMutation = useMutate("delete", (id: number) => `/api/v1/contacts/${id}`, {
        invalidateKeys: [["contacts"]],
    });

    const contacts: Array<Omit<Contact, "tags" | "name" | "phone"> & { name: string; phone: string; tags: string[]; notes: string }> = (data?.data ?? []).map((contact) => ({
        ...contact,
        name: typeof contact.name === "string" ? contact.name : "",
        phone:
            typeof contact.phone === "string"
                ? contact.phone
                : typeof contact.phone_number === "string"
                    ? contact.phone_number
                    : "",
        tags: Array.isArray(contact.tags) ? contact.tags : [],
        notes: typeof contact.notes === "string" ? contact.notes : "",
    }));

    const filtered = contacts.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search)
    );

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const openCreateModal = () => {
        setEditingContactId(null);
        setForm({ name: "", phone_number: "", email: "", notes: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (contact: (typeof contacts)[number]) => {
        setEditingContactId(contact.id);
        setForm({
            name: contact.name,
            phone_number: contact.phone,
            email: contact.email ?? "",
            notes: contact.notes,
        });
        setIsModalOpen(true);
    };

    const onSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (editingContactId === null) {
            if (!form.phone_number.trim()) return;
            createMutation.mutate({
                phone_number: form.phone_number.trim(),
                name: form.name.trim() || undefined,
                email: form.email.trim() || undefined,
                notes: form.notes.trim() || undefined,
            });
            return;
        }

        updateMutation.mutate({
            name: form.name.trim() || undefined,
            email: form.email.trim() || undefined,
            notes: form.notes.trim() || undefined,
        });
    };

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Contacts</h2>
                <button className="btn-primary flex items-center gap-2" onClick={openCreateModal}>
                    <Plus size={16} />
                    Add Contact
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatsCard label="Total Contacts" value={isLoading ? "..." : contacts.length} icon={<Users size={18} />} />
                <StatsCard label="Tagged Contacts" value={isLoading ? "..." : contacts.filter((c) => c.tags.length > 0).length} icon={<Tag size={18} />} />
                <StatsCard label="New This Week" value="-" icon={<UserPlus size={18} />} description="Last 7 days" />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search contacts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Name</th>
                            <th className="px-6 py-3 text-left">Phone</th>
                            <th className="px-6 py-3 text-left">Email</th>
                            <th className="px-6 py-3 text-left">Tags</th>
                            <th className="px-6 py-3 text-left">Added</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map((contact) => (
                            <tr key={contact.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{contact.name}</td>
                                <td className="px-6 py-4 text-gray-600">{contact.phone}</td>
                                <td className="px-6 py-4 text-gray-600">{contact.email}</td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-1 flex-wrap">
                                        {contact.tags.map((tag) => (
                                            <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{tag}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{formatDate(contact.created_at)}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button
                                        className="text-blue-600 hover:text-blue-800"
                                        onClick={() => openEditModal(contact)}
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        className="text-red-500 hover:text-red-700 disabled:opacity-40"
                                        disabled={deleteMutation.isPending}
                                        onClick={() => deleteMutation.mutate(contact.id)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Users size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No contacts found.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white border border-gray-200 shadow-xl">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingContactId === null ? "Add Contact" : "Edit Contact"}
                            </h3>
                        </div>
                        <form className="px-6 py-4 space-y-4" onSubmit={onSubmitForm}>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                                <input
                                    value={form.phone_number}
                                    onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                                    disabled={editingContactId !== null}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    placeholder="628123456789"
                                />
                                {editingContactId !== null && (
                                    <p className="text-xs text-gray-400 mt-1">Phone number cannot be edited from this form.</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Notes</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                                    className="w-full min-h-[90px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || (editingContactId === null && !form.phone_number.trim())}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Saving..." : editingContactId === null ? "Create" : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
