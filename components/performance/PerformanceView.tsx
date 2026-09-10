"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { BrandId, BrandSummary, DateRangeKey, Platform } from "@/types";
import { useAppState } from "@/components/providers/AppStateProvider";
import { DATE_RANGE_LABEL, getBrandSummaries, getDailyBusinessSeries, getDailyGoogleSeries, getDailyMetaSeries, getPortfolios } from "@/lib/analytics";
import { getVisibleBrands, getVisiblePlatforms } from "@/lib/permissions";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent, formatROAS } from "@/lib/formatters";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SOURCE } from "@/components/shared/SourceLabel";
import { TargetStatusBadge } from "@/components/shared/StatusBadge";
import { BrandChip } from "@/components/shared/BrandMark";
import { EmptyState } from "@/components/shared/States";
import { SpendRevenueChart } from "@/components/charts/SpendRevenueChart";
import { SpendTrendChart } from "@/components/charts/SpendTrendChart";
import { ROASChart } from "@/components/charts/ROASChart";
import { PlatformTrendChart } from "@/components/charts/PlatformTrendChart";
import { SalesTrendChart } from "@/components/charts/SalesTrendChart";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PlatformFilter = "all" | Platform | "shopify";
type BrandFilter = "all" | BrandId;

const RANGES: DateRangeKey[] = ["today", "7d", "30d"];

/**
 * /performance – platform selector (All / Meta / Google / Shopify), date
 * selector and brand selector. Metrics change with the selection. Meta,
 * Google and Business (Shopify) numbers are always kept apart.
 */
