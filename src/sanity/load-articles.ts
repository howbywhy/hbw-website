/**
 * Talk's writing, read from the CMS at build time.
 *
 * Server only. Nothing here may break a page: a Sanity outage, a malformed
 * document or an empty dataset all come back as "no articles", and Talk goes
 * on being the contact page it already is. Writing is an addition to that
 * page, not a dependency of it.
 *
 * Unlike the work, there is no local fallback. A case study the CMS cannot
 * answer for still has a sequence shipped in the repo; an article that cannot
 * be fetched has nothing to fall back to, and inventing one would be worse
 * than showing none.
 */
import type { RichText } from "@/components/home/projects/types";
import { portableTextToRichText } from "@/sanity/adapter/portableText";
import type { SanityPortableText } from "@/sanity/adapter/types";
import { CMS_DATASET, CMS_PROJECT_ID, getText } from "@/sanity/cms-fetch";
import { sanityApiVersion } from "@/sanity/env";

export type Article = {
  slug: string;
  title: string;
  standfirst: string;
  /** ISO date, as published. */
  published: string;
  /** Rendered as paragraphs and subheadings; empty for a list-only read. */
  body: RichText;
  /** Which blocks are subheadings, by paragraph index. */
  headings: number[];
};

type Row = {
  slug?: { current?: string } | string | null;
  title?: string | null;
  standfirst?: string | null;
  published?: string | null;
  body?: SanityPortableText;
};

const FIELDS = `"slug": slug.current, title, standfirst, published, body`;

/* Newest first, and only what is publishable: a row missing a slug, a title
   or a date is a document somebody is still writing. */
const LIST = `*[_type == "article" && defined(slug.current) && defined(title) && defined(published)]|order(published desc){${FIELDS}}`;

function query(groq: string) {
  return (
    `https://${CMS_PROJECT_ID}.api.sanity.io/v${sanityApiVersion}/data/query/` +
    `${CMS_DATASET}?query=${encodeURIComponent(groq)}`
  );
}

function slugOf(row: Row): string {
  if (typeof row.slug === "string") return row.slug;
  return row.slug?.current ?? "";
}

/**
 * Which paragraphs are subheadings.
 *
 * portableTextToRichText drops the block style — it was written for case-study
 * copy, which has no headings — so the styles are read off the raw blocks here
 * and handed over as indices. Same filtering as the converter, or the indices
 * would point at the wrong paragraphs.
 */
function headingsOf(body: SanityPortableText | undefined): number[] {
  if (!body?.length) return [];
  const out: number[] = [];
  body
    .filter((block) => block._type === "block")
    .filter((block) => (block.children ?? []).some((child) => child.text))
    .forEach((block, i) => {
      if ((block as { style?: string }).style === "h2") out.push(i);
    });
  return out;
}

function toArticle(row: Row): Article | null {
  const slug = slugOf(row);
  if (!slug || !row.title || !row.published) return null;
  return {
    slug,
    title: row.title,
    standfirst: row.standfirst?.trim() ?? "",
    published: row.published,
    body: portableTextToRichText(row.body),
    headings: headingsOf(row.body),
  };
}

async function rows(groq: string): Promise<Row[]> {
  const body = await getText(query(groq));
  if (!body) return [];
  try {
    return (JSON.parse(body) as { result?: Row[] }).result ?? [];
  } catch {
    return [];
  }
}

/** Every published article, newest first. Empty when the CMS cannot answer. */
export async function loadArticles(): Promise<Article[]> {
  return (await rows(LIST)).map(toArticle).filter((a): a is Article => a !== null);
}

/** One article, or null — which the route turns into a 404. */
export async function loadArticle(slug: string): Promise<Article | null> {
  const found = await rows(
    `*[_type == "article" && slug.current == "${slug.replace(/"/g, "")}"][0...1]{${FIELDS}}`
  );
  return found.length ? toArticle(found[0]) : null;
}
