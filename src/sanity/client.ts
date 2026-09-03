import { createClient } from "@sanity/client";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "@/sanity/env";

/**
 * Read-only public client. Not imported by ProjectView or ProjectsLayer.
 * The public site still renders from experiences.ts.
 */
export const sanityClient = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: true,
  perspective: "published",
});
