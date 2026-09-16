/**
 * Content Production module types.
 *
 * This is the internal content-production desk: marketing raises a request,
 * the script / video / design teams produce it, the requester reviews it.
 * It deliberately reuses the existing Brand, Client and User entities and
 * never touches the marketing task board in types/index.ts.
 */

import type { BrandId, ClientId, ContentDepartment, UserId } from "@/types";

/* ------------------------------------------------------------------ *
 * Entities the content module attaches to
 * ------------------------------------------------------------------ */

export type ProductId = string;

export interface Product {
  id: ProductId;
  brandId: BrandId;
  name: string;
  /** Short line used in pickers, e.g. "Vitamin C serum, 30ml". */
  description: string;
}

export type MarketingCampaignId = string;

/**
 * A marketing campaign such as "Serum Sales" or "Festive Sale".
 * This is the agency's own campaign, not a Meta or Google ad campaign.
 */
export interface MarketingCampaign {
  id: MarketingCampaignId;
  brandId: BrandId;
  name: string;
  /** Products the campaign runs on. */
  productIds: ProductId[];
  funnel?: FunnelStage;
  status: "planning" | "live" | "ended";
}

export type FunnelStage = "TOF" | "MOF" | "BOF" | "Retargeting" | "Existing Customer";

export const FUNNEL_STAGES: FunnelStage[] = ["TOF", "MOF", "BOF", "Retargeting", "Existing Customer"];

/* ------------------------------------------------------------------ *
 * Content assets
 * ------------------------------------------------------------------ */

export type ContentAssetKind =
  | "script"
  | "raw_video"
  | "reference"
  | "ad_copy"
  | "creative"
  | "final_video"
  | "final_creative";

export const ASSET_KIND_LABEL: Record<ContentAssetKind, string> = {
  script: "Script",
  raw_video: "Raw footage",
  reference: "Reference",
  ad_copy: "Ad copy",
  creative: "Creative",
  final_video: "Final video",
  final_creative: "Final creative",
};

/**
 * Anything with a link that belongs to a brand. Assets are always filed
 * against a brand, and against a product / campaign / request where those
 * are known, so nothing has to be re-uploaded into a separate library.
 */
export interface ContentAsset {
  id: string;
  kind: ContentAssetKind;
  title: string;
  /** Canva, Frame.io, Drive, Figma, Dropbox … */
  url: string;
  brandId: BrandId;
  productIds: ProductId[];
  campaignId?: MarketingCampaignId;
  /** Set when the asset arrived through, or was produced by, a request. */
  requestId?: string;
  /** Set for final outputs: which submission version produced it. */
  version?: number;
  addedById: UserId;
  /** ISO date. */
  addedAt: string;
  /** Final outputs that have been approved by the requester. */
  isFinal?: boolean;
}

/* ------------------------------------------------------------------ *
 * Content requests
 * ------------------------------------------------------------------ */

export type ContentRequestStatus =
  | "pending_assignment"
  | "in_production"
  | "in_review"
  | "changes_required"
  | "completed";

export const REQUEST_STATUS_LABEL: Record<ContentRequestStatus, string> = {
  pending_assignment: "Pending Assignment",
  in_production: "In Production",
  in_review: "Ready for Review",
  changes_required: "Changes Required",
  completed: "Completed",
};

export type ScriptType =
  | "UGC"
  | "Founder-led"
  | "AI Video"
  | "Product Demo"
  | "Educational"
  | "Testimonial"
  | "Sales"
  | "Reel"
  | "Meta Ad"
  | "Other";

export const SCRIPT_TYPES: ScriptType[] = ["UGC", "Founder-led", "AI Video", "Product Demo", "Educational", "Testimonial", "Sales", "Reel", "Meta Ad", "Other"];

export type VideoPlatform = "Meta" | "Instagram" | "YouTube" | "TikTok" | "Other";
export const VIDEO_PLATFORMS: VideoPlatform[] = ["Meta", "Instagram", "YouTube", "TikTok", "Other"];

export type AspectRatio = "9:16" | "1:1" | "4:5" | "16:9" | "Multiple" | "Custom";
export const VIDEO_FORMATS: AspectRatio[] = ["9:16", "1:1", "4:5", "16:9", "Multiple"];
export const DESIGN_DIMENSIONS: AspectRatio[] = ["1:1", "4:5", "9:16", "16:9", "Custom"];

