import type { WaterStatus } from "@/types";

export function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  second: "2-digit",
  hour12: false,
  });
}

export function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const STATUS_COLORS: Record<WaterStatus, {
  bg: string;
  text: string;
  border: string;
  badge: string;
  gradient: string;
}> = {
  safe: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    gradient: "from-emerald-500 to-teal-500",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    gradient: "from-amber-500 to-orange-500",
  },
  critical: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    gradient: "from-red-500 to-rose-500",
  },
};

export const SEVERITY_COLORS: Record<string, {
  badge: string;
  dot: string;
}> = {
  low: {
    badge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    dot: "bg-sky-400",
  },
  medium: {
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  high: {
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    dot: "bg-orange-400",
  },
  critical: {
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
    dot: "bg-red-400",
  },
  information: {
    badge: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    dot: "bg-sky-400",
  },
  warning: {
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
};

export function getScoreColor(score: number): string {
  if (score >= 90) return "#10b981";
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "EXCELLENT";
  if (score >= 75) return "GOOD";
  if (score >= 50) return "WARNING";
  return "CRITICAL";
}

export function getScoreStatus(score: number): WaterStatus {
  if (score >= 75) return "safe";
  if (score >= 50) return "warning";
  return "critical";
}

export const PARAM_INFO: Record<string, { label: string; unit: string; color: string; icon: string }> = {
  ph: { label: "pH", unit: "", color: "#06b6d4", icon: "Droplet" },
  turbidity: { label: "Turbidity", unit: "NTU", color: "#f59e0b", icon: "Cloud" },
  temperature: { label: "Temperature", unit: "°C", color: "#ef4444", icon: "Thermometer" },
  tds: { label: "TDS", unit: "ppm", color: "#8b5cf6", icon: "Beaker" },
  dissolved_oxygen: { label: "Dissolved Oxygen", unit: "mg/L", color: "#10b981", icon: "Waves" },
  dissolvedOxygen: { label: "Dissolved Oxygen", unit: "mg/L", color: "#10b981", icon: "Waves" },
  conductivity: { label: "Conductivity", unit: "µS/cm", color: "#3b82f6", icon: "Zap" },
};
