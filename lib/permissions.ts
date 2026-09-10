import type { Brand, BrandId, Platform, Task, User } from "@/types";
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
  | "ai";

export interface NavItem {
  key: SectionKey;
  label: string;
  href: string;
}

export function isManager(user: User): boolean {
  return user.role === "senior_manager" || user.role === "manager";
}

/** Brands the user is responsible for (or all brands for managers / Google). */
export function getVisibleBrands(user: User): Brand[] {
  switch (user.role) {
    case "senior_manager":
    case "manager":
      return brands;
    case "meta_marketer":
      return brands.filter((b) => b.metaOwnerId === user.id);
    case "google_marketer":
      return brands.filter((b) => b.googleOwnerId === user.id);
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
  if (isManager(user)) {
    return ["dashboard", "brands", "performance", "sales", "targets", "tasks", "team", "reports", "ai"];
  }
  return ["dashboard", "brands", "performance", "sales", "tasks", "ai"];
}

export function canAccessSection(user: User, section: SectionKey): boolean {
  return getAllowedSections(user).includes(section);
}

const SECTION_BY_PATH: Array<[string, SectionKey]> = [
  ["/dashboard", "dashboard"],
  ["/brands", "brands"],
  ["/performance", "performance"],
  ["/sales", "sales"],
  ["/targets", "targets"],
  ["/tasks", "tasks"],
  ["/team", "team"],
  ["/reports", "reports"],
  ["/ai", "ai"],
];

export function getSectionForPath(pathname: string): SectionKey | undefined {
  return SECTION_BY_PATH.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1];
}

export function getNavItems(user: User): NavItem[] {
  const manager = isManager(user);
  const all: NavItem[] = [
    { key: "dashboard", label: "Dashboard", href: "/dashboard" },
    { key: "brands", label: manager ? "Brands" : "My Brands", href: "/brands" },
    { key: "performance", label: "Performance", href: "/performance" },
    { key: "sales", label: "Sales", href: "/sales" },
    { key: "targets", label: "Targets", href: "/targets" },
    { key: "tasks", label: manager ? "Tasks" : "My Tasks", href: "/tasks" },
    { key: "team", label: "Team", href: "/team" },
    { key: "reports", label: "Reports", href: "/reports" },
    { key: "ai", label: "Agency AI", href: "/ai" },
  ];
  const allowed = new Set(getAllowedSections(user));
  return all.filter((item) => allowed.has(item.key));
}
