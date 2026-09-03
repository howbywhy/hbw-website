import { loadPublishedFrontendProject } from "@/sanity/load-published";

export { catalogOwnedKoja } from "@/sanity/load-published";

/** Validation-only. Published KOJA document. Does not switch /projects/koja. */
export async function loadKojaPreview() {
  return loadPublishedFrontendProject("koja");
}
