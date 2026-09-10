"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { UserId } from "@/types";
import { brands } from "@/data/brands";
import { users } from "@/data/users";
import { useAppState } from "@/components/providers/AppStateProvider";
import { getWorkload, sortTasks, WORKLOAD_LABEL } from "@/lib/tasks";
import { formatDueDate } from "@/lib/formatters";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { BrandMark } from "@/components/shared/BrandMark";
import { WorkloadBadge, PriorityBadge } from "@/components/shared/StatusBadge";
import { TaskModal } from "@/components/tasks/TaskModal";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/** /team – members, roles, brands and task workload (not a performance score). */
export function TeamView() {
  const { tasks, today } = useAppState();
  const [assignTo, setAssignTo] = React.useState<UserId | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        subtitle="Who is responsible for what, and current task workload. Workload is task volume only – it is not an employee performance score."
        actions={<AskAIButton question="Which team member has the most overdue tasks?" />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((u) => {
          const myBrands = brands.filter((b) => b.managerId === u.id || b.metaOwnerId === u.id || b.googleOwnerId === u.id);
          const w = getWorkload(u.id, tasks, myBrands.length, today);
          const mine = sortTasks(tasks.filter((t) => t.assigneeId === u.id && t.status !== "completed"), today).slice(0, 3);
          const isSenior = u.role === "senior_manager";
          const loadPct = Math.min(100, Math.round((w.openTasks / 10) * 100));
          return (
            <Card key={u.id} className="gap-0 py-0">
              <CardContent className="flex h-full flex-col gap-4 p-4">
                <div className="flex items-start gap-3">
                  <UserAvatar user={u} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.roleLabel}</p>
                  </div>
                  {!isSenior && <WorkloadBadge status={w.status} />}
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                    {isSenior ? "Agency-level visibility" : `Brands (${myBrands.length})`}
                  </p>
                  {isSenior ? (
                    <p className="text-xs text-muted-foreground">All brands, all performance, all targets, all tasks and team workload.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {myBrands.map((b) => (
                        <Link key={b.id} href={`/brands/${b.id}`} className="inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-xs hover:bg-accent">
                          <BrandMark brand={b} size="sm" className="size-4 text-[8px]" />
                          {b.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {!isSenior && (
                  <>
                    <dl className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-muted/60 py-1.5"><dt className="text-[11px] text-muted-foreground">Open</dt><dd className="tabular text-sm font-semibold">{w.openTasks}</dd></div>
                      <div className="rounded-md bg-muted/60 py-1.5"><dt className="text-[11px] text-muted-foreground">Overdue</dt><dd className={cn("tabular text-sm font-semibold", w.overdueTasks > 0 && "text-red-600")}>{w.overdueTasks}</dd></div>
                      <div className="rounded-md bg-muted/60 py-1.5"><dt className="text-[11px] text-muted-foreground">Due today</dt><dd className="tabular text-sm font-semibold">{w.dueToday}</dd></div>
                    </dl>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Current workload</span>
                        <span>{WORKLOAD_LABEL[w.status]}</span>
                      </div>
                      <Progress value={loadPct} indicatorClassName={w.status === "healthy" ? "bg-emerald-500" : w.status === "busy" ? "bg-amber-500" : "bg-red-500"} aria-label={`${w.openTasks} open tasks`} />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-medium text-muted-foreground">Next up</p>
                      {mine.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No open tasks.</p>
                      ) : (
                        <ul className="space-y-1">
                          {mine.map((t) => (
                            <li key={t.id} className="flex items-center justify-between gap-2 text-xs">
                              <span className="truncate">{t.title}</span>
                              <span className="flex shrink-0 items-center gap-1.5">
                                <PriorityBadge priority={t.priority} />
                                <span className="text-muted-foreground">{formatDueDate(t.dueDate, today)}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="mt-auto flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setAssignTo(u.id)}><Plus /> Assign Task</Button>
                      <Button variant="ghost" size="sm" asChild><Link href="/tasks?view=all">View tasks</Link></Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TaskModal open={!!assignTo} onOpenChange={(o) => !o && setAssignTo(null)} defaults={assignTo ? { assigneeId: assignTo } : undefined} />
    </div>
  );
}
