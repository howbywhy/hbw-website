import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Fourth SCK film — present only when the full case-study experience is serialized. */
export const SCK_MOVEMENT_PAYLOAD_MARKER = "/projects/sck/web/4.mp4";
export const SCK_MOVEMENT_ID_MARKER = "sk14";

/** CLOSED film alt — present in local and Sanity case-study payloads, not catalog thumbs. */
export const CLOSED_EXPERIENCE_MARKER = "Torn-paper collage of happy-hour type, bottle silhouettes, a bar photo, and plated food.";
export const CLOSED_LOCAL_FILM_MARKER = "/projects/bar-closed/web/HBWxCLOSED-Portfolio-01.mp4";

/** KOJA film alt — present in local and Sanity case-study payloads, not catalog thumbs. */
export const KOJA_EXPERIENCE_MARKER = "Peanut Fudge plant-protein bar on a cork coaster beside palo santo.";
export const KOJA_LOCAL_FILM_MARKER = "/projects/koja/web/KOJA-Peanut-Fudge.mp4";

/** Chris film alt — present in local and Sanity case-study payloads, not catalog thumbs. */
export const CHRIS_EXPERIENCE_MARKER = "Homepage with the name over scattered photography thumbnails as they rearrange.";
export const CHRIS_LOCAL_FILM_MARKER = "/projects/chris-sisarich/web/HBWCSHOME-Website.mp4";

/** SUB:3 film alt — present in local and Sanity case-study payloads, not catalog thumbs. */
export const SUB3_EXPERIENCE_MARKER = "Angular SUB:3 lettering stretching and compressing on black.";
export const SUB3_LOCAL_FILM_MARKER = "/projects/sub-3/web/SUB3-Type-Stretch-Texture.mp4";

/** OBR film alt — present in local and Sanity case-study payloads, not catalog thumbs. */
export const OBR_EXPERIENCE_MARKER = "Line-drawn figure in checkered pants holding a bottle as the ground colour shifts.";
export const OBR_LOCAL_FILM_MARKER = "/projects/our-boy-roy/web/OBR-Colour-Change.mp4";

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

export function ssgPayloadHasChrisExperience(rel: string) {
  const payload = readSsgPayload(rel);
  return payload.includes(CHRIS_EXPERIENCE_MARKER) || payload.includes(CHRIS_LOCAL_FILM_MARKER);
}

export function ssgPayloadHasSub3Experience(rel: string) {
  const payload = readSsgPayload(rel);
  return payload.includes(SUB3_EXPERIENCE_MARKER) || payload.includes(SUB3_LOCAL_FILM_MARKER);
}

export function ssgPayloadHasObrExperience(rel: string) {
  const payload = readSsgPayload(rel);
  return payload.includes(OBR_EXPERIENCE_MARKER) || payload.includes(OBR_LOCAL_FILM_MARKER);
}
