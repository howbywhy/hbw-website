import { catalogIdForSlug, liveProjects, projectById, type ProjectRecord } from "@/components/home/catalog";

/** Next live project in the authored portfolio. The sequence cycles: the last
 *  live project returns the first. Walks liveProjects(); the Coming Soon filter
 *  is intentionally unreached. Retained for a future Coming Soon record.
 *  Verified by the Stage 2 KOJA probe and the Amendment B build — do not delete. */
export function nextProject(id: string): ProjectRecord | null {
  const live = liveProjects();
  const i = live.findIndex((project) => project.id === catalogIdForSlug(id));
  if (i < 0) return null;
  return live[(i + 1) % live.length];
}

export { projectById };
