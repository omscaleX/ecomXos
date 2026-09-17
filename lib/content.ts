import type { ContentDepartment, User, UserId } from "@/types";
import type {
  ContentAsset,
  ContentRequest,
  ContentRequestStatus,
  RequestDetails,
} from "@/types/content";
import { DEPARTMENT_LABEL, DEPARTMENT_SHORT } from "@/data/contentRequests";
import { DEMO_TODAY } from "@/data/config";
import { daysBetween, pluralize } from "@/lib/formatters";
import { isContentManager, isContentTeam, isManager } from "@/lib/permissions";

/**
 * Content production rules in one place.
 *
 * The workflow is always the same, whatever the department:
 *
 *   Raised → Waiting for assignment → In production → Sent for review
 *          → (Changes asked for → In production → …) → Approved → Done
 *
 * Versions are never deleted or overwritten. Every submission is kept.
 */

export const DEPARTMENTS: ContentDepartment[] = ["script", "video", "design"];

export { DEPARTMENT_LABEL, DEPARTMENT_SHORT };

/** Plain-English one-liner for what each department does. */
export const DEPARTMENT_BLURB: Record<ContentDepartment, string> = {
  script: "Writes the words for videos and ads.",
  video: "Edits raw footage into finished videos.",
  design: "Makes images, banners and carousels.",
};

/** What the requester is asking for, counted. */
export function deliverableCount(details: RequestDetails): number {
  switch (details.department) {
    case "script":
      return details.scriptCount;
    case "video":
      return details.videoCount;
    case "design":
      return details.creativeCount;
  }
}

/** "5 videos", "3 scripts", "8 creatives". */
export function deliverableLabel(details: RequestDetails): string {
  switch (details.department) {
    case "script":
      return pluralize(details.scriptCount, "script");
    case "video":
      return pluralize(details.videoCount, "video");
    case "design":
      return pluralize(details.creativeCount, "creative");
  }
}

/** Short line describing the ask, e.g. "5 videos · Meta · 9:16". */
export function requestSummaryLine(request: ContentRequest): string {
  const d = request.details;
  const parts = [deliverableLabel(d)];
  if (d.department === "script") parts.push(d.scriptType);
  if (d.department === "video") parts.push(d.platform, d.format);
  if (d.department === "design") parts.push(d.creativeType, d.dimensions, d.funnel);
  return parts.join(" · ");
}

/* ------------------------------------------------------------------ *
 * Status
 * ------------------------------------------------------------------ */

/** Plain-English status wording used across the whole module. */
export const STATUS_LABEL: Record<ContentRequestStatus, string> = {
  pending_assignment: "Waiting for a person",
  in_production: "Being worked on",
  in_review: "Waiting for your review",
  changes_required: "Changes asked for",
  completed: "Done",
};

/** Same status, worded for someone who is not the requester. */
export const STATUS_LABEL_NEUTRAL: Record<ContentRequestStatus, string> = {
  pending_assignment: "Waiting for a person",
  in_production: "Being worked on",
  in_review: "Sent for review",
  changes_required: "Changes asked for",
  completed: "Done",
};

export const STATUS_TONE: Record<ContentRequestStatus, "neutral" | "warning" | "info" | "success" | "danger"> = {
  pending_assignment: "warning",
  in_production: "info",
  in_review: "info",
  changes_required: "danger",
  completed: "success",
};

export const OPEN_STATUSES: ContentRequestStatus[] = [
  "pending_assignment",
  "in_production",
  "in_review",
  "changes_required",
];

export function isOpen(request: ContentRequest): boolean {
  return request.status !== "completed";
}

/** Past its due date and still not done. */
export function isOverdue(request: ContentRequest, today: string = DEMO_TODAY): boolean {
  return isOpen(request) && daysBetween(today, request.eta) < 0;
}

/** Due today or tomorrow and still not done. */
export function isDueSoon(request: ContentRequest, today: string = DEMO_TODAY): boolean {
  const diff = daysBetween(today, request.eta);
  return isOpen(request) && diff >= 0 && diff <= 1;
}

export function daysLate(request: ContentRequest, today: string = DEMO_TODAY): number {
  return Math.max(0, -daysBetween(today, request.eta));
}

/** The version currently on the table, if any. */
export function latestSubmission(request: ContentRequest) {
  return request.submissions.length ? request.submissions[request.submissions.length - 1] : undefined;
}

export function versionCount(request: ContentRequest): number {
  return request.submissions.length;
}

/** One line explaining what happens next, in plain English. */
export function nextStepLine(request: ContentRequest, viewer?: User): string {
  const mine = viewer && request.assigneeId === viewer.id;
  const isRequester = viewer && request.requesterId === viewer.id;
  switch (request.status) {
    case "pending_assignment":
      return viewer && ownsQueue(viewer, request.department)
        ? "Give this to someone in your team."
        : `The ${DEPARTMENT_LABEL[request.department]} manager will give this to someone.`;
    case "in_production":
      return mine ? "You are working on this. Upload it when ready." : "The team is working on it.";
    case "in_review":
      return isRequester ? "Look at it and either approve or ask for changes." : "Waiting for the requester to look at it.";
    case "changes_required":
      return mine ? "Changes were asked for. Fix and upload a new version." : "The team is making the changes.";
    case "completed":
      return "Approved and finished.";
  }
}

/* ------------------------------------------------------------------ *
 * Who can do what
 *
 * Demo only. A real backend must check all of this on the server.
 * ------------------------------------------------------------------ */

