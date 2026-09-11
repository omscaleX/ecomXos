"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BrandSummary } from "@/types";
import { usersById } from "@/data/users";
import { formatCurrency, formatROAS } from "@/lib/formatters";
import { TargetStatusBadge } from "@/components/shared/StatusBadge";
import { BrandMark } from "@/components/shared/BrandMark";
import { TargetProgress } from "@/components/targets/TargetTable";
import { describeGap } from "@/components/charts/TargetRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Brand card: owners, Ad Spend, Shopify Net Sales, Actual ROAS, Target, Status. */
export function BrandCard({ summary: s, showOwners = true }: { summary: BrandSummary; showOwners?: boolean }) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <BrandMark brand={s.brand} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/brands/${s.brand.id}`} className="truncate text-sm font-semibold hover:underline">{s.brand.name}</Link>
              <TargetStatusBadge status={s.status} />
            </div>
            <p className="text-xs text-muted-foreground">{s.brand.category} · {s.brand.market} · {s.currency}</p>
          </div>
        </div>

        {showOwners && (
          <dl className="grid grid-cols-3 gap-2 text-xs">
            <div><dt className="text-muted-foreground">Manager</dt><dd className="font-medium">{usersById[s.brand.managerId].name}</dd></div>
            <div><dt className="text-muted-foreground">Meta</dt><dd className="font-medium">{usersById[s.brand.metaOwnerId].name}</dd></div>
            <div><dt className="text-muted-foreground">Google</dt><dd className="font-medium">{usersById[s.brand.googleOwnerId].name}</dd></div>
          </dl>
        )}

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div>
            <dt className="text-[11px] text-muted-foreground">Ad Spend</dt>
            <dd className="tabular font-medium">{formatCurrency(s.totalSpend, s.currency)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Shopify Net Sales</dt>
            <dd className="tabular font-medium">{formatCurrency(s.netSales, s.currency)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Actual ROAS</dt>
            <dd className="tabular text-lg font-semibold">{formatROAS(s.actualROAS)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">Target</dt>
            <dd className="tabular text-lg font-semibold text-muted-foreground">{formatROAS(s.targetROAS)}</dd>
          </div>
        </dl>

        <div className="space-y-1">
          <TargetProgress actual={s.actualROAS} target={s.targetROAS} />
          <p className={`tabular text-xs font-medium ${s.status === "on_track" ? "text-emerald-700" : s.status === "attention" ? "text-amber-700" : "text-red-600"}`}>
            {describeGap(s)}
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="mt-auto">
          <Link href={`/brands/${s.brand.id}`}>Open Brand <ArrowRight /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}
