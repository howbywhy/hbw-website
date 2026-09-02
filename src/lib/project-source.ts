import { getExperience } from "@/components/home/projects/experiences";
import type { ProjectExperience } from "@/components/home/projects/types";
import {
  cmsBackedProject,
  sourceFlagFromEnv,
  type ProjectSource,
} from "@/lib/cms-source";

export type { ProjectSource };
export { catalogIdForSlug, cmsBackedProject, sourceFlagFromEnv } from "@/lib/cms-source";

export type ResolvedProjectExperience = {
  experience: ProjectExperience | null;
  source: ProjectSource;
};

export type ResolveProjectExperienceDeps = {
  sourceFlag?: ProjectSource;
  loadPublishedExperience?: (cmsSlug: string) => Promise<ProjectExperience>;
};

/** Missing or any value other than "sanity" stays on local SCK. Safer default. */
export function sckSourceFlag(env: Record<string, string | undefined> = process.env): ProjectSource {
  return sourceFlagFromEnv("HBW_SCK_SOURCE", env);
}

/** Missing or any value other than "sanity" stays on local CLOSED. Safer default. */
export function closedSourceFlag(env: Record<string, string | undefined> = process.env): ProjectSource {
  return sourceFlagFromEnv("HBW_CLOSED_SOURCE", env);
}

/** Missing or any value other than "sanity" stays on local KOJA. Safer default. */
export function kojaSourceFlag(env: Record<string, string | undefined> = process.env): ProjectSource {
  return sourceFlagFromEnv("HBW_KOJA_SOURCE", env);
}

/** Missing or any value other than "sanity" stays on local Chris. Safer default. */
export function chrisSourceFlag(env: Record<string, string | undefined> = process.env): ProjectSource {
  return sourceFlagFromEnv("HBW_CHRIS_SOURCE", env);
}

/** Missing or any value other than "sanity" stays on local SUB:3. Safer default. */
export function sub3SourceFlag(env: Record<string, string | undefined> = process.env): ProjectSource {
  return sourceFlagFromEnv("HBW_SUB3_SOURCE", env);
}

async function defaultLoadPublishedExperience(cmsSlug: string): Promise<ProjectExperience> {
  const { loadPublishedFrontendProject } = await import("@/sanity/load-published");
  const loaded = await loadPublishedFrontendProject(cmsSlug);
  return loaded.experience;
}

function asRouteExperience(experience: ProjectExperience, routeSlug: string): ProjectExperience {
  return experience.slug === routeSlug ? experience : { ...experience, slug: routeSlug };
}

/**
 * Source-neutral case-study resolver. SCK, CLOSED, KOJA, Chris, and SUB:3 may read Sanity.
 * Fetch/adapter failures fall back to the shipped local experience.
 */
export async function resolveProjectExperience(
  slug: string,
  deps: ResolveProjectExperienceDeps = {}
): Promise<ResolvedProjectExperience> {
  const local = getExperience(slug);
  const cms = cmsBackedProject(slug);
  if (!cms) {
    return { experience: local, source: "local" };
  }

  const flag = deps.sourceFlag ?? sourceFlagFromEnv(cms.envKey);
  if (flag !== "sanity") {
    return { experience: local, source: "local" };
  }

  try {
    const load = deps.loadPublishedExperience ?? defaultLoadPublishedExperience;
    const published = await load(cms.cmsSlug);
    if (!published) throw new Error(`Published ${cms.label} experience was empty`);
    return { experience: asRouteExperience(published, cms.routeSlug), source: "sanity" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    console.warn(`[hbw] ${cms.label} CMS source failed (${reason}); using local fallback`);
    return { experience: local, source: "local" };
  }
}
