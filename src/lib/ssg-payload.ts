import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Fourth SCK film — present only when the full case-study experience is serialized. */
export const SCK_MOVEMENT_PAYLOAD_MARKER = "/projects/sck/web/4.mp4";
export const SCK_MOVEMENT_ID_MARKER = "sk14";

/** CLOSED film alt — present in local and Sanity case-study payloads, not catalog thumbs. */
export const CLOSED_EXPERIENCE_MARKER = "Two white eyes in a rough black bar on white.";
export const CLOSED_LOCAL_FILM_MARKER = "/projects/bar-closed/web/CLOSED-Eyes.mp4";

/** KOJA film alt — present in local and Sanity case-study payloads, not catalog thumbs. */
export const KOJA_EXPERIENCE_MARKER = "Peanut Fudge plant-protein bar on a cork coaster beside palo santo.";
export const KOJA_LOCAL_FILM_MARKER = "/projects/koja/web/KOJA-Peanut-Fudge.mp4";

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
  return payload.includes(SCK_MOVEMENT_PAYLOAD_MARKER) || payload.includes(SCK_MOVEMENT_ID_MARKER);
}

export function ssgPayloadHasClosedExperience(rel: string) {
  const payload = readSsgPayload(rel);
  return payload.includes(CLOSED_EXPERIENCE_MARKER) || payload.includes(CLOSED_LOCAL_FILM_MARKER);
}

export function ssgPayloadHasKojaExperience(rel: string) {
  const payload = readSsgPayload(rel);
  return payload.includes(KOJA_EXPERIENCE_MARKER) || payload.includes(KOJA_LOCAL_FILM_MARKER);
}
