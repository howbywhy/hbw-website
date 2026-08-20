import { join } from "node:path";

/** Second source. Names in comments are the CSS tokens these mirror.
 *  ImageResponse only paints style literals declared in the opengraph-image
 *  module — keep those literals in lockstep with this object. */
export const OG = {
  width: 1200,
  height: 630,
  field: "#f4f5f3", // --hbw-field
  ink: "#333", // workspace body; not a named token
  mutedAlpha: 0.55, // .hbw-mark-descriptor
  track: 0.02, // --hbw-ui-track (em)
  inset: 80, // OG-only; platform corner clip; not a CSS token
  spaceTitle: 32, // --hbw-space-4
  spaceLine: 16, // --hbw-space-3
  markSize: 32,
  titleSize: 56,
  lineSize: 36,
  markLeading: 38, // 32 * --hbw-lh-ui
  titleLeading: 67, // 56 * --hbw-lh-ui
  lineLeading: 43, // 36 * --hbw-lh-ui
} as const;

export const ogSize = { width: OG.width, height: OG.height };
export const ogContentType = "image/png";

export const OG_FONT = join(process.cwd(), "public/fonts/671a30d6ef2a1073319beaeb_Geist-Regular.otf");
