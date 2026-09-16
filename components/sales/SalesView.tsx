"use client";

import * as React from "react";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import { useAppState } from "@/components/providers/AppStateProvider";
import {
  getBrandSummaries,
  getBusinessSeries,
  getPortfolios,
  getSalesComparison,
} from "@/lib/analytics";
import { getVisibleBrands } from "@/lib/permissions";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/formatters";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SOURCE } from "@/components/shared/SourceLabel";
import { BrandChip } from "@/components/shared/BrandMark";
import { PeriodControls, describeRange, usePeriod } from "@/components/shared/PeriodPicker";
import { SalesTrendChart } from "@/components/charts/SalesTrendChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { salesByBrandSlices } from "@/components/charts/pieData";
import {
  ReversalSummary,
  SalesComparisonChart,
  SalesComparisonTable,
} from "@/components/sales/SalesComparison";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** /sales – Shopify Net Sales, orders, returns, and Meta's figure alongside. */
export function SalesView() {
  const { currentUser, targets } = useAppState();
  const { range, granularity, setRange, setGranularity } = usePeriod("30d");

  const brands = getVisibleBrands(currentUser);
  const summaries = getBrandSummaries(brands.map((b) => b.id), targets, range);
  const portfolios = getPortfolios(summaries);
  const comparison = getSalesComparison(brands.map((b) => b.id), range);

  const inrIds = brands.filter((b) => b.currency === "INR").map((b) => b.id);
  const aedIds = brands.filter((b) => b.currency === "AED").map((b) => b.id);
  const chartCurrency = inrIds.length ? "INR" : "AED";
  const chartIds = inrIds.length ? inrIds : aedIds;
  const series = getBusinessSeries(chartIds, range, granularity);
  const periodLabel = describeRange(range);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shopify Sales"
        subtitle="Real sales from Shopify. Net Sales is what is left after returns, and it is the sales number we use for Actual ROAS."
        actions={<AskAIButton question="What are our Shopify sales?" />}
      />

      <PeriodControls
        period={{ range, granularity }}
        onRangeChange={setRange}
        onGranularityChange={setGranularity}
      />

      {portfolios.map((p) => (
        <section key={p.currency} className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{p.label}</p>
            <Badge variant="neutral">{p.currency}</Badge>
            <span className="text-xs text-muted-foreground">{periodLabel}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <MetricCard label="Net Sales" value={formatCurrencyCompact(p.netSales, p.currency)} source={SOURCE.shopify} hint={formatCurrency(p.netSales, p.currency)} />
            <MetricCard label="Orders" value={formatNumber(p.orders)} source={SOURCE.orders} />
            <MetricCard label="Average Order Value" value={formatCurrency(p.orders ? p.netSales / p.orders : 0, p.currency)} source={SOURCE.aov} />
            <MetricCard
              label="Returned"
              value={formatCurrencyCompact(p.returnedAmount, p.currency)}
              tone={p.returnRate >= 0.15 ? "danger" : p.returnRate >= 0.08 ? "warning" : "default"}
              secondary={`${formatNumber(p.returnedOrders)} orders`}
              source="Shopify returns and refunds"
              hint={formatCurrency(p.returnedAmount, p.currency)}
            />
            <MetricCard
              label="Return rate"
              value={formatPercent(p.returnRate, 1)}
              tone={p.returnRate >= 0.15 ? "danger" : p.returnRate >= 0.08 ? "warning" : "default"}
              source="Returned ÷ sales before returns"
            />
          </div>
        </section>
      ))}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Net Sales Trend</CardTitle>
            <CardDescription>
              {chartCurrency === "INR" ? "India brands (INR)" : "Dubai (AED)"} · {periodLabel} · grouped by {granularity}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalesTrendChart data={series} currency={chartCurrency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sales by Brand</CardTitle>
            <CardDescription>Who brought in what share of the Shopify sales, {chartCurrency} brands.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart
              slices={salesByBrandSlices(summaries, chartCurrency)}
              centerValue={formatCurrencyCompact(portfolios.find((p) => p.currency === chartCurrency)?.netSales ?? 0, chartCurrency)}
              centerLabel="Net Sales"
              size={160}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Meta reported sales vs Shopify Net Sales</CardTitle>
          <CardDescription>
            Two sales numbers for the same days. Meta counts the sales it thinks its ads caused. Shopify counts the money that actually came in. Shopify is the one we trust.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SalesComparisonChart data={series} currency={chartCurrency} />
          <SalesComparisonTable rows={comparison} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {portfolios.map((p) => (
          <Card key={p.currency}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Undo2 className="size-4" /> Sales reversals · {p.label}</CardTitle>
              <CardDescription>Returns, refunds and cancellations for {periodLabel.toLowerCase()}.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReversalSummary
                salesBeforeReturns={p.netSales + p.returnedAmount}
                returnedAmount={p.returnedAmount}
                returnedOrders={p.returnedOrders}
                returnRate={p.returnRate}
                netSales={p.netSales}
                currency={p.currency}
              />
            </CardContent>
          </Card>
        ))}
        <Card className={portfolios.length > 1 ? "" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle>Highest return rates</CardTitle>
            <CardDescription>Brands giving back the biggest share of what they sell.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {[...comparison].sort((a, b) => b.returnRate - a.returnRate).slice(0, 4).map((r) => (
                <li key={r.brand.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link href={`/brands/${r.brand.id}?view=detailed&tab=sales`} className="min-w-0 truncate hover:underline">{r.brand.name}</Link>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular text-xs text-muted-foreground">{formatCurrency(r.returnedAmount, r.currency)}</span>
                    <span className={cn("tabular font-semibold", r.returnRate >= 0.15 ? "text-red-600" : r.returnRate >= 0.08 ? "text-amber-700" : "text-emerald-700")}>
                      {formatPercent(r.returnRate, 1)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By Brand</CardTitle>
          <CardDescription>Average order value is Shopify sales divided by orders. Sales are already after returns.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Sales before returns</TableHead>
                <TableHead className="text-right">Returned</TableHead>
                <TableHead className="text-right">Net Sales</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">AOV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((s) => (
                <TableRow key={s.brand.id}>
                  <TableCell>
                    <Link href={`/brands/${s.brand.id}?view=detailed&tab=sales`} className="hover:underline"><BrandChip brand={s.brand} /></Link>
                  </TableCell>
                  <TableCell><Badge variant="neutral">{s.currency}</Badge></TableCell>
                  <TableCell className="tabular text-right text-muted-foreground">{formatCurrency(s.salesBeforeReturns, s.currency)}</TableCell>
                  <TableCell className="tabular text-right text-red-600">-{formatCurrency(s.returnedAmount, s.currency)}</TableCell>
                  <TableCell className="tabular text-right font-medium">{formatCurrency(s.netSales, s.currency)}</TableCell>
                  <TableCell className="tabular text-right">{formatNumber(s.orders)}</TableCell>
                  <TableCell className="tabular text-right">{formatCurrency(s.aov, s.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
