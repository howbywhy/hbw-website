/**
 * Published project reads. Used by preview and the published source resolver.
 * Presentation components do not import this module.
 */
import { createClient } from "@sanity/client";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "../env";
import type { SanityProject } from "../adapter/types";
import { PROJECT_BY_SLUG_QUERY } from "./sck-content";

export function sckReadClient() {
  return createClient({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    apiVersion: sanityApiVersion,
    useCdn: false,
    perspective: "published",
  });
}

export function sckMediaConfig() {
  return { projectId: sanityProjectId, dataset: sanityDataset };
}

export async function fetchPublishedProjectBySlug(slug: string): Promise<SanityProject> {
  const project = await sckReadClient().fetch<SanityProject | null>(PROJECT_BY_SLUG_QUERY, { slug });
  if (!project) throw new Error(`Published project "${slug}" was not found`);
  return project;
}

export async function fetchPublishedSckProject(): Promise<SanityProject> {
  return fetchPublishedProjectBySlug("sck");
}
