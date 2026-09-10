import type { Currency, TargetStatus, TaskPriority, TaskStatus } from "@/types";
import { DEMO_TODAY } from "@/data/config";

const inrFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const aedFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export const CURRENCY_SYMBOL: Record<Currency, string> = { INR: "₹", AED: "AED " };

/** Full currency string with locale grouping, e.g. ₹2,04,545 or AED 10,000. */
export function formatCurrency(value: number, currency: Currency, decimals = 0): string {
  if (currency === "INR") {
    const f = decimals ? new Intl.NumberFormat("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : inrFormatter;
    return `₹${f.format(value)}`;
  }
  const f = decimals ? new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : aedFormatter;
  return `AED ${f.format(value)}`;
}

/** Compact currency for headline metrics, e.g. ₹11.2L, ₹66.7K, AED 10.0K. */
export function formatCurrencyCompact(value: number, currency: Currency): string {
  const abs = Math.abs(value);
  if (currency === "INR") {
    if (abs >= 1e7) return `₹${(value / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5) return `₹${(value / 1e5).toFixed(abs >= 1e6 ? 1 : 2)}L`;
    if (abs >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
    return `₹${Math.round(value)}`;
  }
  if (abs >= 1e6) return `AED ${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e4) return `AED ${(value / 1e3).toFixed(1)}K`;
  return `AED ${aedFormatter.format(value)}`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return numberFormatter.format(value);
}

export function formatROAS(value: number): string {
  return value.toFixed(2);
}

/** Signed difference, e.g. +0.10 / -0.30 */
export function formatGap(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}`;
}

/** value is a ratio (0.0142 → 1.42%) */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatSignedPercent(value: number, decimals = 0): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "10 Sep" */
export function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** "10 Sep 2026" */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00Z`).getTime();
  const b = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Relative due label: Today, Tomorrow, Yesterday, 2 days overdue, 12 Sep */
export function formatDueDate(iso: string, today: string = DEMO_TODAY): string {
  const diff = daysBetween(today, iso);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  if (diff <= 6) return `In ${diff} days`;
  return formatShortDate(iso);
}

export const TARGET_STATUS_LABEL: Record<TargetStatus, string> = {
  on_track: "On Track",
  attention: "Attention",
  below_target: "Below Target",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  review: "Review",
  completed: "Completed",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
