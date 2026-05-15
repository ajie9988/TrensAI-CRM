export const APP_NAME = "TrensAI CRM";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Status Labels ────────────────────────────────────────────────
export const DEVICE_STATUS: Record<string, { label: string; color: string }> = {
  connected: { label: "Terhubung", color: "text-green-700 bg-green-100" },
  disconnected: { label: "Terputus", color: "text-red-700 bg-red-100" },
  connecting: { label: "Menghubungkan", color: "text-yellow-700 bg-yellow-100" },
  pending: { label: "Menunggu QR", color: "text-yellow-700 bg-yellow-100" },
};

export const CONVERSATION_STATUS: Record<string, { label: string; color: string }> = {
  open: { label: "Terbuka", color: "text-blue-700 bg-blue-100" },
  resolved: { label: "Selesai", color: "text-green-700 bg-green-100" },
  waiting: { label: "Menunggu", color: "text-yellow-700 bg-yellow-100" },
};

export const BROADCAST_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-gray-700 bg-gray-100" },
  scheduled: { label: "Terjadwal", color: "text-blue-700 bg-blue-100" },
  sending: { label: "Mengirim", color: "text-yellow-700 bg-yellow-100" },
  completed: { label: "Selesai", color: "text-green-700 bg-green-100" },
  failed: { label: "Gagal", color: "text-red-700 bg-red-100" },
};

export const FLOW_STATUS: Record<string, { label: string; color: string }> = {
  active: { label: "Aktif", color: "text-green-700 bg-green-100" },
  inactive: { label: "Nonaktif", color: "text-gray-700 bg-gray-100" },
  draft: { label: "Draft", color: "text-yellow-700 bg-yellow-100" },
};

// ─── Role Labels ────────────────────────────────────────────────
export const USER_ROLES: Record<string, string> = {
  admin: "Admin",
  manager: "Manajer",
  agent: "Agen",
  viewer: "Viewer",
};

// ─── CRM Pipeline Stages ────────────────────────────────────────
export const CRM_STAGES: Record<string, { label: string; color: string }> = {
  lead: { label: "Lead", color: "text-gray-700 bg-gray-100" },
  prospect: { label: "Prospek", color: "text-blue-700 bg-blue-100" },
  qualified: { label: "Qualified", color: "text-indigo-700 bg-indigo-100" },
  proposal: { label: "Proposal", color: "text-purple-700 bg-purple-100" },
  won: { label: "Menang", color: "text-green-700 bg-green-100" },
  lost: { label: "Kalah", color: "text-red-700 bg-red-100" },
};

// ─── Pagination ───────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
