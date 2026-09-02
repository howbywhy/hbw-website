/**
 * Non-public read of the published SCK Sanity document.
 * Not imported by ProjectView, ProjectsLayer, HbwShell, or public /projects routes.
 */
import { createClient } from "@sanity/client";
import type { SanityProject } from "../adapter/types";
import { SCK_PROJECT_QUERY } from "./sck-content";

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

export async function fetchPublishedSckProject(): Promise<SanityProject> {
  const project = await sckReadClient().fetch<SanityProject | null>(SCK_PROJECT_QUERY);
  if (!project) throw new Error("Published SCK project was not found");
  return project;
}
