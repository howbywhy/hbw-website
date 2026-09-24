import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { indexSpan } from "@/components/home/index-entry";
import { OG_FONT, ogContentType, ogSize } from "@/lib/og-card";
import { loadIndex } from "@/sanity/load-index";

export const alt = "Projects — How by Why";
export const size = ogSize;
export const contentType = ogContentType;

/**
 * The index was the one page with no share card. Every other route had one, so
 * the page that lists all of the work — the one worth sending someone — was
 * the one that arrived in a message as a bare link.
 *
 * The line is the same count the page itself prints, read from the CMS at
 * build time, so the card cannot claim a number the index does not show.
 * loadIndex falls back to the catalog rather than throwing, so this cannot
 * fail the build.
 */
export default async function Image() {
  const font = await readFile(OG_FONT);
  const span = indexSpan(await loadIndex());
  const line = `${span.count} projects · ${span.from}–${span.to}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          backgroundColor: "#faf8f3",
          fontFamily: "Geist",
          color: "#333",
        }}
      >
        <div style={{ display: "flex", fontSize: 32 }}>How by Why</div>
        <div style={{ display: "flex", fontSize: 56, marginTop: 32 }}>Projects</div>
        <div style={{ display: "flex", fontSize: 36, marginTop: 16, opacity: 0.55 }}>{line}</div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [{ name: "Geist", data: font, weight: 400, style: "normal" }],
    },
  );
}
