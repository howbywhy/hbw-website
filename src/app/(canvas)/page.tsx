import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_TAGLINE } from "@/lib/site-meta";
import { StructuredData } from "@/components/StructuredData";
import { founderNode, studioNode, websiteNode, workListNode } from "@/lib/structured-data";
import { loadTiles } from "@/sanity/load-gallery";
import { loadIndex } from "@/sanity/load-index";
import { STUDIO_COPY } from "@/components/home/studio-copy";
import { Bar } from "@/components/site/Bar";
import { Intro } from "@/components/site/Intro";
import { WorkGrid } from "@/components/site/WorkGrid";
import { Ledger } from "@/components/site/Ledger";
import "@/styles/hbw-index.css";

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
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};

/**
 * The front page: a beat for the name, the work full bleed, then the ledger.
 *
 * Three things in the order someone needs them — who this is, what it has
 * done, and the whole record underneath for anyone who wants it.
 */
export default async function HomePage() {
  const [tiles, entries] = await Promise.all([loadTiles(), loadIndex()]);
  return (
    <main className="hbw-site hbw-site--home">
      <StructuredData nodes={[studioNode(), founderNode(), websiteNode(), workListNode()]} />
      <Intro mark="How by Why" line={SITE_TAGLINE} />
      <Bar />

      <WorkGrid tiles={tiles} />

      <div className="hbw-wrap">
        <h1 className="hbw-stat">{SITE_TAGLINE}</h1>
        <p className="hbw-stat__sub">{STUDIO_COPY.partners}</p>

        <Ledger entries={entries} />

        <nav className="hbw-foot hbw-m" aria-label="More">
          <a href="/work">All work</a>
          <a href="/studio">Studio</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </main>
  );
}
