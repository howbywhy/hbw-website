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
import { get as httpsGet } from "node:https";
import { liveProjects } from "@/components/home/catalog";
import { catalogIdForSlug } from "@/lib/cms-source";
import { normaliseLogotype } from "@/lib/logotype";
import type { IndexEntry } from "@/components/home/index-entry";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "@/sanity/env";

/**
 * The studio's own project and dataset, as sanity.cli.ts already hardcodes
 * them. Neither is a secret: both sit in the public query URL, and the dataset
 * is world-readable.
 *
 * env.ts answers "placeholder" when NEXT_PUBLIC_SANITY_PROJECT_ID is unset,
 * which is right for a fork but wrong here. The production build does not
 * have that variable, so every deploy quietly fell back to the six projects
 * in catalog.ts while the CMS held fourteen — a silent, plausible-looking
 * wrong answer, which is the worst kind. The index reads the real dataset
 * whether or not the environment is configured.
 */
const PROJECT_ID = sanityProjectId === "placeholder" ? "aagd1kcy" : sanityProjectId;
const DATASET = sanityDataset || "production";

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

/**
 * Fetches over plain node:https rather than fetch().
 *
 * Next patches global fetch and Vercel restores its data cache between builds,
 * so a cached read can answer a build from before the CMS changed — eight new
 * archive entries were published and the next deploy still rendered six.
 * Marking the fetch no-store fixes the staleness but makes every page that
 * renders the shell dynamic, and this site is statically generated.
 *
 * An unpatched request is neither cached nor dynamic: fresh every build,
 * static every page.
 */
function getText(url: string, timeoutMs = 20000): Promise<string | null> {
  return new Promise((resolve) => {
    const request = httpsGet(url, (response) => {
      const status = response.statusCode ?? 0;
      if (status < 200 || status >= 300) {
        response.resume();
        resolve(null);
        return;
      }
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => (body += chunk));
      response.on("end", () => resolve(body));
    });
    request.on("error", () => resolve(null));
    request.setTimeout(timeoutMs, () => {
      request.destroy();
      resolve(null);
    });
  });
}

/** A list reads better with two or three labels than with seven. */
function trim(values: string[] | null | undefined, most: number) {
  return (values ?? []).filter(Boolean).slice(0, most).join(", ");
}

async function fetchMark(url: string | null | undefined): Promise<IndexEntry["mark"]> {
  if (!url) return null;
  // A logotype that will not load is a row without a mark, not a broken page.
  return normaliseLogotype(await getText(url));
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
  const url =
    `https://${PROJECT_ID}.api.sanity.io/v${sanityApiVersion}/data/query/` +
    `${DATASET}?query=${encodeURIComponent(QUERY)}`;
  const body = await getText(url);
  if (!body) return fromCatalog();
  let rows: CmsRow[] = [];
  try {
    rows = (JSON.parse(body) as { result?: CmsRow[] }).result ?? [];
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

