import type { User, UserId } from "@/types";

export const users: User[] = [
  {
    id: "bhupes",
    name: "Bhupes",
    role: "senior_manager",
    roleLabel: "Senior Manager",
    shortRoleLabel: "Senior Manager",
    initials: "B",
    avatarClass: "bg-slate-800 text-white",
  },
  {
    id: "lucky",
    name: "Lucky",
    role: "manager",
    roleLabel: "Manager",
    shortRoleLabel: "Manager",
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
    initials: "S",
    avatarClass: "bg-amber-600 text-white",
  },
];

export const usersById: Record<UserId, User> = Object.fromEntries(
  users.map((u) => [u.id, u]),
) as Record<UserId, User>;

export function getUser(id: UserId): User {
  return usersById[id];
}

export const DEFAULT_USER_ID: UserId = "bhupes";
