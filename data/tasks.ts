import type { BrandId, Platform, Task, TaskPriority, TaskStatus, UserId } from "@/types";
import { DEMO_TODAY } from "@/data/config";
import { addDays } from "@/data/demo/series";

/**
 * Internal task data. Tasks are editable in the UI via React state; this
 * file only provides the initial list.
 *
 * Due dates are expressed as day offsets from DEMO_TODAY so the demo always
 * has "today", "tomorrow" and "overdue" examples.
 */
interface TaskSeed {
  id: string;
  title: string;
  brandId: BrandId;
  assigneeId: UserId;
  priority: TaskPriority;
  due: number;
  status: TaskStatus;
  platform?: Platform;
  notes?: string;
  /** Offset for completedAt (only for completed tasks). */
  completed?: number;
}

const seeds: TaskSeed[] = [
  // Yeoul
  { id: "t-01", title: "Review Meta campaign", brandId: "yeoul", assigneeId: "om", priority: "medium", due: 0, status: "in_progress", platform: "meta", notes: "Prospecting CTR dropped week over week. Check creative fatigue on the broad ad set." },
  { id: "t-02", title: "Check Google search terms", brandId: "yeoul", assigneeId: "sagar", priority: "medium", due: 0, status: "todo", platform: "google", notes: "Add negatives for irrelevant generic skincare queries." },
  { id: "t-03", title: "Prepare weekly report", brandId: "yeoul", assigneeId: "lucky", priority: "medium", due: 3, status: "todo" },
  { id: "t-21", title: "Set up retargeting audience", brandId: "yeoul", assigneeId: "om", priority: "low", due: 3, status: "todo", platform: "meta" },

  // Giggle Pad
  { id: "t-04", title: "Approve new creatives", brandId: "giggle-pad", assigneeId: "om", priority: "high", due: 0, status: "review", platform: "meta", notes: "6 new static creatives ready for approval before launch." },
  { id: "t-05", title: "Review Meta performance", brandId: "giggle-pad", assigneeId: "om", priority: "medium", due: -2, status: "todo", platform: "meta" },
  { id: "t-06", title: "Check campaign scaling", brandId: "giggle-pad", assigneeId: "om", priority: "low", due: 4, status: "todo", platform: "meta" },
  { id: "t-07", title: "Prepare weekly report", brandId: "giggle-pad", assigneeId: "lucky", priority: "high", due: 1, status: "todo" },
  { id: "t-23", title: "Add negative keywords", brandId: "giggle-pad", assigneeId: "sagar", priority: "medium", due: 0, status: "todo", platform: "google" },

  // Nysh - Warmee
  { id: "t-08", title: "Review campaign performance", brandId: "nysh-warmee", assigneeId: "anubhav", priority: "medium", due: 0, status: "in_progress", platform: "meta" },
  { id: "t-09", title: "Check Google keywords", brandId: "nysh-warmee", assigneeId: "sagar", priority: "medium", due: 2, status: "todo", platform: "google" },
  { id: "t-24", title: "Review Performance Max asset groups", brandId: "nysh-warmee", assigneeId: "sagar", priority: "low", due: 4, status: "in_progress", platform: "google" },

  // Nysh - BluHeat
  { id: "t-11", title: "Fix low ROAS campaign", brandId: "nysh-bluheat", assigneeId: "anubhav", priority: "high", due: 0, status: "in_progress", platform: "meta", notes: "Prospecting campaign CPC is 2x the account average. Test new hooks and tighten audience." },
  { id: "t-12", title: "Review Meta creatives", brandId: "nysh-bluheat", assigneeId: "anubhav", priority: "high", due: -1, status: "blocked", platform: "meta", notes: "Blocked: waiting on new video assets from the brand." },
  { id: "t-13", title: "Check Google spend", brandId: "nysh-bluheat", assigneeId: "sagar", priority: "high", due: -1, status: "todo", platform: "google", notes: "Generic search CPC is high. Review bids and match types." },
  { id: "t-14", title: "Approve budget change", brandId: "nysh-bluheat", assigneeId: "lucky", priority: "high", due: -2, status: "todo" },

  // DesiVidesi - India
  { id: "t-15", title: "Review scaling plan", brandId: "desividesi-india", assigneeId: "om", priority: "medium", due: 0, status: "todo", platform: "meta", notes: "ROAS is above target. Plan a 20% budget increase on Advantage+ Shopping." },
  { id: "t-16", title: "Prepare report", brandId: "desividesi-india", assigneeId: "lucky", priority: "medium", due: 2, status: "todo" },
  { id: "t-17", title: "Review Shopping feed", brandId: "desividesi-india", assigneeId: "sagar", priority: "low", due: 5, status: "todo", platform: "google" },

  // DesiVidesi - Dubai
  { id: "t-18", title: "Check Google Ads", brandId: "desividesi-dubai", assigneeId: "sagar", priority: "medium", due: 0, status: "todo", platform: "google" },
  { id: "t-19", title: "Review Meta campaign", brandId: "desividesi-dubai", assigneeId: "anubhav", priority: "medium", due: 1, status: "todo", platform: "meta" },
  { id: "t-20", title: "Review AED billing setup", brandId: "desividesi-dubai", assigneeId: "lucky", priority: "low", due: 6, status: "blocked", notes: "Blocked: waiting on finance for the AED ad account invoice." },
  { id: "t-22", title: "Share creative brief", brandId: "desividesi-dubai", assigneeId: "anubhav", priority: "low", due: 5, status: "todo", platform: "meta" },

  // Manager
  { id: "t-25", title: "Share client update with Nysh", brandId: "nysh-warmee", assigneeId: "lucky", priority: "medium", due: -3, status: "todo" },

  // Completed this week
  { id: "t-c01", title: "Pause underperforming ad sets", brandId: "yeoul", assigneeId: "om", priority: "medium", due: -4, status: "completed", platform: "meta", completed: -4 },
  { id: "t-c02", title: "Update product feed", brandId: "giggle-pad", assigneeId: "sagar", priority: "low", due: -5, status: "completed", platform: "google", completed: -5 },
  { id: "t-c03", title: "Send weekly report", brandId: "nysh-warmee", assigneeId: "lucky", priority: "high", due: -6, status: "completed", completed: -6 },
  { id: "t-c04", title: "Launch retargeting campaign", brandId: "nysh-warmee", assigneeId: "anubhav", priority: "medium", due: -3, status: "completed", platform: "meta", completed: -3 },
  { id: "t-c05", title: "Review search term report", brandId: "desividesi-india", assigneeId: "sagar", priority: "medium", due: -2, status: "completed", platform: "google", completed: -2 },
  { id: "t-c06", title: "Approve festive creatives", brandId: "desividesi-india", assigneeId: "lucky", priority: "high", due: -2, status: "completed", completed: -1 },
  { id: "t-c07", title: "Set up conversion tracking check", brandId: "desividesi-dubai", assigneeId: "sagar", priority: "high", due: -5, status: "completed", platform: "google", completed: -5 },
  { id: "t-c08", title: "Refresh lookalike audiences", brandId: "desividesi-dubai", assigneeId: "anubhav", priority: "low", due: -4, status: "completed", platform: "meta", completed: -4 },
  { id: "t-c09", title: "Review CPM spike", brandId: "nysh-bluheat", assigneeId: "anubhav", priority: "high", due: -3, status: "completed", platform: "meta", completed: -3 },
  { id: "t-c10", title: "Add brand search campaign", brandId: "nysh-bluheat", assigneeId: "sagar", priority: "medium", due: -6, status: "completed", platform: "google", completed: -6 },
  { id: "t-c11", title: "Share monthly target sheet", brandId: "giggle-pad", assigneeId: "lucky", priority: "medium", due: -1, status: "completed", completed: -1 },
  { id: "t-c12", title: "Test new hook variations", brandId: "giggle-pad", assigneeId: "om", priority: "medium", due: -2, status: "completed", platform: "meta", completed: -2 },
];

export const initialTasks: Task[] = seeds.map((s) => ({
  id: s.id,
  title: s.title,
  brandId: s.brandId,
  assigneeId: s.assigneeId,
  priority: s.priority,
  dueDate: addDays(DEMO_TODAY, s.due),
  status: s.status,
  platform: s.platform,
  notes: s.notes,
  createdAt: addDays(DEMO_TODAY, Math.min(s.due, 0) - 5),
  completedAt: s.completed !== undefined ? addDays(DEMO_TODAY, s.completed) : undefined,
}));
