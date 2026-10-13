import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site-meta";
import { loadSheets } from "@/sanity/load-gallery";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import { Catalogue } from "@/components/site/Catalogue";
import { Logotype } from "@/components/site/Logotype";
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
      {/*
        The positioning only. The wordmark is already in the middle of the same
        row, and printing it twice in one line of chrome read as a mistake.
      */}
      <Bar says={<h1 className="hbw-bar__h1">Clarity for brands at a turning point.</h1>} />
      <div className="hbw-wrap">
        <Catalogue
          projects={projects}
          marks={Object.fromEntries(
            projects.map((project) => [
              project.slug,
              <Logotype key={project.slug} slug={project.slug} name={project.name} />,
            ])
          )}
        />
      </div>

      <Footer />
    </main>
  );
}
