import { loadPublishedFrontendProject } from "@/sanity/load-published";

export { catalogOwnedSck } from "@/sanity/load-published";

/** Validation-only. Same published SCK document as the production resolver. */
export async function loadSckPreview() {
  return loadPublishedFrontendProject("sck");
}
