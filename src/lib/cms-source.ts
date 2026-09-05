/** Six real CMS-backed projects. Routing, source flags, and document identity only. */

export type ProjectSource = "sanity" | "local";

export type CmsSourceEnvKey =
  | "HBW_SCK_SOURCE"
  | "HBW_CLOSED_SOURCE"
  | "HBW_KOJA_SOURCE"
  | "HBW_CHRIS_SOURCE"
  | "HBW_SUB3_SOURCE"
  | "HBW_OBR_SOURCE";

export type CmsProjectAlias = {
  source: string;
  destination: string;
};

export type CmsBackedProject = {
  routeSlug: string;
  cmsSlug: string;
  documentId: string;
  envKey: CmsSourceEnvKey;
  label: string;
  publicPath: string;
  previewSlug: string;
  previewPath: string;
  aliases: readonly CmsProjectAlias[];
};

export const CMS_BACKED_PROJECTS: readonly CmsBackedProject[] = [
  {
    routeSlug: "sck",
    cmsSlug: "sck",
    documentId: "project-sck",
    envKey: "HBW_SCK_SOURCE",
    label: "SCK",
    publicPath: "/projects/sck",
    previewSlug: "sck",
    previewPath: "/preview/sck",
    aliases: [],
  },
  {
    routeSlug: "bar-closed",
    cmsSlug: "closed",
    documentId: "project-closed",
    envKey: "HBW_CLOSED_SOURCE",
    label: "CLOSED",
    publicPath: "/projects/bar-closed",
    previewSlug: "closed",
    previewPath: "/preview/closed",
    aliases: [{ source: "/projects/closed", destination: "/projects/bar-closed" }],
  },
  {
    routeSlug: "koja",
    cmsSlug: "koja",
    documentId: "project-koja",
    envKey: "HBW_KOJA_SOURCE",
    label: "KOJA",
    publicPath: "/projects/koja",
    previewSlug: "koja",
    previewPath: "/preview/koja",
    aliases: [],
  },
  {
    routeSlug: "chris-sisarich",
    cmsSlug: "chris-sisarich",
    documentId: "project-chris-sisarich",
    envKey: "HBW_CHRIS_SOURCE",
    label: "Chris Sisarich",
    publicPath: "/projects/chris-sisarich",
    previewSlug: "chris-sisarich",
    previewPath: "/preview/chris-sisarich",
    aliases: [],
  },
  {
    routeSlug: "sub-3",
    cmsSlug: "sub-3",
    documentId: "project-sub3",
    envKey: "HBW_SUB3_SOURCE",
    label: "SUB:3",
    publicPath: "/projects/sub-3",
    previewSlug: "sub-3",
    previewPath: "/preview/sub-3",
    aliases: [],
  },
  {
    routeSlug: "our-boy-roy",
    cmsSlug: "our-boy-roy",
    documentId: "project-our-boy-roy",
    envKey: "HBW_OBR_SOURCE",
    label: "Our Boy Roy",
    publicPath: "/projects/our-boy-roy",
    previewSlug: "our-boy-roy",
    previewPath: "/preview/our-boy-roy",
    aliases: [],
  },
];

export const CMS_PREVIEW_SLUGS = CMS_BACKED_PROJECTS.map((project) => project.previewSlug);

export function cmsBackedProject(routeSlug: string): CmsBackedProject | undefined {
  return CMS_BACKED_PROJECTS.find((project) => project.routeSlug === routeSlug);
}

export function cmsProjectByCmsSlug(slug: string): CmsBackedProject | undefined {
  return CMS_BACKED_PROJECTS.find((project) => project.cmsSlug === slug);
}

export function cmsProjectByPreviewSlug(slug: string): CmsBackedProject | undefined {
  return CMS_BACKED_PROJECTS.find((project) => project.previewSlug === slug);
}

/** CMS slug → public catalog / route id. CLOSED is the first mismatch. */
export function catalogIdForSlug(slug: string) {
  return cmsProjectByCmsSlug(slug)?.routeSlug ?? slug;
}

export function sourceFlagFromEnv(
  envKey: CmsSourceEnvKey,
  env: Record<string, string | undefined> = process.env
): ProjectSource {
  return env[envKey] === "sanity" ? "sanity" : "local";
}

export function sourceFlagForProject(
  project: CmsBackedProject,
  env: Record<string, string | undefined> = process.env
): ProjectSource {
  return sourceFlagFromEnv(project.envKey, env);
}
