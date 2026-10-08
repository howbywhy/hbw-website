/**
 * Every case study, resolved at build time.
 *
 * Server only. resolveProjectExperience already decides, per project, whether
 * to read the CMS or the sequence the site ships with, and falls back to the
 * shipped one on any failure. This runs it for the whole line in one go so a
 * layout can hand the result to the shell, which is what finally puts CMS
 * content on the page: until now the resolver existed and nothing called it.
 *
 * A project that resolves to nothing is left out rather than stored as null,
 * so a consumer reading a missing slug falls through to getExperience and gets
 * the shipped sequence, exactly as it did before.
 */
import { liveProjects } from "@/components/home/catalog";
import type { ProjectExperience } from "@/components/home/projects/types";
import { resolveProjectExperience } from "@/lib/project-source";

export type ExperienceMap = Record<string, ProjectExperience>;

export async function loadExperiences(slugs?: string[]): Promise<ExperienceMap> {
  const ids = slugs ?? liveProjects().map((project) => project.id);
  const resolved = await Promise.all(
    ids.map(async (id) => [id, (await resolveProjectExperience(id)).experience] as const)
  );
  const map: ExperienceMap = {};
  for (const [id, experience] of resolved) if (experience) map[id] = experience;
  return map;
}
