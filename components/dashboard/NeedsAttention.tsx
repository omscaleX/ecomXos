"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { BrandSummary } from "@/types";
import { getBrandsBelowTarget } from "@/lib/calculations";
import { formatGap, formatROAS } from "@/lib/formatters";
import { TargetStatusBadge } from "@/components/shared/StatusBadge";
import { BrandMark } from "@/components/shared/BrandMark";
import { EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** "Needs Attention" – brands under target, biggest gap first. */
export function NeedsAttention({ summaries, limit }: { summaries: BrandSummary[]; limit?: number }) {
  const list = getBrandsBelowTarget(summaries).slice(0, limit);
  if (!list.length) {
    return <EmptyState icon={CheckCircle2} title="All brands are on track" description="No brand is below its ROAS target right now." />;
  }
  return (
    <ul className="divide-y">
      {list.map((s) => (
        <li key={s.brand.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <BrandMark brand={s.brand} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium">{s.brand.name}</p>
                <TargetStatusBadge status={s.status} />
              </div>
              <p className="tabular text-xs text-muted-foreground">
                Actual ROAS <span className="font-medium text-foreground">{formatROAS(s.actualROAS)}</span> · Target {formatROAS(s.targetROAS)} · Gap{" "}
                <span className={cn("font-medium", s.status === "below_target" ? "text-red-600" : "text-amber-700")}>{formatGap(s.gap)}</span>
                {" "}· about {Math.round(Math.abs(s.gapPercent) * 100)}% below target
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={`/brands/${s.brand.id}`}>View Brand</Link>
          </Button>
        </li>
      ))}
    </ul>
  );
}
