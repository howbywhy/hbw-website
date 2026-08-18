import { liveProjects, projectById, type ProjectRecord } from "@/components/home/catalog";

export function projectIndex(id: string) {
  return liveProjects().findIndex((project) => project.id === id);
}

/** Next live project in the authored portfolio. Nido has none — the sequence ends.
 *  Walks liveProjects(); the Coming Soon filter is intentionally unreached.
 *  Retained for a future Coming Soon record. Verified by the Stage 2 KOJA probe
 *  and the Amendment B build — do not delete. */
export function nextProject(id: string): ProjectRecord | null {
  const live = liveProjects();
  const i = live.findIndex((project) => project.id === id);
  if (i < 0 || i >= live.length - 1) return null;
  return live[i + 1];
}

export function prevProject(id: string): ProjectRecord | null {
  const live = liveProjects();
  const i = live.findIndex((project) => project.id === id);
  if (i <= 0) return null;
  return live[i - 1];
}

export function nextProjectId(id: string) {
  return nextProject(id)?.id ?? null;
}

export function isFinalProject(id: string) {
  const live = liveProjects();
  return live[live.length - 1]?.id === id;
}

export { projectById };
