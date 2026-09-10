import type {
  BrandSummary,
  Platform,
  PriorityItem,
  Task,
  TargetStatus,
} from "@/types";
import { DEMO_TODAY } from "@/data/config";
import { brandsById } from "@/data/brands";
import { usersById } from "@/data/users";
import { formatROAS } from "@/lib/formatters";
import { isBlocked, isDueToday, isOverdue } from "@/lib/tasks";

/**
 * Core business calculations for Agency OS.
 *
 * These are the ONLY place the ROAS / target logic lives. Dashboards,
 * brand pages, reports and the AI engine all call these functions so that
 * every number in the product comes from the same formula.
 */

/** Total Ad Spend = Meta Spend + Google Spend */
export function calculateTotalAdSpend(metaSpend: number, googleSpend: number): number {
  return metaSpend + googleSpend;
}

/** Alias kept for readability in older call sites. */
export const calculateTotalSpend = calculateTotalAdSpend;

/** Actual ROAS = Shopify Net Sales / Total Ad Spend */
export function calculateActualROAS(netSales: number, totalSpend: number): number {
  if (totalSpend <= 0) return 0;
  return netSales / totalSpend;
}

/** Alias kept for readability in older call sites. */
export const calculateROAS = calculateActualROAS;

/** AOV = Shopify Net Sales / Orders */
export function calculateAOV(netSales: number, orders: number): number {
  if (orders <= 0) return 0;
  return netSales / orders;
}

/** Gap = Actual ROAS - Target ROAS (negative means below target). */
export function calculateTargetGap(actualROAS: number, targetROAS: number): number {
  return actualROAS - targetROAS;
}

/** Gap as a fraction of the target, e.g. -0.32 for 32% below target. */
export function calculateTargetGapPercent(actualROAS: number, targetROAS: number): number {
  if (targetROAS <= 0) return 0;
  return (actualROAS - targetROAS) / targetROAS;
}

/**
 * Share of target below which a brand is "Below Target" rather than
 * "Attention". The brief describes a 90% cut-off, but its example tables
 * (Yeoul 2.20 vs 2.50 = Attention, Giggle Pad 2.00 vs 2.50 = Attention,
 * Nysh - BluHeat 1.50 vs 2.20 = Below Target) only hold at 80%, so the
 * prototype uses 80% to keep the demo statuses consistent. Change this one
 * constant to move the cut-off.
 */
export const ATTENTION_THRESHOLD = 0.8;

/**
 * Target status rules:
 *  - Actual >= Target                              → On Track
 *  - ATTENTION_THRESHOLD × Target <= Actual < Target → Attention
 *  - Actual < ATTENTION_THRESHOLD × Target          → Below Target
 */
export function calculateTargetStatus(actualROAS: number, targetROAS: number): TargetStatus {
  if (actualROAS >= targetROAS) return "on_track";
  if (actualROAS >= targetROAS * ATTENTION_THRESHOLD) return "attention";
  return "below_target";
}

/** Brands whose Actual ROAS is under target, worst gap first. */
export function getBrandsBelowTarget(summaries: BrandSummary[]): BrandSummary[] {
  return summaries
    .filter((s) => s.status !== "on_track")
    .sort((a, b) => a.gapPercent - b.gapPercent);
}

export function getBrandsOnTrack(summaries: BrandSummary[]): BrandSummary[] {
  return summaries
    .filter((s) => s.status === "on_track")
    .sort((a, b) => b.gapPercent - a.gapPercent);
}

/** The brand with the largest shortfall against its target. */
export function getBrandWithBiggestGap(summaries: BrandSummary[]): BrandSummary | undefined {
  return [...summaries].sort((a, b) => a.gapPercent - b.gapPercent)[0];
}

/** Best performing brand: largest positive gap vs target, ties broken by Actual ROAS. */
export function getTopPerformingBrand(summaries: BrandSummary[]): BrandSummary | undefined {
  return [...summaries].sort(
    (a, b) => b.gapPercent - a.gapPercent || b.actualROAS - a.actualROAS,
  )[0];
}

/** Highest Shopify Net Sales within one currency group. */
export function getBrandWithHighestSales(summaries: BrandSummary[]): BrandSummary | undefined {
  return [...summaries].sort((a, b) => b.netSales - a.netSales)[0];
}

/**
 * Ranked list of things to look at, combining target gaps and task health.
 * Used by dashboards, the "Today's Priorities" list and the AI engine.
 */
export function getTopPriorities(
  summaries: BrandSummary[],
  tasks: Task[],
  options: { today?: string; limit?: number; platform?: Platform } = {},
): PriorityItem[] {
  const { today = DEMO_TODAY, limit = 6, platform } = options;
  const items: Array<PriorityItem & { score: number }> = [];

  for (const s of summaries) {
    if (s.status === "on_track") continue;
    const severity = s.status === "below_target" ? "high" : "medium";
    items.push({
      id: `brand-${s.brand.id}`,
      rank: 0,
      kind: "brand_target",
      title:
        s.status === "below_target"
          ? `Fix low ROAS for ${s.brand.name}`
          : `Improve ROAS for ${s.brand.name}`,
      detail: `Actual ROAS ${formatROAS(s.actualROAS)} vs target ${formatROAS(s.targetROAS)} (${Math.round(Math.abs(s.gapPercent) * 100)}% below)`,
      severity,
      brandId: s.brand.id,
      assigneeId: platform === "google" ? s.brand.googleOwnerId : s.brand.metaOwnerId,
      href: `/brands/${s.brand.id}`,
      // Clearly-below-target brands outrank everything; "attention" brands sit
      // between overdue tasks and blocked / due-today tasks.
      score: s.status === "below_target" ? 100 + Math.abs(s.gapPercent) * 100 : 55 + Math.abs(s.gapPercent) * 50,
    });
  }

  for (const t of tasks) {
    if (t.status === "completed") continue;
    const brand = brandsById[t.brandId];
    const assignee = usersById[t.assigneeId];
    if (isOverdue(t, today)) {
      items.push({
        id: `task-${t.id}`,
        rank: 0,
        kind: "overdue_task",
        title: `${t.title} · ${brand.name}`,
        detail: `Overdue · assigned to ${assignee.name}`,
        severity: t.priority === "high" ? "high" : "medium",
        brandId: t.brandId,
        taskId: t.id,
        assigneeId: t.assigneeId,
        href: "/tasks?view=overdue",
        score: 60 + (t.priority === "high" ? 20 : t.priority === "medium" ? 10 : 0), // 60–80
      });
    } else if (isBlocked(t)) {
      items.push({
        id: `task-${t.id}`,
        rank: 0,
        kind: "blocked_task",
        title: `${t.title} · ${brand.name}`,
        detail: `Blocked · assigned to ${assignee.name}`,
        severity: "medium",
        brandId: t.brandId,
        taskId: t.id,
        assigneeId: t.assigneeId,
        href: "/tasks?status=blocked",
        score: 50 + (t.priority === "high" ? 15 : 0),
      });
    } else if (isDueToday(t, today) && t.priority === "high") {
      items.push({
        id: `task-${t.id}`,
        rank: 0,
        kind: "due_today",
        title: `${t.title} · ${brand.name}`,
        detail: `Due today · assigned to ${assignee.name}`,
        severity: "medium",
        brandId: t.brandId,
        taskId: t.id,
        assigneeId: t.assigneeId,
        href: "/tasks",
        score: 40,
      });
    }
  }

  return items
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item, i) => {
      const { score: _score, ...rest } = item;
      void _score;
      return { ...rest, rank: i + 1 };
    });
}
