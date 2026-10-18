import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bar } from "@/components/site/Bar";
import { Footer } from "@/components/site/Footer";
import { Prose } from "@/components/site/Prose";
import { loadArticle, loadArticles } from "@/sanity/load-articles";
import { readDate } from "@/lib/date";
import "@/styles/hbw-index.css";

/*
 * Built, not fetched per request. An article changes when it is written, and
 * writing it fires the same rebuild the work does — so there is nothing to
 * gain from asking Sanity again on every view.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await loadArticles()).map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) return {};
  const title = `${article.title} — How by Why`;
  return {
    title,
    description: article.standfirst,
    alternates: { canonical: `/talk/${article.slug}` },
    openGraph: {
      title,
      description: article.standfirst,
      type: "article",
      url: `/talk/${article.slug}`,
      publishedTime: article.published,
    },
    twitter: { card: "summary_large_image", title, description: article.standfirst },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) notFound();

  return (
    <main className="hbw-site">
      <Bar here="talk" />
      <article className="hbw-read">
        <header className="hbw-read__head">
          <h1 className="hbw-read__title">{article.title}</h1>
          {article.standfirst ? <p className="hbw-read__stand">{article.standfirst}</p> : null}
          <p className="hbw-read__when">
            <time dateTime={article.published}>{readDate(article.published)}</time>
          </p>
        </header>
        <Prose body={article.body} headings={article.headings} className="hbw-read__body" />
        {/* The way back, where the eye already is at the end of a column. */}
        <p className="hbw-read__back">
          <a href="/talk">All writing</a>
        </p>
      </article>
      <Footer />
    </main>
  );
}
