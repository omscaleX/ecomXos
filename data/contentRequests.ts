import type { BrandId, ContentDepartment, UserId } from "@/types";
import type {
  ContentComment,
  ContentRequest,
  ContentRequestStatus,
  ContentSubmission,
  RequestDetails,
} from "@/types/content";
import { DEMO_TODAY } from "@/data/config";
import { addDays } from "@/data/demo/series";
import { brandsById } from "@/data/brands";
import { CONTENT_MANAGER_ID } from "@/data/users";

/**
 * Demo content requests.
 *
 * These are production requests only. They never appear on the marketing
 * task board, and raising one does not change any marketing task.
 */

export const DEPARTMENT_PREFIX: Record<ContentDepartment, string> = {
  script: "SCR",
  video: "VID",
  design: "DES",
};

export const DEPARTMENT_LABEL: Record<ContentDepartment, string> = {
  script: "Script Writing",
  video: "Video Editing",
  design: "Graphic Design",
};

export const DEPARTMENT_SHORT: Record<ContentDepartment, string> = {
  script: "Script",
  video: "Video",
  design: "Design",
};

/** Queue number, e.g. VID-26-09-014. Permanent once created. */
export function makeQueueId(department: ContentDepartment, createdAt: string, sequence: number): string {
  const [year, month] = createdAt.split("-");
  return `${DEPARTMENT_PREFIX[department]}-${year.slice(2)}-${month}-${String(sequence).padStart(3, "0")}`;
}

interface SubmissionSeed {
  /** Days before today. */
  age: number;
  by: UserId;
  note?: string;
  outcome?: "approved" | "changes_required";
  outcomeNote?: string;
  /** Days before today the requester acted. */
  outcomeAge?: number;
}

interface RequestSeed {
  seq: number;
  department: ContentDepartment;
  brandId: BrandId;
  productIds: string[];
  campaignId?: string;
  requesterId: UserId;
  /** Days before today the request was raised. */
  age: number;
  /** Days after creation the work is due. */
  etaOffset: number;
  status: ContentRequestStatus;
  assigneeId?: UserId;
  /** Days before today it was assigned or picked up. */
  assignedAge?: number;
  pickedUp?: boolean;
  details: RequestDetails;
  brief: string;
  referenceAssetIds?: string[];
  rawAssetIds?: string[];
  submissions?: SubmissionSeed[];
  comments?: Array<{ by: UserId; body: string; age: number }>;
  sourceLabel: string;
  sourcePath: string;
  relatedTaskId?: string;
}

