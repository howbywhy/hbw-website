import { PROJECT_SLUGS } from "@/components/home/catalog";
import { cmsProjectByPreviewSlug } from "@/lib/cms-source";

export function normPathname(path: string) {
  return (path || "/").replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
}

export function projectSlugFromPath(path: string): string | null {
  const match = normPathname(path).match(/^\/projects\/([^/]+)$/);
  if (!match) return null;
  return PROJECT_SLUGS.includes(match[1]) ? match[1] : null;
}

/** Validation-only CMS preview. Registry preview slugs only. */
export function previewSlugFromPath(path: string): string | null {
  const match = normPathname(path).match(/^\/preview\/([^/]+)$/);
  if (!match) return null;
  return cmsProjectByPreviewSlug(match[1])?.previewSlug ?? null;
}

export function viewSlugFromPath(path: string): string | null {
  return projectSlugFromPath(path) ?? previewSlugFromPath(path);
}

export function isCmsPreviewPath(path: string) {
  return previewSlugFromPath(path) !== null;
}

export function isStudioPathname(path: string) {
  const p = normPathname(path);
  return p === "/studio" || p === "/manifesto";
}
