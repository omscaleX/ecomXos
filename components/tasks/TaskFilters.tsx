"use client";

import { X } from "lucide-react";
import type { Brand, TaskPriority, TaskStatus, User } from "@/types";
import { TASK_PRIORITY_LABEL, TASK_STATUS_LABEL } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface TaskFilterState {
  brand: "all" | Brand["id"];
  person: "all" | User["id"];
  status: "all" | TaskStatus;
  priority: "all" | TaskPriority;
}

export const EMPTY_TASK_FILTERS: TaskFilterState = { brand: "all", person: "all", status: "all", priority: "all" };

const STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked", "review", "completed"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

/** Filter row: Brand, Person, Status, Priority. */
export function TaskFilters({
  value,
  onChange,
  brands,
  people,
}: {
  value: TaskFilterState;
  onChange: (next: TaskFilterState) => void;
  brands: Brand[];
  people: User[];
}) {
  const set = <K extends keyof TaskFilterState>(key: K, v: TaskFilterState[K]) => onChange({ ...value, [key]: v });
  const dirty = value.brand !== "all" || value.person !== "all" || value.status !== "all" || value.priority !== "all";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value.brand} onValueChange={(v) => set("brand", v as TaskFilterState["brand"])}>
        <SelectTrigger className="w-44" aria-label="Filter by brand"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All brands</SelectItem>
          {brands.map((b) => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {people.length > 1 && (
        <Select value={value.person} onValueChange={(v) => set("person", v as TaskFilterState["person"])}>
          <SelectTrigger className="w-36" aria-label="Filter by person"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            {people.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Select value={value.status} onValueChange={(v) => set("status", v as TaskFilterState["status"])}>
        <SelectTrigger className="w-36" aria-label="Filter by status"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>{TASK_STATUS_LABEL[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={value.priority} onValueChange={(v) => set("priority", v as TaskFilterState["priority"])}>
        <SelectTrigger className="w-36" aria-label="Filter by priority"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>{TASK_PRIORITY_LABEL[p]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {dirty && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_TASK_FILTERS)}>
          <X /> Clear
        </Button>
      )}
    </div>
  );
}
