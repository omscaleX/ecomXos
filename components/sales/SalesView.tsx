"use client";

import * as React from "react";
import Link from "next/link";
import type { DateRangeKey } from "@/types";
import { useAppState } from "@/components/providers/AppStateProvider";
import { DATE_RANGE_LABEL, getBrandSummaries, getDailyBusinessSeries, getPortfolios } from "@/lib/analytics";
import { getVisibleBrands } from "@/lib/permissions";
import { formatCurrency, formatCurrencyCompact, formatNumber } from "@/lib/formatters";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SOURCE } from "@/components/shared/SourceLabel";
import { BrandChip } from "@/components/shared/BrandMark";
import { SalesTrendChart } from "@/components/charts/SalesTrendChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { salesByBrandSlices } from "@/components/charts/pieData";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** /sales – Shopify Net Sales and Orders only. */
export function SalesView() {
  const { currentUser, targets } = useAppState();
  const [range, setRange] = React.useState<DateRangeKey>("30d");
  const brands = getVisibleBrands(currentUser);
  const summaries = getBrandSummaries(brands.map((b) => b.id), targets, range);
  const portfolios = getPortfolios(summaries);
  const inrIds = brands.filter((b) => b.currency === "INR").map((b) => b.id);
  const aedIds = brands.filter((b) => b.currency === "AED").map((b) => b.id);
  const inrSeries = getDailyBusinessSeries(inrIds, range === "today" ? "7d" : range);
  const aedSeries = getDailyBusinessSeries(aedIds, range === "today" ? "7d" : range);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shopify Sales"
        subtitle="Actual sales from Shopify. Net Sales and Orders only – this is the sales source for Actual ROAS."
        actions={
          <>
            <Tabs value={range} onValueChange={(v) => setRange(v as DateRangeKey)}>
              <TabsList aria-label="Date range">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="7d">7 days</TabsTrigger>
                <TabsTrigger value="30d">30 days</TabsTrigger>
              </TabsList>
            </Tabs>
            <AskAIButton question="What are our Shopify sales?" />
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {portfolios.map((p) => (
          <div key={p.currency} className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">{p.label}</p>
              <Badge variant="neutral">{p.currency}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Net Sales" value={formatCurrencyCompact(p.netSales, p.currency)} source={SOURCE.shopify} hint={formatCurrency(p.netSales, p.currency)} />
              <MetricCard label="Orders" value={formatNumber(p.orders)} source={SOURCE.orders} />
              <MetricCard label="Average Order Value" value={formatCurrency(p.orders ? p.netSales / p.orders : 0, p.currency)} source={SOURCE.aov} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Net Sales Trend</CardTitle>
            <CardDescription>India Portfolio (INR) · {range === "today" ? "last 7 days" : DATE_RANGE_LABEL[range].toLowerCase()} · daily Shopify Net Sales.</CardDescription>
          </CardHeader>
          <CardContent>
            {inrIds.length ? <SalesTrendChart data={inrSeries} currency="INR" /> : <SalesTrendChart data={aedSeries} currency="AED" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sales by Brand</CardTitle>
            <CardDescription>Shopify Net Sales · INR brands. Dubai is listed separately in AED below.</CardDescription>
            <CardAction>
              {aedIds.length > 0 && inrIds.length > 0 && (
                <span className="text-xs text-muted-foreground">Dubai: {formatCurrency(portfolios.find((p) => p.currency === "AED")?.netSales ?? 0, "AED")}</span>
              )}
            </CardAction>
          </CardHeader>
          <CardContent>
            <DonutChart slices={salesByBrandSlices(summaries, inrIds.length ? "INR" : "AED")} centerValue={formatCurrencyCompact(portfolios.find((p) => p.currency === (inrIds.length ? "INR" : "AED"))?.netSales ?? 0, inrIds.length ? "INR" : "AED")} centerLabel="Net Sales" size={170} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By Brand</CardTitle>
          <CardDescription>AOV = Shopify Net Sales ÷ Orders.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Net Sales</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">AOV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((s) => (
                <TableRow key={s.brand.id}>
                  <TableCell><Link href={`/brands/${s.brand.id}?tab=sales`} className="hover:underline"><BrandChip brand={s.brand} /></Link></TableCell>
                  <TableCell><Badge variant="neutral">{s.currency}</Badge></TableCell>
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
