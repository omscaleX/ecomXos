"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import type { BrandSummary, DateRangeKey } from "@/types";
import { creatives } from "@/data/creatives";
import { useAppState } from "@/components/providers/AppStateProvider";
import { getDailyBusinessSeries, getShopifyTotals } from "@/lib/analytics";
import { getVisiblePlatforms, getVisibleTasks, isManager } from "@/lib/permissions";
import { getTaskCounts, sortTasks } from "@/lib/tasks";
import { formatCurrency, formatCurrencyCompact, formatGap, formatNumber, formatPercent, formatROAS, TARGET_STATUS_LABEL } from "@/lib/formatters";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SOURCE } from "@/components/shared/SourceLabel";
import { DonutChart } from "@/components/charts/DonutChart";
import { TargetRing } from "@/components/charts/TargetRing";
import { CHART_COLORS } from "@/components/charts/chartConfig";
import { SalesTrendChart } from "@/components/charts/SalesTrendChart";
import { TargetProgress } from "@/components/targets/TargetTable";
import { EditTargetModal } from "@/components/targets/EditTargetModal";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskModal } from "@/components/tasks/TaskModal";
import { TargetStatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ---------------- Overview ---------------- */

export function BrandOverviewTab({ summary: s }: { summary: BrandSummary }) {
  const { currentUser } = useAppState();
  const platforms = getVisiblePlatforms(currentUser);
  const spendSlices = [
    { name: "Meta Spend", value: s.metaSpend, color: CHART_COLORS.meta, label: formatCurrency(s.metaSpend, s.currency) },
    { name: "Google Spend", value: s.googleSpend, color: CHART_COLORS.google, label: formatCurrency(s.googleSpend, s.currency) },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Target vs Actual ROAS</CardTitle>
          <CardDescription>Actual ROAS = Shopify Net Sales ÷ Total Ad Spend · last 30 days.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <TargetRing actual={s.actualROAS} target={s.targetROAS} status={s.status} gap={s.gap} gapPercent={s.gapPercent} size={160} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ad Spend by Platform</CardTitle>
          <CardDescription>Meta + Google = Total Ad Spend {formatCurrency(s.totalSpend, s.currency)}.</CardDescription>
        </CardHeader>
        <CardContent>
          <DonutChart slices={spendSlices} centerValue={formatCurrencyCompact(s.totalSpend, s.currency)} centerLabel="Total Ad Spend" size={150} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Business Performance</CardTitle>
          <CardDescription>Meta and Google shown separately; Shopify is the sales source.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="rounded-md border p-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Meta performance</p>
              <Row label="Meta Spend" value={formatCurrency(s.metaSpend, s.currency)} />
              {platforms.includes("meta") && (
                <>
                  <Row label="Meta Purchases" value={formatNumber(s.meta.purchases)} />
                  <Row label="Meta Reported Purchase Value" value={formatCurrency(s.meta.reportedPurchaseValue, s.currency)} muted />
                </>
              )}
            </div>
            <div className="rounded-md border p-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Google performance</p>
              <Row label="Google Spend" value={formatCurrency(s.googleSpend, s.currency)} />
              {platforms.includes("google") && (
                <>
                  <Row label="Google Conversions" value={formatNumber(s.google.conversions)} />
                  <Row label="Google Conversion Value" value={formatCurrency(s.google.conversionValue, s.currency)} muted />
                </>
              )}
            </div>
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Business performance</p>
              <Row label="Total Ad Spend" value={formatCurrency(s.totalSpend, s.currency)} />
              <Row label="Shopify Net Sales" value={formatCurrency(s.netSales, s.currency)} />
              <Row label="Actual ROAS" value={formatROAS(s.actualROAS)} strong />
              <Row label="Target" value={formatROAS(s.targetROAS)} />
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`tabular ${strong ? "text-base font-semibold" : muted ? "text-muted-foreground" : "font-medium"}`}>{value}</dd>
    </div>
  );
}

/* ---------------- Sales ---------------- */