const seeds: RequestSeed[] = [
  /* ---------------- Completed work, builds the library ---------------- */
  {
    seq: 1, department: "script", brandId: "yeoul", productIds: ["yeoul-yuja-serum"], campaignId: "yeoul-serum-sales",
    requesterId: "om", age: 40, etaOffset: 4, status: "completed", assigneeId: "kavya", assignedAge: 39,
    details: { department: "script", scriptCount: 5, scriptType: "Sales" },
    brief: "Need 5 sales scripts about the serum ingredients and the before and after angle.",
    referenceAssetIds: ["a-yeo-f1"],
    submissions: [{ age: 36, by: "kavya", note: "First 5 drafts.", outcome: "approved", outcomeNote: "These are good. Going ahead.", outcomeAge: 35 }],
    comments: [{ by: "om", body: "Please keep each script under 30 seconds.", age: 39 }, { by: "kavya", body: "Done. All five are 25 to 28 seconds.", age: 36 }],
    sourceLabel: "Product page", sourcePath: "/brands/yeoul",
  },
  {
    seq: 1, department: "video", brandId: "yeoul", productIds: ["yeoul-yuja-serum"], campaignId: "yeoul-serum-sales",
    requesterId: "om", age: 32, etaOffset: 5, status: "completed", assigneeId: "rahul", assignedAge: 31,
    details: { department: "video", videoCount: 3, scriptAssetIds: ["a-yeo-s1"], platform: "Meta", format: "9:16" },
    brief: "Cut 3 Meta videos from the ingredient script using the studio b-roll.",
    rawAssetIds: ["a-yeo-r1"], referenceAssetIds: ["a-yeo-f1"],
    submissions: [
      { age: 28, by: "rahul", note: "Version 1, three cuts.", outcome: "changes_required", outcomeNote: "Opening hook is slow. Please start on the texture shot.", outcomeAge: 27 },
      { age: 26, by: "rahul", note: "Version 2 with the new opening.", outcome: "approved", outcomeNote: "Much better. Approved.", outcomeAge: 26 },
    ],
    comments: [{ by: "om", body: "Please change the opening hook.", age: 27 }, { by: "rahul", body: "Done. Updated version uploaded.", age: 26 }, { by: "om", body: "Approved.", age: 26 }],
    sourceLabel: "Campaign page", sourcePath: "/brands/yeoul",
  },
  {
    seq: 1, department: "design", brandId: "yeoul", productIds: ["yeoul-yuja-serum"], campaignId: "yeoul-serum-sales",
    requesterId: "om", age: 24, etaOffset: 3, status: "completed", assigneeId: "arjun", assignedAge: 23, pickedUp: true,
    details: { department: "design", creativeCount: 6, adCopyAssetIds: ["a-yeo-c1"], funnel: "BOF", creativeType: "Before/After", dimensions: "4:5" },
    brief: "6 before and after statics for the serum, using the copy bank.",
    referenceAssetIds: ["a-yeo-f2"],
    submissions: [{ age: 21, by: "arjun", note: "All 6 statics.", outcome: "approved", outcomeNote: "Great, thanks.", outcomeAge: 20 }],
    sourceLabel: "Brand page", sourcePath: "/brands/yeoul",
  },
  {
    seq: 2, department: "design", brandId: "giggle-pad", productIds: ["gigglepad-play-mat"], campaignId: "gigglepad-playmat-launch",
    requesterId: "om", age: 33, etaOffset: 4, status: "completed", assigneeId: "arjun", assignedAge: 32,
    details: { department: "design", creativeCount: 8, adCopyAssetIds: [], funnel: "TOF", creativeType: "Static", dimensions: "1:1" },
    brief: "8 launch statics for the play mat. Bright, parent friendly.",
    submissions: [{ age: 30, by: "arjun", outcome: "approved", outcomeAge: 29 }],
    sourceLabel: "Campaign page", sourcePath: "/brands/giggle-pad",
  },
  {
    seq: 2, department: "video", brandId: "nysh-warmee", productIds: ["warmee-thermal-set"], campaignId: "warmee-winter-push",
    requesterId: "anubhav", age: 27, etaOffset: 5, status: "completed", assigneeId: "zoya", assignedAge: 26,
    details: { department: "video", videoCount: 2, scriptAssetIds: ["a-war-s1"], platform: "Instagram", format: "9:16" },
    brief: "2 layering guide videos from the cold room footage.",
    rawAssetIds: ["a-war-r1"],
    submissions: [{ age: 24, by: "zoya", outcome: "approved", outcomeAge: 23 }],
    sourceLabel: "Brand page", sourcePath: "/brands/nysh-warmee",
  },
  {
    seq: 3, department: "video", brandId: "desividesi-india", productIds: ["dvi-kurta-set"], campaignId: "dvi-festive-sale",
    requesterId: "om", age: 28, etaOffset: 6, status: "completed", assigneeId: "zoya", assignedAge: 27,
    details: { department: "video", videoCount: 4, scriptAssetIds: ["a-dvi-s1"], platform: "Meta", format: "Multiple" },
    brief: "4 festive reels from the shoot footage. Two in 9:16 and two in 4:5.",
    rawAssetIds: ["a-dvi-r1"], referenceAssetIds: ["a-dvi-f1"],
    submissions: [
      { age: 25, by: "zoya", outcome: "changes_required", outcomeNote: "Please add the price card at the end.", outcomeAge: 25 },
      { age: 24, by: "zoya", note: "Price card added to all four.", outcome: "approved", outcomeAge: 24 },
    ],
    sourceLabel: "Campaign page", sourcePath: "/brands/desividesi-india",
  },
  {
    seq: 3, department: "design", brandId: "desividesi-india", productIds: ["dvi-kurta-set"], campaignId: "dvi-festive-sale",
    requesterId: "om", age: 19, etaOffset: 3, status: "completed", assigneeId: "arjun", assignedAge: 18,
    details: { department: "design", creativeCount: 5, adCopyAssetIds: ["a-dvi-c1"], funnel: "MOF", creativeType: "Carousel", dimensions: "4:5" },
    brief: "5 festive carousels from the copy bank.",
    submissions: [{ age: 16, by: "arjun", outcome: "approved", outcomeAge: 15 }],
    sourceLabel: "Brand page", sourcePath: "/brands/desividesi-india",
  },
  {
    seq: 2, department: "script", brandId: "nysh-warmee", productIds: ["warmee-thermal-set"], campaignId: "warmee-winter-push",
    requesterId: "anubhav", age: 23, etaOffset: 3, status: "completed", assigneeId: "kavya", assignedAge: 22,
    details: { department: "script", scriptCount: 3, scriptType: "Educational" },
    brief: "3 educational scripts on how thermal layering works.",
    submissions: [{ age: 20, by: "kavya", outcome: "approved", outcomeAge: 20 }],
    sourceLabel: "Brand page", sourcePath: "/brands/nysh-warmee",
  },

  /* ---------------- Waiting for the requester to review ---------------- */
  {
    seq: 14, department: "video", brandId: "nysh-bluheat", productIds: ["bluheat-jacket"], campaignId: "bluheat-rescue",
    requesterId: "anubhav", age: 5, etaOffset: 4, status: "in_review", assigneeId: "rahul", assignedAge: 4,
    details: { department: "video", videoCount: 5, scriptAssetIds: ["a-blu-s2"], platform: "Meta", format: "9:16" },
    brief: "5 sales focused Meta videos to turn BluHeat around. Lead with the heat demo.",
    rawAssetIds: ["a-blu-r1", "a-blu-r2"], referenceAssetIds: ["a-blu-f1"],
    relatedTaskId: "t-11",
    submissions: [{ age: 1, by: "rahul", note: "All 5 cuts, heat demo in the first 2 seconds." }],
    comments: [{ by: "anubhav", body: "Please lead with the heat demo, not the logo.", age: 4 }, { by: "rahul", body: "Yes, heat demo is in the first 2 seconds on all five.", age: 1 }],
    sourceLabel: "Brand page", sourcePath: "/brands/nysh-bluheat",
  },
  {
    seq: 4, department: "design", brandId: "giggle-pad", productIds: ["gigglepad-gift-box"], campaignId: "gigglepad-festive",
    requesterId: "om", age: 4, etaOffset: 3, status: "in_review", assigneeId: "arjun", assignedAge: 3,
    details: { department: "design", creativeCount: 6, adCopyAssetIds: ["a-gig-c1"], funnel: "MOF", creativeType: "Offer", dimensions: "1:1" },
    brief: "6 festive offer creatives for the gift box. Show the bundle price clearly.",
    referenceAssetIds: ["a-gig-f1"],
    submissions: [{ age: 1, by: "arjun", note: "6 offer creatives, price badge top right." }],
    sourceLabel: "Campaign page", sourcePath: "/brands/giggle-pad",
  },
  {
    seq: 4, department: "script", brandId: "desividesi-india", productIds: ["dvi-menswear"], campaignId: "dvi-festive-sale",
    requesterId: "lucky", age: 3, etaOffset: 3, status: "in_review", assigneeId: "kavya", assignedAge: 3, pickedUp: true,
    details: { department: "script", scriptCount: 4, scriptType: "Reel" },
    brief: "4 reel scripts for the Nehru jacket, styling led.",
    submissions: [{ age: 0, by: "kavya", note: "4 styling reels, 20 seconds each." }],
    sourceLabel: "Dashboard", sourcePath: "/dashboard",
  },

  /* ---------------- Changes requested, back with the team ---------------- */
  {
    seq: 15, department: "video", brandId: "desividesi-india", productIds: ["dvi-lehenga"], campaignId: "dvi-wedding-edit",
    requesterId: "om", age: 8, etaOffset: 5, status: "changes_required", assigneeId: "zoya", assignedAge: 7,
    details: { department: "video", videoCount: 3, scriptAssetIds: ["a-dvi-s2"], platform: "Instagram", format: "9:16" },
    brief: "3 wedding edit videos from the lehenga detail shots.",
    rawAssetIds: ["a-dvi-r2"],
    submissions: [{ age: 3, by: "zoya", note: "First cut of all three.", outcome: "changes_required", outcomeNote: "Music is too loud over the voiceover. Please rebalance.", outcomeAge: 2 }],
    comments: [{ by: "om", body: "Music is drowning out the voiceover. Please bring it down.", age: 2 }],
    sourceLabel: "Campaign page", sourcePath: "/brands/desividesi-india",
  },
  {
    seq: 5, department: "design", brandId: "nysh-bluheat", productIds: ["bluheat-gloves"], campaignId: "bluheat-rescue",
    requesterId: "anubhav", age: 7, etaOffset: 4, status: "changes_required", assigneeId: "arjun", assignedAge: 6,
    details: { department: "design", creativeCount: 4, adCopyAssetIds: ["a-blu-c1"], funnel: "Retargeting", creativeType: "Comparison", dimensions: "4:5" },
    brief: "4 comparison creatives, heated gloves against normal gloves.",
    submissions: [{ age: 2, by: "arjun", outcome: "changes_required", outcomeNote: "Comparison is not clear enough. Please label both sides.", outcomeAge: 1 }],
    sourceLabel: "Brand page", sourcePath: "/brands/nysh-bluheat",
  },

  /* ---------------- In production ---------------- */
  {
    seq: 16, department: "video", brandId: "yeoul", productIds: ["yeoul-cleanser", "yeoul-sunscreen"], campaignId: "yeoul-routine-awareness",
    requesterId: "om", age: 3, etaOffset: 5, status: "in_production", assigneeId: "rahul", assignedAge: 2,
    details: { department: "video", videoCount: 4, scriptAssetIds: ["a-yeo-s3"], platform: "Instagram", format: "9:16" },
    brief: "4 morning routine videos from the creator footage.",
    rawAssetIds: ["a-yeo-r2", "a-yeo-r3"],
    sourceLabel: "Product page", sourcePath: "/brands/yeoul",
  },
  {
    seq: 5, department: "script", brandId: "giggle-pad", productIds: ["gigglepad-blocks"], campaignId: "gigglepad-festive",
    requesterId: "om", age: 2, etaOffset: 4, status: "in_production", assigneeId: "kavya", assignedAge: 2,
    details: { department: "script", scriptCount: 6, scriptType: "UGC" },
    brief: "6 UGC scripts for the building blocks, parent voice.",
    sourceLabel: "Brand page", sourcePath: "/brands/giggle-pad",
  },
  {
    seq: 6, department: "design", brandId: "nysh-warmee", productIds: ["warmee-hoodie"], campaignId: "warmee-winter-push",
    requesterId: "anubhav", age: 2, etaOffset: 4, status: "in_production", assigneeId: "arjun", assignedAge: 1, pickedUp: true,
    details: { department: "design", creativeCount: 5, adCopyAssetIds: [], funnel: "TOF", creativeType: "Product", dimensions: "4:5" },
    brief: "5 product creatives for the sherpa hoodie.",
    sourceLabel: "Product page", sourcePath: "/brands/nysh-warmee",
  },
  {
    seq: 17, department: "video", brandId: "desividesi-dubai", productIds: ["dvd-abaya-fusion"], campaignId: "dvd-uae-festive",
    requesterId: "anubhav", age: 4, etaOffset: 6, status: "in_production", assigneeId: "zoya", assignedAge: 3,
    details: { department: "video", videoCount: 3, scriptAssetIds: ["a-dvd-s1"], platform: "Meta", format: "4:5" },
    brief: "3 UAE festive videos from the rooftop shoot.",
    rawAssetIds: ["a-dvd-r1"], referenceAssetIds: ["a-dvd-f1"],
    sourceLabel: "Campaign page", sourcePath: "/brands/desividesi-dubai",
  },

  /* ---------------- Overdue, still in production ---------------- */
  {
    seq: 18, department: "video", brandId: "giggle-pad", productIds: ["gigglepad-play-mat"], campaignId: "gigglepad-playmat-launch",
    requesterId: "lucky", age: 11, etaOffset: 5, status: "in_production", assigneeId: "rahul", assignedAge: 10,
    details: { department: "video", videoCount: 2, scriptAssetIds: ["a-gig-s1"], platform: "YouTube", format: "16:9" },
    brief: "2 long form unboxing videos for YouTube.",
    rawAssetIds: ["a-gig-r1"],
    comments: [{ by: "lucky", body: "Any update on these? The launch is waiting.", age: 2 }],
    sourceLabel: "Dashboard", sourcePath: "/dashboard",
  },
  {
    seq: 7, department: "design", brandId: "yeoul", productIds: ["yeoul-sunscreen"], campaignId: "yeoul-routine-awareness",
    requesterId: "om", age: 9, etaOffset: 4, status: "in_production", assigneeId: "arjun", assignedAge: 8,
    details: { department: "design", creativeCount: 4, adCopyAssetIds: [], funnel: "TOF", creativeType: "Educational", dimensions: "1:1" },
    brief: "4 educational creatives on why SPF matters daily.",
    sourceLabel: "Product page", sourcePath: "/brands/yeoul",
  },

  /* ---------------- Waiting to be picked up ---------------- */
  {
    seq: 19, department: "video", brandId: "nysh-bluheat", productIds: ["bluheat-jacket"], campaignId: "bluheat-rescue",
    requesterId: "anubhav", age: 1, etaOffset: 4, status: "pending_assignment",
    details: { department: "video", videoCount: 3, scriptAssetIds: ["a-blu-s2"], platform: "Meta", format: "9:16" },
    brief: "3 more hook tests for BluHeat. Different opening each time.",
    rawAssetIds: ["a-blu-r1"], referenceAssetIds: ["a-blu-f1"],
    relatedTaskId: "t-12",
    sourceLabel: "Brand page", sourcePath: "/brands/nysh-bluheat",
  },
  {
    seq: 6, department: "script", brandId: "desividesi-dubai", productIds: ["dvd-kaftan"], campaignId: "dvd-uae-festive",
    requesterId: "anubhav", age: 1, etaOffset: 3, status: "pending_assignment",
    details: { department: "script", scriptCount: 4, scriptType: "Testimonial" },
    brief: "4 testimonial scripts for the kaftan, UAE customers.",
    sourceLabel: "Brand page", sourcePath: "/brands/desividesi-dubai",
  },
  {
    seq: 8, department: "design", brandId: "desividesi-india", productIds: ["dvi-lehenga"], campaignId: "dvi-wedding-edit",
    requesterId: "lucky", age: 0, etaOffset: 5, status: "pending_assignment",
    details: { department: "design", creativeCount: 10, adCopyAssetIds: ["a-dvi-c1"], funnel: "BOF", creativeType: "Carousel", dimensions: "4:5" },
    brief: "10 wedding edit carousels. Premium look, lots of detail shots.",
    referenceAssetIds: ["a-dvi-f1"],
    sourceLabel: "Campaign page", sourcePath: "/brands/desividesi-india",
  },
  {
    seq: 7, department: "script", brandId: "yeoul", productIds: ["yeoul-yuja-serum"], campaignId: "yeoul-serum-sales",
    requesterId: "om", age: 0, etaOffset: 2, status: "pending_assignment",
    details: { department: "script", scriptCount: 3, scriptType: "Founder-led" },
    brief: "3 founder led scripts about why the serum was made.",
    referenceAssetIds: ["a-yeo-f1"],
    sourceLabel: "Product page", sourcePath: "/brands/yeoul",
  },
  {
    seq: 20, department: "video", brandId: "nysh-warmee", productIds: ["warmee-thermal-set"], campaignId: "warmee-winter-push",
    requesterId: "lucky", age: 6, etaOffset: 3, status: "pending_assignment",
    details: { department: "video", videoCount: 2, scriptAssetIds: ["a-war-s2"], platform: "Meta", format: "9:16" },
    brief: "2 cold room test videos. Short and punchy.",
    rawAssetIds: ["a-war-r1"],
    sourceLabel: "Brand page", sourcePath: "/brands/nysh-warmee",
  },
];

