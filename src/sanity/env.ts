/**
 * Public Sanity connection values only.
 * Do not put tokens here. Preview tokens belong in a later slice.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const FALLBACK_PROJECT_ID = "placeholder";
const FALLBACK_DATASET = "production";
const FALLBACK_API_VERSION = "2025-02-19";
const PUBLIC_SANITY_KEYS = [
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  "NEXT_PUBLIC_SANITY_DATASET",
  "NEXT_PUBLIC_SANITY_API_VERSION",
  "SANITY_STUDIO_PROJECT_ID",
  "SANITY_STUDIO_DATASET",
  "SANITY_API_VERSION",
] as const;

/** Next.js already loads .env.local. tsx scripts do not. */
function applyLocalPublicSanityEnv() {
  if (PUBLIC_SANITY_KEYS.some((key) => process.env[key]?.trim())) return;
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    if (!PUBLIC_SANITY_KEYS.includes(key as (typeof PUBLIC_SANITY_KEYS)[number])) continue;
    if (process.env[key]?.trim()) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

applyLocalPublicSanityEnv();

// Next only inlines static process.env.NEXT_PUBLIC_* reads. Dynamic
// process.env[name] resolves to undefined in the production SSG bundle.
export const sanityProjectId =
  process.env.SANITY_STUDIO_PROJECT_ID?.trim() ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ||
  FALLBACK_PROJECT_ID;
export const sanityDataset =
  process.env.SANITY_STUDIO_DATASET?.trim() ||
  process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() ||
  FALLBACK_DATASET;
export const sanityApiVersion =
  process.env.SANITY_API_VERSION?.trim() ||
  process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() ||
  FALLBACK_API_VERSION;

export function isSanityConfigured() {
  return sanityProjectId !== FALLBACK_PROJECT_ID;
}
