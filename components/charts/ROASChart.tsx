"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BrandSummary } from "@/types";
import { formatROAS, TARGET_STATUS_LABEL } from "@/lib/formatters";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from "@/components/charts/chartConfig";
import { EmptyState } from "@/components/shared/States";

const STATUS_COLOR = {
  on_track: CHART_COLORS.onTrack,
  attention: CHART_COLORS.attention,
  below_target: CHART_COLORS.belowTarget,
} as const;

/**
 * "Actual ROAS by Brand" – horizontal bars coloured by target status, with a
 * target marker per brand. ROAS is a ratio so INR and AED brands can share
 * the chart.
 */
export function ROASChart({ summaries, height }: { summaries: BrandSummary[]; height?: number }) {
  if (!summaries.length) return <EmptyState title="No data available for this period." />;
  const data = summaries.map((s) => ({
    name: s.brand.name,
    roas: Number(s.actualROAS.toFixed(2)),
    target: s.targetROAS,
    status: s.status,
  }));
  const max = Math.max(...data.map((d) => Math.max(d.roas, d.target))) * 1.15;
  const uniqueTargets = [...new Set(data.map((d) => d.target))].sort((a, b) => a - b);
  const h = height ?? Math.max(160, data.length * 44 + 24);
  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={h}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 0 }} barCategoryGap={10}>
          <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
          <XAxis type="number" domain={[0, Number(max.toFixed(1))]} tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => v.toFixed(1)} />
          <YAxis type="category" dataKey="name" width={132} tick={{ ...AXIS_TICK, fill: "#1a1a19" }} axisLine={false} tickLine={false} />
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
            formatter={(value, name, item) => {
              const row = item.payload as (typeof data)[number];
              if (name === "Actual ROAS") return [`${formatROAS(Number(value))} (target ${formatROAS(row.target)}) · ${TARGET_STATUS_LABEL[row.status]}`, "Actual ROAS"];
              return [String(value), String(name)];
            }}
          />
          <Bar isAnimationActive={false} dataKey="roas" name="Actual ROAS" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((d) => (
              <Cell key={d.name} fill={STATUS_COLOR[d.status]} />
            ))}
            <LabelList dataKey="roas" position="right" formatter={(v: unknown) => formatROAS(Number(v))} style={{ fontSize: 11, fill: "#1a1a19", fontWeight: 500 }} />
          </Bar>
          {uniqueTargets.map((t) => (
            <ReferenceLine key={`t-${t}`} x={t} stroke={CHART_COLORS.target} strokeDasharray="3 3" ifOverflow="extendDomain" />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap items-center gap-4 px-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: CHART_COLORS.onTrack }} />On Track</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: CHART_COLORS.attention }} />Attention</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm" style={{ background: CHART_COLORS.belowTarget }} />Below Target</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0 w-4 border-t border-dashed" style={{ borderColor: CHART_COLORS.target }} />Target markers ({uniqueTargets.map(formatROAS).join(" / ")})</span>
      </div>
    </div>
  );
}
