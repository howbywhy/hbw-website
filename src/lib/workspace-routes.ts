export const MIGRATED_PROJECT_SLUGS = [
  "sub-3",
  "koja",
  "bar-closed",
  "our-boy-roy",
  "chris-sisarich",
  "bistro-nido",
] as const;

export type MigratedProjectSlug = (typeof MIGRATED_PROJECT_SLUGS)[number];

export function normPathname(path: string) {
  return (path || "/").replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
}

export function projectSlugFromPath(path: string): MigratedProjectSlug | null {
  const match = normPathname(path).match(/^\/projects\/([^/]+)$/);
  if (!match) return null;
  return (MIGRATED_PROJECT_SLUGS as readonly string[]).includes(match[1])
    ? (match[1] as MigratedProjectSlug)
    : null;
}

export function isStudioPathname(path: string) {
  const p = normPathname(path);
  return p === "/studio" || p === "/manifesto";
}

export function isWorkspacePathname(path: string) {
  const p = normPathname(path);
  return p === "/" || isStudioPathname(p) || projectSlugFromPath(p) !== null;
}
