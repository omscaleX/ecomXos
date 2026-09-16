/**
 * Shared domain types for Agency OS.
 *
 * These types are intentionally shaped like the records a future backend
 * would return after normalising Meta, Google Ads and Shopify data.
 * The frontend only ever depends on these shapes, so swapping the demo
 * data in /data for real API responses should not require UI changes.
 */

export type Currency = "INR" | "AED";

export type UserId =
  // Marketing and account side
  | "bhupes"
  | "lucky"
  | "om"
  | "anubhav"
  | "sagar"
  // Content production side
  | "meera"
  | "kavya"
  | "rahul"
  | "zoya"
  | "arjun";

export type Role =
  // Marketing and account side
  | "senior_manager"
  | "manager"
  | "meta_marketer"
  | "google_marketer"
  // Content production side
  | "content_manager"
  | "script_writer"
  | "video_editor"
  | "designer";

/** The three content-production departments. */
export type ContentDepartment = "script" | "video" | "design";

export type Platform = "meta" | "google";

export interface User {
  id: UserId;
  name: string;
  role: Role;
  /** Long form, e.g. "Meta Ads Performance Marketer" */
  roleLabel: string;
  /** Short form used in tables, e.g. "Meta Ads" */
  shortRoleLabel: string;
  /** Platform the user runs ads on, if any. */
  platform?: Platform;
  /** Content-production department, for content team members only. */
  department?: ContentDepartment;
  /** True for the content-production side of the agency. */
  isContentTeam?: boolean;
  email: string;
  initials: string;
  /** Tailwind background class used for avatars. */
  avatarClass: string;
}

export type BrandId =
  | "yeoul"
  | "giggle-pad"
  | "nysh-warmee"
  | "nysh-bluheat"
  | "desividesi-india"
  | "desividesi-dubai";

export type Market = "India" | "Dubai";

export type ClientId = "yeoul" | "giggle-pad" | "nysh" | "desividesi";

/** The account a brand belongs to. Two Nysh brands share one client. */
export interface Client {
  id: ClientId;
  name: string;
  /** Marketing-side owner of the account. */
  accountManagerId: UserId;
}

export interface Brand {
  id: BrandId;
  clientId: ClientId;
  name: string;
  currency: Currency;
  market: Market;
  category: string;
  managerId: UserId;
  metaOwnerId: UserId;
  googleOwnerId: UserId;
  shopifyStore: string;
  /** Tailwind background class used for the brand mark. */
  colorClass: string;
}

export type TargetStatus = "on_track" | "attention" | "below_target";

export interface Target {
  brandId: BrandId;
  metric: "roas";
  targetROAS: number;
  /** Human readable period label, e.g. "Last 30 days". */
  period: string;
}

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "review"
  | "completed";

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  brandId: BrandId;
  assigneeId: UserId;
  priority: TaskPriority;
  /** ISO date, e.g. "2026-09-10" */
  dueDate: string;
  status: TaskStatus;
  notes?: string;
  platform?: Platform;
  /** ISO date */
  createdAt: string;
  /** ISO date, only for completed tasks */
  completedAt?: string;
}

/** Daily Meta Ads performance for one brand. */
export interface MetaPerformance {
  brandId: BrandId;
  date: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  purchases: number;
  reportedPurchaseValue: number;
}

/** Daily Google Ads performance for one brand. */
export interface GooglePerformance {
  brandId: BrandId;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  conversionValue: number;
}

/**
 * Daily Shopify sales for one brand.
 *
 * `netSales` follows Shopify's own definition and is already AFTER returns.
 * `returnedAmount` / `returnedOrders` are the reversal record for the same
 * day, shown separately so the team can see how much was given back.
 */
export interface ShopifySales {
  brandId: BrandId;
  date: string;
  currency: Currency;
  /** Net Sales, after returns. This is the sales figure used for Actual ROAS. */
  netSales: number;
  orders: number;
  /** Value reversed by returns, refunds and cancellations. */
  returnedAmount: number;
  /** Number of orders reversed. */
  returnedOrders: number;
}

export type CampaignStatus = "active" | "paused" | "learning";

export interface MetaCampaign {
  id: string;
  brandId: BrandId;
  name: string;
  objective: string;
  spend: number;
  purchases: number;
  ctr: number;
  cpc: number;
  status: CampaignStatus;
}

