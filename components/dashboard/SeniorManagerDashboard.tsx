"use client";

import Link from "next/link";
import { useAppState } from "@/components/providers/AppStateProvider";
import { brandIds } from "@/data/brands";
import { getBrandSummaries, getPortfolioSummary } from "@/lib/analytics";
import { formatCurrency, formatCurrencyCompact, formatROAS } from "@/lib/formatters";
import { generateAgencySummary } from "@/lib/agency";
import { PageHeader } from "@/components/layout/PageHeader";
import { PortfolioMetrics } from "@/components/dashboard/PortfolioMetrics";
import { BrandPerformanceTable } from "@/components/dashboard/BrandPerformanceTable";
import { NeedsAttention } from "@/components/dashboard/NeedsAttention";
import { TeamWorkloadCards } from "@/components/dashboard/TeamWorkload";
import { TaskSummary } from "@/components/dashboard/TaskSummary";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { DonutChart } from "@/components/charts/DonutChart";
import { TargetOverview } from "@/components/charts/TargetRing";
import { salesByBrandSlices, spendByBrandSlices, spendByPlatformSlices, statusSlices } from "@/components/charts/pieData";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Bhupes – "How is the agency doing?" and "What needs attention?" */
export function SeniorManagerDashboard() {
  const { currentUser, targets, tasks, today } = useAppState();
  const summaries = getBrandSummaries(brandIds, targets);
  const agency = generateAgencySummary(brandIds, targets, tasks, { today });
  const inrPortfolio = getPortfolioSummary(summaries, "INR");
  const aedPortfolio = summaries.some((x) => x.currency === "AED") ? getPortfolioSummary(summaries, "AED") : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good morning, ${currentUser.name}`}
        subtitle="Agency overview · last 30 days · Demo Portfolio Total (India in INR, Dubai in AED, never combined)"
        actions={<QuickActions />}
      />

      <PortfolioMetrics summaries={summaries} tasks={tasks} />

      <Card>
        <CardHeader>
          <CardTitle>Brand Performance</CardTitle>
          <CardDescription>Ad Spend = Meta + Google. Actual ROAS = Shopify Net Sales ÷ Ad Spend.</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" asChild><Link href="/brands">All brands</Link></Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0 sm:px-4">
          <BrandPerformanceTable summaries={summaries} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
            <CardDescription>Brands under their ROAS target, biggest gap first.</CardDescription>
          </CardHeader>
          <CardContent>
            <NeedsAttention summaries={summaries} />
          </CardContent>
        </Card>
        <AIInsightCard brandIds={brandIds} tasks={tasks} scopeLabel="Agency" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target vs Actual ROAS</CardTitle>
          <CardDescription>Each ring fills to Actual ÷ Target. The line under each brand says exactly how far it is from its target.</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" asChild><Link href="/targets">All targets</Link></Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <TargetOverview summaries={summaries} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Brands by Status</CardTitle>
            <CardDescription>All 6 brands against their ROAS target.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart slices={statusSlices(summaries)} centerValue={String(summaries.length)} centerLabel="brands" size={150} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ad Spend by Platform</CardTitle>
            <CardDescription>India brands (INR) · Meta + Google = Total Ad Spend.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart slices={spendByPlatformSlices(summaries, "INR")} centerValue={formatCurrencyCompact(inrPortfolio.totalSpend, "INR")} centerLabel="Total Ad Spend" size={150} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ad Spend by Brand</CardTitle>
            <CardDescription>India brands (INR) · share of total ad spend.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart slices={spendByBrandSlices(summaries, "INR")} centerValue={formatCurrencyCompact(inrPortfolio.totalSpend, "INR")} centerLabel="Ad Spend" size={150} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Shopify Net Sales by Brand</CardTitle>
            <CardDescription>India brands (INR) · share of Shopify Net Sales.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart slices={salesByBrandSlices(summaries, "INR")} centerValue={formatCurrencyCompact(inrPortfolio.netSales, "INR")} centerLabel="Net Sales" size={150} />
          </CardContent>
        </Card>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        DesiVidesi - Dubai is in AED and is not included in the INR pies: AED {formatCurrency(aedPortfolio?.totalSpend ?? 0, "AED").replace("AED ", "")} ad spend, {formatCurrency(aedPortfolio?.netSales ?? 0, "AED")} Shopify Net Sales, Actual ROAS {formatROAS(aedPortfolio?.actualROAS ?? 0)}.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Team Workload</CardTitle>
          <CardDescription>Task volume only – not a performance score.</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" asChild><Link href="/team">Team</Link></Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <TeamWorkloadCards workloads={agency.workloads} columns={4} />
        </CardContent>
      </Card>

      <TaskSummary tasks={tasks} title="Tasks" description="Across the whole team. Overdue and due-today first." />
    </div>
  );
}
