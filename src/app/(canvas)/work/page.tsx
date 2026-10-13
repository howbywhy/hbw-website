import type { Metadata } from "next";
import { loadGallery } from "@/sanity/load-gallery";
import { Bar } from "@/components/site/Bar";
import { Catalogue } from "@/components/site/Catalogue";
import { StructuredData } from "@/components/StructuredData";
import { workListNode } from "@/lib/structured-data";
import "@/styles/hbw-index.css";

const title = "Work — How by Why";
const description =
  "Brand work for companies at a turning point: strategy, naming, identity, packaging and motion across architecture, hospitality, food and sport.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/work" },
  openGraph: { title, description, type: "website", url: "/work" },
};

/** The catalogue: every case study as a contact sheet of its own frames. */
export default async function WorkPage() {
  const projects = await loadGallery();
  return (
    <main className="hbw-site">
      <StructuredData nodes={[workListNode()]} />
      {/* The page's heading lives in the bar: "Work" was being said twice,
          once in the nav and again as a title under it. */}
      <Bar here="work" says={<h1 className="hbw-bar__h1">Selected work, 2022—2026</h1>} />
      <div className="hbw-wrap">
        <Catalogue projects={projects} />
        <nav className="hbw-foot hbw-m" aria-label="More">
          <a href="/">Index</a>
          <a href="/studio">Studio</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </main>
  );
}
