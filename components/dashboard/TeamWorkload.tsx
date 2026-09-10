"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { UserId, Workload } from "@/types";
import { usersById } from "@/data/users";
import { WorkloadBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Team Workload. This is task volume only – it is not an employee
 * performance score.
 */
export function TeamWorkloadTable({ workloads }: { workloads: Workload[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Brands</TableHead>
          <TableHead className="text-right">Open Tasks</TableHead>
          <TableHead className="text-right">Overdue</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workloads.map((w) => {
          const u = usersById[w.userId];
          return (
            <TableRow key={w.userId}>
              <TableCell>
                <Link href="/team" className="inline-flex items-center gap-2 hover:underline">
                  <UserAvatar user={u} size="sm" />
                  <span className="font-medium">{u.name}</span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{u.shortRoleLabel}</TableCell>
              <TableCell className="tabular text-right">{w.brandCount}</TableCell>
              <TableCell className="tabular text-right">{w.openTasks}</TableCell>
              <TableCell className={cn("tabular text-right", w.overdueTasks > 0 && "font-medium text-red-600")}>{w.overdueTasks}</TableCell>
              <TableCell><WorkloadBadge status={w.status} /></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** Compact cards with an "Assign Task" button (manager dashboard). */
export function TeamWorkloadCards({ workloads, columns = 3 }: { workloads: Workload[]; columns?: 1 | 3 | 4 }) {
  const [assignTo, setAssignTo] = React.useState<UserId | null>(null);
  return (
    <>
      <ul className={cn("grid gap-3", columns === 1 ? "grid-cols-1" : "sm:grid-cols-2", columns === 4 && "xl:grid-cols-4", columns === 3 && "xl:grid-cols-3")}>
        {workloads.map((w) => {
          const u = usersById[w.userId];
          return (
            <li key={w.userId} className={cn("flex gap-3 rounded-lg border p-3", columns === 1 ? "flex-col sm:flex-row sm:items-center" : "flex-col")}>
              <div className={cn("flex items-center gap-2", columns === 1 && "sm:w-44")}>
                <UserAvatar user={u} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.shortRoleLabel}</p>
                </div>
                <WorkloadBadge status={w.status} />
              </div>
              <dl className={cn("grid grid-cols-3 gap-2 text-center", columns === 1 && "sm:flex-1")}>
                <div className="rounded-md bg-muted/60 py-1.5">
                  <dt className="text-[11px] text-muted-foreground">Brands</dt>
                  <dd className="tabular text-sm font-semibold">{w.brandCount}</dd>
                </div>
                <div className="rounded-md bg-muted/60 py-1.5">
                  <dt className="text-[11px] text-muted-foreground">Open</dt>
                  <dd className="tabular text-sm font-semibold">{w.openTasks}</dd>
                </div>
                <div className="rounded-md bg-muted/60 py-1.5">
                  <dt className="text-[11px] text-muted-foreground">Overdue</dt>
                  <dd className={cn("tabular text-sm font-semibold", w.overdueTasks > 0 && "text-red-600")}>{w.overdueTasks}</dd>
                </div>
              </dl>
              <Button variant="outline" size="sm" onClick={() => setAssignTo(w.userId)}>
                <Plus /> Assign Task
              </Button>
            </li>
          );
        })}
      </ul>
      <TaskModal open={!!assignTo} onOpenChange={(o) => !o && setAssignTo(null)} defaults={assignTo ? { assigneeId: assignTo } : undefined} />
    </>
  );
}
