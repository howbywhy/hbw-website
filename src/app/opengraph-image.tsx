import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { OG_FONT, ogContentType, ogSize } from "@/lib/og-card";

export const alt = "How by Why — Clarity for brands at a turning point";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  const font = await readFile(OG_FONT);
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
          backgroundColor: "#f4f5f3",
          fontFamily: "Geist",
          color: "#333",
        }}
      >
        <div style={{ display: "flex", fontSize: 32 }}>How by Why</div>
        <div style={{ display: "flex", fontSize: 56, marginTop: 32 }}>
          Clarity for brands at a turning point
        </div>
        <div style={{ display: "flex", fontSize: 36, marginTop: 16, opacity: 0.55 }}>
          HBW is a Sydney brand and design practice working with founders at moments of change. Strategy, identity, and design.
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [{ name: "Geist", data: font, weight: 400, style: "normal" }],
    },
  );
}
