import type { UserId } from "@/types";
import { DEFAULT_USER_ID, usersById } from "@/data/users";

/**
 * Tiny external store for the demo "current user" and the demo session so
 * the selection survives a page refresh during a presentation. Uses
 * localStorage when available.
 *
 * Demo only: in production the user and session come from real
 * authentication, and the backend enforces permissions.
 */
const USER_KEY = "agency-os.currentUser";
const SESSION_KEY = "agency-os.session";

/** "unknown" is only ever returned before hydration on the client. */
export type SessionState = "unknown" | "in" | "out";

const listeners = new Set<() => void>();
let cachedUser: UserId | null = null;
let cachedSession: SessionState | null = null;

function isUserId(value: string | null): value is UserId {
  return !!value && value in usersById;
}

function readUser(): UserId {
  if (cachedUser) return cachedUser;
  try {
    const stored = window.localStorage.getItem(USER_KEY);
    cachedUser = isUserId(stored) ? stored : DEFAULT_USER_ID;
  } catch {
    cachedUser = DEFAULT_USER_ID;
  }
  return cachedUser;
}

function readSession(): SessionState {
  if (cachedSession) return cachedSession;
  try {
    cachedSession = window.localStorage.getItem(SESSION_KEY) === "in" ? "in" : "out";
  } catch {
    cachedSession = "out";
  }
  return cachedSession;
}

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeUser(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getUserSnapshot(): UserId {
  return readUser();
}

export function getUserServerSnapshot(): UserId {
  return DEFAULT_USER_ID;
}

export function getSessionSnapshot(): SessionState {
  return readSession();
}

export function getSessionServerSnapshot(): SessionState {
  return "unknown";
}

export function setStoredUserId(id: UserId): void {
  cachedUser = id;
  try {
    window.localStorage.setItem(USER_KEY, id);
  } catch {
    // Storage unavailable (private mode etc.) – keep the in-memory value.
  }
  notify();
}

/** Demo login: remember the chosen user and mark the session as signed in. */
export function loginAs(id: UserId): void {
  cachedUser = id;
  cachedSession = "in";
  try {
    window.localStorage.setItem(USER_KEY, id);
    window.localStorage.setItem(SESSION_KEY, "in");
  } catch {
    // ignore
  }
  notify();
}

export function logout(): void {
  cachedSession = "out";
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
  notify();
}
