"use client";

import * as React from "react";
import Link from "next/link";
import { brands } from "@/data/brands";
import { clientsById } from "@/data/clients";
import { getBrandProducts } from "@/data/products";
import { useAppState, useContent } from "@/components/providers/AppStateProvider";
import { DEPARTMENTS, DEPARTMENT_SHORT, getBrandAssets } from "@/lib/content";
import { buildBrandContentStats } from "@/lib/contentStats";
import { PageHeader } from "@/components/layout/PageHeader";
import { BrandMark } from "@/components/shared/BrandMark";
import { Badge } from "@/components/ui/badge";

/**
 * Brands as the content team sees them: what the brand sells, what has
 * been asked for and what is on file. No spend, sales or ROAS.
 */
export function BrandContentList() {
  const { today } = useAppState();
  const { contentRequests, contentAssets } = useContent();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brands"
        subtitle="The brands you make content for. Open one to see its library and history."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => {
          const stats = buildBrandContentStats(contentRequests, b.id, today);
          const assets = getBrandAssets(contentAssets, b.id);
          const products = getBrandProducts(b.id);
          return (
            <Link
              key={b.id}
              href={`/brands/${b.id}?tab=content`}
              className="min-w-0 space-y-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <BrandMark brand={b} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {clientsById[b.clientId].name} · {b.category}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEPARTMENTS.map((d) => (
                  <Badge key={d} variant="neutral">
                    {DEPARTMENT_SHORT[d]}: {stats.byDepartment[d]}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{stats.open} open · {stats.completed} done</span>
                {stats.overdue > 0 && <Badge variant="danger">{stats.overdue} late</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {assets.length} files on file · {products.length} products
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
