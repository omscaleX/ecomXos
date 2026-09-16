"use client";

import * as React from "react";
import { ExternalLink, FileText, Inbox } from "lucide-react";
import type { BrandId } from "@/types";
import { ASSET_KIND_LABEL } from "@/types/content";
import { usersById } from "@/data/users";
import { getBrandCampaigns, getBrandProducts, productsById } from "@/data/products";
import { useAppState, useContent } from "@/components/providers/AppStateProvider";
import { DEPARTMENTS, DEPARTMENT_LABEL, canRaiseRequest, getBrandAssets, sortForQueue } from "@/lib/content";
import { buildBrandContentStats } from "@/lib/contentStats";
import { formatLongDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/States";
import { CountCard, RequestRow } from "@/components/content/ContentBits";
import { RaiseContentTaskButton } from "@/components/content/RaiseContentTaskModal";

/**
 * The Content tab on a brand page.
 *
 * Everything the brand has ever asked for, and every file that came out of
 * it. The library builds itself — nothing has to be filed by hand.
 */
export function BrandContentTab({ brandId, brandName }: { brandId: BrandId; brandName: string }) {
  const { currentUser: user, today } = useAppState();
  const { contentRequests, contentAssets } = useContent();

  const requests = React.useMemo(
    () => sortForQueue(contentRequests.filter((r) => r.brandId === brandId), today),
    [contentRequests, brandId, today],
  );
  const assets = React.useMemo(() => getBrandAssets(contentAssets, brandId), [contentAssets, brandId]);
  const stats = React.useMemo(() => buildBrandContentStats(requests, brandId, today), [requests, brandId, today]);

  const products = getBrandProducts(brandId);
  const campaigns = getBrandCampaigns(brandId);
  const open = requests.filter((r) => r.status !== "completed");
  const done = requests.filter((r) => r.status === "completed");

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Content for {brandName}</h3>
          <p className="text-xs text-muted-foreground">Scripts, videos and creatives asked for on this brand.</p>
        </div>
        {canRaiseRequest(user) && (
          <RaiseContentTaskButton
            context={{ brandId, sourceLabel: "Brand page", sourcePath: `/brands/${brandId}?tab=content` }}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CountCard label="Asked for" value={stats.total} />
        <CountCard label="Still open" value={stats.open} />
        <CountCard label="Finished" value={stats.completed} tone="success" />
        <CountCard label="Late" value={stats.overdue} tone={stats.overdue ? "danger" : "default"} />
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-sm">Open now ({open.length})</CardTitle>
          <CardDescription>Work in progress for this brand.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {open.length ? (
            open.map((r) => <RequestRow key={r.id} request={r} today={today} />)
          ) : (
            <EmptyState icon={Inbox} title="Nothing open" description="No content is being made for this brand right now." />
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-sm">Content library ({assets.length})</CardTitle>
          <CardDescription>
            Every file on this brand. Pick from here when you raise a request instead of pasting links again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {assets.length ? (
            assets.slice(0, 20).map((a) => {
              const by = usersById[a.addedById];
              const productNames = a.productIds.map((p) => productsById[p]?.name).filter(Boolean);
              return (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-3 rounded-md border bg-card px-3 py-2 hover:border-primary/40"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{a.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {productNames.join(", ") || "All products"} · added by {by.name} on {formatLongDate(a.addedAt)}
                    </span>
                  </span>
                  <Badge variant={a.isFinal ? "success" : "neutral"}>{ASSET_KIND_LABEL[a.kind]}</Badge>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                </a>
              );
            })
          ) : (
            <EmptyState icon={FileText} title="Library is empty" description="Nothing has been filed for this brand yet." />
          )}
          {assets.length > 20 && (
            <p className="text-xs text-muted-foreground">Showing the 20 newest of {assets.length} files.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader><CardTitle className="text-sm">Finished ({done.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {done.length ? (
              done.slice(0, 8).map((r) => <RequestRow key={r.id} request={r} today={today} />)
            ) : (
              <p className="text-sm text-muted-foreground">Nothing finished yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-sm">What this brand sells</CardTitle>
            <CardDescription>Products and campaigns a request can be filed against.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Products</p>
              <div className="flex flex-wrap gap-1.5">
                {products.map((p) => (
                  <Badge key={p.id} variant="neutral">{p.name}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Campaigns</p>
              <div className="flex flex-wrap gap-1.5">
                {campaigns.length ? (
                  campaigns.map((c) => <Badge key={c.id} variant="outline">{c.name}</Badge>)
                ) : (
                  <span className="text-xs text-muted-foreground">None yet.</span>
                )}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Split by team</p>
              <div className="flex flex-wrap gap-1.5">
                {DEPARTMENTS.map((d) => (
                  <Badge key={d} variant="neutral">
                    {DEPARTMENT_LABEL[d]}: {stats.byDepartment[d]}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
