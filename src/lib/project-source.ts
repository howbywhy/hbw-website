import { getExperience } from "@/components/home/projects/experiences";
import type { ProjectExperience } from "@/components/home/projects/types";

export type ProjectSource = "sanity" | "local";

export type ResolvedProjectExperience = {
  experience: ProjectExperience | null;
  source: ProjectSource;
};

export type ResolveProjectExperienceDeps = {
  sourceFlag?: ProjectSource;
  loadPublishedExperience?: (slug: string) => Promise<ProjectExperience>;
};

/** Missing or any value other than "sanity" stays on local SCK. Safer default. */
export function sckSourceFlag(env: Record<string, string | undefined> = process.env): ProjectSource {
  return env.HBW_SCK_SOURCE === "sanity" ? "sanity" : "local";
}

async function defaultLoadPublishedExperience(slug: string): Promise<ProjectExperience> {
  const { loadPublishedFrontendProject } = await import("@/sanity/load-published");
  const loaded = await loadPublishedFrontendProject(slug);
  return loaded.experience;
}

/**
 * Source-neutral case-study resolver. SCK is the only slug that may read Sanity.
 * Fetch/adapter failures fall back to the shipped local experience.
 */
export async function resolveProjectExperience(
  slug: string,
  deps: ResolveProjectExperienceDeps = {}
): Promise<ResolvedProjectExperience> {
  const local = getExperience(slug);
  if (slug !== "sck") {
    return { experience: local, source: "local" };
  }

  const flag = deps.sourceFlag ?? sckSourceFlag();
  if (flag !== "sanity") {
    return { experience: local, source: "local" };
  }

  try {
    const load = deps.loadPublishedExperience ?? defaultLoadPublishedExperience;
    const experience = await load(slug);
    if (!experience) throw new Error("Published SCK experience was empty");
    return { experience, source: "sanity" };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    console.warn(`[hbw] SCK CMS source failed (${reason}); using local fallback`);
    return { experience: local, source: "local" };
  }
}
