import { PROJECTS, projectById, type ProjectRecord } from "@/components/home/catalog";

export function projectIndex(id: string) {
  return PROJECTS.findIndex((project) => project.id === id);
}

/** Next project in the authored portfolio. Nido has none — the sequence ends. */
export function nextProject(id: string): ProjectRecord | null {
  const i = projectIndex(id);
  if (i < 0 || i >= PROJECTS.length - 1) return null;
  return PROJECTS[i + 1];
}

export function prevProject(id: string): ProjectRecord | null {
  const i = projectIndex(id);
  if (i <= 0) return null;
  return PROJECTS[i - 1];
}

export function nextProjectId(id: string) {
  return nextProject(id)?.id ?? null;
}

export function isFinalProject(id: string) {
  return PROJECTS[PROJECTS.length - 1]?.id === id;
}

export { projectById };
