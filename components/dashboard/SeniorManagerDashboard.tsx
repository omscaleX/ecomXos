"use client";

import Link from "next/link";
import { useAppState } from "@/components/providers/AppStateProvider";
import { brandIds, brands } from "@/data/brands";
import { getBrandSummaries, getDailyBusinessSeries } from "@/lib/analytics";
import { generateAgencySummary } from "@/lib/agency";
import { PageHeader } from "@/components/layout/PageHeader";
import { PortfolioMetrics } from "@/components/dashboard/PortfolioMetrics";
import { BrandPerformanceTable } from "@/components/dashboard/BrandPerformanceTable";
import { NeedsAttention } from "@/components/dashboard/NeedsAttention";
import { TeamWorkloadCards } from "@/components/dashboard/TeamWorkload";
import { TaskSummary } from "@/components/dashboard/TaskSummary";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { SpendRevenueChart } from "@/components/charts/SpendRevenueChart";
import { ROASChart } from "@/components/charts/ROASChart";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Bhupes – "How is the agency doing?" and "What needs attention?" */
export function SeniorManagerDashboard() {
  const { currentUser, targets, tasks, today } = useAppState();
  const summaries = getBrandSummaries(brandIds, targets);
  const agency = generateAgencySummary(brandIds, targets, tasks, { today });
  const inrBrandIds = brands.filter((b) => b.currency === "INR").map((b) => b.id);
  const series = getDailyBusinessSeries(inrBrandIds, "30d");

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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ad Spend vs Shopify Net Sales</CardTitle>
            <CardDescription>India Portfolio (INR) · daily · compares the two numbers, does not imply causation.</CardDescription>
          </CardHeader>
          <CardContent>
            <SpendRevenueChart data={series} currency="INR" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actual ROAS by Brand</CardTitle>
            <CardDescription>Shopify Net Sales ÷ Total Ad Spend, with target markers.</CardDescription>
          </CardHeader>
          <CardContent>
            <ROASChart summaries={summaries} />
          </CardContent>
        </Card>
      </div>

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