export function BrandSalesTab({ summary: s }: { summary: BrandSummary }) {
  const [range, setRange] = React.useState<DateRangeKey>("30d");
  const totals = getShopifyTotals([s.brand.id], range);
  const series = getDailyBusinessSeries([s.brand.id], range);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Shopify Net Sales" value={formatCurrency(totals.netSales, s.currency)} source={SOURCE.shopify} />
        <MetricCard label="Orders" value={formatNumber(totals.orders)} source={SOURCE.orders} />
        <MetricCard label="AOV" value={formatCurrency(totals.aov, s.currency)} source={SOURCE.aov} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription>Shopify Net Sales only. No discounts, refunds or other breakdowns.</CardDescription>
          <CardAction>
            <Tabs value={range} onValueChange={(v) => setRange(v as DateRangeKey)}>
              <TabsList>
                <TabsTrigger value="7d">7 days</TabsTrigger>
                <TabsTrigger value="30d">30 days</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardAction>
        </CardHeader>
        <CardContent>
          <SalesTrendChart data={series} currency={s.currency} />
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Targets ---------------- */

export function BrandTargetsTab({ summary: s }: { summary: BrandSummary }) {
  const { currentUser } = useAppState();
  const [open, setOpen] = React.useState(false);
  const manager = isManager(currentUser);
  const pct = Math.round((s.actualROAS / s.targetROAS) * 100);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>ROAS Target</CardTitle>
          <CardDescription>Actual ROAS = Shopify Net Sales ÷ Total Ad Spend · last 30 days.</CardDescription>
          <CardAction>{manager && <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Edit Target</Button>}</CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <TargetRing actual={s.actualROAS} target={s.targetROAS} status={s.status} gap={s.gap} gapPercent={s.gapPercent} size={150} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><p className="text-[11px] text-muted-foreground">Actual ROAS</p><p className="tabular text-2xl font-semibold">{formatROAS(s.actualROAS)}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Target</p><p className="tabular text-2xl font-semibold text-muted-foreground">{formatROAS(s.targetROAS)}</p></div>
            <div><p className="text-[11px] text-muted-foreground">Gap</p><p className={`tabular text-2xl font-semibold ${s.gap >= 0 ? "text-emerald-700" : s.status === "attention" ? "text-amber-700" : "text-red-600"}`}>{formatGap(s.gap)}</p></div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{pct}% of target</span>
              <TargetStatusBadge status={s.status} />
            </div>
            <TargetProgress actual={s.actualROAS} target={s.targetROAS} className="[&>div]:w-full" />
          </div>
          <p className="text-xs text-muted-foreground">
            {s.status === "on_track"
              ? `${s.brand.name} is above target. Scale carefully and keep watching Actual ROAS.`
              : `${s.brand.name} is ${Math.round(Math.abs(s.gapPercent) * 100)}% below target (${TARGET_STATUS_LABEL[s.status]}). Review campaigns before increasing spend.`}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Status rules</CardTitle>
          <CardDescription>Shared calculateTargetStatus() used everywhere.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between"><span>Actual ROAS ≥ Target</span><TargetStatusBadge status="on_track" /></li>
            <li className="flex items-center justify-between"><span>Actual ROAS ≥ 80% of Target</span><TargetStatusBadge status="attention" /></li>
            <li className="flex items-center justify-between"><span>Actual ROAS &lt; 80% of Target</span><TargetStatusBadge status="below_target" /></li>
          </ul>
        </CardContent>
      </Card>
      {manager && <EditTargetModal open={open} onOpenChange={setOpen} brandId={s.brand.id} />}
    </div>
  );
}

/* ---------------- Tasks ---------------- */

export function BrandTasksTab({ summary: s }: { summary: BrandSummary }) {
  const { currentUser, tasks, today } = useAppState();
  const [addOpen, setAddOpen] = React.useState(false);
  const [showCompleted, setShowCompleted] = React.useState(false);
  const visible = getVisibleTasks(currentUser, tasks).filter((t) => t.brandId === s.brand.id);
  const counts = getTaskCounts(visible, today);
  const list = sortTasks(visible.filter((t) => showCompleted || t.status !== "completed"), today);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
        <CardDescription>{counts.open} open · {counts.overdue} overdue · {counts.blocked} blocked</CardDescription>
        <CardAction className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowCompleted((v) => !v)} aria-pressed={showCompleted}>
            {showCompleted ? "Hide completed" : "Show completed"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}><Plus /> Add Task</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 sm:px-4">
        <TaskTable tasks={list} showBrand={false} showAssignee={isManager(currentUser)} emptyTitle="No open tasks" emptyDescription={`Nothing open for ${s.brand.name}.`} />
      </CardContent>
      <TaskModal open={addOpen} onOpenChange={setAddOpen} defaults={{ brandId: s.brand.id }} />
    </Card>
  );
}

/* ---------------- Creatives ---------------- */

export function BrandCreativesTab({ summary: s }: { summary: BrandSummary }) {
  const { currentUser } = useAppState();
  const platforms = getVisiblePlatforms(currentUser);
  const list = creatives.filter((c) => c.brandId === s.brand.id && platforms.includes(c.platform));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Creatives</CardTitle>
        <CardDescription>Creative library snapshot. Asset storage is not part of the prototype.</CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-4">
        {list.length === 0 ? (
          <p className="px-4 text-sm text-muted-foreground">No creatives available for your platform.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creative</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.format}</TableCell>
                  <TableCell>{c.platform === "meta" ? "Meta" : "Google"}</TableCell>
                  <TableCell className="tabular text-right">{c.ctr ? formatPercent(c.ctr) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "Live" ? "success" : c.status === "In Review" ? "warning" : "neutral"}>{c.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Reports ---------------- */

export function BrandReportsTab({ summary: s }: { summary: BrandSummary }) {
  const { currentUser } = useAppState();
  const manager = isManager(currentUser);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>Weekly performance summary for {s.brand.name}.</CardDescription>
        <CardAction>
          {manager && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/reports?brand=${s.brand.id}`}><FileText /> Generate Report</Link>
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border p-3"><dt className="text-[11px] text-muted-foreground">Total Ad Spend</dt><dd className="tabular font-semibold">{formatCurrency(s.totalSpend, s.currency)}</dd></div>
          <div className="rounded-md border p-3"><dt className="text-[11px] text-muted-foreground">Shopify Net Sales</dt><dd className="tabular font-semibold">{formatCurrency(s.netSales, s.currency)}</dd></div>
          <div className="rounded-md border p-3"><dt className="text-[11px] text-muted-foreground">Actual ROAS</dt><dd className="tabular font-semibold">{formatROAS(s.actualROAS)} <span className="text-xs font-normal text-muted-foreground">vs {formatROAS(s.targetROAS)}</span></dd></div>
          <div className="rounded-md border p-3"><dt className="text-[11px] text-muted-foreground">Orders</dt><dd className="tabular font-semibold">{formatNumber(s.orders)}</dd></div>
        </dl>
        {!manager && <p className="mt-3 text-xs text-muted-foreground">Report generation is available to managers.</p>}
      </CardContent>
    </Card>
  );
}
