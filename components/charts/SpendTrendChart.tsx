"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Currency, Platform } from "@/types";
import type { DailyBusinessPoint } from "@/lib/analytics";
import { formatCurrency, formatCurrencyCompact } from "@/lib/formatters";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from "@/components/charts/chartConfig";
import { EmptyState } from "@/components/shared/States";

/**
 * "Ad Spend Trend" – Meta Spend, Google Spend and Total Spend.
 * Pass `platforms` to limit which platform lines are shown (team members
 * only see their own platform); Total is always shown.
 */
export function SpendTrendChart({
  data,
  currency,
  platforms = ["meta", "google"],
  showTotal = true,
  height = 240,
}: {
  data: DailyBusinessPoint[];
  currency: Currency;
  platforms?: Platform[];
  showTotal?: boolean;
  height?: number;
}) {
  if (!data.length) return <EmptyState title="No data available for this period." />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tickFormatter={(v: number) => formatCurrencyCompact(v, currency)} tick={AXIS_TICK} axisLine={false} tickLine={false} width={64} />
        <Tooltip
          {...TOOLTIP_STYLE}
          labelFormatter={(_label, payload) => (payload?.[0]?.payload as { fullLabel?: string } | undefined)?.fullLabel ?? String(_label)}
          formatter={(value, name) => [formatCurrency(Number(value), currency), String(name)]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        {platforms.includes("meta") && (
          <Line isAnimationActive={false} type="monotone" dataKey="metaSpend" name="Meta Spend" stroke={CHART_COLORS.meta} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        )}
        {platforms.includes("google") && (
          <Line isAnimationActive={false} type="monotone" dataKey="googleSpend" name="Google Spend" stroke={CHART_COLORS.google} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        )}
        {showTotal && (
          <Line isAnimationActive={false} type="monotone" dataKey="totalSpend" name="Total Spend" stroke={CHART_COLORS.total} strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={{ r: 4 }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
