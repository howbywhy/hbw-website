import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadSheets } from "@/sanity/load-gallery";
import { SITE_TAGLINE } from "@/lib/site-meta";
import { Bar } from "@/components/site/Bar";
import { Work } from "@/components/site/Work";
import { Logotype } from "@/components/site/Logotype";
import "@/styles/hbw-index.css";

/**
 * Three other front pages, side by side with the one the site has.
 *
 * They are real pages rather than mock-ups: the same data, the same bar,
 * the same gallery a press opens, the same foot. Only the arrangement
 * differs, so what is being judged is the arrangement.
 *
 * Kept out of the index — noindex here, Disallow in robots — because they
 * are seven projects arranged three more ways, which is exactly the kind
 * of near-duplicate a search engine should never have to sort out. Delete
 * the folder when a decision is made.
 */
const SHAPES = {
  end: {
    shape: "end" as const,
    name: "It ends",
    says: "The work once, then the foot. No wrap.",
  },
  large: {
    shape: "large" as const,
    name: "One each",
    says: "A picture the width of the page per project.",
  },
  index: {
    shape: "index" as const,
    name: "The index",
    /* The studio's own line, because the nav is the studio until a
       project is scrolled to and then it is the project. */
    says: SITE_TAGLINE,
  },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(SHAPES).map((shape) => ({ shape }));
}

type Props = { params: Promise<{ shape: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shape } = await params;
  const one = SHAPES[shape as keyof typeof SHAPES];
  return {
    title: one ? `${one.name} — a front page to try` : "A front page to try",
    description: one?.says,
    robots: { index: false, follow: false },
  };
}

export default async function TryPage({ params }: Props) {
  const { shape } = await params;
  const one = SHAPES[shape as keyof typeof SHAPES];
  if (!one) notFound();
  const projects = await loadSheets();
  return (
    <main className="hbw-site">
      <Bar says={<h1 className="hbw-bar__h1">{one.says}</h1>} />
      <div className="hbw-wrap">
        <Work
          projects={projects}
          shape={one.shape}
          marks={Object.fromEntries(
            projects.map((project) => [
              project.slug,
              <Logotype key={project.slug} slug={project.slug} name={project.name} />,
            ])
          )}
        />
      </div>
    </main>
  );
}
