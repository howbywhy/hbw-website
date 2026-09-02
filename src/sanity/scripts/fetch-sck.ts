/**
 * Published project reads. Used by preview and the SCK source resolver.
 * Presentation components do not import this module.
 */
import { createClient } from "@sanity/client";
import type { SanityProject } from "../adapter/types";
import { PROJECT_BY_SLUG_QUERY } from "./sck-content";

const PROJECT_ID = "aagd1kcy";
const DATASET = "production";

export function sckReadClient() {
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: "2025-02-19",
    useCdn: false,
    perspective: "published",
  });
}

export function sckMediaConfig() {
  return { projectId: PROJECT_ID, dataset: DATASET };
}

export async function fetchPublishedProjectBySlug(slug: string): Promise<SanityProject> {
  const project = await sckReadClient().fetch<SanityProject | null>(PROJECT_BY_SLUG_QUERY, { slug });
  if (!project) throw new Error(`Published project "${slug}" was not found`);
  return project;
}

export async function fetchPublishedSckProject(): Promise<SanityProject> {
  return fetchPublishedProjectBySlug("sck");
}
