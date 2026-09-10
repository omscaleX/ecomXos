"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { PriorityItem } from "@/types";
import { usersById } from "@/data/users";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { EmptyState } from "@/components/shared/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** "Today's Priorities" – ranked output of getTopPriorities(). */
export function PriorityList({ items }: { items: PriorityItem[] }) {
  if (!items.length) {
    return <EmptyState icon={CheckCircle2} title="Nothing urgent today" description="All brands are on track and no tasks are overdue." />;
  }
  return (
    <ol className="divide-y">
      {items.map((p) => {
        const assignee = p.assigneeId ? usersById[p.assigneeId] : undefined;
        return (
          <li key={p.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={cn(
                "tabular mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                p.severity === "high" ? "bg-red-100 text-red-700" : p.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground",
              )}
            >
              {p.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.detail}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {assignee && (
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <UserAvatar user={assignee} size="sm" />
                    {assignee.name}
                  </span>
                )}
                <Badge variant={p.severity === "high" ? "danger" : p.severity === "medium" ? "warning" : "neutral"}>
                  {p.severity === "high" ? "High" : p.severity === "medium" ? "Medium" : "Low"}
                </Badge>
              </div>
            </div>
            <Button asChild variant="ghost" size="icon-sm" aria-label={`Open ${p.title}`}>
              <Link href={p.href}><ArrowRight /></Link>
            </Button>
          </li>
        );
      })}
    </ol>
  );
}
