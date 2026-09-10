"use client";

import { AlertTriangle, Briefcase, CheckSquare, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import type { BrandSummary, PortfolioSummary, Task } from "@/types";
import { useAppState } from "@/components/providers/AppStateProvider";
import { getPortfolios } from "@/lib/analytics";
import { getTaskCounts } from "@/lib/tasks";
import { formatCurrency, formatCurrencyCompact, formatROAS } from "@/lib/formatters";
import { MetricCard, MetricGrid } from "@/components/dashboard/MetricCard";
import { SOURCE } from "@/components/shared/SourceLabel";

function primaryAndSecondary(portfolios: PortfolioSummary[], pick: (p: PortfolioSummary) => string) {
  const inr = portfolios.find((p) => p.currency === "INR");
  const aed = portfolios.find((p) => p.currency === "AED");
  const primary = inr ? pick(inr) : aed ? pick(aed) : "—";
  const secondary = inr && aed ? `Dubai: ${pick(aed)}` : undefined;
  return { primary, secondary };
}

/**
 * Headline metric row. INR (India Portfolio) is the main figure and the AED
 * (Dubai) figure is shown separately underneath – they are never added.
 */
export function PortfolioMetrics({
  summaries,
  tasks,
  brandsLabel = "Total Brands",
  spendLabel = "Total Ad Spend",
  spendSource = SOURCE.totalSpend,
  spendValue,
  salesLabel = "Shopify Net Sales",
  tasksLabel = "Open Tasks",
}: {
  summaries: BrandSummary[];
  tasks: Task[];
  brandsLabel?: string;
  spendLabel?: string;
  spendSource?: string;
  /** Override the spend figure (e.g. Meta spend only for a Meta marketer). */
  spendValue?: (p: PortfolioSummary) => number;
  salesLabel?: string;
  tasksLabel?: string;
}) {
  const { today } = useAppState();
  const portfolios = getPortfolios(summaries);
  const counts = getTaskCounts(tasks, today);
  const onlyINR = portfolios.length === 1 && portfolios[0].currency === "INR";
  const spend = primaryAndSecondary(portfolios, (p) => formatCurrencyCompact(spendValue ? spendValue(p) : p.totalSpend, p.currency));
  const sales = primaryAndSecondary(portfolios, (p) => formatCurrencyCompact(p.netSales, p.currency));
  const roas = primaryAndSecondary(portfolios, (p) => formatROAS(p.actualROAS));
  const spendFull = primaryAndSecondary(portfolios, (p) => formatCurrency(spendValue ? spendValue(p) : p.totalSpend, p.currency));
  const salesFull = primaryAndSecondary(portfolios, (p) => formatCurrency(p.netSales, p.currency));
  const label = onlyINR || portfolios.length === 0 ? "" : " (INR)";

  return (
    <MetricGrid>
      <MetricCard label={brandsLabel} value={summaries.length} icon={Briefcase} source={`${summaries.filter((s) => s.currency === "INR").length} India · ${summaries.filter((s) => s.currency === "AED").length} Dubai`} />
      <MetricCard label={`${spendLabel}${label}`} value={spend.primary} secondary={spend.secondary} icon={Wallet} source={spendSource} hint={spendFull.primary} />
      <MetricCard label={`${salesLabel}${label}`} value={sales.primary} secondary={sales.secondary} icon={ShoppingBag} source={SOURCE.shopify} hint={salesFull.primary} />
      <MetricCard label={`Actual ROAS${label}`} value={roas.primary} secondary={roas.secondary} icon={TrendingUp} source={SOURCE.actualROAS} hint="Actual ROAS never uses Meta or Google reported revenue." />
      <MetricCard label={tasksLabel} value={counts.open} icon={CheckSquare} source={SOURCE.tasks} />
      <MetricCard label="Overdue Tasks" value={counts.overdue} icon={AlertTriangle} tone={counts.overdue > 0 ? "danger" : "default"} source={SOURCE.tasks} />
    </MetricGrid>
  );
}
