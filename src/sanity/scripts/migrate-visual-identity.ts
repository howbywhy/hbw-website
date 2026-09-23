/**
 * "Brand Identity" and "Visual Identity" were two names for the same
 * discipline. Only Visual Identity remains, so any document still carrying
 * the old label is migrated onto it.
 *
 * Dry run:  npx sanity exec src/sanity/scripts/migrate-visual-identity.ts --with-user-token
 * For real: npx sanity exec src/sanity/scripts/migrate-visual-identity.ts --with-user-token -- --write
 */
import { getCliClient } from "sanity/cli";

const OLD = "Brand Identity";
const NEW = "Visual Identity";

const write = process.argv.includes("--write");
const client = getCliClient({
  apiVersion: "2025-02-19",
  projectId: "aagd1kcy",
  dataset: "production",
}).withConfig({ timeout: 300000 });

async function run() {
  const docs = await client.fetch<{ _id: string; title: string; disciplines: string[] }[]>(
    `*[_type == "project" && $old in disciplines]{_id, title, disciplines}`,
    { old: OLD }
  );
  console.log(write ? "WRITING to production\n" : "DRY RUN — nothing will be written\n");
  if (!docs.length) {
    console.log("Nothing to migrate.");
    return;
  }
  for (const doc of docs) {
    // Replace in place so the editor's ordering survives, and de-duplicate in
    // case a document already carried both labels.
    const next = [...new Set(doc.disciplines.map((d) => (d === OLD ? NEW : d)))];
    console.log(`${doc.title}`);
    console.log(`   was  ${doc.disciplines.join(", ")}`);
    console.log(`   now  ${next.join(", ")}`);
    if (write) {
      await client.patch(doc._id).set({ disciplines: next }).commit();
      console.log("   → patched\n");
    } else {
      console.log("");
    }
  }
  if (!write) console.log("Re-run with  -- --write  to apply.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