const TIMES = ["09:15 AM", "10:42 AM", "11:30 AM", "12:05 PM", "02:20 PM", "03:48 PM", "04:35 PM", "05:50 PM"];
const timeFor = (n: number) => TIMES[n % TIMES.length];

function buildRequest(seed: RequestSeed, index: number): ContentRequest {
  const createdAt = addDays(DEMO_TODAY, -seed.age);
  const id = makeQueueId(seed.department, createdAt, seed.seq);

  const submissions: ContentSubmission[] = (seed.submissions ?? []).map((s, i) => ({
    version: i + 1,
    outputUrl: `https://f.io/${id.toLowerCase()}-v${i + 1}`,
    note: s.note,
    submittedById: s.by,
    submittedAt: addDays(DEMO_TODAY, -s.age),
    submittedTime: timeFor(index + i),
    outcome: s.outcome,
    outcomeNote: s.outcomeNote,
    outcomeAt: s.outcomeAge !== undefined ? addDays(DEMO_TODAY, -s.outcomeAge) : undefined,
  }));

  const comments: ContentComment[] = (seed.comments ?? []).map((c, i) => ({
    id: `${id}-c${i + 1}`,
    authorId: c.by,
    body: c.body,
    createdAt: addDays(DEMO_TODAY, -c.age),
    createdTime: timeFor(index + i + 3),
  }));

  const lastApproved = [...submissions].reverse().find((s) => s.outcome === "approved");

  return {
    id,
    department: seed.department,
    status: seed.status,
    brandId: seed.brandId,
    clientId: brandsById[seed.brandId].clientId,
    productIds: seed.productIds,
    campaignId: seed.campaignId,
    funnel: seed.details.department === "design" ? seed.details.funnel : undefined,
    relatedTaskId: seed.relatedTaskId,
    source: { label: seed.sourceLabel, path: seed.sourcePath },
    requesterId: seed.requesterId,
    createdAt,
    createdTime: timeFor(index),
    departmentManagerId: CONTENT_MANAGER_ID,
    assigneeId: seed.assigneeId,
    assignedAt: seed.assignedAge !== undefined ? addDays(DEMO_TODAY, -seed.assignedAge) : undefined,
    assignedTime: seed.assignedAge !== undefined ? timeFor(index + 1) : undefined,
    pickedUp: seed.pickedUp,
    details: seed.details,
    brief: seed.brief,
    eta: addDays(createdAt, seed.etaOffset),
    referenceAssetIds: seed.referenceAssetIds ?? [],
    rawAssetIds: seed.rawAssetIds ?? [],
    submissions,
    comments,
    completedAt: seed.status === "completed" ? lastApproved?.outcomeAt : undefined,
  };
}

export const initialContentRequests: ContentRequest[] = seeds.map(buildRequest);

/** Highest sequence used so far per department, so new requests continue it. */
export const nextSequence: Record<ContentDepartment, number> = {
  script: Math.max(...seeds.filter((s) => s.department === "script").map((s) => s.seq)) + 1,
  video: Math.max(...seeds.filter((s) => s.department === "video").map((s) => s.seq)) + 1,
  design: Math.max(...seeds.filter((s) => s.department === "design").map((s) => s.seq)) + 1,
};
