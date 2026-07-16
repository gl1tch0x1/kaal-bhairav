import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(d);
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return "text-red-400 bg-red-400/10 border-red-400/30";
    case "high": return "text-orange-400 bg-orange-400/10 border-orange-400/30";
    case "medium": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
    case "low": return "text-green-400 bg-green-400/10 border-green-400/30";
    case "info": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
    default: return "text-slate-400 bg-slate-400/10 border-slate-400/30";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "active": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
    case "pending": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
    case "closed": return "text-slate-400 bg-slate-400/10 border-slate-400/30";
    case "archived": return "text-purple-400 bg-purple-400/10 border-purple-400/30";
    default: return "text-slate-400 bg-slate-400/10 border-slate-400/30";
  }
}
