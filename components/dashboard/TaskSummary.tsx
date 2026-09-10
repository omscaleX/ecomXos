"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Task } from "@/types";
import { useAppState } from "@/components/providers/AppStateProvider";
import { getTaskCounts, isDueToday, isOverdue, sortTasks } from "@/lib/tasks";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Stat({ label, value, tone }: { label: string; value: number; tone?: "danger" | "warning" | "success" }) {
  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("tabular text-lg font-semibold", tone === "danger" && value > 0 && "text-red-600", tone === "warning" && value > 0 && "text-amber-700", tone === "success" && "text-emerald-700")}>{value}</p>
    </div>
  );
}

/** Task stats + a short table of today's / overdue tasks. */
export function TaskSummary({
  tasks,
  title = "Tasks",
  description,
  showAssignee = true,
  limit = 6,
}: {
  tasks: Task[];
  title?: string;
  description?: string;
  showAssignee?: boolean;
  limit?: number;
}) {
  const { today } = useAppState();
  const [addOpen, setAddOpen] = React.useState(false);
  const counts = getTaskCounts(tasks, today);
  const focus = sortTasks(
    tasks.filter((t) => t.status !== "completed" && (isOverdue(t, today) || isDueToday(t, today))),
    today,
  ).slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description ?? "Overdue and due-today tasks first."}</CardDescription>
        <CardAction className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}><Plus /> Add Task</Button>
          <Button variant="ghost" size="sm" asChild><Link href="/tasks">View all</Link></Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Tasks Today" value={counts.dueToday} />
          <Stat label="Overdue" value={counts.overdue} tone="danger" />
          <Stat label="Blocked" value={counts.blocked} tone="warning" />
          <Stat label="Completed This Week" value={counts.completedThisWeek} tone="success" />
        </div>
        <TaskTable tasks={focus} showAssignee={showAssignee} emptyTitle="No overdue tasks" emptyDescription="You're all caught up." />
      </CardContent>
      <TaskModal open={addOpen} onOpenChange={setAddOpen} />
    </Card>
  );
}