export function PerformanceView() {
  const { currentUser, targets } = useAppState();
  const router = useRouter();
  const params = useSearchParams();
  const visiblePlatforms = getVisiblePlatforms(currentUser);
  const visibleBrands = getVisibleBrands(currentUser);

  const platformOptions: PlatformFilter[] = ["all", ...visiblePlatforms, "shopify"];
  const requestedPlatform = params.get("platform") as PlatformFilter | null;
  const [platform, setPlatformState] = React.useState<PlatformFilter>(
    requestedPlatform && platformOptions.includes(requestedPlatform) ? requestedPlatform : "all",
  );
  const [range, setRange] = React.useState<DateRangeKey>("30d");
  const requestedBrand = params.get("brand");
  const [brandFilter, setBrandFilter] = React.useState<BrandFilter>(
    requestedBrand && visibleBrands.some((b) => b.id === requestedBrand) ? (requestedBrand as BrandId) : "all",
  );

  const setPlatform = (p: PlatformFilter) => {
    setPlatformState(p);
    const search = new URLSearchParams(params.toString());
    if (p === "all") search.delete("platform");
    else search.set("platform", p);
    const qs = search.toString();
    router.replace(`/performance${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const selectedBrands = brandFilter === "all" ? visibleBrands : visibleBrands.filter((b) => b.id === brandFilter);
  const summaries = getBrandSummaries(selectedBrands.map((b) => b.id), targets, range);
  const portfolios = getPortfolios(summaries);
  const chartCurrency = summaries.length && summaries.every((s) => s.currency === "AED") ? "AED" : "INR";
  const chartBrandIds = summaries.filter((s) => s.currency === chartCurrency).map((s) => s.brand.id);
  const businessSeries = getDailyBusinessSeries(chartBrandIds, range);
  const metaSeries = getDailyMetaSeries(chartBrandIds, range);
  const googleSeries = getDailyGoogleSeries(chartBrandIds, range);
  const hasData = summaries.length > 0 && summaries.some((s) => s.totalSpend > 0 || s.netSales > 0);

  const platformLabel: Record<PlatformFilter, string> = { all: "All", meta: "Meta", google: "Google", shopify: "Shopify" };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance"
        subtitle="Meta, Google and Shopify in one place. Platform metrics are for channel analysis; Actual ROAS uses Shopify Net Sales."
        actions={<AskAIButton brandId={brandFilter === "all" ? undefined : brandFilter} platform={platform === "meta" || platform === "google" ? platform : undefined} />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={platform} onValueChange={(v) => setPlatform(v as PlatformFilter)}>
          <TabsList aria-label="Platform">
            {platformOptions.map((p) => (
              <TabsTrigger key={p} value={p}>{platformLabel[p]}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select value={range} onValueChange={(v) => setRange(v as DateRangeKey)}>
          <SelectTrigger className="w-40" aria-label="Date range"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r} value={r}>{DATE_RANGE_LABEL[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={brandFilter} onValueChange={(v) => setBrandFilter(v as BrandFilter)}>
          <SelectTrigger className="w-52" aria-label="Brand"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {visibleBrands.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!hasData ? (
        <EmptyState title="No data available for this period." description="Try a wider date range or a different brand." />
      ) : (
        <>
          {(platform === "all" || platform === "shopify") && (
            <BusinessSection summaries={summaries} portfolios={portfolios} currency={chartCurrency} series={businessSeries} range={range} showTrend={platform === "shopify"} />
          )}
          {(platform === "all" || platform === "meta") && visiblePlatforms.includes("meta") && (
            <PlatformSection platform="meta" summaries={summaries} currency={chartCurrency} series={metaSeries} range={range} />
          )}
          {(platform === "all" || platform === "google") && visiblePlatforms.includes("google") && (
            <PlatformSection platform="google" summaries={summaries} currency={chartCurrency} series={googleSeries} range={range} />
          )}
          {platform === "all" && (
            <Card>
              <CardHeader>
                <CardTitle>Ad Spend Trend</CardTitle>
                <CardDescription>{chartCurrency === "INR" ? "India Portfolio (INR)" : "Dubai (AED)"} · {DATE_RANGE_LABEL[range]}.</CardDescription>
              </CardHeader>
              <CardContent>
                <SpendTrendChart data={businessSeries} currency={chartCurrency} platforms={visiblePlatforms} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function BusinessSection({
  summaries,
  portfolios,
  currency,
  series,
  range,
  showTrend,
}: {
  summaries: BrandSummary[];
  portfolios: ReturnType<typeof getPortfolios>;
  currency: "INR" | "AED";
  series: ReturnType<typeof getDailyBusinessSeries>;
  range: DateRangeKey;
  showTrend: boolean;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Business Performance</h3>
        <p className="text-xs text-muted-foreground">Total Ad Spend (Meta + Google) vs Shopify Net Sales. Currencies shown separately.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {portfolios.map((p) => (
          <div key={p.currency} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label={`${p.label} · Ad Spend`} value={formatCurrencyCompact(p.totalSpend, p.currency)} source={SOURCE.totalSpend} hint={formatCurrency(p.totalSpend, p.currency)} />
            <MetricCard label="Shopify Net Sales" value={formatCurrencyCompact(p.netSales, p.currency)} source={SOURCE.shopify} hint={formatCurrency(p.netSales, p.currency)} />
            <MetricCard label="Actual ROAS" value={formatROAS(p.actualROAS)} source={SOURCE.actualROAS} />
            <MetricCard label="Orders" value={formatNumber(p.orders)} source={SOURCE.orders} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{showTrend ? "Shopify Net Sales Trend" : "Ad Spend vs Shopify Net Sales"}</CardTitle>
            <CardDescription>{currency === "INR" ? "INR brands" : "AED"} · {DATE_RANGE_LABEL[range]} · does not imply causation.</CardDescription>
          </CardHeader>
          <CardContent>
            {showTrend ? <SalesTrendChart data={series} currency={currency} /> : <SpendRevenueChart data={series} currency={currency} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actual ROAS by Brand</CardTitle>
            <CardDescription>Shopify Net Sales ÷ Total Ad Spend for {DATE_RANGE_LABEL[range].toLowerCase()}, vs 30-day target.</CardDescription>
          </CardHeader>
          <CardContent>
            <ROASChart summaries={summaries} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>By Brand</CardTitle>
          <CardDescription>Business view. Meta and Google spend are shown separately and added for Total Ad Spend.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Meta Spend</TableHead>
                <TableHead className="text-right">Google Spend</TableHead>
                <TableHead className="text-right">Total Ad Spend</TableHead>
                <TableHead className="text-right">Shopify Net Sales</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Actual ROAS</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((s) => (
                <TableRow key={s.brand.id}>
                  <TableCell><Link href={`/brands/${s.brand.id}`} className="hover:underline"><BrandChip brand={s.brand} subtitle={s.currency === "AED" ? "AED" : undefined} /></Link></TableCell>
                  <TableCell className="tabular text-right">{formatCurrency(s.metaSpend, s.currency)}</TableCell>
                  <TableCell className="tabular text-right">{formatCurrency(s.googleSpend, s.currency)}</TableCell>
                  <TableCell className="tabular text-right font-medium">{formatCurrency(s.totalSpend, s.currency)}</TableCell>
                  <TableCell className="tabular text-right font-medium">{formatCurrency(s.netSales, s.currency)}</TableCell>
                  <TableCell className="tabular text-right">{formatNumber(s.orders)}</TableCell>
                  <TableCell className="tabular text-right font-semibold">{formatROAS(s.actualROAS)}</TableCell>
                  <TableCell><TargetStatusBadge status={s.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}

function PlatformSection({
  platform,
  summaries,
  currency,
  series,
  range,
}: {
  platform: Platform;
  summaries: BrandSummary[];
  currency: "INR" | "AED";
  series: ReturnType<typeof getDailyMetaSeries>;
  range: DateRangeKey;
}) {
  const isMeta = platform === "meta";
  const label = isMeta ? "Meta" : "Google";
  const group = summaries.filter((s) => s.currency === currency);
  const spend = group.reduce((a, s) => a + (isMeta ? s.metaSpend : s.googleSpend), 0);
  const conv = group.reduce((a, s) => a + (isMeta ? s.meta.purchases : s.google.conversions), 0);
  const value = group.reduce((a, s) => a + (isMeta ? s.meta.reportedPurchaseValue : s.google.conversionValue), 0);
  const clicks = group.reduce((a, s) => a + (isMeta ? s.meta.clicks : s.google.clicks), 0);
  const imps = group.reduce((a, s) => a + (isMeta ? s.meta.impressions : s.google.impressions), 0);
  const other = summaries.filter((s) => s.currency !== currency);

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{label} Performance</h3>
        <p className="text-xs text-muted-foreground">
          {currency === "INR" ? "India brands (INR)" : "Dubai (AED)"} · platform-reported metrics for channel analysis. Not used for Actual ROAS.
          {other.length > 0 && ` ${other.map((s) => s.brand.name).join(", ")} shown in the table in ${other[0].currency}.`}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label={`${label} Spend`} value={formatCurrencyCompact(spend, currency)} source={`${label} Ads`} hint={formatCurrency(spend, currency)} />
        <MetricCard label={isMeta ? "Meta Purchases" : "Google Conversions"} value={formatNumber(conv)} source={`${label}-reported`} />
        <MetricCard label={isMeta ? "Meta Reported Purchase Value" : "Google Conversion Value"} value={formatCurrencyCompact(value, currency)} source={`${label}-reported · ROAS ${formatROAS(spend ? value / spend : 0)}`} hint="Platform-reported. Not the business ROAS." />
        <MetricCard label="CTR" value={formatPercent(imps ? clicks / imps : 0)} source={`${label} Ads`} />
        <MetricCard label="CPC" value={formatCurrency(clicks ? spend / clicks : 0, currency, 2)} source={`${label} Ads`} />
        <MetricCard label="CPM" value={formatCurrency(imps ? (spend / imps) * 1000 : 0, currency, 2)} source={`${label} Ads`} />
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{label} Spend Trend</CardTitle>
            <CardDescription>{DATE_RANGE_LABEL[range]} · daily.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlatformTrendChart data={series} platform={platform} currency={currency} />
          </CardContent>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>{label} by Brand</CardTitle>
            <CardDescription>{label}-reported ROAS is shown next to Actual ROAS so the difference is visible.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">{isMeta ? "Purchases" : "Conversions"}</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead className="text-right">{label} ROAS</TableHead>
                  <TableHead className="text-right">Actual ROAS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((s) => {
                  const m = isMeta ? s.meta : s.google;
                  return (
                    <TableRow key={s.brand.id}>
                      <TableCell><Link href={`/brands/${s.brand.id}?tab=${platform}`} className="hover:underline"><BrandChip brand={s.brand} subtitle={s.currency === "AED" ? "AED" : undefined} /></Link></TableCell>
                      <TableCell className="tabular text-right">{formatCurrency(m.spend, s.currency)}</TableCell>
                      <TableCell className="tabular text-right">{formatNumber(isMeta ? s.meta.purchases : s.google.conversions)}</TableCell>
                      <TableCell className="tabular text-right">{formatPercent(m.ctr)}</TableCell>
                      <TableCell className="tabular text-right">{formatCurrency(m.cpc, s.currency, 2)}</TableCell>
                      <TableCell className="tabular text-right text-muted-foreground">{formatROAS(m.reportedROAS)}</TableCell>
                      <TableCell className="tabular text-right font-semibold">{formatROAS(s.actualROAS)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
