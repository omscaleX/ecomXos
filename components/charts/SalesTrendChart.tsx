"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Currency } from "@/types";
import type { DailyBusinessPoint } from "@/lib/analytics";
import { formatCurrency, formatCurrencyCompact, formatNumber } from "@/lib/formatters";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from "@/components/charts/chartConfig";
import { EmptyState } from "@/components/shared/States";

/** "Shopify Net Sales Trend" – Net Sales only, daily. */
export function SalesTrendChart({ data, currency, height = 240 }: { data: DailyBusinessPoint[]; currency: Currency; height?: number }) {
  if (!data.length) return <EmptyState title="No data available for this period." />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.netSales} stopOpacity={0.18} />
            <stop offset="100%" stopColor={CHART_COLORS.netSales} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
        <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tickFormatter={(v: number) => formatCurrencyCompact(v, currency)} tick={AXIS_TICK} axisLine={false} tickLine={false} width={64} />
        <Tooltip
          {...TOOLTIP_STYLE}
          labelFormatter={(_label, payload) => (payload?.[0]?.payload as { fullLabel?: string } | undefined)?.fullLabel ?? String(_label)}
          formatter={(value, name, item) => {
            const row = item.payload as DailyBusinessPoint;
            return [`${formatCurrency(Number(value), currency)} · ${formatNumber(row.orders)} orders`, String(name)];
          }}
        />
        <Area isAnimationActive={false} type="monotone" dataKey="netSales" name="Shopify Net Sales" stroke={CHART_COLORS.netSales} strokeWidth={2} fill="url(#salesFill)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
