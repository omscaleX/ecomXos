"use client";

import * as React from "react";
import Link from "next/link";
import { Check, MoreHorizontal, Pencil } from "lucide-react";
import type { Task, TaskPriority, TaskStatus, UserId } from "@/types";
import { brandsById } from "@/data/brands";
import { users, usersById } from "@/data/users";
import { useAppState } from "@/components/providers/AppStateProvider";
import { isManager } from "@/lib/permissions";
import { isOverdue } from "@/lib/tasks";
import { formatDueDate, TASK_PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/lib/formatters";
import { PriorityBadge, TaskStatusBadge } from "@/components/shared/StatusBadge";
import { UserChip } from "@/components/shared/UserAvatar";
import { BrandChip } from "@/components/shared/BrandMark";
import { EmptyState } from "@/components/shared/States";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked", "review", "completed"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

/** Per-row actions: Mark Complete, Change Status, Change Priority, Assign, Edit. */
export function TaskRowActions({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const { currentUser, updateTask, completeTask } = useAppState();
  const manager = isManager(currentUser);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${task.title}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {task.status !== "completed" && (
          <DropdownMenuItem onSelect={() => completeTask(task.id)}>
            <Check /> Mark Complete
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil /> Edit task
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {STATUSES.map((s) => (
          <DropdownMenuCheckboxItem key={s} checked={task.status === s} onSelect={() => updateTask(task.id, { status: s })}>
            {TASK_STATUS_LABEL[s]}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Priority</DropdownMenuLabel>
        {PRIORITIES.map((p) => (
          <DropdownMenuCheckboxItem key={p} checked={task.priority === p} onSelect={() => updateTask(task.id, { priority: p })}>
            {TASK_PRIORITY_LABEL[p]}
          </DropdownMenuCheckboxItem>
        ))}
        {manager && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Assign to</DropdownMenuLabel>
            {users
              .filter((u) => u.role !== "senior_manager")
              .map((u) => (
                <DropdownMenuCheckboxItem key={u.id} checked={task.assigneeId === u.id} onSelect={() => updateTask(task.id, { assigneeId: u.id as UserId })}>
                  {u.name}
                </DropdownMenuCheckboxItem>
              ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TaskTable({
  tasks,
  showBrand = true,
  showAssignee = true,
  emptyTitle = "No tasks",
  emptyDescription = "You're all caught up.",
  className,
}: {
  tasks: Task[];
  showBrand?: boolean;
  showAssignee?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}) {
  const { today, completeTask } = useAppState();
  const [editing, setEditing] = React.useState<Task | null>(null);

  if (!tasks.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} className={className} />;
  }

  return (
    <>
      <Table className={className}>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"><span className="sr-only">Complete</span></TableHead>
            <TableHead>Task</TableHead>
            {showBrand && <TableHead>Brand</TableHead>}
            {showAssignee && <TableHead>Assigned To</TableHead>}
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => {
            const overdue = isOverdue(t, today);
            const done = t.status === "completed";
            return (
              <TableRow key={t.id} className={cn(done && "text-muted-foreground")}>
                <TableCell>
                  <button
                    type="button"
                    aria-label={done ? `${t.title} completed` : `Mark ${t.title} complete`}
                    disabled={done}
                    onClick={() => completeTask(t.id)}
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border transition-colors cursor-pointer disabled:cursor-default",
                      done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border hover:border-emerald-500 hover:text-emerald-600",
                    )}
                  >
                    <Check className="size-3" />
                  </button>
                </TableCell>
                <TableCell className="max-w-[260px]">
                  <span className={cn("block truncate font-medium", done && "line-through")}>{t.title}</span>
                  {t.notes && <span className="block truncate text-xs text-muted-foreground">{t.notes}</span>}
                </TableCell>
                {showBrand && (
                  <TableCell>
                    <Link href={`/brands/${t.brandId}`} className="hover:underline">
                      <BrandChip brand={brandsById[t.brandId]} />
                    </Link>
                  </TableCell>
                )}
                {showAssignee && (
                  <TableCell>
                    <UserChip user={usersById[t.assigneeId]} />
                  </TableCell>
                )}
                <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                <TableCell className={cn(overdue && "font-medium text-red-600")}>{formatDueDate(t.dueDate, today)}</TableCell>
                <TableCell><TaskStatusBadge status={t.status} /></TableCell>
                <TableCell><TaskRowActions task={t} onEdit={() => setEditing(t)} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <TaskModal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} task={editing ?? undefined} />
    </>
  );
}
