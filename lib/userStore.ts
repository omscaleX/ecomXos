import type { UserId } from "@/types";
import { DEFAULT_USER_ID, usersById } from "@/data/users";

/**
 * Tiny external store for the demo "current user" so the selection survives
 * a page refresh during a presentation. Uses localStorage when available.
 *
 * Demo only: in production the user comes from real authentication.
 */
const STORAGE_KEY = "agency-os.currentUser";
const listeners = new Set<() => void>();
let cached: UserId | null = null;

function isUserId(value: string | null): value is UserId {
  return !!value && value in usersById;
}

function read(): UserId {
  if (cached) return cached;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    cached = isUserId(stored) ? stored : DEFAULT_USER_ID;
  } catch {
    cached = DEFAULT_USER_ID;
  }
  return cached;
}

export function subscribeUser(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUserSnapshot(): UserId {
  return read();
}

export function getUserServerSnapshot(): UserId {
  return DEFAULT_USER_ID;
}

export function setStoredUserId(id: UserId): void {
  cached = id;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage unavailable (private mode etc.) – keep the in-memory value.
  }
  listeners.forEach((l) => l());
}
