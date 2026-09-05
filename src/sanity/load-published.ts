import { projectById } from "@/components/home/catalog";
import { cmsProjectByCmsSlug } from "@/lib/cms-source";
import type { CatalogPresentation } from "@/sanity/adapter/types";
import { sanityProjectToFrontendProject } from "@/sanity/adapter/map";
import { fetchPublishedProjectBySlug, sckMediaConfig } from "@/sanity/scripts/fetch-sck";

/** Catalog chrome that stays out of Sanity. Browse / Home remain catalog.ts. */
export function catalogOwned(routeSlug: string): CatalogPresentation {
  const shipped = projectById(routeSlug);
  return {
    crop: shipped.crop,
    layout: shipped.layout,
    visualSpan: shipped.visualSpan,
    visualStart: shipped.visualStart,
    visualBefore: shipped.visualBefore,
    homeSelected: shipped.homeSelected,
    credits: shipped.credits,
    features: shipped.features,
    status: shipped.status,
    collaborators: shipped.collaborators,
  };
}

/** Server-only. CMS slug → published Sanity document → existing frontend models. */
export async function loadPublishedFrontendProject(slug: string) {
  const cms = cmsProjectByCmsSlug(slug);
  if (!cms) {
    throw new Error(
      `Published loader only supports sck, closed, koja, chris-sisarich, sub-3, or our-boy-roy (received "${slug}")`
    );
  }
  const project = await fetchPublishedProjectBySlug(cms.cmsSlug);
  return sanityProjectToFrontendProject(project, catalogOwned(cms.routeSlug), sckMediaConfig());
}
