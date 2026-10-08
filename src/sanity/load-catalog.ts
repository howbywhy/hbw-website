/**
 * The work line, read from the CMS at build time.
 *
 * Server only. The record the site ships with is catalog.ts; this reads the
 * same projects out of Sanity and lays them over the top, so an editor can
 * change a name, a year, the credits or what the card crops to without a
 * deploy, and can add a project that catalog.ts has never heard of.
 *
 * Like loadIndex, it must be impossible for this to break a page. A Sanity
 * outage, a malformed row or an empty dataset all fall back to the shipped
 * catalog. The work line is the studio's record of itself — it should never
 * be blank because a request failed.
 */
import {
  liveProjects,
  type BrowseLayout,
  type CollaboratorId,
  type Discipline,
  type ProjectRecord,
  type Sector,
} from "@/components/home/catalog";
import { keyArt } from "@/components/home/work-data";
import { catalogIdForSlug } from "@/lib/cms-source";
import { resolveProjectExperience } from "@/lib/project-source";
import { queryRows } from "@/sanity/cms-fetch";
import { sanityApiVersion } from "@/sanity/env";

type CmsRow = {
  slug?: string | null;
  title?: string | null;
  year?: string | null;
  proposition?: string | null;
  sectors?: string[] | null;
  disciplines?: string[] | null;
  credits?: string[] | null;
  features?: { name?: string | null; url?: string | null }[] | null;
  location?: string | null;
  portfolioOrder?: number | null;
  cardCrop?: string | null;
  cardMovementKey?: string | null;
  visualSpan?: number | null;
  visualStart?: number | null;
  visualBefore?: number | null;
  preview?: {
    url?: string | null;
    dimensions?: { width?: number | null; height?: number | null } | null;
  } | null;
};

/** Index rows are archive only — they have no page, so they are not on the line. */
const QUERY = `*[_type == "project" && listing != "index" && defined(title) && defined(year)]{
  "slug": slug.current, title, year, proposition, sectors, disciplines, credits, features,
  location, portfolioOrder, cardCrop, cardMovementKey, visualSpan, visualStart, visualBefore,
  "preview": preview.asset->{url, "dimensions": metadata.dimensions}
}`;

/**
 * A responsive set straight off Sanity's image CDN, which resizes and
 * re-encodes on request. The site ships pre-made -p- variants for its own
 * files; anything that arrives through the CMS gets the same treatment
 * without anyone having to generate anything.
 */
export function cdnSrcSet(url: string, intrinsic: number) {
  const widths = [500, 800, 1080, 1600].filter((w) => w < intrinsic);
  return widths
    .map((w) => `${url}?w=${w}&q=72&auto=format ${w}w`)
    .concat(`${url}?q=82&auto=format ${intrinsic}w`)
    .join(", ");
}

/** Taller than it is wide reads as a portrait card; anything else is landscape. */
function layoutFor(width: number, height: number): BrowseLayout {
  return height > width ? "portrait" : "landscape";
}

function clean<T>(values: T[] | null | undefined) {
  return (values ?? []).filter(Boolean) as T[];
}

/**
 * One CMS row over one shipped record. Anything the row does not carry keeps
 * the value the site already ships, so a half-filled document degrades to the
 * catalog field by field rather than all at once.
 */
function merge(row: CmsRow, base: ProjectRecord | undefined): ProjectRecord | null {
  const slug = row.slug?.trim();
  const title = row.title?.trim();
  if (!slug || !title || !/^\d{4}$/.test(row.year ?? "")) return null;

  const id = catalogIdForSlug(slug);
  const preview = row.preview;
  const width = preview?.dimensions?.width ?? 0;
  const height = preview?.dimensions?.height ?? 0;
  const hasPreview = Boolean(preview?.url) && width > 0 && height > 0;

  // Without a shipped record and without a preview there is no card to draw.
  if (!base && !hasPreview) return null;

  const art = hasPreview
    ? {
        src: preview!.url as string,
        srcSet: cdnSrcSet(preview!.url as string, width),
        width,
        height,
        layout: layoutFor(width, height),
      }
    : {
        src: base!.src,
        srcSet: base!.srcSet,
        width: base!.width,
        height: base!.height,
        layout: base!.layout,
      };

  const features = clean(row.features)
    .map((item) => ({ name: item.name?.trim() ?? "", url: item.url?.trim() || undefined }))
    .filter((item) => item.name);

  return {
    ...(base ?? {}),
    id,
    href: `/projects/${id}`,
    name: title,
    idea: row.proposition?.trim() || base?.idea || "",
    year: row.year as string,
    ...art,
    crop: row.cardCrop?.trim() || base?.crop || "center center",
    ...(row.cardMovementKey?.trim()
      ? { keyArtId: row.cardMovementKey.trim() }
      : base?.keyArtId
        ? { keyArtId: base.keyArtId }
        : {}),
    sectors: (clean(row.sectors).length ? clean(row.sectors) : base?.sectors) as Sector[] | undefined,
    disciplines: (clean(row.disciplines).length ? clean(row.disciplines) : base?.disciplines) as
      | Discipline[]
      | undefined,
    credits: clean(row.credits).length ? clean(row.credits) : base?.credits,
    features: features.length ? features : base?.features,
    location: row.location?.trim() || base?.location,
    // A lens, keyed to ids the site knows. The CMS stores collaborators as
    // free prose for the case study, which is a different thing.
    collaborators: base?.collaborators as CollaboratorId[] | undefined,
    visualSpan: (row.visualSpan ?? base?.visualSpan) as ProjectRecord["visualSpan"],
    visualStart: (row.visualStart ?? base?.visualStart) as ProjectRecord["visualStart"],
    visualBefore: (row.visualBefore ?? base?.visualBefore) as ProjectRecord["visualBefore"],
  } as ProjectRecord;
}

/** Newest year first, and within a year the order the editor set. */
function order(records: ProjectRecord[], rank: Map<string, number>) {
  return records.sort(
    (a, b) =>
      Number(b.year) - Number(a.year) ||
      (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER) ||
      a.name.localeCompare(b.name)
  );
}

/**
 * The card each project shows, worked out here rather than in the browser.
 *
 * Drawing a card needs one frame out of a case study. Handing the client every
 * case study so it could pick six frames put all six sequences into the payload
 * of every page, including ones that show no work. This resolves them once and
 * carries only the answer.
 */
async function withCardArt(records: ProjectRecord[]): Promise<ProjectRecord[]> {
  return Promise.all(
    records.map(async (record) => {
      const { experience } = await resolveProjectExperience(record.id);
      return experience ? { ...record, cardArt: keyArt(record, experience) } : record;
    })
  );
}

export async function loadCatalog(): Promise<ProjectRecord[]> {
  const shipped = liveProjects();
  const rows = await queryRows<CmsRow>(QUERY, sanityApiVersion);
  if (!rows?.length) return withCardArt(shipped);

  const base = new Map(shipped.map((project) => [project.id, project]));
  const rank = new Map<string, number>();
  const merged: ProjectRecord[] = [];

  for (const row of rows) {
    const record = merge(row, base.get(catalogIdForSlug(row.slug ?? "")));
    if (!record) continue;
    if (typeof row.portfolioOrder === "number") rank.set(record.id, row.portfolioOrder);
    merged.push(record);
  }

  // A CMS that answered but produced nothing usable is an outage by another
  // name, and the line should not go quiet because a field was mistyped.
  return withCardArt(merged.length ? order(merged, rank) : shipped);
}
