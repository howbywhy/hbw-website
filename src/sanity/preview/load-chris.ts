import { loadPublishedFrontendProject } from "@/sanity/load-published";

export { catalogOwnedChris } from "@/sanity/load-published";

/** Preview-only. Published Chris Sisarich document. Independent of HBW_CHRIS_SOURCE. */
export async function loadChrisPreview() {
  return loadPublishedFrontendProject("chris-sisarich");
}
