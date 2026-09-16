"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, ListChecks, Sparkles } from "lucide-react";
import type { BrandSummary } from "@/types";
import { usersById } from "@/data/users";
import { useAppState } from "@/components/providers/AppStateProvider";
import { useAIDrawer } from "@/components/providers/AIDrawerProvider";
import { getVisiblePlatforms, getVisibleTasks, isManager } from "@/lib/permissions";
import { isOverdue, sortTasks } from "@/lib/tasks";
import { formatCurrency, formatCurrencyCompact, formatDueDate, formatNumber, formatPercent, formatROAS } from "@/lib/formatters";
import { DonutChart } from "@/components/charts/DonutChart";
import { describeGap, TargetRing } from "@/components/charts/TargetRing";
import { CHART_COLORS } from "@/components/charts/chartConfig";
import { PriorityBadge, TargetStatusBadge, TaskStatusBadge } from "@/components/shared/StatusBadge";
import { SOURCE } from "@/components/shared/SourceLabel";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Simple view of a brand: one screen, no tabs, plain language.
 * Every number comes from the same BrandSummary as the detailed view.
 */
export function BrandSimpleView({ summary: s, onShowDetails }: { summary: BrandSummary; onShowDetails: () => void }) {
  const { currentUser, tasks, today } = useAppState();
  const { openDrawer } = useAIDrawer();
  const platforms = getVisiblePlatforms(currentUser);
  const manager = isManager(currentUser);
  const openTasks = sortTasks(getVisibleTasks(currentUser, tasks).filter((t) => t.brandId === s.brand.id && t.status !== "completed"), today);
  const overdue = openTasks.filter((t) => isOverdue(t, today)).length;
  const cur = s.currency;
  const unit = cur === "INR" ? "₹" : "AED";

  const spendSlices = [
    { name: "Meta Spend", value: s.metaSpend, color: CHART_COLORS.meta, label: formatCurrency(s.metaSpend, cur) },
    { name: "Google Spend", value: s.googleSpend, color: CHART_COLORS.google, label: formatCurrency(s.googleSpend, cur) },
  ];

  const checks: string[] = [];
  if (s.status === "on_track") {
    checks.push("The brand is above its ROAS target. Keep the current setup.");
    checks.push("If scaling, increase budget slowly (10–20% at a time) and watch Actual ROAS daily.");
  } else {
    if (platforms.includes("meta")) checks.push(`Review Meta campaigns: CTR is ${formatPercent(s.meta.ctr)} and CPC is ${formatCurrency(s.meta.cpc, cur, 2)}.`);
    if (platforms.includes("google")) checks.push(`Review Google search terms: CPC is ${formatCurrency(s.google.cpc, cur, 2)}.`);
    checks.push("Check creatives and pause the ones that are not performing.");
    checks.push("Do not increase ad spend until Actual ROAS moves closer to the target.");
  }

  return (
    <div className="space-y-4">
      {/* Row 1: the answer in one sentence + the ring */}
      <Card className={cn(s.status === "on_track" ? "border-emerald-200" : s.status === "attention" ? "border-amber-200" : "border-red-200")}>
        <CardContent className="flex flex-col items-center gap-6 lg:flex-row lg:items-center">
          <TargetRing actual={s.actualROAS} target={s.targetROAS} status={s.status} gap={s.gap} gapPercent={s.gapPercent} size={150} />
          <div className="min-w-0 flex-1 space-y-3 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {s.status === "on_track" ? <CheckCircle2 className="size-5 text-emerald-600" /> : <AlertTriangle className={cn("size-5", s.status === "attention" ? "text-amber-600" : "text-red-600")} />}
              <p className="text-lg font-semibold">
                {s.status === "on_track" ? `${s.brand.name} is meeting its target.` : s.status === "attention" ? `${s.brand.name} needs attention.` : `${s.brand.name} is below target.`}
              </p>
              <TargetStatusBadge status={s.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              We spent <strong className="text-foreground">{formatCurrency(s.totalSpend, cur)}</strong> on ads and sold{" "}
              <strong className="text-foreground">{formatCurrency(s.netSales, cur)}</strong> on Shopify. That is{" "}
              <strong className="text-foreground">{unit}{formatROAS(s.actualROAS)}</strong> back for every {unit}1 spent (Actual ROAS {formatROAS(s.actualROAS)}).
              The target is <strong className="text-foreground">{formatROAS(s.targetROAS)}</strong>, so the brand is{" "}
              <strong className={cn(s.status === "on_track" ? "text-emerald-700" : s.status === "attention" ? "text-amber-700" : "text-red-600")}>{describeGap(s)}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Meta reports <strong className="text-foreground">{formatCurrency(s.metaReportedSales, cur)}</strong> of sales for the same period,{" "}
              {Math.abs(s.salesGapVsMeta) < 1
                ? "which matches Shopify."
                : `${formatCurrency(Math.abs(s.salesGapVsMeta), cur)} ${s.salesGapVsMeta > 0 ? "more" : "less"} than Shopify.`}{" "}
              Customers sent back <strong className="text-foreground">{formatCurrency(s.returnedAmount, cur)}</strong> ({formatPercent(s.returnRate, 1)} of sales),
              already deducted from Net Sales.
            </p>
            <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
              <Button size="sm" onClick={() => openDrawer({ brandId: s.brand.id, initialQuestion: s.status === "on_track" ? "What should we do?" : `Why does ${s.brand.name} need attention?` })}>
                <Sparkles /> Ask Agency AI
              </Button>
              <Button size="sm" variant="outline" onClick={onShowDetails}>Show details</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row 2: the four numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <BigNumber label="Total Ad Spend" value={formatCurrency(s.totalSpend, cur)} source={SOURCE.totalSpend} />
        <BigNumber label="Shopify Net Sales" value={formatCurrency(s.netSales, cur)} source={SOURCE.shopify} />
        <BigNumber label="Returned" value={`-${formatCurrency(s.returnedAmount, cur)}`} source={`${formatPercent(s.returnRate, 1)} of sales`} tone="danger" />
        <BigNumber label="Orders" value={formatNumber(s.orders)} source={SOURCE.orders} />
        <BigNumber label="Average Order Value" value={formatCurrency(s.aov, cur)} source={SOURCE.aov} />
      </div>

      {/* Row 3: where the money went + things to check + tasks */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Where the ad money went</CardTitle>
            <CardDescription>Meta + Google = {formatCurrency(s.totalSpend, cur)}.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart slices={spendSlices} centerValue={formatCurrencyCompact(s.totalSpend, cur)} centerLabel="Total Ad Spend" size={150} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Things to check</CardTitle>
            <CardDescription>{s.status === "on_track" ? "Keep it steady." : "Before adding budget."}</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              {checks.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span className="tabular flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{i + 1}</span>
                  <span>{c}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="size-4" /> Open tasks</CardTitle>
            <CardDescription>{openTasks.length} open{overdue ? ` · ${overdue} overdue` : ""}</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild><Link href={`/brands/${s.brand.id}?tab=tasks`}>All tasks</Link></Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {openTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open tasks for this brand.</p>
            ) : (
              <ul className="space-y-2">
                {openTasks.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.title}</p>
                      <p className={cn("text-xs text-muted-foreground", isOverdue(t, today) && "font-medium text-red-600")}>
                        {manager ? `${usersById[t.assigneeId].name} · ` : ""}{formatDueDate(t.dueDate, today)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <PriorityBadge priority={t.priority} />
                      <TaskStatusBadge status={t.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BigNumber({
  label,
  value,
  source,
  tone = "default",
}: {
  label: string;
  value: string;
  source: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("tabular mt-1 text-2xl font-semibold tracking-tight", tone === "danger" && "text-red-600")}>{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{source}</p>
    </div>
  );
}
