import { loadPublishedFrontendProject } from "@/sanity/load-published";

export { catalogOwnedSub3 } from "@/sanity/load-published";

/** Preview-only. Published SUB:3 document. Independent of HBW_SUB3_SOURCE. */
export async function loadSub3Preview() {
  return loadPublishedFrontendProject("sub-3");
}
