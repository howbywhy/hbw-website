import { loadPublishedFrontendProject } from "@/sanity/load-published";

export { catalogOwnedClosed } from "@/sanity/load-published";

/** Validation-only. Published CLOSED document. Does not switch /projects/bar-closed. */
export async function loadClosedPreview() {
  return loadPublishedFrontendProject("closed");
}
