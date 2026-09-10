"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import type { BrandId, BrandSummary } from "@/types";
import { formatGap, formatROAS } from "@/lib/formatters";
import { TargetStatusBadge } from "@/components/shared/StatusBadge";
import { BrandChip } from "@/components/shared/BrandMark";
import { EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Progress bar showing Actual ROAS as a share of target (capped at 100%). */
export function TargetProgress({ actual, target, className }: { actual: number; target: number; className?: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  const tone = actual >= target ? "bg-emerald-500" : actual >= target * 0.8 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress value={pct} indicatorClassName={tone} className="h-1.5 w-24" aria-label={`${pct}% of target`} />
      <span className="tabular w-9 text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

/**
 * Target table used on /targets and the manager "Target Tracking" card.
 * Columns: Brand, Actual ROAS, Target, Gap (Difference), Status.
 */
export function TargetTable({
  summaries,
  onEdit,
  showProgress = true,
  compact = false,
}: {
  summaries: BrandSummary[];
  onEdit?: (brandId: BrandId) => void;
  showProgress?: boolean;
  compact?: boolean;
}) {
  if (!summaries.length) return <EmptyState title="No brands match your filters." />;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Brand</TableHead>
          <TableHead className="text-right">ROAS Target</TableHead>
          <TableHead className="text-right">Actual ROAS</TableHead>
          <TableHead className="text-right">Difference</TableHead>
          {showProgress && <TableHead>Progress</TableHead>}
          <TableHead>Status</TableHead>
          {onEdit && <TableHead className="w-10"><span className="sr-only">Edit</span></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {summaries.map((s) => (
          <TableRow key={s.brand.id}>
            <TableCell>
              {compact ? (
                <Link href={`/brands/${s.brand.id}`} className="font-medium hover:underline">{s.brand.name}</Link>
              ) : (
                <Link href={`/brands/${s.brand.id}`} className="hover:underline">
                  <BrandChip brand={s.brand} subtitle={s.currency === "AED" ? "Dubai · AED" : undefined} />
                </Link>
              )}
            </TableCell>
            <TableCell className="tabular text-right text-muted-foreground">{formatROAS(s.targetROAS)}</TableCell>
            <TableCell className="tabular text-right font-semibold">{formatROAS(s.actualROAS)}</TableCell>
            <TableCell className={cn("tabular text-right font-medium", s.gap >= 0 ? "text-emerald-700" : s.status === "attention" ? "text-amber-700" : "text-red-600")}>
              {formatGap(s.gap)}
            </TableCell>
            {showProgress && (
              <TableCell><TargetProgress actual={s.actualROAS} target={s.targetROAS} /></TableCell>
            )}
            <TableCell><TargetStatusBadge status={s.status} /></TableCell>
            {onEdit && (
              <TableCell>
                <Button variant="ghost" size="icon-sm" aria-label={`Edit target for ${s.brand.name}`} onClick={() => onEdit(s.brand.id)}>
                  <Pencil />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
