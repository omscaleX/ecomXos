"use client";

import * as React from "react";
import type { BrandId, Task, TaskPriority, TaskStatus, UserId } from "@/types";
import { users } from "@/data/users";
import { useAppState, type NewTaskInput } from "@/components/providers/AppStateProvider";
import { getVisibleBrands, isManager } from "@/lib/permissions";
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing task to edit. Omit to create a new task. */
  task?: Task;
  /** Defaults for new tasks (e.g. from a brand page or team card). */
  defaults?: Partial<Pick<Task, "brandId" | "assigneeId" | "priority" | "dueDate">>;
}

const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];
const STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked", "review", "completed"];

/** Add / edit task modal. Frontend state only. */
export function TaskModal({ open, onOpenChange, task, defaults }: TaskModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Mounted fresh on every open so the form always starts from the current task / defaults. */}
        {open && <TaskForm key={task?.id ?? "new"} task={task} defaults={defaults} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({ task, defaults, onClose }: { task?: Task; defaults?: TaskModalProps["defaults"]; onClose: () => void }) {
  const { currentUser, addTask, updateTask, today } = useAppState();
  const brands = getVisibleBrands(currentUser);
  const manager = isManager(currentUser);
  const assignees = manager ? users.filter((u) => u.role !== "senior_manager") : [currentUser];

  const [form, setForm] = React.useState<NewTaskInput>(() => ({
    title: task?.title ?? "",
    brandId: task?.brandId ?? defaults?.brandId ?? brands[0]?.id ?? "yeoul",
    assigneeId: task?.assigneeId ?? defaults?.assigneeId ?? (manager ? "lucky" : currentUser.id),
    priority: task?.priority ?? defaults?.priority ?? "medium",
    dueDate: task?.dueDate ?? defaults?.dueDate ?? today,
    status: task?.status ?? "todo",
    notes: task?.notes ?? "",
    platform: task?.platform,
  }));
  const [error, setError] = React.useState<string | null>(null);

  const set = <K extends keyof NewTaskInput>(key: K, value: NewTaskInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Task name is required.");
      return;
    }
    if (task) {
      updateTask(task.id, { ...form, title: form.title.trim() });
    } else {
      addTask({ ...form, title: form.title.trim() });
    }
    onClose();
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{task ? "Edit task" : "Add task"}</DialogTitle>
        <DialogDescription>{task ? "Update the task details." : "Create a task for a brand and assign it to someone."}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-1.5">
        <Label htmlFor="task-title">Task name</Label>
        <Input id="task-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Review Meta campaign" autoFocus />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="task-brand">Brand</Label>
          <Select value={form.brandId} onValueChange={(v) => set("brandId", v as BrandId)}>
            <SelectTrigger id="task-brand" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="task-assignee">Assigned to</Label>
          <Select value={form.assigneeId} onValueChange={(v) => set("assigneeId", v as UserId)} disabled={!manager}>
            <SelectTrigger id="task-assignee" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {assignees.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name} · {u.shortRoleLabel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="task-priority">Priority</Label>
          <Select value={form.priority} onValueChange={(v) => set("priority", v as TaskPriority)}>
            <SelectTrigger id="task-priority" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{TASK_PRIORITY_LABEL[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="task-due">Due date</Label>
          <Input id="task-due" type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </div>
        {task && (
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="task-status">Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as TaskStatus)}>
              <SelectTrigger id="task-status" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{TASK_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="task-notes">Notes</Label>
        <Textarea id="task-notes" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Optional context for the assignee" rows={3} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">{task ? "Save changes" : "Add task"}</Button>
      </DialogFooter>
    </form>
  );
}
