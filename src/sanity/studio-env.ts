/**
 * Browser-safe Sanity connection values for the Studio bundle.
 *
 * src/sanity/env.ts is the Node side: it reads .env.local off disk and
 * touches process.cwd(). Importing it from sanity.config.ts put node:fs and
 * a bare `process` into the Studio's Vite bundle, which threw
 * "process is not defined" before the Studio could render.
 *
 * Nothing here imports Node built-ins. Every read is a static
 * process.env.SANITY_STUDIO_* literal so Vite can replace it at build time,
 * guarded so the expression is still safe if it is left standing.
 */

const FALLBACK_PROJECT_ID = "aagd1kcy";
const FALLBACK_DATASET = "production";

function read(value: string | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** True when `process` exists at all. Safe on a bare identifier. */
const hasProcess = typeof process !== "undefined" && typeof process.env === "object";

export const studioProjectId =
  (hasProcess ? read(process.env.SANITY_STUDIO_PROJECT_ID) : undefined) || FALLBACK_PROJECT_ID;

export const studioDataset =
  (hasProcess ? read(process.env.SANITY_STUDIO_DATASET) : undefined) || FALLBACK_DATASET;

export const studioPreviewOrigin =
  (hasProcess ? read(process.env.SANITY_STUDIO_PREVIEW_ORIGIN) : undefined) || "https://www.hbw.works";

export const studioOrigin =
  (hasProcess ? read(process.env.SANITY_STUDIO_URL) : undefined) || "https://hbw.sanity.studio";
