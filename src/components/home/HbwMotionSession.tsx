"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import type { ViewPhase } from "@/components/home/projects/ProjectView";
import { viewSlugFromPath } from "@/lib/workspace-routes";
import type { FilterDim, ProjectsMode, SortId, WindowMode } from "@/components/home/workspace";

export type MotionSwap = {
  from: WindowMode;
  to: WindowMode;
  phase: "preparing" | "entering" | "exiting";
};

export type MotionSessionKind = "enter" | "exit" | "home" | "handoff";

export type MotionSession = {
  kind: MotionSessionKind;
  phase: ViewPhase;
  swap: MotionSwap | null;
  windowMode: WindowMode;
  activeId: string;
  viewIndex: number;
  leaving: { id: string; index: number } | null;
  entrance: "archive" | "reduced" | "handoff" | "field";
  keepBrowse: boolean;
  parkedX: number | null;
  handoffFrom?: number | null;
  cinematic: boolean;
  startedAt: number;
  browse?: {
    mode: ProjectsMode;
    filterDim: FilterDim;
    filterValue: string;
    sort: SortId;
    scroll?: number;
  };
};

export type MotionStore = {
  read: () => MotionSession | null;
  write: (session: MotionSession) => void;
  clear: () => void;
};

const MotionSessionContext = createContext<MotionStore | null>(null);

export function createMotionStore(): MotionStore {
  let current: MotionSession | null = null;
  return {
    read: () => current,
    write: (session) => {
      current = session;
    },
    clear: () => {
      current = null;
    },
  };
}

/** URL-derived phase unless an in-flight session is crossing the home ↔ project layout split. */
export function phaseAfterRouteBoundary(session: MotionSession | null, pathname: string): ViewPhase {
  if (session) return session.phase;
  return viewSlugFromPath(pathname) ? "active" : "idle";
}

export function HbwMotionSessionProvider({ children }: { children: ReactNode }) {
  const store = useRef<MotionStore | null>(null);
  if (!store.current) store.current = createMotionStore();
  const value = useMemo(() => store.current as MotionStore, []);
  return <MotionSessionContext.Provider value={value}>{children}</MotionSessionContext.Provider>;
}

export function useHbwMotionSession() {
  return useContext(MotionSessionContext);
}
