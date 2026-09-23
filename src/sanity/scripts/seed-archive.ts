/**
 * Seeds the archive: index-only projects, with their logotypes.
 *
 * Dry run (writes nothing):
 *   npx sanity exec src/sanity/scripts/seed-archive.ts --with-user-token
 * For real:
 *   npx sanity exec src/sanity/scripts/seed-archive.ts --with-user-token -- --write
 *
 * Every field here comes from the project's own documents — dates from the
 * brief headers and filenames, sectors from what each business says it is,
 * disciplines from the deliverables actually in the folder. Nothing is
 * invented: there is no proposition on these rows, because an archive entry
 * that makes up a positioning line is the thing we removed from the site.
 *
 * Bounce Padel Club is deliberately absent. It has not launched.
 */
import { readFileSync } from "node:fs";
import { getCliClient } from "sanity/cli";

const LOGOS = "/Users/markblackler/Desktop/HBW Work/_logos-for-cms";

type Entry = {
  id: string;
  title: string;
  year: string;
  sectors: string[];
  disciplines: string[];
  /** The studio it was made with. Empty when it was HBW's own work. */
  madeWith?: string;
  /** Filename in the staged logo folder, or null when there is no vector. */
  logo: string | null;
  /** Where the year and sector came from, so the claim can be checked. */
  source: string;
};

const ENTRIES: Entry[] = [
  {
    id: "made-by-madelen",
    title: "Made by Madelen",
    year: "2026",
    sectors: ["Fashion"],
    disciplines: ["Visual Identity", "Digital Design"],
    logo: "made-by-madelen.svg",
    source: "HBW2608-Proposal.pdf, dated 11.08.2026; content plan and image curation",
  },
  {
    id: "the-yard-gym",
    title: "The Yard GYM",
    year: "2025",
    sectors: ["Sport & Fitness"],
    disciplines: ["Print", "Digital Design"],
    logo: "the-yard-gym.svg",
    source: "HBW250818 and HBW250831 podcast covers; SS25/SS26 merchandise",
  },
  {
    id: "robs",
    title: "ROBS",
    year: "2025",
    sectors: ["Sport & Fitness"],
    disciplines: ["Visual Identity", "Print", "Digital Design"],
    logo: "robs.svg",
    source: "ROBS250815-Business-Card.pdf; brand audit. Push bike mechanic",
  },
  {
    id: "dear-ruby",
    title: "Dear Ruby",
    year: "2024",
    sectors: ["Jewellery"],
    disciplines: ["Brand Strategy", "Visual Identity"],
    madeWith: "The Colour Club",
    logo: "dear-ruby.svg",
    source: "Brand DNA dated 25/09/24; concept development 08/10/24",
  },
  {
    id: "emma-wiseman",
    title: "Emma Wiseman",
    year: "2024",
    sectors: ["Health & Wellbeing"],
    disciplines: ["Brand Strategy", "Visual Identity"],
    madeWith: "The Colour Club",
    logo: "emma-wiseman.svg",
    source: "Concept development dated 28/03/24; \"holistic approach to health\"",
  },
  {
    id: "honeydripper",
    title: "Honeydripper",
    year: "2023",
    sectors: ["Hospitality"],
    disciplines: ["Brand Strategy", "Visual Identity"],
    madeWith: "The Colour Club",
    logo: "honeydripper.svg",
    source: "Brand DNA dated 02/08/23; brand guidelines 0524",
  },
  {
    id: "test-by-xvlabs",
    title: "TEST",
    year: "2022",
    sectors: ["Sport & Fitness"],
    disciplines: ["Visual Identity", "Website"],
    madeWith: "The Colour Club",
    logo: "test-by-xvlabs.svg",
    source: "Concept development dated 09/12/22; website wireframe package",
  },
  {
    id: "emple",
    title: "Emple",
    year: "2021",
    sectors: ["Professional Services"],
    disciplines: ["Brand Strategy", "Naming", "Visual Identity"],
    logo: "emple.svg",
    source: "Brand guidelines 210928; renamed from Epic Sales Group",
  },
];

const write = process.argv.includes("--write");
const client = getCliClient({
  apiVersion: "2025-02-19",
  projectId: "aagd1kcy",
  dataset: "production",
}).withConfig({ timeout: 300000 });

async function run() {
  console.log(write ? "WRITING to production\n" : "DRY RUN — nothing will be written\n");

  for (const entry of ENTRIES) {
    const docId = `project-${entry.id}`;
    const existing = write ? await client.getDocument(docId) : null;
    const credit = entry.madeWith ? `  ·  with ${entry.madeWith}` : "";
    console.log(`${entry.title}  (${entry.year})${credit}`);
    console.log(`   id         ${docId}${existing ? "   [already exists — skipping]" : ""}`);
    console.log(`   sectors    ${entry.sectors.join(", ")}`);
    console.log(`   work       ${entry.disciplines.join(", ")}`);
    console.log(`   logotype   ${entry.logo ?? "none"}`);
    console.log(`   evidence   ${entry.source}`);

    if (!write) {
      console.log("");
      continue;
    }
    if (existing) {
      console.log("   → left alone\n");
      continue;
    }

    let logotype: { _type: "file"; asset: { _type: "reference"; _ref: string } } | undefined;
    if (entry.logo) {
      const asset = await client.assets.upload("file", readFileSync(`${LOGOS}/${entry.logo}`), {
        filename: entry.logo,
        contentType: "image/svg+xml",
      });
      logotype = { _type: "file", asset: { _type: "reference", _ref: asset._id } };
    }

    await client.createIfNotExists({
      _id: docId,
      _type: "project",
      listing: "index",
      title: entry.title,
      slug: { _type: "slug", current: entry.id },
      year: entry.year,
      sectors: entry.sectors,
      disciplines: entry.disciplines,
      ...(entry.madeWith ? { madeWith: entry.madeWith } : {}),
      ...(logotype ? { logotype } : {}),
    });
    console.log("   → created\n");
  }

  console.log(
    write
      ? "Done. Publish nothing — these are created as published documents already."
      : "\nRe-run with  -- --write  to create these."
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
