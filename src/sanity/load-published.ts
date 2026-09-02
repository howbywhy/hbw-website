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

/** Catalog chrome that stays out of Sanity for Chris. Browse remains catalog.ts. */
export function catalogOwnedChris(): CatalogPresentation {
  const shipped = projectById("chris-sisarich");
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

/** Catalog chrome that stays out of Sanity for SUB:3. Browse remains catalog.ts. */
export function catalogOwnedSub3(): CatalogPresentation {
  const shipped = projectById("sub-3");
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

/** Catalog chrome that stays out of Sanity for OBR. Browse remains catalog.ts. */
export function catalogOwnedObr(): CatalogPresentation {
  const shipped = projectById("our-boy-roy");
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

/** Server-only. Sanity document → existing frontend models. Preview includes OBR. */
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
  if (slug === "chris-sisarich") {
    const project = await fetchPublishedProjectBySlug("chris-sisarich");
    return sanityProjectToFrontendProject(project, catalogOwnedChris(), sckMediaConfig());
  }
  if (slug === "sub-3") {
    const project = await fetchPublishedProjectBySlug("sub-3");
    return sanityProjectToFrontendProject(project, catalogOwnedSub3(), sckMediaConfig());
  }
  if (slug === "our-boy-roy") {
    const project = await fetchPublishedProjectBySlug("our-boy-roy");
    return sanityProjectToFrontendProject(project, catalogOwnedObr(), sckMediaConfig());
  }
  throw new Error(
    `Published loader only supports sck, closed, koja, chris-sisarich, sub-3, or our-boy-roy (received "${slug}")`
  );
}
