"use client";

import AppShell from "@/components/AppShell";
import StatsCard from "@/components/StatsCard";
import { useGet, useMutate } from "@/hooks/useApi";
import { FLOW_STATUS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Workflow, Play, AlertCircle, Plus, Pencil, Trash2, Pause } from "lucide-react";

type Flow = {
    id: number;
    name: string;
    trigger_type: string;
    is_active: boolean;
    status: "active" | "inactive" | "draft";
    flow_logs_count?: number;
    updated_at: string;
};

interface FlowsResponse { data: Flow[] }

export default function FlowsPage() {
    const { data, isLoading } = useGet<FlowsResponse>(["flows"], "/api/v1/flows");

    const toggleMutation = useMutate("post", (vars: { id: number; active: boolean }) =>
        `/api/v1/flows/${vars.id}/${vars.active ? "deactivate" : "activate"}`, {
        invalidateKeys: [["flows"]],
    });
    const deleteMutation = useMutate("delete", (id: number) => `/api/v1/flows/${id}`, {
        invalidateKeys: [["flows"]],
    });

    const flows: Flow[] = data?.data ?? [];

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Automation Flows</h2>
                <button className="btn-primary flex items-center gap-2">
                    <Plus size={16} />
                    New Flow
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatsCard label="Active Flows" value={isLoading ? "..." : flows.filter((f) => f.is_active).length} icon={<Workflow size={18} />} />
                <StatsCard label="Total Flows" value={isLoading ? "..." : flows.length} icon={<Play size={18} />} />
                <StatsCard label="Eksekusi" value={isLoading ? "..." : flows.reduce((a, f) => a + (f.flow_logs_count ?? 0), 0)} icon={<AlertCircle size={18} />} description="All time" />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-700">All Flows</h3>
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Flow Name</th>
                            <th className="px-6 py-3 text-left">Trigger</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Eksekusi</th>
                            <th className="px-6 py-3 text-left">Updated</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading && (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                        )}
                        {flows.map((flow) => (
                            <tr key={flow.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{flow.name}</td>
                                <td className="px-6 py-4 text-gray-600">{flow.trigger_type}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${flow.is_active ? FLOW_STATUS.active.color : FLOW_STATUS.inactive.color
                                        }`}>
                                        {flow.is_active ? FLOW_STATUS.active.label : FLOW_STATUS.inactive.label}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{flow.flow_logs_count ?? 0}</td>
                                <td className="px-6 py-4 text-gray-500">{formatDate(flow.updated_at)}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    {flow.is_active ? (
                                        <button
                                            onClick={() => toggleMutation.mutate({ id: flow.id, active: true })}
                                            className="text-yellow-600 hover:text-yellow-800 disabled:opacity-40" title="Nonaktifkan"
                                            disabled={toggleMutation.isPending}
                                        >
                                            <Pause size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => toggleMutation.mutate({ id: flow.id, active: false })}
                                            className="text-green-600 hover:text-green-800 disabled:opacity-40" title="Aktifkan"
                                            disabled={toggleMutation.isPending}
                                        >
                                            <Play size={14} />
                                        </button>
                                    )}
                                    <button className="text-blue-600 hover:text-blue-800"><Pencil size={14} /></button>
                                    <button
                                        onClick={() => deleteMutation.mutate(flow.id)}
                                        disabled={deleteMutation.isPending}
                                        className="text-red-500 hover:text-red-700 disabled:opacity-40"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {flows.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Workflow size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No flows yet. Create your first automation!</p>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
