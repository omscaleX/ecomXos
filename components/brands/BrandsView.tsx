"use client";

import * as React from "react";
import { LayoutGrid, List, Search } from "lucide-react";
import type { TargetStatus } from "@/types";
import { useAppState } from "@/components/providers/AppStateProvider";
import { getBrandSummaries } from "@/lib/analytics";
import { getVisibleBrands, isManager } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { BrandCard } from "@/components/brands/BrandCard";
import { BrandPerformanceTable } from "@/components/dashboard/BrandPerformanceTable";
import { EmptyState } from "@/components/shared/States";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type StatusFilter = "all" | TargetStatus;

export function BrandsView() {
  const { currentUser, targets } = useAppState();
  const manager = isManager(currentUser);
  const visible = getVisibleBrands(currentUser);
  const summaries = getBrandSummaries(visible.map((b) => b.id), targets);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [view, setView] = React.useState<"cards" | "table">("cards");

  const filtered = summaries.filter(
    (s) =>
      (status === "all" || s.status === status) &&
      (query.trim() === "" || s.brand.name.toLowerCase().includes(query.trim().toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={manager ? "Brands" : "My Brands"}
        subtitle={manager ? "All six brands. Actual ROAS = Shopify Net Sales ÷ (Meta + Google spend)." : `${visible.length} brands you are responsible for on ${currentUser.platform === "meta" ? "Meta" : "Google"} Ads.`}
        actions={
          <div className="flex items-center gap-1 rounded-md border bg-card p-0.5">
            <Button variant={view === "cards" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("cards")} aria-label="Card view" aria-pressed={view === "cards"}><LayoutGrid /></Button>
            <Button variant={view === "table" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("table")} aria-label="Table view" aria-pressed={view === "table"}><List /></Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search brands" className="pl-8" aria-label="Search brands" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-40" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="on_track">On Track</SelectItem>
            <SelectItem value="attention">Attention</SelectItem>
            <SelectItem value="below_target">Below Target</SelectItem>
          </SelectContent>
        </Select>
        <p className="ml-auto text-xs text-muted-foreground">{filtered.length} of {summaries.length} brands</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No brands match your filters." description="Try a different search or status." />
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <BrandCard key={s.brand.id} summary={s} showOwners={manager} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="px-0 sm:px-4">
            <BrandPerformanceTable summaries={filtered} showOwners={manager} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
