"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import type { BrandId } from "@/types";
import { brandsById, isBrandId } from "@/data/brands";
import { useAppState } from "@/components/providers/AppStateProvider";
import { getBrandSummary } from "@/lib/analytics";
import { canViewBrand, canViewMoney, canViewPlatform, isManager } from "@/lib/permissions";
import { BrandHeader } from "@/components/brands/BrandHeader";
import { BrandPlatformTab } from "@/components/brands/BrandPlatformTab";
import { BrandCreativesTab, BrandOverviewTab, BrandReportsTab, BrandSalesTab, BrandTargetsTab, BrandTasksTab } from "@/components/brands/BrandTabs";
import { BrandSimpleView } from "@/components/brands/BrandSimpleView";
import { BrandContentTab } from "@/components/brands/BrandContentTab";
import { BrandMark } from "@/components/shared/BrandMark";
import { LayoutList, Rows3 } from "lucide-react";
import { EmptyState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = ["overview", "meta", "google", "sales", "targets", "tasks", "content", "creatives", "reports"] as const;
type TabKey = (typeof TABS)[number];

export function BrandDetail({ brandId }: { brandId: string }) {
  const { currentUser, targets } = useAppState();
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("tab");

  if (!isBrandId(brandId)) {
    return (
      <EmptyState
        title="Brand not found"
        description="This brand doesn't exist in the demo data."
        action={<Button asChild variant="outline" size="sm"><Link href="/brands">Back to brands</Link></Button>}
      />
    );
  }
  if (!canViewBrand(currentUser, brandId)) {
    return (
      <EmptyState
        icon={Lock}
        title={`${brandsById[brandId].name} isn't one of your brands`}
        description={`${currentUser.name} only works on their own brands. Switch person from the top right to see it as someone else.`}
        action={<Button asChild variant="outline" size="sm"><Link href="/brands">My Brands</Link></Button>}
      />
    );
  }

  // The content team sees the brand's content only, never its money.
  if (!canViewMoney(currentUser)) {
    const b = brandsById[brandId as BrandId];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BrandMark brand={b} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight">{b.name}</h2>
            <p className="text-sm text-muted-foreground">{b.category} · {b.market}</p>
          </div>
        </div>
        <BrandContentTab brandId={brandId as BrandId} brandName={b.name} />
      </div>
    );
  }

  const summary = getBrandSummary(brandId as BrandId, targets);
  const manager = isManager(currentUser);
  // Simple view is the default; a ?tab= link or the toggle opens the detailed tabs.
  const view: "simple" | "detailed" = params.get("view") === "detailed" || requested ? "detailed" : "simple";
  const setView = (next: "simple" | "detailed") => {
    const search = new URLSearchParams(params.toString());
    if (next === "simple") {
      search.delete("view");
      search.delete("tab");
    } else {
      search.set("view", "detailed");
    }
    const qs = search.toString();
    router.replace(`/brands/${brandId}${qs ? `?${qs}` : ""}`, { scroll: false });
  };
  const allowed = TABS.filter((t) => {
    if (t === "meta") return canViewPlatform(currentUser, "meta");
    if (t === "google") return canViewPlatform(currentUser, "google");
    return true;
  });
  const tab: TabKey = requested && (allowed as readonly string[]).includes(requested) ? (requested as TabKey) : "overview";

  const setTab = (next: string) => {
    const search = new URLSearchParams(params.toString());
    if (next === "overview") search.delete("tab");
    else search.set("tab", next);
    const qs = search.toString();
    router.replace(`/brands/${brandId}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const labels: Record<TabKey, string> = {
    overview: "Overview",
    meta: "Meta",
    google: "Google",
    sales: "Sales",
    targets: "Targets",
    tasks: "Tasks",
    content: "Content",
    creatives: "Creatives",
    reports: "Reports",
  };

  return (
    <div className="space-y-6">
      <BrandHeader summary={summary} showOwners={manager || true} compact={view === "simple"} />
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-md border bg-card p-0.5" role="group" aria-label="Brand view">
          <Button variant={view === "simple" ? "secondary" : "ghost"} size="sm" onClick={() => setView("simple")} aria-pressed={view === "simple"}>
            <LayoutList /> Simple view
          </Button>
          <Button variant={view === "detailed" ? "secondary" : "ghost"} size="sm" onClick={() => setView("detailed")} aria-pressed={view === "detailed"}>
            <Rows3 /> Detailed view
          </Button>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">{view === "simple" ? "One screen, plain language." : "All tabs: Meta, Google, Sales, Targets, Tasks, Content, Creatives, Reports."}</p>
      </div>
      {view === "simple" ? (
        <BrandSimpleView summary={summary} onShowDetails={() => setView("detailed")} />
      ) : (
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full justify-start sm:w-auto">
          {allowed.map((t) => (
            <TabsTrigger key={t} value={t}>{labels[t]}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview"><BrandOverviewTab summary={summary} /></TabsContent>
        {allowed.includes("meta") && <TabsContent value="meta"><BrandPlatformTab summary={summary} platform="meta" /></TabsContent>}
        {allowed.includes("google") && <TabsContent value="google"><BrandPlatformTab summary={summary} platform="google" /></TabsContent>}
        <TabsContent value="sales"><BrandSalesTab summary={summary} /></TabsContent>
        <TabsContent value="targets"><BrandTargetsTab summary={summary} /></TabsContent>
        <TabsContent value="tasks"><BrandTasksTab summary={summary} /></TabsContent>
        <TabsContent value="content"><BrandContentTab brandId={brandId as BrandId} brandName={brandsById[brandId as BrandId].name} /></TabsContent>
        <TabsContent value="creatives"><BrandCreativesTab summary={summary} /></TabsContent>
        <TabsContent value="reports"><BrandReportsTab summary={summary} /></TabsContent>
      </Tabs>
      )}
    </div>
  );
}
