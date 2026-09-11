"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { BrandSummary } from "@/types";
import { usersById } from "@/data/users";
import { formatCurrency, formatROAS } from "@/lib/formatters";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TargetStatusBadge } from "@/components/shared/StatusBadge";
import { BrandMark } from "@/components/shared/BrandMark";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { SOURCE } from "@/components/shared/SourceLabel";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { BrandTargetPanel } from "@/components/charts/TargetRing";
import { TARGET_STATUS_LABEL } from "@/lib/formatters";

/** Brand page header: owners + the five business metric cards. */
export function BrandHeader({ summary: s, showOwners = true, compact = false }: { summary: BrandSummary; showOwners?: boolean; compact?: boolean }) {
  const owners = [
    { label: "Manager", user: usersById[s.brand.managerId] },
    { label: "Meta", user: usersById[s.brand.metaOwnerId] },
    { label: "Google", user: usersById[s.brand.googleOwnerId] },
  ];
  const tone = s.status === "on_track" ? "success" : s.status === "attention" ? "warning" : "danger";

  return (
    <div className="space-y-5">
      <Link href="/brands" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-3.5" /> Brands
      </Link>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <BrandMark brand={s.brand} size="lg" />
            <span>
              <span className="flex flex-wrap items-center gap-2">
                {s.brand.name}
                <TargetStatusBadge status={s.status} />
              </span>
              <span className="block text-sm font-normal text-muted-foreground">
                {s.brand.category} · {s.brand.market} · {s.currency} · {s.brand.shopifyStore}
              </span>
            </span>
          </span>
        }
        actions={<QuickActions brandId={s.brand.id} />}
      >
        {showOwners && (
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {owners.map((o) => (
              <div key={o.label} className="flex items-center gap-2">
                <UserAvatar user={o.user} size="sm" />
                <div className="leading-tight">
                  <dt className="text-[11px] text-muted-foreground">{o.label}</dt>
                  <dd className="text-sm font-medium">{o.user.name}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}
      </PageHeader>

      {!compact && (
      <div className="grid gap-3 lg:grid-cols-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-3">
          <MetricCard label="Total Ad Spend" value={formatCurrency(s.totalSpend, s.currency)} source={SOURCE.totalSpend} hint={`Meta ${formatCurrency(s.metaSpend, s.currency)} + Google ${formatCurrency(s.googleSpend, s.currency)}`} />
          <MetricCard label="Shopify Net Sales" value={formatCurrency(s.netSales, s.currency)} source={SOURCE.shopify} hint={`${s.orders} orders`} />
          <MetricCard label="Actual ROAS" value={formatROAS(s.actualROAS)} source={SOURCE.actualROAS} tone={tone} secondary={`Target ${formatROAS(s.targetROAS)} · ${TARGET_STATUS_LABEL[s.status]}`} />
        </div>
        <div className="lg:col-span-2">
          <BrandTargetPanel summary={s} />
        </div>
      </div>
      )}
    </div>
  );
}
