import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Fourth SCK film — present only when the full case-study experience is serialized. */
export const SCK_MOVEMENT_PAYLOAD_MARKER = "/projects/sck/web/4.mp4";
export const SCK_MOVEMENT_ID_MARKER = "sk14";

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