/** Anyone on the marketing side can raise a request. */
export function canRaiseRequest(user: User): boolean {
  return !isContentTeam(user);
}

/**
 * Each production house has its own manager, and a manager only hands out
 * work inside their own house.
 */
export function canAssign(user: User, request: ContentRequest): boolean {
  return isContentManager(user) && user.department === request.department;
}

/** True when this person runs the house a request belongs to. */
export function ownsQueue(user: User, department: ContentDepartment): boolean {
  return isContentManager(user) && user.department === department;
}

/**
 * A producer can pick up an unassigned job in their own house. Managers
 * hand work out rather than taking it themselves.
 */
export function canPickUp(user: User, request: ContentRequest): boolean {
  return (
    request.status === "pending_assignment" &&
    isContentTeam(user) &&
    !isContentManager(user) &&
    user.department === request.department &&
    !request.assigneeId
  );
}

/** Only the person doing the work uploads versions. */
export function canSubmit(user: User, request: ContentRequest): boolean {
  return (
    request.assigneeId === user.id &&
    (request.status === "in_production" || request.status === "changes_required")
  );
}

/** The requester decides. Managers can decide too, so nothing gets stuck. */
export function canReview(user: User, request: ContentRequest): boolean {
  if (request.status !== "in_review") return false;
  return request.requesterId === user.id || isManager(user);
}

/** Everyone involved can talk on the request. */
export function canComment(user: User, request: ContentRequest): boolean {
  return (
    request.requesterId === user.id ||
    request.assigneeId === user.id ||
    ownsQueue(user, request.department) ||
    isManager(user)
  );
}

/* ------------------------------------------------------------------ *
 * Selectors
 * ------------------------------------------------------------------ */

/** Everything the user is allowed to see, newest first. */
export function getVisibleRequests(user: User, requests: ContentRequest[]): ContentRequest[] {
  if (isManager(user)) return requests;
  // A content manager runs one house and sees only that queue.
  if (isContentManager(user)) return requests.filter((r) => r.department === user.department);
  if (isContentTeam(user)) {
    // Producers see their own jobs plus their department's open queue.
    return requests.filter(
      (r) => r.assigneeId === user.id || (r.department === user.department && !r.assigneeId),
    );
  }
  return requests.filter((r) => r.requesterId === user.id);
}

/** Requests waiting for this person to do something. */
export function getMyActions(user: User, requests: ContentRequest[]): ContentRequest[] {
  return requests.filter((r) => {
    if (canReview(user, r)) return true;
    if (canSubmit(user, r)) return true;
    if (canPickUp(user, r)) return true;
    if (canAssign(user, r) && r.status === "pending_assignment") return true;
    return false;
  });
}

export function byDepartment(requests: ContentRequest[], department: ContentDepartment): ContentRequest[] {
  return requests.filter((r) => r.department === department);
}

/** Newest first, with anything late pulled to the top. */
export function sortForQueue(requests: ContentRequest[], today: string = DEMO_TODAY): ContentRequest[] {
  return [...requests].sort((a, b) => {
    const lateA = isOverdue(a, today) ? 1 : 0;
    const lateB = isOverdue(b, today) ? 1 : 0;
    if (lateA !== lateB) return lateB - lateA;
    if (a.eta !== b.eta) return a.eta < b.eta ? -1 : 1;
    return a.id < b.id ? 1 : -1;
  });
}

/* ------------------------------------------------------------------ *
 * Assets
 * ------------------------------------------------------------------ */

/**
 * Assets worth offering when someone raises a request. Anything for the
 * same brand, with the ones on the same product or campaign first.
 */
export function suggestAssets(
  assets: ContentAsset[],
  options: { brandId: string; productIds?: string[]; campaignId?: string; kinds?: ContentAsset["kind"][] },
): ContentAsset[] {
  const { brandId, productIds = [], campaignId, kinds } = options;
  const pool = assets.filter((a) => a.brandId === brandId && (!kinds || kinds.includes(a.kind)));
  const score = (a: ContentAsset) => {
    let s = 0;
    if (campaignId && a.campaignId === campaignId) s += 2;
    if (productIds.length && a.productIds.some((p) => productIds.includes(p))) s += 1;
    return s;
  };
  return pool.sort((a, b) => score(b) - score(a) || (a.addedAt < b.addedAt ? 1 : -1));
}

export function getBrandAssets(assets: ContentAsset[], brandId: string): ContentAsset[] {
  return assets.filter((a) => a.brandId === brandId).sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
}

/** Everything produced by a request, in version order. */
export function getRequestAssets(assets: ContentAsset[], requestId: string): ContentAsset[] {
  return assets.filter((a) => a.requestId === requestId).sort((a, b) => (a.version ?? 0) - (b.version ?? 0));
}

/* ------------------------------------------------------------------ *
 * Notification wording
 * ------------------------------------------------------------------ */

export function notificationRecipients(request: ContentRequest, kind: string): UserId[] {
  const ids = new Set<UserId>();
  switch (kind) {
    case "new_request":
      ids.add(request.departmentManagerId);
      break;
    case "assigned":
    case "picked_up":
      if (request.assigneeId) ids.add(request.assigneeId);
      ids.add(request.requesterId);
      ids.add(request.departmentManagerId);
      break;
    case "submitted":
      ids.add(request.requesterId);
      ids.add(request.departmentManagerId);
      break;
    case "changes_requested":
    case "approved":
      if (request.assigneeId) ids.add(request.assigneeId);
      ids.add(request.departmentManagerId);
      break;
  }
  return [...ids];
}
