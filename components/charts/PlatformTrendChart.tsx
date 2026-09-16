"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Currency, Platform } from "@/types";
import type { DailyPlatformPoint } from "@/lib/analytics";
import { formatCurrency, formatCurrencyCompact, formatNumber } from "@/lib/formatters";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from "@/components/charts/chartConfig";
import { EmptyState } from "@/components/shared/States";

/** Daily spend for one platform (Meta Spend Trend / Google Spend Trend). */
export function PlatformTrendChart({
  data,
  platform,
  currency,
  height = 220,
}: {
  data: DailyPlatformPoint[];
  platform: Platform;
  currency: Currency;
  height?: number;
}) {
  if (!data.length) return <EmptyState title="No data available for this period." />;
  const color = platform === "meta" ? CHART_COLORS.meta : CHART_COLORS.google;
  const label = platform === "meta" ? "Meta Spend" : "Google Spend";
  const convLabel = platform === "meta" ? "purchases" : "conversions";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tickFormatter={(v: number) => formatCurrencyCompact(v, currency)} tick={AXIS_TICK} axisLine={false} tickLine={false} width={64} />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
          labelFormatter={(_label, payload) => (payload?.[0]?.payload as { fullLabel?: string } | undefined)?.fullLabel ?? String(_label)}
          formatter={(value, name, item) => {
            const row = item.payload as DailyPlatformPoint;
            return [`${formatCurrency(Number(value), currency)} · ${formatNumber(row.conversions)} ${convLabel}`, String(name)];
          }}
        />
        <Bar isAnimationActive={false} dataKey="spend" name={label} fill={color} radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
