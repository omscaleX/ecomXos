"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { TOOLTIP_STYLE } from "@/components/charts/chartConfig";
import { EmptyState } from "@/components/shared/States";
import { cn } from "@/lib/utils";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
  /** Optional pre-formatted value shown in the legend and tooltip. */
  label?: string;
}

/** Fixed categorical order for brand slices (validated palette). */
export const SLICE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];

/**
 * Simple pie / donut with a plain legend: name, value and share.
 * Used for part-to-whole splits only (spend by platform, spend by brand,
 * sales by brand, brand status).
 */
export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  size = 180,
  className,
}: {
  slices: DonutSlice[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  className?: string;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (!slices.length || total <= 0) return <EmptyState title="No data available for this period." />;
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={size * 0.32}
              outerRadius={size * 0.48}
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              {...TOOLTIP_STYLE}
              formatter={(value, name, item) => {
                const slice = item.payload as DonutSlice;
                const share = Math.round((Number(value) / total) * 100);
                return [`${slice.label ?? String(value)} (${share}%)`, String(name)];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {(centerLabel || centerValue) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerValue && <span className="tabular text-lg font-semibold leading-tight">{centerValue}</span>}
            {centerLabel && <span className="max-w-[70%] text-[11px] leading-tight text-muted-foreground">{centerLabel}</span>}
          </div>
        )}
      </div>
      <ul className="w-full min-w-0 space-y-1 text-xs">
        {slices.map((s) => {
          const share = Math.round((s.value / total) * 100);
          return (
            <li key={s.name} className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              <span className="tabular text-muted-foreground">{s.label ?? s.value}</span>
              <span className="tabular w-9 text-right font-medium">{share}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