export type CreativeType =
  | "Static"
  | "Carousel"
  | "Story"
  | "Banner"
  | "Offer"
  | "Product"
  | "Testimonial"
  | "Comparison"
  | "Before/After"
  | "Educational"
  | "Other";

export const CREATIVE_TYPES: CreativeType[] = ["Static", "Carousel", "Story", "Banner", "Offer", "Product", "Testimonial", "Comparison", "Before/After", "Educational", "Other"];

/** Where the request was raised from, recorded automatically. */
export interface RequestSource {
  /** e.g. "Brand page", "Product page", "Campaign page", "Dashboard". */
  label: string;
  /** The route the requester was on. */
  path: string;
}

/** Department-specific fields. Only the matching block is ever filled. */
export interface ScriptRequestDetails {
  department: "script";
  scriptCount: number;
  scriptType: ScriptType;
}

export interface VideoRequestDetails {
  department: "video";
  videoCount: number;
  /** Scripts the editor should work from, as asset ids. */
  scriptAssetIds: string[];
  platform: VideoPlatform;
  format: AspectRatio;
}

export interface DesignRequestDetails {
  department: "design";
  creativeCount: number;
  /** Ad copy to design around, as asset ids. */
  adCopyAssetIds: string[];
  funnel: FunnelStage;
  creativeType: CreativeType;
  dimensions: AspectRatio;
}

export type RequestDetails = ScriptRequestDetails | VideoRequestDetails | DesignRequestDetails;

/** One submitted version of the work. Versions are never overwritten. */
export interface ContentSubmission {
  version: number;
  outputUrl: string;
  note?: string;
  submittedById: UserId;
  /** ISO date. */
  submittedAt: string;
  submittedTime: string;
  /** Set once the requester has acted on this version. */
  outcome?: "approved" | "changes_required";
  outcomeNote?: string;
  /** ISO date. */
  outcomeAt?: string;
}

export interface ContentComment {
  id: string;
  authorId: UserId;
  body: string;
  /** ISO date. */
  createdAt: string;
  createdTime: string;
}

export interface ContentRequest {
  /** Permanent department queue number, e.g. VID-26-09-014. */
  id: string;
  department: ContentDepartment;
  status: ContentRequestStatus;

  // Context, filled automatically from where the request was raised.
  brandId: BrandId;
  clientId: ClientId;
  productIds: ProductId[];
  campaignId?: MarketingCampaignId;
  funnel?: FunnelStage;
  /** Optional link to a marketing task. The task's own status never changes. */
  relatedTaskId?: string;
  source: RequestSource;

  // Requester, filled automatically from the session.
  requesterId: UserId;
  /** ISO date. */
  createdAt: string;
  createdTime: string;

  // Production
  /** The content manager who owns the department queue. */
  departmentManagerId: UserId;
  assigneeId?: UserId;
  /** ISO date. */
  assignedAt?: string;
  assignedTime?: string;
  /** True when a team member picked it up rather than being assigned. */
  pickedUp?: boolean;

  // What is being asked for
  details: RequestDetails;
  brief: string;
  /** ISO date the work is due. */
  eta: string;
  /** Existing assets the requester attached. */
  referenceAssetIds: string[];
  rawAssetIds: string[];

  submissions: ContentSubmission[];
  comments: ContentComment[];
  /** ISO date, set when the requester approves the final version. */
  completedAt?: string;
}

/* ------------------------------------------------------------------ *
 * Notifications
 * ------------------------------------------------------------------ */

export type ContentNotificationKind =
  | "new_request"
  | "assigned"
  | "picked_up"
  | "submitted"
  | "changes_requested"
  | "approved";

export interface ContentNotification {
  id: string;
  kind: ContentNotificationKind;
  requestId: string;
  /** Who should see it. */
  recipientIds: UserId[];
  actorId: UserId;
  message: string;
  /** ISO date. */
  createdAt: string;
  createdTime: string;
  read: boolean;
}

/* ------------------------------------------------------------------ *
 * Analytics
 * ------------------------------------------------------------------ */

export interface DepartmentStats {
  department: ContentDepartment;
  requested: number;
  completed: number;
  inProduction: number;
  awaitingReview: number;
  overdue: number;
  /** Deliverables asked for, e.g. 5 videos. */
  deliverablesRequested: number;
  deliverablesCompleted: number;
  /** Days from assignment to first submission. */
  avgProductionDays: number;
  /** Days from submission to the requester acting. */
  avgReviewDays: number;
  /** Share of completed requests that needed more than one version. */
  revisionRate: number;
}
