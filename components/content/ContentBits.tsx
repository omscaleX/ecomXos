"use client";

import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import type { ContentDepartment } from "@/types";
import type { ContentRequest } from "@/types/content";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/shared/BrandMark";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { brandsById } from "@/data/brands";
import { usersById } from "@/data/users";
import { productsById, campaignsById } from "@/data/products";
import {
  DEPARTMENT_LABEL,
  DEPARTMENT_SHORT,
  STATUS_LABEL_NEUTRAL,
  STATUS_TONE,
  daysLate,
  isOverdue,
  requestSummaryLine,
  versionCount,
} from "@/lib/content";
import { formatDueDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/** The coloured word that tells you where a request has got to. */
export function RequestStatusBadge({ request }: { request: ContentRequest }) {
  return <Badge variant={STATUS_TONE[request.status]}>{STATUS_LABEL_NEUTRAL[request.status]}</Badge>;
}

const DEPARTMENT_CLASS: Record<ContentDepartment, string> = {
  script: "bg-purple-100 text-purple-700 border-purple-200",
  video: "bg-rose-100 text-rose-700 border-rose-200",
  design: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

export function DepartmentBadge({ department, full = false }: { department: ContentDepartment; full?: boolean }) {
  return (
    <span className={cn("inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-xs font-medium", DEPARTMENT_CLASS[department])}>
      {full ? DEPARTMENT_LABEL[department] : DEPARTMENT_SHORT[department]}
    </span>
  );
}

/** Due date, turning red once it is late. */
export function DueLabel({ request, today }: { request: ContentRequest; today: string }) {
  const late = isOverdue(request, today);
  if (request.status === "completed") {
    return <span className="text-xs text-muted-foreground">Finished {formatDueDate(request.completedAt ?? request.eta, today)}</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", late ? "font-medium text-red-600" : "text-muted-foreground")}>
      {late ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
      {late ? `${daysLate(request, today)} days late` : `Due ${formatDueDate(request.eta, today)}`}
    </span>
  );
}

/** One row in a queue. Everything you need to decide, nothing more. */
export function RequestRow({ request, today }: { request: ContentRequest; today: string }) {
  const brand = brandsById[request.brandId];
  const requester = usersById[request.requesterId];
  const assignee = request.assigneeId ? usersById[request.assigneeId] : undefined;
  const campaign = request.campaignId ? campaignsById[request.campaignId] : undefined;
  const products = request.productIds.map((p) => productsById[p]?.name).filter(Boolean);
  const versions = versionCount(request);

  return (
    <Link
      href={`/content/${request.id}`}
      className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <BrandMark brand={brand} size="md" />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{request.id}</span>
            <DepartmentBadge department={request.department} />
            <RequestStatusBadge request={request} />
            {versions > 1 && <Badge variant="neutral">v{versions}</Badge>}
          </div>
          <p className="truncate text-sm font-medium">{requestSummaryLine(request)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {brand.name}
            {products.length ? ` · ${products.join(", ")}` : ""}
            {campaign ? ` · ${campaign.name}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
        <DueLabel request={request} today={today} />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {assignee ? (
            <>
              <UserAvatar user={assignee} size="sm" /> {assignee.name}
            </>
          ) : (
            <>Asked by {requester.name}</>
          )}
        </span>
      </div>
    </Link>
  );
}

/** A number with a word under it. Used for the counts along the top. */
export function CountCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border bg-card p-4",
        tone === "warning" && "border-amber-200 bg-amber-50/60",
        tone === "danger" && "border-red-200 bg-red-50/60",
        tone === "success" && "border-emerald-200 bg-emerald-50/60",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
