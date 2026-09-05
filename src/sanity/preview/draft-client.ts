import { createClient } from "@sanity/client";
import type { SanityProject } from "../adapter/types";
import { PROJECT_BY_SLUG_QUERY } from "../scripts/sck-content";
import { sckMediaConfig, sckReadClient } from "../scripts/fetch-sck";
import { DraftPreviewError, requireSanityReadToken } from "./token";

export function draftReadClient(env: Record<string, string | undefined> = process.env) {
  const published = sckReadClient();
  return published.withConfig({
    token: requireSanityReadToken(env),
    useCdn: false,
    perspective: "previewDrafts",
    stega: false,
  });
}

export function draftMediaConfig() {
  return sckMediaConfig();
}

export async function fetchDraftProjectBySlug(
  slug: string,
  env: Record<string, string | undefined> = process.env
): Promise<SanityProject> {
  const project = await draftReadClient(env).fetch<SanityProject | null>(PROJECT_BY_SLUG_QUERY, { slug });
  if (!project) throw new DraftPreviewError("missing", `No draft or published project was found for "${slug}".`);
  return project;
}

