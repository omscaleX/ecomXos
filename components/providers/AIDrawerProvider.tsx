"use client";

import * as React from "react";
import type { BrandId, Platform } from "@/types";

/**
 * Controls the right-side "Ask Agency AI" drawer. Any page can open it with
 * context (the brand / platform currently on screen) so the AI answers
 * relative to what the user is looking at.
 */

export interface AIDrawerContextValue {
  brandId?: BrandId;
  platform?: Platform;
  /** Pre-filled question to ask when the drawer opens. */
  initialQuestion?: string;
}

interface AIDrawerState {
  open: boolean;
  context: AIDrawerContextValue;
  openDrawer: (context?: AIDrawerContextValue) => void;
  closeDrawer: () => void;
  setOpen: (open: boolean) => void;
}

const AIDrawerContext = React.createContext<AIDrawerState | null>(null);

export function AIDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [context, setContext] = React.useState<AIDrawerContextValue>({});

  const openDrawer = React.useCallback((ctx: AIDrawerContextValue = {}) => {
    setContext(ctx);
    setOpen(true);
  }, []);

  const closeDrawer = React.useCallback(() => setOpen(false), []);

  const value = React.useMemo(
    () => ({ open, context, openDrawer, closeDrawer, setOpen }),
    [open, context, openDrawer, closeDrawer],
  );

  return <AIDrawerContext.Provider value={value}>{children}</AIDrawerContext.Provider>;
}

export function useAIDrawer(): AIDrawerState {
  const ctx = React.useContext(AIDrawerContext);
  if (!ctx) throw new Error("useAIDrawer must be used inside AIDrawerProvider");
  return ctx;
}
