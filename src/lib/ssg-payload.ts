import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** An SCK movement id — present only when the sequence itself is serialized. */
export const SCK_MOVEMENT_ID_MARKER = "sk14";

/** CLOSED movement alt — serialized with the sequence, never with a catalog thumb. */
export const CLOSED_EXPERIENCE_MARKER = "Torn-paper collage of happy-hour type, bottle silhouettes, a bar photo, and plated food.";

/** KOJA movement alt — serialized with the sequence, never with a catalog thumb. */
export const KOJA_EXPERIENCE_MARKER =
  "The KOJA logotype assembling letter by letter, the ground changing colour behind it.";

/** Chris movement alt — serialized with the sequence, never with a catalog thumb. */
export const CHRIS_EXPERIENCE_MARKER =
  "Rubble and two blocks of orange-striped stone under a pale sky, a handwritten note pinned above them and a fine blue arc drawn across.";

/** SUB:3 film alt — present in local and Sanity case-study payloads, not catalog thumbs. */
export const SUB3_EXPERIENCE_MARKER = "A PRE-RUN pouch suspended in darkness, catching a hard flare of light.";

/** OBR movement alt — serialized with the sequence, never with a catalog thumb. */
/** OBR movement alt — serialized with the sequence, never with a catalog thumb. */
export const OBR_EXPERIENCE_MARKER =
  "A line-drawn figure in checked trousers on pale yellow, the ground colour shifting behind.";

/**
 * What counts as "this page carries that case study".
 *
 * A movement's alt text, or a movement id — both exist only where the
 * sequence itself has been serialized. A film's path used to count too, and
 * stopped being evidence when a project page began prefetching its
 * neighbours' media: Chris's paths turned up on SCK, KOJA and SUB:3 without
 * a word of Chris's sequence being on any of them, and the check called that
 * a leak. Paths are what the prefetch is for; words are what the payload is.
 */
const APP = path.join(process.cwd(), ".next/server/app");

export function ssgAppDir() {
  return APP;
}

export function readSsgPayload(rel: string) {
  const html = path.join(APP, `${rel}.html`);
  const rsc = path.join(APP, `${rel}.rsc`);
  const parts: string[] = [];
  if (existsSync(html)) parts.push(readFileSync(html, "utf8"));
  if (existsSync(rsc)) parts.push(readFileSync(rsc, "utf8"));
  return parts.join("\n");
}

export function ssgPayloadHasSckExperience(rel: string) {
  const payload = readSsgPayload(rel);
  return payload.includes(SCK_MOVEMENT_ID_MARKER);
}

export function ssgPayloadHasClosedExperience(rel: string) {
  const payload = readSsgPayload(rel);
  return payload.includes(CLOSED_EXPERIENCE_MARKER);
}

export function ssgPayloadHasKojaExperience(rel: string) {
  const payload = readSsgPayload(rel);
  return payload.includes(KOJA_EXPERIENCE_MARKER);
}

export function ssgPayloadHasChrisExperience(rel: string) {
  const payload = readSsgPayload(rel);
  return payload.includes(CHRIS_EXPERIENCE_MARKER);
}

export function ssgPayloadHasSub3Experience(rel: string) {
  const payload = readSsgPayload(rel);
  return payload.includes(SUB3_EXPERIENCE_MARKER);
}

export function ssgPayloadHasObrExperience(rel: string) {
  const payload = readSsgPayload(rel);
  return payload.includes(OBR_EXPERIENCE_MARKER);
}