export interface GoogleCampaign {
  id: string;
  brandId: BrandId;
  name: string;
  type: string;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  status: CampaignStatus;
}

export interface Creative {
  id: string;
  brandId: BrandId;
  name: string;
  format: "Image" | "Video" | "Carousel";
  platform: Platform;
  status: "Live" | "Paused" | "In Review";
  ctr: number;
}

export interface Report {
  id: string;
  title: string;
  brandId: BrandId | "all";
  dateRange: string;
  generatedAt: string;
  generatedBy: UserId;
}

export type DateRangeKey = "today" | "7d" | "30d" | "this_week" | "this_month" | "90d";

/** An explicit from/to window picked on the calendar. Both are ISO dates. */
export interface DateRange {
  from: string;
  to: string;
}

/** Anything the analytics layer accepts as a period. */
export type RangeInput = DateRangeKey | DateRange;

/** How a KPI series is bucketed on a chart or table. */
export type Granularity = "day" | "week" | "month";

/** Aggregated Meta metrics for a set of rows. */
export interface MetaTotals {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  purchases: number;
  reportedPurchaseValue: number;
  /** Meta-reported ROAS = reportedPurchaseValue / spend (platform metric, not business ROAS). */
  reportedROAS: number;
}

/** Aggregated Google metrics for a set of rows. */
export interface GoogleTotals {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  conversionValue: number;
  /** Google-reported ROAS = conversionValue / spend (platform metric, not business ROAS). */
  reportedROAS: number;
}

/** Aggregated Shopify totals for a set of rows. */
export interface ShopifyTotals {
  /** After returns. */
  netSales: number;
  orders: number;
  aov: number;
  /** Reversal record for the period. */
  returnedAmount: number;
  returnedOrders: number;
  /** netSales + returnedAmount, i.e. before the reversals were applied. */
  salesBeforeReturns: number;
  /** returnedAmount / salesBeforeReturns, as a ratio. */
  returnRate: number;
}

/**
 * Business-level summary for one brand over a date range.
 * Actual ROAS = Shopify Net Sales / (Meta Spend + Google Spend)
 */
export interface BrandSummary {
  brand: Brand;
  currency: Currency;
  metaSpend: number;
  googleSpend: number;
  totalSpend: number;
  /** Shopify Net Sales, after returns. */
  netSales: number;
  orders: number;
  aov: number;
  /** Reversal record: value and orders given back in the period. */
  returnedAmount: number;
  returnedOrders: number;
  salesBeforeReturns: number;
  returnRate: number;
  /**
   * The two sales figures side by side:
   * - metaReportedSales comes from Meta's own attribution.
   * - netSales comes from Shopify and is the source of truth.
   */
  metaReportedSales: number;
  /** metaReportedSales - netSales. Positive means Meta is over-reporting. */
  salesGapVsMeta: number;
  actualROAS: number;
  targetROAS: number;
  gap: number;
  gapPercent: number;
  status: TargetStatus;
  meta: MetaTotals;
  google: GoogleTotals;
}

/** Totals for a group of brands that share one currency. */
export interface PortfolioSummary {
  currency: Currency;
  label: string;
  brandCount: number;
  metaSpend: number;
  googleSpend: number;
  totalSpend: number;
  netSales: number;
  orders: number;
  returnedAmount: number;
  returnedOrders: number;
  returnRate: number;
  metaReportedSales: number;
  actualROAS: number;
}

export type WorkloadStatus = "healthy" | "busy" | "needs_attention";

export interface Workload {
  userId: UserId;
  brandCount: number;
  openTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  dueToday: number;
  status: WorkloadStatus;
}

export type PrioritySeverity = "high" | "medium" | "low";

export interface PriorityItem {
  id: string;
  rank: number;
  kind: "brand_target" | "overdue_task" | "blocked_task" | "due_today";
  title: string;
  detail: string;
  severity: PrioritySeverity;
  brandId?: BrandId;
  taskId?: string;
  assigneeId?: UserId;
  href: string;
}

export interface DataSourceStatus {
  id: "meta" | "google" | "shopify";
  name: string;
  status: "connected" | "syncing" | "error";
  lastSynced: string;
}
