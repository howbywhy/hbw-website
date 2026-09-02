import { loadPublishedFrontendProject } from "@/sanity/load-published";

export { catalogOwnedObr } from "@/sanity/load-published";

/** Preview-only. Published Our Boy Roy document. Independent of HBW_OBR_SOURCE. */
export async function loadObrPreview() {
  return loadPublishedFrontendProject("our-boy-roy");
}
