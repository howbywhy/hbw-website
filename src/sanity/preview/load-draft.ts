import { cmsProjectByCmsSlug } from "@/lib/cms-source";
import { sanityProjectToFrontendProject } from "../adapter/map";
import { catalogOwned } from "../load-published";
import { draftMediaConfig, fetchDraftProjectBySlug } from "./draft-client";
import { DraftPreviewError } from "./token";

/** Server-only. CMS slug → draft-aware Sanity document. Public routes must not import this. */
export async function loadDraftFrontendProject(
  slug: string,
  env: Record<string, string | undefined> = process.env
) {
  const cms = cmsProjectByCmsSlug(slug);
  if (!cms) {
    throw new DraftPreviewError(
      "invalid",
      `Draft loader only supports sck, closed, koja, chris-sisarich, sub-3, or our-boy-roy (received "${slug}")`
    );
  }
  const project = await fetchDraftProjectBySlug(cms.cmsSlug, env);
  return sanityProjectToFrontendProject(project, catalogOwned(cms.routeSlug), draftMediaConfig());
}
