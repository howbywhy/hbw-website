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

/** Catalog chrome that stays out of Sanity for CLOSED preview. Public route stays bar-closed. */
export function catalogOwnedClosed(): CatalogPresentation {
  const shipped = projectById("bar-closed");
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

/** Catalog chrome that stays out of Sanity for KOJA preview. Public route stays local. */
export function catalogOwnedKoja(): CatalogPresentation {
  const shipped = projectById("koja");
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

/** Server-only. Sanity document → existing frontend models. SCK, CLOSED, and KOJA preview. */
export async function loadPublishedFrontendProject(slug: string) {
  if (slug === "sck") {
    const project = await fetchPublishedProjectBySlug("sck");
    return sanityProjectToFrontendProject(project, catalogOwnedSck(), sckMediaConfig());
  }
  if (slug === "closed") {
    const project = await fetchPublishedProjectBySlug("closed");
    return sanityProjectToFrontendProject(project, catalogOwnedClosed(), sckMediaConfig());
  }
  if (slug === "koja") {
    const project = await fetchPublishedProjectBySlug("koja");
    return sanityProjectToFrontendProject(project, catalogOwnedKoja(), sckMediaConfig());
  }
  throw new Error(`Published loader only supports sck, closed, or koja (received "${slug}")`);
}
