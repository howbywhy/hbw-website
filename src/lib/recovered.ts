import fs from "node:fs";
import path from "node:path";
import pages from "@/recovered/pages.json";

export type RecoveredRoute = keyof typeof pages;

const PAGE_FILES: Record<string, string> = {
  "/": "home.html",
  "/projects": "projects.html",
  "/studio": "studio.html",
  "/collections": "collections.html",
  "/manifesto": "manifesto.html",
  "/intake/start": "intake__start.html",
  "/projects/sub-3": "projects__sub-3.html",
  "/projects/koja": "projects__koja.html",
  "/projects/bar-closed": "projects__bar-closed.html",
  "/projects/our-boy-roy": "projects__our-boy-roy.html",
  "/projects/chris-sisarich": "projects__chris-sisarich.html",
  "/projects/bistro-nido": "projects__bistro-nido.html",
};

export const PROJECT_SLUGS = [
  "sub-3",
  "koja",
  "bar-closed",
  "our-boy-roy",
  "chris-sisarich",
  "bistro-nido",
] as const;

export function getRecoveredMeta(route: string) {
  const rec = pages[route as RecoveredRoute];
  if (!rec) return { title: "HBW", description: "How by why" };
  return {
    title: rec.title,
    description:
      "HBW (How by why) is a Sydney-based brand and design practice.",
  };
}

export function getRecoveredHtml(route: string): string {
  const file = PAGE_FILES[route];
  if (!file) {
    throw new Error(`No recovered HTML for route ${route}`);
  }
  const full = path.join(process.cwd(), "src/recovered/html", file);
  return fs.readFileSync(full, "utf8");
}
