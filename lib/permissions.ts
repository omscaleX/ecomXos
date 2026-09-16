import type { Brand, BrandId, ContentDepartment, Platform, Task, User } from "@/types";
import { brands } from "@/data/brands";

/**
 * Prototype permissions.
 *
 * IMPORTANT: This is UI-only simulation for the demo. In production the role
 * must come from real authentication and the backend must enforce access on
 * every request. Never trust the frontend role, URL parameters or hidden UI
 * as security.
 */

export type SectionKey =
  | "dashboard"
  | "brands"
  | "performance"
  | "sales"
  | "targets"
  | "tasks"
  | "team"
  | "reports"
  | "content"
  | "content_analytics"
  | "chat"
  | "ai";

export interface NavItem {
  key: SectionKey;
  label: string;
  href: string;
}

/** Marketing-side managers: they run the brands and see every number. */
export function isManager(user: User): boolean {
  return user.role === "senior_manager" || user.role === "manager";
}

/** Anyone on the content production side (script, video, design). */
export function isContentTeam(user: User): boolean {
  return user.isContentTeam === true;
}

/** The person who runs all three content queues. */
export function isContentManager(user: User): boolean {
  return user.role === "content_manager";
}

/** A producer: writes scripts, edits video or makes creatives. */
export function isProducer(user: User): boolean {
  return user.role === "script_writer" || user.role === "video_editor" || user.role === "designer";
}

/** The department a producer belongs to, if any. */
export function getDepartment(user: User): ContentDepartment | undefined {
  return user.department;
}

/**
 * Brands the user works on.
 *
 * Marketing people see the brands they own. The content team produces work
 * for every brand, so they can see all brand names — but not the ad numbers,
 * which are gated separately by section and platform access below.
 */
export function getVisibleBrands(user: User): Brand[] {
  switch (user.role) {
    case "senior_manager":
    case "manager":
      return brands;
    case "meta_marketer":
      return brands.filter((b) => b.metaOwnerId === user.id);
    case "google_marketer":
      return brands.filter((b) => b.googleOwnerId === user.id);
    case "content_manager":
    case "script_writer":
    case "video_editor":
    case "designer":
      return brands;
    default:
      return [];
  }
}

export function getVisibleBrandIds(user: User): BrandId[] {
  return getVisibleBrands(user).map((b) => b.id);
}

export function canViewBrand(user: User, brandId: BrandId): boolean {
  return getVisibleBrandIds(user).includes(brandId);
}

/** Which ad platforms the user can see detailed metrics for. */
export function getVisiblePlatforms(user: User): Platform[] {
  if (isContentTeam(user)) return [];
  if (isManager(user)) return ["meta", "google"];
  return user.platform ? [user.platform] : [];
}

export function canViewPlatform(user: User, platform: Platform): boolean {
  return getVisiblePlatforms(user).includes(platform);
}

/** Managers see every task; team members see only their own. */
export function getVisibleTasks(user: User, tasks: Task[]): Task[] {
  if (isManager(user)) return tasks;
  return tasks.filter((t) => t.assigneeId === user.id);
}

export function getAllowedSections(user: User): SectionKey[] {
  if (isContentManager(user)) {
    return ["content", "content_analytics", "brands", "chat"];
  }
  if (isContentTeam(user)) {
    return ["content", "brands", "chat"];
  }
  if (isManager(user)) {
    return [
      "dashboard",
      "brands",
      "performance",
      "sales",
      "targets",
      "tasks",
      "content",
      "content_analytics",
      "team",
      "reports",
      "chat",
      "ai",
    ];
  }
  return ["dashboard", "brands", "performance", "sales", "tasks", "content", "chat", "ai"];
}

export function canAccessSection(user: User, section: SectionKey): boolean {
  return getAllowedSections(user).includes(section);
}

/** Where a user lands after signing in. The content team starts on their desk. */
export function getHomePath(user: User): string {
  return isContentTeam(user) ? "/content" : "/dashboard";
}

const SECTION_BY_PATH: Array<[string, SectionKey]> = [
  ["/dashboard", "dashboard"],
  ["/brands", "brands"],
  ["/performance", "performance"],
  ["/sales", "sales"],
  ["/targets", "targets"],
  ["/tasks", "tasks"],
  ["/content/analytics", "content_analytics"],
  ["/content", "content"],
  ["/team", "team"],
  ["/reports", "reports"],
  ["/chat", "chat"],
  ["/ai", "ai"],
];

export function getSectionForPath(pathname: string): SectionKey | undefined {
  return SECTION_BY_PATH.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1];
}

export function getNavItems(user: User): NavItem[] {
  const manager = isManager(user);
  const content = isContentTeam(user);
  const all: NavItem[] = [
    { key: "dashboard", label: "Dashboard", href: "/dashboard" },
    { key: "content", label: content ? "My Work" : "Content Desk", href: "/content" },
    { key: "brands", label: manager || content ? "Brands" : "My Brands", href: "/brands" },
    { key: "performance", label: "Performance", href: "/performance" },
    { key: "sales", label: "Sales", href: "/sales" },
    { key: "targets", label: "Targets", href: "/targets" },
    { key: "tasks", label: manager ? "Tasks" : "My Tasks", href: "/tasks" },
    { key: "content_analytics", label: "Content Reports", href: "/content/analytics" },
    { key: "team", label: "Team", href: "/team" },
    { key: "reports", label: "Reports", href: "/reports" },
    { key: "chat", label: "Chat & Huddle", href: "/chat" },
    { key: "ai", label: "Agency AI", href: "/ai" },
  ];
  const allowed = new Set(getAllowedSections(user));
  return all.filter((item) => allowed.has(item.key));
}

/**
 * Money and ad numbers are for the marketing side only. The content team
 * sees brand names and the content library, never spend, sales or ROAS.
 */
export function canViewMoney(user: User): boolean {
  return !isContentTeam(user);
}
