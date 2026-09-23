import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbNode, founderNode, studioNode } from "@/lib/structured-data";
import { STUDIO_COPY } from "@/components/home/studio-copy";

const title = "Studio — HBW";
const description = STUDIO_COPY.opening;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/studio",
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/studio",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function StudioPage() {
  return (
    <StructuredData
      nodes={[
        studioNode(),
        founderNode(),
        breadcrumbNode([
          { name: "HBW", path: "/" },
          { name: "Studio", path: "/studio" },
        ]),
      ]}
    />
  );
}
