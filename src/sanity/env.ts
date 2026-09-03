/**
 * Public Sanity connection values only.
 * Do not put tokens here. Preview tokens belong in a later slice.
 */

const FALLBACK_PROJECT_ID = "placeholder";
const FALLBACK_DATASET = "production";
const FALLBACK_API_VERSION = "2025-02-19";

function readPublic(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

export const sanityProjectId =
  process.env.SANITY_STUDIO_PROJECT_ID?.trim() ||
  readPublic("NEXT_PUBLIC_SANITY_PROJECT_ID", FALLBACK_PROJECT_ID);
export const sanityDataset =
  process.env.SANITY_STUDIO_DATASET?.trim() ||
  readPublic("NEXT_PUBLIC_SANITY_DATASET", FALLBACK_DATASET);
export const sanityApiVersion =
  process.env.SANITY_API_VERSION?.trim() ||
  readPublic("NEXT_PUBLIC_SANITY_API_VERSION", FALLBACK_API_VERSION);

export function isSanityConfigured() {
  return sanityProjectId !== FALLBACK_PROJECT_ID;
}
