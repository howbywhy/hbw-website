/**
 * Published project reads. Used by preview and the published source resolver.
 * Presentation components do not import this module.
 */
import { createClient } from "@sanity/client";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "../env";
import type { SanityProject } from "../adapter/types";
import { PROJECT_BY_SLUG_QUERY } from "./sck-content";

/** Known production project. Used when Next SSG cannot see public env. */
const PRODUCTION_PROJECT_ID = "aagd1kcy";
const PRODUCTION_DATASET = "production";
const PRODUCTION_API_VERSION = "2025-02-19";

function publishedProjectId() {
  return sanityProjectId === "placeholder" ? PRODUCTION_PROJECT_ID : sanityProjectId;
}

function publishedDataset() {
  return sanityDataset || PRODUCTION_DATASET;
}

function publishedApiVersion() {
  return sanityApiVersion || PRODUCTION_API_VERSION;
}

export function sckReadClient() {
  return createClient({
    projectId: publishedProjectId(),
    dataset: publishedDataset(),
    apiVersion: publishedApiVersion(),
    useCdn: false,
    perspective: "published",
  });
}

export function sckMediaConfig() {
  return { projectId: publishedProjectId(), dataset: publishedDataset() };
}

export async function fetchPublishedProjectBySlug(slug: string): Promise<SanityProject> {
  const project = await sckReadClient().fetch<SanityProject | null>(PROJECT_BY_SLUG_QUERY, { slug });
  if (!project) throw new Error(`Published project "${slug}" was not found`);
  return project;
}

export async function fetchPublishedSckProject(): Promise<SanityProject> {
  return fetchPublishedProjectBySlug("sck");
}
