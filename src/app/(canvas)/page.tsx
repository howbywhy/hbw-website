import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-meta";
import { loadSheets } from "@/sanity/load-gallery";
import { Bar } from "@/components/site/Bar";
import { Catalogue } from "@/components/site/Catalogue";
import { StructuredData } from "@/components/StructuredData";
import { founderNode, studioNode, websiteNode, workListNode } from "@/lib/structured-data";
import "@/styles/hbw-index.css";

const title = SITE_TITLE;
const description = SITE_DESCRIPTION;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, type: "website", url: "/" },
};

/**
 * The front page: the work, as a contact sheet per project.
 *
 * It was /work, and everything that used to sit in front of it — a title
 * card, a field of marks, a horizontal reel — has gone. None of it was the
 * work, and all of it stood between a visitor and the work.
 */
export default async function HomePage() {
  const projects = await loadSheets();
  return (
    <main className="hbw-site">
      <StructuredData nodes={[studioNode(), founderNode(), websiteNode(), workListNode()]} />
      {/* The heading lives in the bar: the page is the work, so a title
          above it would only name what is already there. */}
      <Bar says={<h1 className="hbw-bar__h1">How by Why — clarity for brands at a turning point.</h1>} />
      <div className="hbw-wrap">
        <Catalogue projects={projects} />
        <nav className="hbw-foot hbw-m" aria-label="More">
          <a href="/studio">Studio</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </main>
  );
}
