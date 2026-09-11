"use client";

import * as React from "react";
import type { BrandId, Task, User, UserId } from "@/types";
import { usersById } from "@/data/users";
import { getSessionServerSnapshot, getSessionSnapshot, getUserServerSnapshot, getUserSnapshot, loginAs, logout as logoutStore, setStoredUserId, subscribeUser, type SessionState } from "@/lib/userStore";
import { initialTasks } from "@/data/tasks";
import { initialTargetMap, type TargetMap } from "@/data/targets";
import { DEMO_TODAY } from "@/data/config";

/**
 * Global demo state.
 *
 * - currentUser: simulated login (the user switcher). Demo only – in
 *   production the role comes from real authentication.
 * - tasks / targets: editable in-memory copies of the internal system data.
 *
 * When a backend exists this provider becomes the place where data is
 * fetched and mutations are sent; consumers keep the same hooks.
 */

export type NewTaskInput = Omit<Task, "id" | "createdAt" | "completedAt">;

interface AppState {
  currentUser: User;
  setCurrentUserId: (id: UserId) => void;
  /** Demo session: "unknown" before hydration, then "in" or "out". */
  session: SessionState;
  login: (id: UserId) => void;
  logout: () => void;
  tasks: Task[];
  addTask: (input: NewTaskInput) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  completeTask: (id: string) => void;
  targets: TargetMap;
  setTarget: (brandId: BrandId, targetROAS: number) => void;
  today: string;
}

const AppStateContext = React.createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  // Persisted across refreshes (demo convenience only).
  const currentUserId = React.useSyncExternalStore(subscribeUser, getUserSnapshot, getUserServerSnapshot);
  const setCurrentUserId = React.useCallback((id: UserId) => setStoredUserId(id), []);
  const session = React.useSyncExternalStore(subscribeUser, getSessionSnapshot, getSessionServerSnapshot);
  const login = React.useCallback((id: UserId) => loginAs(id), []);
  const logout = React.useCallback(() => logoutStore(), []);
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [targets, setTargets] = React.useState<TargetMap>(initialTargetMap);
  const counter = React.useRef(100);

  const addTask = React.useCallback((input: NewTaskInput) => {
    counter.current += 1;
    const task: Task = { ...input, id: `t-new-${counter.current}`, createdAt: DEMO_TODAY };
    setTasks((prev) => [task, ...prev]);
    return task;
  }, []);

  const updateTask = React.useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...patch };
        if (patch.status === "completed" && !next.completedAt) next.completedAt = DEMO_TODAY;
        if (patch.status && patch.status !== "completed") next.completedAt = undefined;
        return next;
      }),
    );
  }, []);

  const completeTask = React.useCallback(
    (id: string) => updateTask(id, { status: "completed", completedAt: DEMO_TODAY }),
    [updateTask],
  );

  const setTarget = React.useCallback((brandId: BrandId, targetROAS: number) => {
    setTargets((prev) => ({ ...prev, [brandId]: targetROAS }));
  }, []);

  const value = React.useMemo<AppState>(
    () => ({
      currentUser: usersById[currentUserId],
      setCurrentUserId,
      session,
      login,
      logout,
      tasks,
      addTask,
      updateTask,
      completeTask,
      targets,
      setTarget,
      today: DEMO_TODAY,
    }),
    [currentUserId, setCurrentUserId, session, login, logout, tasks, addTask, updateTask, completeTask, targets, setTarget],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = React.useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}

export function useCurrentUser(): User {
  return useAppState().currentUser;
}

export function useTargets() {
  const { targets, setTarget } = useAppState();
  return { targets, setTarget };
}

export function useTasks() {
  const { tasks, addTask, updateTask, completeTask } = useAppState();
  return { tasks, addTask, updateTask, completeTask };
}
