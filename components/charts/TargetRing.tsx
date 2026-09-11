"use client";

import Link from "next/link";
import type { BrandSummary, TargetStatus } from "@/types";
import { formatROAS, TARGET_STATUS_LABEL } from "@/lib/formatters";
import { TargetStatusBadge } from "@/components/shared/StatusBadge";
import { BrandMark } from "@/components/shared/BrandMark";
import { CHART_COLORS } from "@/components/charts/chartConfig";
import { cn } from "@/lib/utils";

const STATUS_COLOR: Record<TargetStatus, string> = {
  on_track: CHART_COLORS.onTrack,
  attention: CHART_COLORS.attention,
  below_target: CHART_COLORS.belowTarget,
};

/** Plain-English gap line, e.g. "0.70 below target (32%)" or "0.10 above target (4%)". */
export function describeGap(s: Pick<BrandSummary, "gap" | "gapPercent">): string {
  const pct = Math.round(Math.abs(s.gapPercent) * 100);
  if (s.gap >= 0) return `${Math.abs(s.gap).toFixed(2)} above target (${pct}%)`;
  return `${Math.abs(s.gap).toFixed(2)} below target (${pct}%)`;
}

/**
 * A single ring showing how much of the ROAS target a brand has reached.
 * The ring fills to Actual ÷ Target (capped at 100%). Actual, Target and
 * the gap are always written out so nothing has to be inferred from the shape.
 */
export function TargetRing({
  actual,
  target,
  status,
  gap,
  gapPercent,
  size = 132,
  label,
  className,
}: {
  actual: number;
  target: number;
  status: TargetStatus;
  gap: number;
  gapPercent: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  const pct = target > 0 ? Math.min(1, actual / target) : 0;
  const stroke = Math.max(8, Math.round(size * 0.1));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = STATUS_COLOR[status];
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(pct * 100)}% of target reached`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7e6e2" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c * pct} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="tabular font-semibold leading-none" style={{ fontSize: Math.round(size * 0.2) }}>{formatROAS(actual)}</span>
          <span className="mt-1 text-[11px] leading-none text-muted-foreground">of {formatROAS(target)}</span>
        </div>
      </div>
      <div className="text-center">
        {label && <p className="text-sm font-medium">{label}</p>}
        <p className="tabular text-xs text-muted-foreground">Target {formatROAS(target)} · {Math.round(pct * 100)}% reached</p>
        <p className={cn("tabular text-sm font-semibold", status === "on_track" ? "text-emerald-700" : status === "attention" ? "text-amber-700" : "text-red-600")}>
          {describeGap({ gap, gapPercent })}
        </p>
      </div>
    </div>
  );
}

/** Grid of one ring per brand – "Target vs Actual ROAS" at a glance. */
export function TargetOverview({ summaries, columns = 6 }: { summaries: BrandSummary[]; columns?: 3 | 6 }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3", columns === 6 && "xl:grid-cols-6")}>
      {summaries.map((s) => (
        <li key={s.brand.id} className="flex flex-col items-center gap-2 rounded-lg border p-3">
          <Link href={`/brands/${s.brand.id}`} className="flex items-center gap-2 hover:underline">
            <BrandMark brand={s.brand} size="sm" />
            <span className="text-sm font-medium">{s.brand.name}</span>
          </Link>
          <TargetRing actual={s.actualROAS} target={s.targetROAS} status={s.status} gap={s.gap} gapPercent={s.gapPercent} size={112} />
          <TargetStatusBadge status={s.status} />
        </li>
      ))}
    </ul>
  );
}

/** Larger single-brand panel used in the brand header. */
export function BrandTargetPanel({ summary: s }: { summary: BrandSummary }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:justify-start sm:gap-6">
      <TargetRing actual={s.actualROAS} target={s.targetROAS} status={s.status} gap={s.gap} gapPercent={s.gapPercent} size={140} />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-1">
        <div>
          <dt className="text-[11px] text-muted-foreground">Actual ROAS</dt>
          <dd className="tabular text-xl font-semibold">{formatROAS(s.actualROAS)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted-foreground">Target</dt>
          <dd className="tabular text-xl font-semibold">{formatROAS(s.targetROAS)}</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-[11px] text-muted-foreground">Status</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2">
            <TargetStatusBadge status={s.status} />
            <span className="text-xs text-muted-foreground">{TARGET_STATUS_LABEL[s.status] === "On Track" ? "Meeting target" : describeGap(s)}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
