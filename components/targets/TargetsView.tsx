"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import type { BrandId } from "@/types";
import { useAppState } from "@/components/providers/AppStateProvider";
import { getBrandSummaries } from "@/lib/analytics";
import { getVisibleBrands, isManager } from "@/lib/permissions";
import { formatROAS } from "@/lib/formatters";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TargetTable } from "@/components/targets/TargetTable";
import { EditTargetModal } from "@/components/targets/EditTargetModal";
import { DonutChart } from "@/components/charts/DonutChart";
import { TargetOverview } from "@/components/charts/TargetRing";
import { statusSlices } from "@/components/charts/pieData";
import { TargetStatusBadge } from "@/components/shared/StatusBadge";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { SOURCE } from "@/components/shared/SourceLabel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** /targets – ROAS targets vs Actual ROAS with an editable demo target. */
export function TargetsView() {
  const { currentUser, targets } = useAppState();
  const manager = isManager(currentUser);
  const brands = getVisibleBrands(currentUser);
  const summaries = getBrandSummaries(brands.map((b) => b.id), targets);
  const [editing, setEditing] = React.useState<BrandId | null | "any">(null);

  const onTrack = summaries.filter((s) => s.status === "on_track").length;
  const attention = summaries.filter((s) => s.status === "attention").length;
  const below = summaries.filter((s) => s.status === "below_target").length;
  const avg = summaries.length ? summaries.reduce((a, s) => a + s.actualROAS, 0) / summaries.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Targets"
        subtitle="ROAS targets are internal. They are compared with Actual ROAS = Shopify Net Sales ÷ Total Ad Spend (last 30 days)."
        actions={
          <>
            <AskAIButton question="Which brands are below target?" />
            {manager && (
              <Button size="sm" onClick={() => setEditing("any")}><Pencil /> Edit Target</Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <MetricCard label="Total Brands" value={summaries.length} source={SOURCE.target} />
        <MetricCard label="Brands On Track" value={onTrack} tone="success" source="Actual ROAS ≥ target" />
        <MetricCard label="Attention" value={attention} tone={attention ? "warning" : "default"} source="≥ 80% of target" />
        <MetricCard label="Brands Below Target" value={below} tone={below ? "danger" : "default"} source="< 80% of target" />
        <MetricCard label="Average Actual ROAS" value={formatROAS(avg)} source="Simple average across brands" hint="Average of each brand's Actual ROAS. Currencies are not combined – ROAS is a ratio." />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target vs Actual ROAS</CardTitle>
          <CardDescription>Each ring fills to Actual ÷ Target. The line under each brand says exactly how far it is from its target.</CardDescription>
        </CardHeader>
        <CardContent>
          <TargetOverview summaries={summaries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target Tracking</CardTitle>
          <CardDescription>{manager ? "Click the pencil to change a target. Changes update every dashboard and the AI." : "Targets are set by managers."}</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-4">
          <TargetTable summaries={summaries} onEdit={manager ? (id) => setEditing(id) : undefined} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Brands by Status</CardTitle>
            <CardDescription>How many brands are on track, need attention or are below target.</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart slices={statusSlices(summaries)} centerValue={String(summaries.length)} centerLabel="brands" size={150} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Status rules</CardTitle>
            <CardDescription>Shared calculateTargetStatus() used on every page and by Agency AI.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between rounded-md border px-3 py-2"><span>Actual ROAS is at or above the target</span><TargetStatusBadge status="on_track" /></li>
              <li className="flex items-center justify-between rounded-md border px-3 py-2"><span>Actual ROAS is below target but at least 80% of it</span><TargetStatusBadge status="attention" /></li>
              <li className="flex items-center justify-between rounded-md border px-3 py-2"><span>Actual ROAS is less than 80% of the target</span><TargetStatusBadge status="below_target" /></li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {manager && (
        <EditTargetModal
          open={editing !== null}
          onOpenChange={(o) => !o && setEditing(null)}
          brandId={editing && editing !== "any" ? editing : undefined}
        />
      )}
    </div>
  );
}
