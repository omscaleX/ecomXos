import type { Role, User } from "@/types";
import { users } from "@/data/users";

/**
 * The four demo roles shown on the login screen. Each role maps to the
 * demo users that hold it. In production the role comes from real
 * authentication; this list only drives the dummy login screen.
 */
export interface RoleDefinition {
  role: Role;
  label: string;
  description: string;
  canSee: string[];
  users: User[];
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: "senior_manager",
    label: "Senior Manager",
    description: "Agency-level view of every brand, target, task and team member.",
    canSee: ["All brands", "All performance", "Targets", "Team workload", "Reports", "Agency AI"],
    users: users.filter((u) => u.role === "senior_manager"),
  },
  {
    role: "manager",
    label: "Manager",
    description: "Runs all six brands day to day: priorities, targets and team tasks.",
    canSee: ["All brands", "Targets", "Team tasks", "Team workload", "Reports", "Agency AI"],
    users: users.filter((u) => u.role === "manager"),
  },
  {
    role: "meta_marketer",
    label: "Meta Ads",
    description: "Meta Ads performance marketer for three brands.",
    canSee: ["My 3 brands", "Meta performance", "Shopify sales for my brands", "My tasks", "Agency AI"],
    users: users.filter((u) => u.role === "meta_marketer"),
  },
  {
    role: "google_marketer",
    label: "Google Ads",
    description: "Google Ads performance marketer for all six brands.",
    canSee: ["All 6 brands", "Google performance", "Shopify sales", "My tasks", "Agency AI"],
    users: users.filter((u) => u.role === "google_marketer"),
  },
];

export const ROLE_LABEL: Record<Role, string> = Object.fromEntries(
  ROLE_DEFINITIONS.map((r) => [r.role, r.label]),
) as Record<Role, string>;
