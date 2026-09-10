"use client";

import Link from "next/link";
import { useAppState } from "@/components/providers/AppStateProvider";
import { getBrandSummaries, getDailyBusinessSeries, getDailyMetaSeries, getDailyGoogleSeries, getPortfolios } from "@/lib/analytics";
import { getVisibleBrands, getVisibleTasks } from "@/lib/permissions";
import { generateAgencySummary } from "@/lib/agency";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent, formatROAS } from "@/lib/formatters";
import { PageHeader } from "@/components/layout/PageHeader";
import { PortfolioMetrics } from "@/components/dashboard/PortfolioMetrics";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { BrandCard } from "@/components/brands/BrandCard";
import { PriorityList } from "@/components/dashboard/PriorityList";
import { TaskSummary } from "@/components/dashboard/TaskSummary";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { ROASChart } from "@/components/charts/ROASChart";
import { PlatformTrendChart } from "@/components/charts/PlatformTrendChart";
import { SpendRevenueChart } from "@/components/charts/SpendRevenueChart";
import { SOURCE } from "@/components/shared/SourceLabel";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrandChip } from "@/components/shared/BrandMark";

/** Om / Anubhav / Sagar – "My brands, my tasks, what should I do today?" */
export function TeamMemberDashboard() {
  const { currentUser, targets, tasks, today } = useAppState();
  const platform = currentUser.platform ?? "meta";
  const isMeta = platform === "meta";
  const platformLabel = isMeta ? "Meta" : "Google";
  const myBrands = getVisibleBrands(currentUser);
  const myBrandIds = myBrands.map((b) => b.id);
  const myTasks = getVisibleTasks(currentUser, tasks);
  const summaries = getBrandSummaries(myBrandIds, targets);
  const agency = generateAgencySummary(myBrandIds, targets, myTasks, { today, teamUserIds: [currentUser.id], platform });
  const portfolios = getPortfolios(summaries);
  const inrIds = myBrands.filter((b) => b.currency === "INR").map((b) => b.id);
  const platformSeries = isMeta ? getDailyMetaSeries(inrIds, "30d") : getDailyGoogleSeries(inrIds, "30d");
  const businessSeries = getDailyBusinessSeries(inrIds, "30d");
  const inr = summaries.filter((s) => s.currency === "INR");
  const inrTotals = {
    spend: inr.reduce((a, s) => a + (isMeta ? s.metaSpend : s.googleSpend), 0),
    clicks: inr.reduce((a, s) => a + (isMeta ? s.meta.clicks : s.google.clicks), 0),
    impressions: inr.reduce((a, s) => a + (isMeta ? s.meta.impressions : s.google.impressions), 0),
    orders: inr.reduce((a, s) => a + s.orders, 0),
  };
  const ctr = inrTotals.impressions ? inrTotals.clicks / inrTotals.impressions : 0;
  const cpc = inrTotals.clicks ? inrTotals.spend / inrTotals.clicks : 0;
  const cpm = inrTotals.impressions ? (inrTotals.spend / inrTotals.impressions) * 1000 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good morning, ${currentUser.name}`}
        subtitle={`${currentUser.roleLabel} · ${myBrands.length} brands · last 30 days`}
        actions={<QuickActions />}
      />

      <PortfolioMetrics
        summaries={summaries}
        tasks={myTasks}
        brandsLabel="My Brands"
        spendLabel={`${platformLabel} Spend`}
        spendSource={isMeta ? SOURCE.metaSpend : SOURCE.googleSpend}
        spendValue={(p) => (isMeta ? p.metaSpend : p.googleSpend)}
        salesLabel={isMeta ? "Shopify Net Sales" : "Portfolio Shopify Net Sales"}
        tasksLabel="Open Tasks"
      />
      {!isMeta && (
        <p className="-mt-3 text-xs text-muted-foreground">
          Shopify Net Sales are for the whole brand and are not attributed to Google alone. Actual ROAS uses total brand ad spend (Meta + Google).
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>What should I do today?</CardTitle>
            <CardDescription>Your brands under target and your overdue, blocked or due-today tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <PriorityList items={agency.priorities.slice(0, 5)} />
          </CardContent>
        </Card>
        <AIInsightCard brandIds={myBrandIds} tasks={myTasks} scopeLabel="My brands" />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">My Brands</h3>
            <p className="text-xs text-muted-foreground">Actual ROAS uses total brand ad spend and Shopify Net Sales.</p>
          </div>
          <Button variant="ghost" size="sm" asChild><Link href="/brands">All my brands</Link></Button>
        </div>
        <div className={`grid gap-4 sm:grid-cols-2 ${myBrands.length > 3 ? "xl:grid-cols-3" : "xl:grid-cols-3"}`}>
          {summaries.map((s) => (
            <BrandCard key={s.brand.id} summary={s} showOwners={false} />
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{platformLabel} Performance</CardTitle>
          <CardDescription>India brands (INR) · platform metrics for channel analysis. Not used for Actual ROAS.</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm" asChild><Link href={`/performance?platform=${platform}`}>Performance</Link></Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <MetricCard label={`${platformLabel} Spend`} value={formatCurrencyCompact(inrTotals.spend, "INR")} source={isMeta ? SOURCE.metaSpend : SOURCE.googleSpend} />
            <MetricCard label="Shopify Net Sales" value={formatCurrencyCompact(portfolios.find((p) => p.currency === "INR")?.netSales ?? 0, "INR")} source={SOURCE.shopify} />
            <MetricCard label="Actual ROAS" value={formatROAS(portfolios.find((p) => p.currency === "INR")?.actualROAS ?? 0)} source={SOURCE.actualROAS} />
            <MetricCard label="CTR" value={formatPercent(ctr)} source={platformLabel} />
            <MetricCard label="CPC" value={formatCurrency(cpc, "INR", 2)} source={platformLabel} />
            <MetricCard label="CPM" value={formatCurrency(cpm, "INR", 2)} source={platformLabel} />
            <MetricCard label="Orders" value={formatNumber(inrTotals.orders)} source={SOURCE.orders} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{platformLabel} Spend Trend · INR</p>
              <PlatformTrendChart data={platformSeries} platform={platform} currency="INR" />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Actual ROAS by Brand</p>
              <ROASChart summaries={summaries} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{platformLabel} Performance by Brand</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">{platformLabel} Spend</TableHead>
                  <TableHead className="text-right">{isMeta ? "Purchases" : "Conversions"}</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead className="text-right">CPM</TableHead>
                  <TableHead className="text-right">{platformLabel}-reported ROAS</TableHead>
                  <TableHead className="text-right">Actual ROAS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((s) => {
                  const m = isMeta ? s.meta : s.google;
                  const conv = isMeta ? s.meta.purchases : s.google.conversions;
                  return (
                    <TableRow key={s.brand.id}>
                      <TableCell><Link href={`/brands/${s.brand.id}?tab=${platform}`} className="hover:underline"><BrandChip brand={s.brand} subtitle={s.currency === "AED" ? "AED" : undefined} /></Link></TableCell>
                      <TableCell className="tabular text-right">{formatCurrency(m.spend, s.currency)}</TableCell>
                      <TableCell className="tabular text-right">{formatNumber(conv)}</TableCell>
                      <TableCell className="tabular text-right">{formatPercent(m.ctr)}</TableCell>
                      <TableCell className="tabular text-right">{formatCurrency(m.cpc, s.currency, 2)}</TableCell>
                      <TableCell className="tabular text-right">{formatCurrency(m.cpm, s.currency, 2)}</TableCell>
                      <TableCell className="tabular text-right text-muted-foreground">{formatROAS(m.reportedROAS)}</TableCell>
                      <TableCell className="tabular text-right font-semibold">{formatROAS(s.actualROAS)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ad Spend vs Shopify Net Sales</CardTitle>
          <CardDescription>My India brands (INR) · total brand ad spend · does not imply causation.</CardDescription>
        </CardHeader>
        <CardContent>
          <SpendRevenueChart data={businessSeries} currency="INR" />
        </CardContent>
      </Card>

      <TaskSummary tasks={myTasks} title="My Tasks" description="Your overdue and due-today tasks first." showAssignee={false} />
    </div>
  );
}
