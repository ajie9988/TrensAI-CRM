import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { id } from "date-fns/locale";

/** Gabungkan Tailwind class dengan kondisi */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format tanggal jadi string yang human-readable */
export function formatDate(date: string | Date, pattern = "dd MMM yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return `Hari ini, ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Kemarin, ${format(d, "HH:mm")}`;
  return format(d, pattern, { locale: id });
}

/** Format tanggal relatif (e.g. "3 jam yang lalu") */
export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: id });
}

/** Truncate string panjang */
export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

/** Format nomor telepon WhatsApp (628xx → +628xx) */
export function formatPhone(phone: string): string {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("62")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+62${cleaned.slice(1)}`;
  return `+62${cleaned}`;
}

/** Format angka dengan pemisah ribuan */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

/** Ambil inisial dari nama (max 2 huruf) */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}
