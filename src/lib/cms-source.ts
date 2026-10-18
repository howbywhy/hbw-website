/** CMS-backed project registry. Routing, source flags, and document identity only. */

export type ProjectSource = "sanity" | "local";

/** Production env name. Short token, not derived from the public slug. */
export type CmsSourceEnvKey = `HBW_${string}_SOURCE`;

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

export type CmsProjectInput = {
  routeSlug: string;
  cmsSlug: string;
  documentId: string;
  envKey: CmsSourceEnvKey;
  label: string;
  previewSlug?: string;
  aliases?: readonly CmsProjectAlias[];
};

/** Derive public/preview paths from identity. CLOSED is the only alias case. */
export function defineCmsProject(input: CmsProjectInput): CmsBackedProject {
  const previewSlug = input.previewSlug ?? input.cmsSlug;
  return {
    routeSlug: input.routeSlug,
    cmsSlug: input.cmsSlug,
    documentId: input.documentId,
    envKey: input.envKey,
    label: input.label,
    publicPath: `/projects/${input.routeSlug}`,
    previewSlug,
    previewPath: `/preview/${previewSlug}`,
    aliases: input.aliases ?? [],
  };
}

export const CMS_BACKED_PROJECTS: readonly CmsBackedProject[] = [
  defineCmsProject({
    routeSlug: "sck",
    cmsSlug: "sck",
    documentId: "project-sck",
    envKey: "HBW_SCK_SOURCE",
    label: "SCK",
  }),
  defineCmsProject({
    routeSlug: "bar-closed",
    cmsSlug: "closed",
    documentId: "project-closed",
    envKey: "HBW_CLOSED_SOURCE",
    label: "CLOSED",
    aliases: [{ source: "/projects/closed", destination: "/projects/bar-closed" }],
  }),
  defineCmsProject({
    routeSlug: "koja",
    cmsSlug: "koja",
    documentId: "project-koja",
    envKey: "HBW_KOJA_SOURCE",
    label: "KOJA",
  }),
  defineCmsProject({
    routeSlug: "chris-sisarich",
    cmsSlug: "chris-sisarich",
    documentId: "project-chris-sisarich",
    envKey: "HBW_CHRIS_SOURCE",
    label: "Chris Sisarich",
  }),
  defineCmsProject({
    routeSlug: "sub-3",
    cmsSlug: "sub-3",
    documentId: "project-sub3",
    envKey: "HBW_SUB3_SOURCE",
    label: "SUB:3",
  }),
  defineCmsProject({
    routeSlug: "our-boy-roy",
    cmsSlug: "our-boy-roy",
    documentId: "project-our-boy-roy",
    envKey: "HBW_OBR_SOURCE",
    label: "Our Boy Roy",
  }),
];

export const CMS_PREVIEW_SLUGS = CMS_BACKED_PROJECTS.map((project) => project.previewSlug);
export const CMS_SLUGS = CMS_BACKED_PROJECTS.map((project) => project.cmsSlug);

/** Seed safety: any published project slug not in the registry. */
export function unknownCmsProjectSlugQuery() {
  const list = CMS_SLUGS.map((slug) => JSON.stringify(slug)).join(", ");
  return `*[_type == "project" && !(slug.current in [${list}])].slug.current`;
}

export function cmsBackedProject(routeSlug: string): CmsBackedProject | undefined {
  return CMS_BACKED_PROJECTS.find((project) => project.routeSlug === routeSlug);
}

export function cmsProjectByCmsSlug(slug: string): CmsBackedProject | undefined {
  return CMS_BACKED_PROJECTS.find((project) => project.cmsSlug === slug);
}

export function cmsProjectByPreviewSlug(slug: string): CmsBackedProject | undefined {
  return CMS_BACKED_PROJECTS.find((project) => project.previewSlug === slug);
}

export function cmsProjectByDocumentId(id: string): CmsBackedProject | undefined {
  return CMS_BACKED_PROJECTS.find((project) => project.documentId === id);
}

export function isKnownPublishedProjectId(id: string) {
  return Boolean(cmsProjectByDocumentId(id));
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
