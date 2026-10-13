import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-meta";
import { StructuredData } from "@/components/StructuredData";
import { founderNode, studioNode, websiteNode, workListNode } from "@/lib/structured-data";
import { loadCatalog } from "@/sanity/load-catalog";
import { loadWall } from "@/sanity/load-wall";
import { liveProjects } from "@/components/home/catalog";
import { CanvasShell } from "@/components/canvas/CanvasShell";
import "@/styles/hbw-canvas.css";

const title = SITE_TITLE;
const description = SITE_DESCRIPTION;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
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

export default async function HomePage() {
  // The wall needs a pool of stills — a slug and a URL each, not a sequence —
  // so no case study is loaded here. The catalog is read for the plain list.
  const [catalog, tiles] = await Promise.all([loadCatalog(), loadWall()]);
  const projects = catalog.length ? catalog : liveProjects();
  return (
    <>
      <StructuredData nodes={[studioNode(), founderNode(), websiteNode(), workListNode()]} />
      <CanvasShell tiles={tiles} projects={projects} />
    </>
  );
}
