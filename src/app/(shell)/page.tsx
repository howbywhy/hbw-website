import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-meta";
import { StructuredData } from "@/components/StructuredData";
import { founderNode, studioNode, websiteNode, workListNode } from "@/lib/structured-data";

const title = SITE_TITLE;
const description = SITE_DESCRIPTION;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "How by Why — Clarity for brands at a turning point",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

export default function HomePage() {
  return <StructuredData nodes={[studioNode(), founderNode(), websiteNode(), workListNode()]} />;
}
