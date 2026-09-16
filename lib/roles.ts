import type { Role, User } from "@/types";
import { users } from "@/data/users";

/**
 * The demo roles shown on the login screen. Each role maps to the demo
 * users who hold it. In production the role comes from real
 * authentication; this list only drives the dummy login screen.
 */
export type RoleSide = "marketing" | "content";

export interface RoleDefinition {
  role: Role;
  side: RoleSide;
  label: string;
  description: string;
  canSee: string[];
  users: User[];
}

const byRole = (role: Role) => users.filter((u) => u.role === role);

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: "senior_manager",
    side: "marketing",
    label: "Senior Manager",
    description: "Sees the whole agency: every brand, target, task and person.",
    canSee: ["All brands", "All ad numbers", "Targets", "Team", "Content Desk", "Reports"],
    users: byRole("senior_manager"),
  },
  {
    role: "manager",
    side: "marketing",
    label: "Manager",
    description: "Runs all six brands day to day and raises content requests.",
    canSee: ["All brands", "Targets", "Team tasks", "Content Desk", "Reports"],
    users: byRole("manager"),
  },
  {
    role: "meta_marketer",
    side: "marketing",
    label: "Meta Ads",
    description: "Runs Meta ads for their own brands.",
    canSee: ["My brands", "Meta numbers", "Shopify sales", "My tasks", "Content Desk"],
    users: byRole("meta_marketer"),
  },
  {
    role: "google_marketer",
    side: "marketing",
    label: "Google Ads",
    description: "Runs Google ads across all six brands.",
    canSee: ["All 6 brands", "Google numbers", "Shopify sales", "My tasks", "Content Desk"],
    users: byRole("google_marketer"),
  },
  {
    role: "content_manager",
    side: "content",
    label: "Content Manager",
    description: "Runs all three content queues and hands work out.",
    canSee: ["All 3 queues", "Give work to people", "Content reports", "Chat & Huddle"],
    users: byRole("content_manager"),
  },
  {
    role: "script_writer",
    side: "content",
    label: "Script Writer",
    description: "Writes the words for videos and ads.",
    canSee: ["My script jobs", "Script queue", "Brand content library", "Chat & Huddle"],
    users: byRole("script_writer"),
  },
  {
    role: "video_editor",
    side: "content",
    label: "Video Editor",
    description: "Edits raw footage into finished videos.",
    canSee: ["My video jobs", "Video queue", "Brand content library", "Chat & Huddle"],
    users: byRole("video_editor"),
  },
  {
    role: "designer",
    side: "content",
    label: "Graphic Designer",
    description: "Makes images, banners and carousels.",
    canSee: ["My design jobs", "Design queue", "Brand content library", "Chat & Huddle"],
    users: byRole("designer"),
  },
];

export const SIDE_LABEL: Record<RoleSide, string> = {
  marketing: "Marketing & Accounts",
  content: "Content Production",
};

export const SIDE_BLURB: Record<RoleSide, string> = {
  marketing: "Run the ads, watch the numbers, ask for content.",
  content: "Write, edit and design what marketing asks for.",
};

export function rolesForSide(side: RoleSide): RoleDefinition[] {
  return ROLE_DEFINITIONS.filter((r) => r.side === side);
}

export const ROLE_LABEL: Record<Role, string> = Object.fromEntries(
  ROLE_DEFINITIONS.map((r) => [r.role, r.label]),
) as Record<Role, string>;
