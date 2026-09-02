import { projectById } from "@/components/home/catalog";
import type { CatalogPresentation } from "@/sanity/adapter/types";
import { sanityProjectToFrontendProject } from "@/sanity/adapter/map";
import { fetchPublishedProjectBySlug, sckMediaConfig } from "@/sanity/scripts/fetch-sck";

/** Catalog chrome that stays out of Sanity for the first SCK cutover. */
export function catalogOwnedSck(): CatalogPresentation {
  const shipped = projectById("sck");
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

/** Server-only. Sanity document → existing frontend models. */
export async function loadPublishedFrontendProject(slug: string) {
  if (slug !== "sck") {
    throw new Error(`Published loader only supports sck in G8 (received "${slug}")`);
  }
  const project = await fetchPublishedProjectBySlug(slug);
  return sanityProjectToFrontendProject(project, catalogOwnedSck(), sckMediaConfig());
}
