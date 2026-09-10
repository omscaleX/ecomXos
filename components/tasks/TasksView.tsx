"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { users } from "@/data/users";
import { useAppState } from "@/components/providers/AppStateProvider";
import { getVisibleBrands, getVisibleTasks, isManager } from "@/lib/permissions";
import { getTaskCounts, isOverdue, sortTasks } from "@/lib/tasks";
import { PageHeader } from "@/components/layout/PageHeader";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskModal } from "@/components/tasks/TaskModal";
import { EMPTY_TASK_FILTERS, TaskFilters, type TaskFilterState } from "@/components/tasks/TaskFilters";
import { AskAIButton } from "@/components/ai/AskAIButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type View = "my" | "all" | "overdue" | "completed";

/** /tasks – My Tasks / All Tasks / Overdue / Completed with filters and interactions. */
export function TasksView() {
  const { currentUser, tasks, today } = useAppState();
  const router = useRouter();
  const params = useSearchParams();
  const manager = isManager(currentUser);
  const requestedView = params.get("view") as View | null;
  const requestedStatus = params.get("status") as TaskFilterState["status"] | null;
  const [view, setViewState] = React.useState<View>(
    requestedView && ["my", "all", "overdue", "completed"].includes(requestedView) ? requestedView : manager ? "all" : "my",
  );
  const [filters, setFilters] = React.useState<TaskFilterState>({ ...EMPTY_TASK_FILTERS, status: requestedStatus ?? "all" });
  const [addOpen, setAddOpen] = React.useState(false);

  const setView = (v: View) => {
    setViewState(v);
    const search = new URLSearchParams(params.toString());
    search.set("view", v);
    router.replace(`/tasks?${search.toString()}`, { scroll: false });
  };

  const visible = getVisibleTasks(currentUser, tasks);
  const brands = getVisibleBrands(currentUser);
  const people = manager ? users.filter((u) => u.role !== "senior_manager") : [currentUser];
  const counts = getTaskCounts(visible, today);

  const base = visible.filter((t) => {
    if (view === "my") return t.assigneeId === currentUser.id && t.status !== "completed";
    if (view === "overdue") return isOverdue(t, today);
    if (view === "completed") return t.status === "completed";
    return t.status !== "completed";
  });
  const filtered = sortTasks(
    base.filter(
      (t) =>
        (filters.brand === "all" || t.brandId === filters.brand) &&
        (filters.person === "all" || t.assigneeId === filters.person) &&
        (filters.status === "all" || t.status === filters.status) &&
        (filters.priority === "all" || t.priority === filters.priority),
    ),
    today,
  );

  const views: Array<{ key: View; label: string; count: number }> = [
    { key: "my", label: "My Tasks", count: visible.filter((t) => t.assigneeId === currentUser.id && t.status !== "completed").length },
    ...(manager ? [{ key: "all" as View, label: "All Tasks", count: counts.open }] : []),
    { key: "overdue", label: "Overdue", count: counts.overdue },
    { key: "completed", label: "Completed", count: visible.filter((t) => t.status === "completed").length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={manager ? "Tasks" : "My Tasks"}
        subtitle={`${counts.open} open · ${counts.overdue} overdue · ${counts.blocked} blocked · ${counts.completedThisWeek} completed this week`}
        actions={
          <>
            <AskAIButton question="Show me overdue tasks." />
            <Button size="sm" onClick={() => setAddOpen(true)}><Plus /> Add Task</Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList aria-label="Task views">
            {views.map((v) => (
              <TabsTrigger key={v.key} value={v.key}>
                {v.label}
                <span className="tabular rounded-full bg-muted px-1.5 text-[10px] text-muted-foreground">{v.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <TaskFilters value={filters} onChange={setFilters} brands={brands} people={people} />
      </div>

      <Card>
        <CardContent className="px-0 sm:px-4">
          <TaskTable
            tasks={filtered}
            showAssignee={manager}
            emptyTitle={view === "overdue" ? "No overdue tasks" : view === "completed" ? "No completed tasks" : "No tasks match your filters"}
            emptyDescription={view === "overdue" ? "You're all caught up." : "Try clearing a filter or add a new task."}
          />
        </CardContent>
      </Card>

      <TaskModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
