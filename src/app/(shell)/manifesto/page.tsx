import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { founderNode, studioNode } from "@/lib/structured-data";
import { MANIFESTO_COPY } from "@/components/home/studio-copy";

const title = "Manifesto — HBW";
const description = MANIFESTO_COPY.opening.join(" ");

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
    url: "/manifesto",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function ManifestoPage() {
  return <StructuredData nodes={[studioNode(), founderNode()]} />;
}
