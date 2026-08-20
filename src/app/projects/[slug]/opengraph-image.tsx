import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { liveProjects } from "@/components/home/catalog";
import { OG_FONT, ogContentType, ogSize } from "@/lib/og-card";

type Props = { params: Promise<{ slug: string }> };

export const alt = "How by Why";
export const size = ogSize;
export const contentType = ogContentType;
export const dynamicParams = false;

export function generateStaticParams() {
  return liveProjects().map((project) => ({ slug: project.id }));
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const record = liveProjects().find((project) => project.id === slug);
  if (!record) notFound();
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
        <div style={{ display: "flex", fontSize: 56, marginTop: 32 }}>{record.name}</div>
        <div style={{ display: "flex", fontSize: 36, marginTop: 16, opacity: 0.55 }}>{record.idea}</div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [{ name: "Geist", data: font, weight: 400, style: "normal" }],
    },
  );
}
