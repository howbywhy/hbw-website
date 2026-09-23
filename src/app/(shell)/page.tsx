import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { founderNode, studioNode, websiteNode, workListNode } from "@/lib/structured-data";

const title = "HBW — Clarity for brands at a turning point";
const description =
  "HBW (How by Why) is an independent brand and design practice led by Mark Blackler, based in the Blue Mountains and working with founders across Sydney and Australia. Brand strategy, identity and design.";

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
