"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Currency } from "@/types";
import type { DailyBusinessPoint } from "@/lib/analytics";
import { formatCurrency, formatCurrencyCompact, formatShortDate } from "@/lib/formatters";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from "@/components/charts/chartConfig";
import { EmptyState } from "@/components/shared/States";

/**
 * "Ad Spend vs Shopify Net Sales" – compares the two numbers over time.
 * It does not imply that ad spend caused the sales.
 */
export function SpendRevenueChart({ data, currency, height = 260 }: { data: DailyBusinessPoint[]; currency: Currency; height?: number }) {
  if (!data.length) return <EmptyState title="No data available for this period." />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
        <XAxis dataKey="date" tickFormatter={formatShortDate} tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tickFormatter={(v: number) => formatCurrencyCompact(v, currency)} tick={AXIS_TICK} axisLine={false} tickLine={false} width={64} />
        <Tooltip
          {...TOOLTIP_STYLE}
          labelFormatter={(label) => formatShortDate(String(label))}
          formatter={(value, name) => [formatCurrency(Number(value), currency), String(name)]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar isAnimationActive={false} dataKey="totalSpend" name="Total Ad Spend" fill={CHART_COLORS.total} radius={[4, 4, 0, 0]} maxBarSize={18} />
        <Line isAnimationActive={false} type="monotone" dataKey="netSales" name="Shopify Net Sales" stroke={CHART_COLORS.netSales} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
