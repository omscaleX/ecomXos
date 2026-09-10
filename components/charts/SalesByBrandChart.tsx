"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BrandSummary, Currency } from "@/types";
import { formatCurrency, formatCurrencyCompact, formatNumber } from "@/lib/formatters";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from "@/components/charts/chartConfig";
import { EmptyState } from "@/components/shared/States";

/** "Sales by Brand" – Shopify Net Sales per brand within one currency. */
export function SalesByBrandChart({ summaries, currency, height }: { summaries: BrandSummary[]; currency: Currency; height?: number }) {
  const rows = summaries.filter((s) => s.currency === currency);
  if (!rows.length) return <EmptyState title="No data available for this period." />;
  const data = [...rows].sort((a, b) => b.netSales - a.netSales).map((s) => ({ name: s.brand.name, netSales: s.netSales, orders: s.orders }));
  const h = height ?? Math.max(140, data.length * 40 + 24);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 72, left: 8, bottom: 0 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
        <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatCurrencyCompact(v, currency)} />
        <YAxis type="category" dataKey="name" width={132} tick={{ ...AXIS_TICK, fill: "#1a1a19" }} axisLine={false} tickLine={false} />
        <Tooltip
          {...TOOLTIP_STYLE}
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
          formatter={(value, name, item) => {
            const row = item.payload as (typeof data)[number];
            return [`${formatCurrency(Number(value), currency)} · ${formatNumber(row.orders)} orders`, String(name)];
          }}
        />
        <Bar isAnimationActive={false} dataKey="netSales" name="Shopify Net Sales" fill={CHART_COLORS.netSales} radius={[0, 4, 4, 0]} maxBarSize={20}>
          <LabelList dataKey="netSales" position="right" formatter={(v: unknown) => formatCurrencyCompact(Number(v), currency)} style={{ fontSize: 11, fill: "#1a1a19", fontWeight: 500 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
