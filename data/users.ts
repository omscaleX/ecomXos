import type { ContentDepartment, User, UserId } from "@/types";

/**
 * Everyone who signs in. Two sides of the agency:
 *
 * - Marketing and account: run the brands, the ads and the reporting.
 *   They raise content requests.
 * - Content production: the script, video and design desk. They produce
 *   what marketing asks for.
 *
 * Both sides sign in to the same app and see the parts that concern them.
 */
export const users: User[] = [
  /* ---- Marketing and account ---- */
  {
    id: "bhupes",
    name: "Bhupes",
    role: "senior_manager",
    roleLabel: "Senior Manager",
    shortRoleLabel: "Senior Manager",
    email: "bhupes@agency.com",
    initials: "B",
    avatarClass: "bg-slate-800 text-white",
  },
  {
    id: "lucky",
    name: "Lucky",
    role: "manager",
    roleLabel: "Manager",
    shortRoleLabel: "Manager",
    email: "lucky@agency.com",
    initials: "L",
    avatarClass: "bg-indigo-600 text-white",
  },
  {
    id: "om",
    name: "Om",
    role: "meta_marketer",
    roleLabel: "Meta Ads Performance Marketer",
    shortRoleLabel: "Meta Ads",
    platform: "meta",
    email: "om@agency.com",
    initials: "O",
    avatarClass: "bg-sky-600 text-white",
  },
  {
    id: "anubhav",
    name: "Anubhav",
    role: "meta_marketer",
    roleLabel: "Meta Ads Performance Marketer",
    shortRoleLabel: "Meta Ads",
    platform: "meta",
    email: "anubhav@agency.com",
    initials: "A",
    avatarClass: "bg-teal-600 text-white",
  },
  {
    id: "sagar",
    name: "Sagar",
    role: "google_marketer",
    roleLabel: "Google Ads Performance Marketer",
    shortRoleLabel: "Google Ads",
    platform: "google",
    email: "sagar@agency.com",
    initials: "S",
    avatarClass: "bg-amber-600 text-white",
  },

  /* ---- Content production ---- */
  {
    id: "meera",
    name: "Meera",
    role: "content_manager",
    roleLabel: "Content Production Manager",
    shortRoleLabel: "Content Manager",
    isContentTeam: true,
    email: "meera@agency.com",
    initials: "M",
    avatarClass: "bg-fuchsia-700 text-white",
  },
  {
    id: "kavya",
    name: "Kavya",
    role: "script_writer",
    roleLabel: "Script Writer",
    shortRoleLabel: "Script",
    department: "script",
    isContentTeam: true,
    email: "kavya@agency.com",
    initials: "K",
    avatarClass: "bg-purple-600 text-white",
  },
  {
    id: "rahul",
    name: "Rahul",
    role: "video_editor",
    roleLabel: "Video Editor",
    shortRoleLabel: "Video",
    department: "video",
    isContentTeam: true,
    email: "rahul@agency.com",
    initials: "R",
    avatarClass: "bg-rose-600 text-white",
  },
  {
    id: "zoya",
    name: "Zoya",
    role: "video_editor",
    roleLabel: "Video Editor",
    shortRoleLabel: "Video",
    department: "video",
    isContentTeam: true,
    email: "zoya@agency.com",
    initials: "Z",
    avatarClass: "bg-pink-600 text-white",
  },
  {
    id: "arjun",
    name: "Arjun",
    role: "designer",
    roleLabel: "Graphic Designer",
    shortRoleLabel: "Design",
    department: "design",
    isContentTeam: true,
    email: "arjun@agency.com",
    initials: "A",
    avatarClass: "bg-cyan-700 text-white",
  },
];

export const usersById: Record<UserId, User> = Object.fromEntries(
  users.map((u) => [u.id, u]),
) as Record<UserId, User>;

export function getUser(id: UserId): User {
  return usersById[id];
}

export const DEFAULT_USER_ID: UserId = "bhupes";

/** Marketing and account side. These users raise content requests. */
export const marketingUsers = users.filter((u) => !u.isContentTeam);

/** Content production side. These users produce the work. */
export const contentUsers = users.filter((u) => u.isContentTeam);

/** The producers in one department, excluding the manager. */
export function getDepartmentMembers(department: ContentDepartment): User[] {
  return users.filter((u) => u.department === department);
}

/** The single manager who owns all three content queues. */
export const CONTENT_MANAGER_ID: UserId = "meera";
