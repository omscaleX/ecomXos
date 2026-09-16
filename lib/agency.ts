import type {
  BrandId,
  Platform,
  RangeInput,
  BrandSummary,
  PortfolioSummary,
  PriorityItem,
  Task,
  User,
  Workload,
} from "@/types";
import { DEMO_TODAY } from "@/data/config";
import { brands } from "@/data/brands";
import { users } from "@/data/users";
import type { TargetMap } from "@/data/targets";
import { getBrandSummaries, getPortfolios } from "@/lib/analytics";
import {
  getBrandsBelowTarget,
  getBrandsOnTrack,
  getBrandWithBiggestGap,
  getTopPerformingBrand,
  getTopPriorities,
} from "@/lib/calculations";
import { getTaskCounts, getWorkload } from "@/lib/tasks";

export interface AgencySummary {
  totalBrands: number;
  summaries: BrandSummary[];
  portfolios: PortfolioSummary[];
  /** Brands under target (Attention + Below Target), worst first. */
  belowTarget: BrandSummary[];
  /** Brands with status "below_target" only. */
  strictlyBelow: BrandSummary[];
  attention: BrandSummary[];
  onTrack: BrandSummary[];
  openTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  dueToday: number;
  completedThisWeek: number;
  mainConcern?: BrandSummary;
  strongestBrand?: BrandSummary;
  workloads: Workload[];
  priorities: PriorityItem[];
}

/**
 * One function that produces the agency-level picture used by the Senior
 * Manager dashboard, reports and the AI engine. Pass a subset of brands and
 * tasks to get the same summary scoped to a single user.
 */
export function generateAgencySummary(
  brandIds: BrandId[],
  targets: TargetMap,
  tasks: Task[],
  options: { today?: string; teamUserIds?: User["id"][]; platform?: Platform; range?: RangeInput } = {},
): AgencySummary {
  const today = options.today ?? DEMO_TODAY;
  const summaries = getBrandSummaries(brandIds, targets, options.range ?? "30d");
  const portfolios = getPortfolios(summaries);
  const belowTarget = getBrandsBelowTarget(summaries);
  const counts = getTaskCounts(tasks, today);
  const teamIds = options.teamUserIds ?? users.filter((u) => u.role !== "senior_manager").map((u) => u.id);
  const workloads = teamIds.map((id) => {
    const brandCount = brands.filter(
      (b) => b.managerId === id || b.metaOwnerId === id || b.googleOwnerId === id,
    ).length;
    return getWorkload(id, tasks, brandCount, today);
  });

  return {
    totalBrands: brandIds.length,
    summaries,
    portfolios,
    belowTarget,
    strictlyBelow: summaries.filter((s) => s.status === "below_target"),
    attention: summaries.filter((s) => s.status === "attention"),
    onTrack: getBrandsOnTrack(summaries),
    openTasks: counts.open,
    overdueTasks: counts.overdue,
    blockedTasks: counts.blocked,
    dueToday: counts.dueToday,
    completedThisWeek: counts.completedThisWeek,
    mainConcern: belowTarget.length ? getBrandWithBiggestGap(summaries) : undefined,
    strongestBrand: getTopPerformingBrand(summaries),
    workloads,
    priorities: getTopPriorities(summaries, tasks, { today, limit: 8, platform: options.platform }),
  };
}
