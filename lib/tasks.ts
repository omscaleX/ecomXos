import type { Task, TaskPriority, UserId, Workload, WorkloadStatus } from "@/types";
import { DEMO_TODAY } from "@/data/config";
import { daysBetween } from "@/lib/formatters";

/** Task helpers shared by dashboards, the team page and the AI engine. */

export function isOpen(task: Task): boolean {
  return task.status !== "completed";
}

export function isOverdue(task: Task, today: string = DEMO_TODAY): boolean {
  return isOpen(task) && daysBetween(today, task.dueDate) < 0;
}

export function isDueToday(task: Task, today: string = DEMO_TODAY): boolean {
  return isOpen(task) && task.dueDate === today;
}

export function isBlocked(task: Task): boolean {
  return task.status === "blocked";
}

export function isCompletedThisWeek(task: Task, today: string = DEMO_TODAY): boolean {
  if (task.status !== "completed" || !task.completedAt) return false;
  const diff = daysBetween(task.completedAt, today);
  return diff >= 0 && diff < 7;
}

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/** Sort: overdue first, then due date, then priority. */
export function sortTasks(tasks: Task[], today: string = DEMO_TODAY): Task[] {
  return [...tasks].sort((a, b) => {
    const ao = isOverdue(a, today) ? 0 : 1;
    const bo = isOverdue(b, today) ? 0 : 1;
    if (ao !== bo) return ao - bo;
    if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
}

export function getTaskCounts(tasks: Task[], today: string = DEMO_TODAY) {
  const open = tasks.filter(isOpen);
  return {
    open: open.length,
    overdue: open.filter((t) => isOverdue(t, today)).length,
    blocked: open.filter(isBlocked).length,
    dueToday: open.filter((t) => isDueToday(t, today)).length,
    inReview: open.filter((t) => t.status === "review").length,
    completedThisWeek: tasks.filter((t) => isCompletedThisWeek(t, today)).length,
  };
}

/** Workload is purely task-volume based. It is not a performance score. */
export function calculateWorkloadStatus(openTasks: number, overdueTasks: number): WorkloadStatus {
  if (overdueTasks >= 2 || openTasks >= 8) return "needs_attention";
  if (openTasks >= 6 || overdueTasks >= 1) return "busy";
  return "healthy";
}

export function getWorkload(
  userId: UserId,
  tasks: Task[],
  brandCount: number,
  today: string = DEMO_TODAY,
): Workload {
  const mine = tasks.filter((t) => t.assigneeId === userId);
  const counts = getTaskCounts(mine, today);
  return {
    userId,
    brandCount,
    openTasks: counts.open,
    overdueTasks: counts.overdue,
    blockedTasks: counts.blocked,
    dueToday: counts.dueToday,
    status: calculateWorkloadStatus(counts.open, counts.overdue),
  };
}

export const WORKLOAD_LABEL: Record<WorkloadStatus, string> = {
  healthy: "Healthy",
  busy: "Busy",
  needs_attention: "Needs Attention",
};
