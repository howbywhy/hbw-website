import type { Metadata } from "next";
import { loadGallery } from "@/sanity/load-gallery";
import { Gallery } from "@/components/canvas/Gallery";
import { CanvasNav } from "@/components/canvas/CanvasNav";
import { StructuredData } from "@/components/StructuredData";
import { workListNode } from "@/lib/structured-data";
import "@/styles/hbw-canvas.css";

const title = "Work — How by Why";
const description =
  "Brand work for companies at a turning point: identity, strategy, packaging and motion across architecture, hospitality, food and sport.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/work" },
  openGraph: { title, description, type: "website", url: "/work" },
};

export default async function WorkPage() {
  const projects = await loadGallery();
  return (
    <main className="hbw-page">
      <StructuredData nodes={[workListNode()]} />
      <CanvasNav here="work" />
      <h1 className="hbw-page__title">Work</h1>
      <Gallery projects={projects} />
    </main>
  );
}
