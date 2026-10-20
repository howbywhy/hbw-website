/**
 * Write the project registry from what is actually published in the CMS.
 *
 * Adding a project used to mean editing five files that had to agree: the
 * sequence, the seed that wrote it, the route-to-document mapping, the
 * catalogue record, and a verifier. Four of those were restating the same
 * handful of facts in four shapes, and keeping them in step by hand is the
 * sort of job that is fine the first time and wrong by the fourth.
 *
 * So the facts are read from the one place that holds them. This asks the
 * CMS for every published project and writes them out as a module the site
 * imports. Run it by hand, or let a build run it: either way the list the
 * site has is the list the CMS has, and a project appears by being
 * published rather than by being typed out again.
 *
 * What it does not write is the look — the crop, the card, the span, the
 * credits. Those are decisions about how a project is shown rather than
 * facts about it, they are deliberately not in the CMS, and they live in
 * project-look.ts where a project without one simply uses its own preview
 * and sensible defaults.
 *
 * Run: npm run sync:projects
 *
 * Plain client rather than the CLI's, so a build can run it: Vercel has a
 * read token in its environment and no logged-in user. If the CMS cannot be
 * reached it says so and leaves the committed registry alone — a deploy
 * should not fail because a content API blinked, and the file on disk is a
 * perfectly good answer to "what was published last time anybody looked".
 */
import { writeFileSync } from "node:fs";
import { createClient } from "@sanity/client";

const OUT = "src/lib/projects.generated.ts";

/*
 * A project is ready when it has work in it.
 *
 * The CMS holds fourteen project documents and the site shows seven. The
 * other seven are stubs — a name, a slug, and nothing else: no pictures, no
 * preview, no order. Asking for "every project with a slug" would have put
 * all of them on the front page.
 *
 * So the test is the work itself rather than a flag somebody has to
 * remember to set: a project appears when it has a preview and at least one
 * movement, which is exactly the point at which there is something to show.
 * Start one, fill it in, and it arrives when it is ready.
 */
const QUERY = `*[_type == "project"
  && defined(slug.current)
  && defined(preview.asset)
  && count(movements) > 0
] | order(coalesce(portfolioOrder, 99) asc, year desc) {
  _id,
  title,
  "slug": slug.current,
  proposition,
  year,
  sectors,
  disciplines,
  portfolioOrder,
  preview{
    ...,
    asset->{ _id, url, originalFilename, mimeType, metadata }
  }
}`;

type Row = {
  _id: string;
  title?: string;
  slug?: string;
  proposition?: string;
  year?: string;
  sectors?: string[];
  disciplines?: string[];
  portfolioOrder?: number;
  preview?: {
    asset?: { url?: string; metadata?: { dimensions?: { width?: number; height?: number } } };
  };
};

/*
 * The card a project has when nobody has chosen one for it.
 *
 * Every look in project-look.ts names a still from the repo, picked by hand
 * because the frame that makes the best card is rarely the first one. A new
 * project has no such entry, so it needs a card from somewhere — and the
 * CMS preview is the one picture it is guaranteed to have, at whatever size
 * it was uploaded.
 *
 * Written out here rather than fetched at render, because the catalogue is
 * read synchronously by both the server and the browser and cannot go and
 * ask anything.
 */
function cardOf(row: Row) {
  const asset = row.preview?.asset;
  const url = asset?.url;
  const dim = asset?.metadata?.dimensions;
  if (!url || !dim?.width || !dim?.height) return null;
  return { src: url, width: dim.width, height: dim.height };
}

async function main() {
  const projectId =
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_STUDIO_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? process.env.SANITY_STUDIO_DATASET;
  const token = process.env.SANITY_API_READ_TOKEN;
  if (!projectId || !dataset) {
    console.warn("[sync] No CMS connection in the environment; keeping the registry as committed.");
    return;
  }
  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2025-02-19",
    useCdn: false,
    ...(token ? { token } : {}),
  });
  const rows: Row[] = await client.fetch(QUERY);

  const kept = rows.filter((row) => row.slug && row.title);
  if (!kept.length) throw new Error("The CMS returned no published projects; refusing to write an empty registry.");

  const body = kept
    .map((row) =>
      [
        "  {",
        `    slug: ${JSON.stringify(row.slug)},`,
        `    documentId: ${JSON.stringify(row._id)},`,
        `    name: ${JSON.stringify(row.title)},`,
        `    idea: ${JSON.stringify(row.proposition ?? "")},`,
        `    year: ${JSON.stringify(String(row.year ?? ""))},`,
        `    sectors: ${JSON.stringify(row.sectors ?? [])},`,
        `    disciplines: ${JSON.stringify(row.disciplines ?? [])},`,
        `    order: ${row.portfolioOrder ?? 99},`,
        `    card: ${JSON.stringify(cardOf(row))},`,
        "  },",
      ].join("\n")
    )
    .join("\n");

  const file = `/**
 * Written by src/sanity/scripts/sync-projects.ts. Do not edit by hand.
 *
 * Every project published in the CMS, in the order the CMS gives them. The
 * site reads this rather than a list kept by hand, so adding a project is
 * publishing one.
 *
 * It is committed on purpose: a build with no CMS credentials still has a
 * site, and a diff here is a readable record of what changed and when.
 */
export type RegisteredProject = {
  slug: string;
  documentId: string;
  name: string;
  idea: string;
  year: string;
  sectors: string[];
  disciplines: string[];
  order: number;
  /** The CMS preview, for a project that has not been given a card by hand. */
  card: { src: string; width: number; height: number } | null;
};

export const REGISTERED_PROJECTS: readonly RegisteredProject[] = [
${body}
];
`;

  writeFileSync(OUT, file);
  console.log(`wrote ${OUT} with ${kept.length} projects:`);
  for (const row of kept) console.log(`  ${row.slug}  ${row.title}  ${row.year}`);
}

main().catch((error) => {
  /*
   * A failure here is not a reason to have no site.
   *
   * The registry is committed, so the worst case of an unreachable CMS is a
   * build that ships the last known list of projects — which is the list it
   * would have shipped anyway five minutes earlier. Said loudly, so a
   * registry that has quietly stopped updating is noticed.
   */
  console.warn(`[sync] Could not read the CMS (${error instanceof Error ? error.message : error}).`);
  console.warn("[sync] Keeping the registry as committed.");
});
