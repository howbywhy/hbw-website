/** Three real CMS-backed projects. Not a migration registry. */

export type ProjectSource = "sanity" | "local";

export type CmsBackedProject = {
  routeSlug: string;
  cmsSlug: string;
  envKey: "HBW_SCK_SOURCE" | "HBW_CLOSED_SOURCE" | "HBW_KOJA_SOURCE";
  label: string;
};

export const CMS_BACKED_PROJECTS: readonly CmsBackedProject[] = [
  { routeSlug: "sck", cmsSlug: "sck", envKey: "HBW_SCK_SOURCE", label: "SCK" },
  { routeSlug: "bar-closed", cmsSlug: "closed", envKey: "HBW_CLOSED_SOURCE", label: "CLOSED" },
  { routeSlug: "koja", cmsSlug: "koja", envKey: "HBW_KOJA_SOURCE", label: "KOJA" },
];

export function cmsBackedProject(routeSlug: string): CmsBackedProject | undefined {
  return CMS_BACKED_PROJECTS.find((project) => project.routeSlug === routeSlug);
}

/** CMS slug → public catalog / route id. CLOSED is the first mismatch. */
export function catalogIdForSlug(slug: string) {
  return CMS_BACKED_PROJECTS.find((project) => project.cmsSlug === slug)?.routeSlug ?? slug;
}

export function sourceFlagFromEnv(
  envKey: CmsBackedProject["envKey"],
  env: Record<string, string | undefined> = process.env
): ProjectSource {
  return env[envKey] === "sanity" ? "sanity" : "local";
}
