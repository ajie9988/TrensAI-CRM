"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import StatsCard from "@/components/StatsCard";
import { useGet, useMutate } from "@/hooks/useApi";
import { DEVICE_STATUS } from "@/lib/constants";
import { Smartphone, Wifi, WifiOff, Plus, RefreshCw, Trash2, QrCode, Unplug, ChevronDown, ChevronUp } from "lucide-react";

type Device = {
    id: number;
    device_name: string;
    phone_number: string;
    status: "connected" | "disconnected" | "connecting" | "pending";
    is_ai_enabled: boolean;
    last_activity_at: string | null;
    last_connected_at: string | null;
};

interface DevicesResponse { data: Device[] }

interface QRResponse {
    mode?: "qr" | "pairing_code" | "unavailable" | "error" | "connected";
    qr_code?: string | null;
    pairing_code?: string | null;
    message?: string;
}

export default function DevicesPage() {
    const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
    const [connectForm, setConnectForm] = useState({
        device_name: "",
        phone_number: "",
    });
    const [qrDeviceId, setQrDeviceId] = useState<number | null>(null);
    const [showPairingCode, setShowPairingCode] = useState(false);
    const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
    const [syncTick, setSyncTick] = useState(0);
    const [qrCountdown, setQrCountdown] = useState(30);
    const [missedQrScans, setMissedQrScans] = useState(0);
    const QR_CYCLE_SECONDS = 30;
    const MAX_MISSED_SCANS = 3;

    useEffect(() => {
        setShowPairingCode(false);
    }, [qrDeviceId]);

    const { data, isLoading, isFetching, refetch } = useGet<DevicesResponse>(
        ["devices"],
        "/api/v1/devices",
        {
            refetchInterval: 4000,
            refetchIntervalInBackground: true,
        }
    );
    const { data: qrData, isLoading: isQrLoading } = useGet<QRResponse>(
        ["device-qr", qrDeviceId],
        qrDeviceId ? `/api/v1/devices/${qrDeviceId}/qr` : "/api/v1/devices/0/qr",
        {
            enabled: qrDeviceId !== null,
            refetchInterval: (query) => {
                const mode = (query.state.data as QRResponse | undefined)?.mode;
                return mode === "connected" ? false : 2500;
            },
            refetchIntervalInBackground: true,
        }
    );

    useEffect(() => {
        if (qrData?.mode === "connected") {
            refetch();
            setTimeout(() => setQrDeviceId(null), 1000);
        }
    }, [qrData?.mode, refetch]);

    // Reset countdown & missed-scan counter when modal opens / changes device
    useEffect(() => {
        setQrCountdown(QR_CYCLE_SECONDS);
        setMissedQrScans(0);
    }, [qrDeviceId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reset countdown each time a new QR image arrives from backend
    useEffect(() => {
        if (qrData?.qr_code) {
            setQrCountdown(QR_CYCLE_SECONDS);
        }
    }, [qrData?.qr_code]); // eslint-disable-line react-hooks/exhaustive-deps

    // Countdown interval – only while QR modal is open and not yet connected
    useEffect(() => {
        if (qrDeviceId === null || qrData?.mode === "connected") return;

        const id = setInterval(() => {
            setQrCountdown((prev) => {
                if (prev <= 1) {
                    setMissedQrScans((m) => m + 1);
                    return QR_CYCLE_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(id);
    }, [qrDeviceId, qrData?.mode]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-close modal + disconnect when 3 cycles expire without scan
    useEffect(() => {
        if (missedQrScans >= MAX_MISSED_SCANS && qrDeviceId !== null) {
            disconnectMutation.mutate(qrDeviceId);
            setQrDeviceId(null);
            setMissedQrScans(0);
        }
    }, [missedQrScans]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (data) {
            setLastSyncAt(Date.now());
        }
    }, [data]);

    useEffect(() => {
        const id = window.setInterval(() => {
            setSyncTick((prev) => prev + 1);
        }, 1000);

        return () => window.clearInterval(id);
    }, []);

    const formatDate = (iso: string | null | undefined): string => {
        if (!iso) return "-";
        try {
            return new Intl.DateTimeFormat("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }).format(new Date(iso));
        } catch {
            return iso;
        }
    };

    const createMutation = useMutate("post", "/api/v1/devices", {
        invalidateKeys: [["devices"]],
        onSuccess: () => {
            setIsConnectModalOpen(false);
            setConnectForm({ device_name: "", phone_number: "" });
        },
    });
    const deleteMutation = useMutate("delete", (id: number) => `/api/v1/devices/${id}`, {
        invalidateKeys: [["devices"]],
    });
    const reconnectMutation = useMutate("post", (id: number) => `/api/v1/devices/${id}/reconnect`, {
        invalidateKeys: [["devices"]],
    });
    const disconnectMutation = useMutate("post", (id: number) => `/api/v1/devices/${id}/disconnect`, {
        invalidateKeys: [["devices"]],
    });
    const toggleAiMutation = useMutate("post", (id: number) => `/api/v1/devices/${id}/toggle-ai`, {
        invalidateKeys: [["devices"]],
    });

    const devices: Device[] = data?.data ?? [];
    const isMutating = createMutation.isPending || reconnectMutation.isPending || deleteMutation.isPending || disconnectMutation.isPending || toggleAiMutation.isPending;

    // Close QR modal and stop the session unless already connected
    const closeQrModal = () => {
        if (qrDeviceId !== null && qrData?.mode !== "connected") {
            disconnectMutation.mutate(qrDeviceId);
        }
        setQrDeviceId(null);
        setMissedQrScans(0);
    };
    const qrImageSrc = qrData?.qr_code;
    const pairingCode = qrData?.pairing_code ?? null;
    const qrMessage = qrData?.message ?? null;
    const selectedDevice = qrDeviceId !== null ? devices.find((d) => d.id === qrDeviceId) ?? null : null;
    const secondsSinceLastSync = lastSyncAt ? Math.max(0, Math.floor((Date.now() - lastSyncAt) / 1000)) : null;
    const lastSyncLabel = secondsSinceLastSync === null
        ? "Belum tersinkron"
        : secondsSinceLastSync === 0
            ? "baru saja"
            : `${secondsSinceLastSync} detik lalu`;

    void syncTick;
    const canRenderQrImage =
        typeof qrImageSrc === "string" &&
        qrImageSrc.length > 0 &&
        !qrImageSrc.includes("...") &&
        (qrImageSrc.startsWith("data:image/") || qrImageSrc.startsWith("http://") || qrImageSrc.startsWith("https://"));

    const onCreateDevice = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!connectForm.phone_number.trim()) return;

        createMutation.mutate({
            device_name: connectForm.device_name.trim() || undefined,
            phone_number: connectForm.phone_number.trim(),
        });
    };

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">WhatsApp Devices</h2>
                <button
                    className="btn-primary flex items-center gap-2"
                    onClick={() => setIsConnectModalOpen(true)}
                >
                    <Plus size={16} />
                    Connect Device
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatsCard label="Total Devices" value={isLoading ? "..." : devices.length} icon={<Smartphone size={18} />} />
                <StatsCard
                    label="Connected"
                    value={isLoading ? "..." : devices.filter((d) => d.status === "connected").length}
                    icon={<Wifi size={18} />}
                    description="Active right now"
                />
                <StatsCard
                    label="Disconnected"
                    value={isLoading ? "..." : devices.filter((d) => d.status === "disconnected").length}
                    icon={<WifiOff size={18} />}
                    description="Need attention"
                />
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-700">Device List</h3>
                        <p className="mt-1 text-xs text-gray-500">
                            {isFetching ? "Sedang sinkronisasi..." : `Last sync ${lastSyncLabel}`}
                        </p>
                    </div>
                    <button onClick={() => refetch()} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                        <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 text-left">Device Name</th>
                            <th className="px-6 py-3 text-left">Phone Number</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-center">AI Auto-Reply</th>
                            <th className="px-6 py-3 text-left">Last Seen</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                        )}
                        {devices.map((device) => (
                            <tr key={device.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-800">{device.device_name}</td>
                                <td className="px-6 py-4 text-gray-600">{device.phone_number}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${DEVICE_STATUS[device.status]?.color ?? ""}`}>
                                        {DEVICE_STATUS[device.status]?.label ?? device.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => toggleAiMutation.mutate(device.id)}
                                        disabled={isMutating}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${device.is_ai_enabled ? 'bg-purple-600' : 'bg-gray-300'} disabled:opacity-50`}
                                        title={device.is_ai_enabled ? "Turn off AI Auto-Reply" : "Turn on AI Auto-Reply"}
                                    >
                                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${device.is_ai_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{formatDate(device.last_connected_at ?? device.last_activity_at)}</td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setQrDeviceId(device.id)}
                                        className="text-indigo-600 hover:text-indigo-800 text-xs mr-3"
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            <QrCode size={12} /> QR
                                        </span>
                                    </button>
                                    {device.status !== "connected" && (
                                        <button
                                            onClick={() => reconnectMutation.mutate(device.id)}
                                            className="text-blue-600 hover:text-blue-800 text-xs mr-3 disabled:opacity-40"
                                            disabled={isMutating}
                                        >
                                            Reconnect
                                        </button>
                                    )}
                                    {device.status === "connected" && (
                                        <button
                                            onClick={() => disconnectMutation.mutate(device.id)}
                                            className="text-amber-600 hover:text-amber-800 text-xs mr-3 disabled:opacity-40"
                                            disabled={isMutating}
                                        >
                                            <span className="inline-flex items-center gap-1">
                                                <Unplug size={12} /> Disconnect
                                            </span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteMutation.mutate(device.id)}
                                        className="text-red-500 hover:text-red-700 disabled:opacity-40"
                                        disabled={isMutating}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {devices.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <Smartphone size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No devices connected yet.</p>
                        <button className="btn-primary mt-4" onClick={() => setIsConnectModalOpen(true)}>Connect your first device</button>
                    </div>
                )}
            </div>

            {isConnectModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-xl bg-white border border-gray-200 shadow-xl">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Connect Device</h3>
                        </div>
                        <form className="px-6 py-4 space-y-4" onSubmit={onCreateDevice}>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Device Name</label>
                                <input
                                    value={connectForm.device_name}
                                    onChange={(e) => setConnectForm((prev) => ({ ...prev, device_name: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Sales Team Device"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                                <input
                                    value={connectForm.phone_number}
                                    onChange={(e) => setConnectForm((prev) => ({ ...prev, phone_number: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="628123456789"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsConnectModalOpen(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || !connectForm.phone_number.trim()}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {createMutation.isPending ? "Connecting..." : "Connect"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {qrDeviceId !== null && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) closeQrModal(); }}>
                    <div className="w-full max-w-md rounded-xl bg-white border border-gray-200 shadow-xl">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Device QR Code</h3>
                            <button
                                onClick={closeQrModal}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Close
                            </button>
                        </div>
                        <div className="px-6 py-6 text-center">
                            {selectedDevice && (
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
                                    <span className={`inline-block h-2 w-2 rounded-full ${selectedDevice.status === "connected" ? "bg-emerald-500" : selectedDevice.status === "connecting" ? "bg-amber-500" : "bg-gray-400"}`} />
                                    Status: {DEVICE_STATUS[selectedDevice.status]?.label ?? selectedDevice.status}
                                </div>
                            )}
                            {isQrLoading && <p className="text-sm text-gray-500">Loading QR...</p>}
                            {!isQrLoading && qrData?.mode === "connected" && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-emerald-700">Perangkat sudah terhubung.</p>
                                    <p className="text-xs text-gray-500">Status akan diperbarui otomatis pada daftar device.</p>
                                </div>
                            )}
                            {!isQrLoading && canRenderQrImage && (
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm relative">
                                        <img src={qrImageSrc} alt="Device QR" className="mx-auto h-64 w-64 object-contain" />
                                    </div>
                                    {/* Countdown bar */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>
                                                {missedQrScans > 0
                                                    ? `⚠️ Percobaan ${missedQrScans + 1} dari ${MAX_MISSED_SCANS} — QR akan ditutup otomatis jika tidak di-scan`
                                                    : "Scan QR ini di WhatsApp sebelum waktu habis"}
                                            </span>
                                            <span className={`font-mono font-semibold ${qrCountdown <= 10 ? "text-red-500" : "text-gray-600"}`}>
                                                {qrCountdown}s
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${qrCountdown <= 10 ? "bg-red-500" : qrCountdown <= 20 ? "bg-amber-400" : "bg-emerald-500"
                                                    }`}
                                                style={{ width: `${(qrCountdown / QR_CYCLE_SECONDS) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500">Setelah berhasil pair, status akan berubah otomatis ke Connected.</p>
                                </div>
                            )}
                            {!isQrLoading && qrData?.mode !== "connected" && !canRenderQrImage && (
                                <div className="space-y-3">
                                    <div className="mx-auto rounded-2xl border border-gray-200 bg-gray-50 px-5 py-6">
                                        <p className="text-sm font-medium text-gray-700">QR belum tersedia saat ini.</p>
                                        <p className="mt-1 text-sm text-gray-500">Silakan tunggu beberapa saat atau buka pairing code sebagai cadangan.</p>
                                    </div>

                                    {pairingCode && (
                                        <div className="space-y-3 text-left">
                                            <button
                                                type="button"
                                                onClick={() => setShowPairingCode((prev) => !prev)}
                                                className="mx-auto flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                {showPairingCode ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                {showPairingCode ? "Sembunyikan pairing code" : "Tampilkan pairing code"}
                                            </button>

                                            {showPairingCode && (
                                                <div className="space-y-3 text-center">
                                                    <div className="mx-auto inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                                                        <span className="font-mono text-lg font-semibold tracking-[0.3em] text-gray-900">{pairingCode}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400">Buka WhatsApp di phone, lalu pilih perangkat tertaut / pair with phone number dan masukkan kode ini.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!pairingCode && (
                                        <p className="text-sm text-gray-500">{qrMessage || "QR code is not available yet for this device."}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
