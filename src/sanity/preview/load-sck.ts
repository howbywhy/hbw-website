import { projectById } from "@/components/home/catalog";
import type { CatalogPresentation } from "@/sanity/adapter/types";
import { sanityProjectToFrontendProject } from "@/sanity/adapter/map";
import { fetchPublishedSckProject, sckMediaConfig } from "@/sanity/scripts/fetch-sck";

/** Catalog chrome that stays out of Sanity for G6. */
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
export async function loadSckPreview() {
  const project = await fetchPublishedSckProject();
  return sanityProjectToFrontendProject(project, catalogOwnedSck(), sckMediaConfig());
}
