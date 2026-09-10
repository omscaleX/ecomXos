"use client";

import type { BrandSummary, Platform } from "@/types";
import { metaCampaigns } from "@/data/meta";
import { googleCampaigns } from "@/data/google";
import { getDailyGoogleSeries, getDailyMetaSeries } from "@/lib/analytics";
import { formatCurrency, formatNumber, formatPercent, formatROAS } from "@/lib/formatters";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CampaignStatusBadge } from "@/components/shared/StatusBadge";
import { PlatformTrendChart } from "@/components/charts/PlatformTrendChart";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * Meta or Google tab for one brand. Platform-reported numbers are shown for
 * channel analysis only; they are never used for Actual ROAS.
 */
export function BrandPlatformTab({ summary: s, platform }: { summary: BrandSummary; platform: Platform }) {
  const isMeta = platform === "meta";
  const label = isMeta ? "Meta" : "Google";
  const m = isMeta ? s.meta : s.google;
  const conversions = isMeta ? s.meta.purchases : s.google.conversions;
  const reportedValue = isMeta ? s.meta.reportedPurchaseValue : s.google.conversionValue;
  const series = isMeta ? getDailyMetaSeries([s.brand.id], "30d") : getDailyGoogleSeries([s.brand.id], "30d");
  const campaigns = isMeta ? metaCampaigns.filter((c) => c.brandId === s.brand.id) : googleCampaigns.filter((c) => c.brandId === s.brand.id);
  const source = `${label} Ads`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label={`${label} Spend`} value={formatCurrency(m.spend, s.currency)} source={source} hint={`${Math.round((m.spend / s.totalSpend) * 100)}% of total ad spend`} />
        <MetricCard label={isMeta ? "Meta reported purchases" : "Conversions"} value={formatNumber(conversions)} source={`${label}-reported`} />
        <MetricCard
          label={isMeta ? "Meta reported purchase value" : "Conversion Value"}
          value={formatCurrency(reportedValue, s.currency)}
          source={`${label}-reported · ROAS ${formatROAS(m.reportedROAS)}`}
          hint={`Platform-reported value. Actual ROAS (${formatROAS(s.actualROAS)}) uses Shopify Net Sales instead.`}
        />
        <MetricCard label="CTR" value={formatPercent(m.ctr)} source={source} />
        <MetricCard label="CPC" value={formatCurrency(m.cpc, s.currency, 2)} source={source} />
        <MetricCard label="CPM" value={formatCurrency(m.cpm, s.currency, 2)} source={source} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{label} Spend Trend</CardTitle>
            <CardDescription>Daily spend · last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlatformTrendChart data={series} platform={platform} currency={s.currency} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>Campaign spend adds up to {label} spend for the period.</CardDescription>
            <CardAction>
              <AskAIButton brandId={s.brand.id} platform={platform} label={`Ask about ${label}`} />
            </CardAction>
          </CardHeader>
          <CardContent className="px-0 sm:px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">{isMeta ? "Purchases" : "Conversions"}</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="max-w-[280px]">
                      <span className="block truncate font-medium">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">{"objective" in c ? c.objective : c.type}</span>
                    </TableCell>
                    <TableCell className="tabular text-right">{formatCurrency(c.spend, s.currency)}</TableCell>
                    <TableCell className="tabular text-right">{formatNumber("purchases" in c ? c.purchases : c.conversions)}</TableCell>
                    <TableCell className="tabular text-right">{formatPercent(c.ctr)}</TableCell>
                    <TableCell className="tabular text-right">{formatCurrency(c.cpc, s.currency, 2)}</TableCell>
                    <TableCell><CampaignStatusBadge status={c.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
