import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-meta";
import { StructuredData } from "@/components/StructuredData";
import { founderNode, studioNode, websiteNode, workListNode } from "@/lib/structured-data";
import { loadIndex } from "@/sanity/load-index";
import { indexSpan } from "@/components/home/index-entry";
import { STUDIO_COPY } from "@/components/home/studio-copy";
import { Bar } from "@/components/site/Bar";
import { IndexRows } from "@/components/site/IndexRows";
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
 * The index.
 *
 * The front page is the record: what the practice is, in three lines, then
 * every project it has done, numbered and dated. No hero, no carousel, no
 * autoplaying film — the live site pulled 26MB of video to say less than this
 * says in text.
 */
export default async function IndexPage() {
  const entries = await loadIndex();
  const span = indexSpan(entries);

  return (
    <main className="hbw-site">
      <StructuredData nodes={[studioNode(), founderNode(), websiteNode(), workListNode()]} />
      <Bar here="index" />

      <div className="hbw-wrap">
        <section className="hbw-say">
          <h1>How by Why is an independent brand and design practice led by Mark Blackler.</h1>
          <p className="is-ink">{STUDIO_COPY.partners}</p>
          <p>{STUDIO_COPY.glimpse}</p>
        </section>

        <div className="hbw-band">
          <p className="hbw-m" style={{ margin: 0, color: "var(--ink)" }}>
            Index
          </p>
          <p className="hbw-m" style={{ margin: 0 }}>
            {span.count} projects · {span.from}—{span.to}
          </p>
        </div>

        <IndexRows entries={entries} />

        <nav className="hbw-foot hbw-m" aria-label="More">
          <a href="/work">Work</a>
          <a href="/studio">Studio</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </main>
  );
}
