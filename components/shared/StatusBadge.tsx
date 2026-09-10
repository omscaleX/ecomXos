import type { TargetStatus, TaskPriority, TaskStatus, WorkloadStatus, CampaignStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  TARGET_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
} from "@/lib/formatters";
import { WORKLOAD_LABEL } from "@/lib/tasks";
import { cn } from "@/lib/utils";

/** Green = On Track, Yellow = Attention, Red = Below Target. */
export function TargetStatusBadge({ status, className }: { status: TargetStatus; className?: string }) {
  const variant = status === "on_track" ? "success" : status === "attention" ? "warning" : "danger";
  return (
    <Badge variant={variant} className={className}>
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          status === "on_track" && "bg-emerald-500",
          status === "attention" && "bg-amber-500",
          status === "below_target" && "bg-red-500",
        )}
      />
      {TARGET_STATUS_LABEL[status]}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const variant =
    status === "completed"
      ? "success"
      : status === "blocked"
        ? "danger"
        : status === "in_progress"
          ? "info"
          : status === "review"
            ? "warning"
            : "neutral";
  return <Badge variant={variant}>{TASK_STATUS_LABEL[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const variant = priority === "high" ? "danger" : priority === "medium" ? "warning" : "neutral";
  return <Badge variant={variant}>{TASK_PRIORITY_LABEL[priority]}</Badge>;
}

export function WorkloadBadge({ status }: { status: WorkloadStatus }) {
  const variant = status === "healthy" ? "success" : status === "busy" ? "warning" : "danger";
  return <Badge variant={variant}>{WORKLOAD_LABEL[status]}</Badge>;
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const variant = status === "active" ? "success" : status === "learning" ? "info" : "neutral";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant={variant}>{label}</Badge>;
}
