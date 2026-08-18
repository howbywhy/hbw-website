import { PROJECT_SLUGS } from "@/components/home/catalog";

export function normPathname(path: string) {
  return (path || "/").replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
}

export function projectSlugFromPath(path: string): string | null {
  const match = normPathname(path).match(/^\/projects\/([^/]+)$/);
  if (!match) return null;
  return PROJECT_SLUGS.includes(match[1]) ? match[1] : null;
}

export function isStudioPathname(path: string) {
  const p = normPathname(path);
  return p === "/studio" || p === "/manifesto";
}

export function isWorkspacePathname(_path: string) {
  return true;
}
