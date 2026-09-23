/**
 * The index of work, read from the CMS at build time.
 *
 * Server only. Every page that renders the shell calls this, so it has to be
 * impossible for it to break a page: a Sanity outage, a malformed logotype or
 * an empty dataset all fall back to the catalog the site already ships with.
 * The index is a record of the studio's work — it should never be blank
 * because a request failed.
 *
 * Logotypes are fetched and stripped to one colour here, at build time, so the
 * browser is never asked to parse an SVG from a third party.
 */
import { liveProjects } from "@/components/home/catalog";
import { catalogIdForSlug } from "@/lib/cms-source";
import { normaliseLogotype } from "@/lib/logotype";
import type { IndexEntry } from "@/components/home/index-entry";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "@/sanity/env";

type CmsRow = {
  slug?: string | null;
  title?: string | null;
  year?: string | null;
  proposition?: string | null;
  sectors?: string[] | null;
  disciplines?: string[] | null;
  listing?: string | null;
  logotypeScale?: number | null;
  logo?: { url?: string | null; extension?: string | null } | null;
};

const QUERY = `*[_type == "project" && defined(title) && defined(year)]|order(year desc, title asc){
  "slug": slug.current, title, year, proposition, sectors, disciplines, listing, logotypeScale,
  "logo": logotype.asset->{url, extension}
}`;

/** A list reads better with two or three labels than with seven. */
function trim(values: string[] | null | undefined, most: number) {
  return (values ?? []).filter(Boolean).slice(0, most).join(", ");
}

async function fetchMark(url: string | null | undefined): Promise<IndexEntry["mark"]> {
  if (!url) return null;
  try {
    const response = await fetch(url, { next: { revalidate: false } });
    if (!response.ok) return null;
    return normaliseLogotype(await response.text());
  } catch {
    // A logotype that will not load is a row without a mark, not a broken page.
    return null;
  }
}

/**
 * The catalog the site ships with, used when the CMS has nothing to say.
 * Sorted the way the query sorts, so the list reads newest first either way.
 */
function fromCatalog(): IndexEntry[] {
  return liveProjects()
    .map((project) => ({
      id: project.id,
      name: project.name,
      idea: project.idea,
      work: trim(project.disciplines as string[] | undefined, 3),
      sector: trim(project.sectors as string[] | undefined, 2),
      year: Number(project.year),
      mark: null,
      markScale: null,
      featured: true,
    }))
    .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
}

export type { IndexEntry };

export async function loadIndex(): Promise<IndexEntry[]> {
  if (sanityProjectId === "placeholder") return fromCatalog();
  let rows: CmsRow[] = [];
  try {
    const url =
      `https://${sanityProjectId}.api.sanity.io/v${sanityApiVersion}/data/query/` +
      `${sanityDataset}?query=${encodeURIComponent(QUERY)}`;
    const response = await fetch(url, { next: { revalidate: false } });
    if (!response.ok) return fromCatalog();
    rows = ((await response.json()) as { result?: CmsRow[] }).result ?? [];
  } catch {
    return fromCatalog();
  }
  if (!rows.length) return fromCatalog();

  const marks = await Promise.all(rows.map((row) => fetchMark(row.logo?.url)));
  const known = new Set(liveProjects().map((project) => project.id));

  return rows
    .filter((row) => row.title && /^\d{4}$/.test(row.year ?? ""))
    .map((row, i) => {
      const id = catalogIdForSlug(row.slug ?? "");
      return {
        id,
        name: row.title as string,
        idea: row.proposition?.trim() ?? "",
        work: trim(row.disciplines, 3),
        sector: trim(row.sectors, 2),
        year: Number(row.year),
        mark: marks[i],
        markScale:
          typeof row.logotypeScale === "number" && row.logotypeScale > 0 ? row.logotypeScale : null,
        // Only a project the site can actually route to opens from a row.
        featured: row.listing !== "index" && known.has(id),
      };
    });
}

