import type { Metadata } from "next";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbNode, studioNode, workListNode } from "@/lib/structured-data";

const title = "Projects — HBW";
const description =
  "Every project HBW has worked on: the client, what we did, the sector and the year. Brand strategy, identity, naming, packaging and websites.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/projects",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

/** The shell paints the index over the poster. This route carries the address. */
export default function ProjectsPage() {
  return (
    <StructuredData
      nodes={[
        studioNode(),
        workListNode(),
        breadcrumbNode([
          { name: "HBW", path: "/" },
          { name: "Projects", path: "/projects" },
        ]),
      ]}
    />
  );
}
