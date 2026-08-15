"use client";

import { createContext, useContext } from "react";
import type { WindowMode } from "@/components/home/workspace";

export type WorkspacePanelId = "studio" | "info" | null;
export type StudioView = "studio" | "manifesto";

export type WorkspaceApi = {
  windowMode: WindowMode;
  openPanel: (id: Exclude<WorkspacePanelId, null>) => void;
  closePanel: () => void;
  panel: WorkspacePanelId;
  openProjects: () => void;
  closeProjects: () => void;
  returnToMake: () => void;
};

export const WorkspaceContext = createContext<WorkspaceApi | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace requires HbwShell");
  return ctx;
}
