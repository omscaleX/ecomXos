import type { BrandId, ContentDepartment, UserId } from "@/types";
import type { ContentRequest, DepartmentStats } from "@/types/content";
import { DEMO_TODAY } from "@/data/config";
import { daysBetween } from "@/lib/formatters";
import { deliverableCount, isOverdue } from "@/lib/content";
import { resolveRange } from "@/lib/analytics";
import type { RangeInput } from "@/types";

/**
 * Content production reporting.
 *
 * Deliberately separate from the ad/sales analytics in lib/analytics.ts:
 * these are counts of work done, never money, so nothing here can be
 * confused with ROAS or sales.
 */

function avg(values: number[]): number {
  if (!values.length) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/** Requests raised inside a date range. */
export function filterByRange(requests: ContentRequest[], range: RangeInput): ContentRequest[] {
  const { from, to } = resolveRange(range);
  return requests.filter((r) => r.createdAt >= from && r.createdAt <= to);
}

/** Days from assignment to the first version being uploaded. */
export function productionDays(request: ContentRequest): number | undefined {
  const first = request.submissions[0];
  if (!first || !request.assignedAt) return undefined;
  return Math.max(0, daysBetween(request.assignedAt, first.submittedAt));
}

/** Days from a version being uploaded to the requester acting on it. */
export function reviewDays(request: ContentRequest): number | undefined {
  const acted = request.submissions.filter((s) => s.outcome && s.outcomeAt);
  if (!acted.length) return undefined;
  return avg(acted.map((s) => Math.max(0, daysBetween(s.submittedAt, s.outcomeAt as string))));
}

export function buildDepartmentStats(
  requests: ContentRequest[],
  department: ContentDepartment,
  today: string = DEMO_TODAY,
): DepartmentStats {
  const rows = requests.filter((r) => r.department === department);
  const completed = rows.filter((r) => r.status === "completed");

  return {
    department,
    requested: rows.length,
    completed: completed.length,
    inProduction: rows.filter((r) => r.status === "in_production" || r.status === "changes_required").length,
    awaitingReview: rows.filter((r) => r.status === "in_review").length,
    overdue: rows.filter((r) => isOverdue(r, today)).length,
    deliverablesRequested: rows.reduce((sum, r) => sum + deliverableCount(r.details), 0),
    deliverablesCompleted: completed.reduce((sum, r) => sum + deliverableCount(r.details), 0),
    avgProductionDays: avg(rows.map(productionDays).filter((v): v is number => v !== undefined)),
    avgReviewDays: avg(rows.map(reviewDays).filter((v): v is number => v !== undefined)),
    revisionRate: completed.length
      ? Math.round((completed.filter((r) => r.submissions.length > 1).length / completed.length) * 100) / 100
      : 0,
  };
}

export function buildAllDepartmentStats(requests: ContentRequest[], today: string = DEMO_TODAY): DepartmentStats[] {
  return (["script", "video", "design"] as ContentDepartment[]).map((d) =>
    buildDepartmentStats(requests, d, today),
  );
}

export interface PersonLoad {
  userId: UserId;
  department: ContentDepartment;
  open: number;
  inProduction: number;
  awaitingReview: number;
  overdue: number;
  completed: number;
  deliverablesOpen: number;
}

export function buildPersonLoad(
  requests: ContentRequest[],
  userId: UserId,
  department: ContentDepartment,
  today: string = DEMO_TODAY,
): PersonLoad {
  const mine = requests.filter((r) => r.assigneeId === userId);
  const open = mine.filter((r) => r.status !== "completed");
  return {
    userId,
    department,
    open: open.length,
    inProduction: mine.filter((r) => r.status === "in_production" || r.status === "changes_required").length,
    awaitingReview: mine.filter((r) => r.status === "in_review").length,
    overdue: mine.filter((r) => isOverdue(r, today)).length,
    completed: mine.filter((r) => r.status === "completed").length,
    deliverablesOpen: open.reduce((sum, r) => sum + deliverableCount(r.details), 0),
  };
}

export interface BrandContentStats {
  brandId: BrandId;
  total: number;
  open: number;
  completed: number;
  overdue: number;
  byDepartment: Record<ContentDepartment, number>;
}

export function buildBrandContentStats(
  requests: ContentRequest[],
  brandId: BrandId,
  today: string = DEMO_TODAY,
): BrandContentStats {
  const rows = requests.filter((r) => r.brandId === brandId);
  return {
    brandId,
    total: rows.length,
    open: rows.filter((r) => r.status !== "completed").length,
    completed: rows.filter((r) => r.status === "completed").length,
    overdue: rows.filter((r) => isOverdue(r, today)).length,
    byDepartment: {
      script: rows.filter((r) => r.department === "script").length,
      video: rows.filter((r) => r.department === "video").length,
      design: rows.filter((r) => r.department === "design").length,
    },
  };
}

/** Totals across all three departments, for the headline cards. */
export interface ContentOverview {
  total: number;
  open: number;
  waitingForPerson: number;
  beingWorkedOn: number;
  waitingForReview: number;
  done: number;
  overdue: number;
  deliverablesOpen: number;
  onTimeRate: number;
}

export function buildContentOverview(requests: ContentRequest[], today: string = DEMO_TODAY): ContentOverview {
  const open = requests.filter((r) => r.status !== "completed");
  const done = requests.filter((r) => r.status === "completed");
  const onTime = done.filter((r) => !r.completedAt || r.completedAt <= r.eta);
  return {
    total: requests.length,
    open: open.length,
    waitingForPerson: requests.filter((r) => r.status === "pending_assignment").length,
    beingWorkedOn: requests.filter((r) => r.status === "in_production" || r.status === "changes_required").length,
    waitingForReview: requests.filter((r) => r.status === "in_review").length,
    done: done.length,
    overdue: requests.filter((r) => isOverdue(r, today)).length,
    deliverablesOpen: open.reduce((sum, r) => sum + deliverableCount(r.details), 0),
    onTimeRate: done.length ? Math.round((onTime.length / done.length) * 100) / 100 : 0,
  };
}
