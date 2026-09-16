"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Currency } from "@/types";
import type { BusinessPoint, SalesComparisonRow } from "@/lib/analytics";
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent } from "@/lib/formatters";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from "@/components/charts/chartConfig";
import { BrandChip } from "@/components/shared/BrandMark";
import { EmptyState } from "@/components/shared/States";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Two sales figures per period: what Meta reports and what Shopify recorded.
 * They will not match. Meta counts a sale against the ad that it attributes
 * it to, inside its own window; Shopify counts the money that actually came
 * in. Shopify stays the source of truth for Actual ROAS.
 */
export function SalesComparisonChart({
  data,
  currency,
  height = 260,
}: {
  data: BusinessPoint[];
  currency: Currency;
  height?: number;
}) {
  if (!data.length) return <EmptyState title="No data available for this period." />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tickFormatter={(v: number) => formatCurrencyCompact(v, currency)} tick={AXIS_TICK} axisLine={false} tickLine={false} width={64} />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
          labelFormatter={(label, payload) => (payload?.[0]?.payload as { fullLabel?: string } | undefined)?.fullLabel ?? String(label)}
          formatter={(value, name) => [formatCurrency(Number(value), currency), String(name)]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar isAnimationActive={false} dataKey="metaReportedSales" name="Meta reported sales" fill={CHART_COLORS.meta} radius={[4, 4, 0, 0]} maxBarSize={16} />
        <Bar isAnimationActive={false} dataKey="netSales" name="Shopify Net Sales" fill={CHART_COLORS.netSales} radius={[4, 4, 0, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Per-brand table: Meta's figure, Shopify's figure, the gap between them,
 * and the reversal record.
 */
export function SalesComparisonTable({
  rows,
  showReversals = true,
}: {
  rows: SalesComparisonRow[];
  showReversals?: boolean;
}) {
  if (!rows.length) return <EmptyState title="No brands match your filters." />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Brand</TableHead>
          <TableHead className="text-right">Meta reported sales</TableHead>
          <TableHead className="text-right">Shopify Net Sales</TableHead>
          <TableHead className="text-right">Difference</TableHead>
          {showReversals && <TableHead className="text-right">Returned</TableHead>}
          {showReversals && <TableHead className="text-right">Return rate</TableHead>}
          <TableHead className="text-right">Orders</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.brand.id}>
            <TableCell>
              <Link href={`/brands/${r.brand.id}?view=detailed&tab=sales`} className="hover:underline">
                <BrandChip brand={r.brand} subtitle={r.currency === "AED" ? "AED" : undefined} />
              </Link>
            </TableCell>
            <TableCell className="tabular text-right text-muted-foreground">{formatCurrency(r.metaReportedSales, r.currency)}</TableCell>
            <TableCell className="tabular text-right font-medium">{formatCurrency(r.shopifyNetSales, r.currency)}</TableCell>
            <TableCell className={cn("tabular text-right", r.difference > 0 ? "text-amber-700" : r.difference < 0 ? "text-blue-700" : "text-muted-foreground")}>
              {r.difference > 0 ? "+" : ""}{formatCurrency(r.difference, r.currency)}
              <span className="ml-1 text-xs text-muted-foreground">
                {r.differencePercent > 0 ? "+" : ""}{Math.round(r.differencePercent * 100)}%
              </span>
            </TableCell>
            {showReversals && (
              <TableCell className="tabular text-right">
                {formatCurrency(r.returnedAmount, r.currency)}
                <span className="ml-1 text-xs text-muted-foreground">{formatNumber(r.returnedOrders)} orders</span>
              </TableCell>
            )}
            {showReversals && (
              <TableCell className={cn("tabular text-right font-medium", r.returnRate >= 0.15 ? "text-red-600" : r.returnRate >= 0.08 ? "text-amber-700" : "text-emerald-700")}>
                {formatPercent(r.returnRate, 1)}
              </TableCell>
            )}
            <TableCell className="tabular text-right">{formatNumber(r.orders)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * The reversal record on its own: what was sold before returns, what came
 * back, and what is left as Net Sales.
 */
export function ReversalSummary({
  salesBeforeReturns,
  returnedAmount,
  returnedOrders,
  returnRate,
  netSales,
  currency,
}: {
  salesBeforeReturns: number;
  returnedAmount: number;
  returnedOrders: number;
  returnRate: number;
  netSales: number;
  currency: Currency;
}) {
  const returnedShare = Math.min(100, Math.round(returnRate * 100));
  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md border p-2">
          <dt className="text-[11px] text-muted-foreground">Sales before returns</dt>
          <dd className="tabular text-sm font-semibold">{formatCurrency(salesBeforeReturns, currency)}</dd>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50/50 p-2">
          <dt className="text-[11px] text-muted-foreground">Returned</dt>
          <dd className="tabular text-sm font-semibold text-red-600">-{formatCurrency(returnedAmount, currency)}</dd>
        </div>
        <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-2">
          <dt className="text-[11px] text-muted-foreground">Net Sales</dt>
          <dd className="tabular text-sm font-semibold text-emerald-700">{formatCurrency(netSales, currency)}</dd>
        </div>
      </dl>
      <div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`${returnedShare}% of sales returned`}>
          <span className="bg-emerald-500" style={{ width: `${100 - returnedShare}%` }} />
          <span className="bg-red-500" style={{ width: `${returnedShare}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {formatNumber(returnedOrders)} orders came back, which is {formatPercent(returnRate, 1)} of what was sold.
          Net Sales already has this deducted, so Actual ROAS is unaffected.
        </p>
      </div>
    </div>
  );
}
