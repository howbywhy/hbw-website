/**
 * One vocabulary for what the studio did.
 *
 * Disciplines and roles had grown apart: "Brand DNA" against "Brand Strategy",
 * "Signage/Wayfinding" against "Signage & Wayfinding", and "Print & Digital
 * Design" against "Print" plus "Digital Design" — three names for two things,
 * across two lists, shown side by side on the index.
 *
 * Dry run:  npx sanity exec src/sanity/scripts/migrate-vocabulary.ts --with-user-token
 * For real: npx sanity exec src/sanity/scripts/migrate-vocabulary.ts --with-user-token -- --write
 */
import { getCliClient } from "sanity/cli";

/** One old term may become two: it was saying two things. */
const RENAMES: Record<string, string[]> = {
  "Brand DNA": ["Brand Strategy"],
  "Signage/Wayfinding": ["Signage & Wayfinding"],
  "Print & Digital Design": ["Print", "Digital Design"],
};

const write = process.argv.includes("--write");
const client = getCliClient({
  apiVersion: "2025-02-19",
  projectId: "aagd1kcy",
  dataset: "production",
}).withConfig({ timeout: 300000 });

/** Rewrites in place and de-duplicates, so the editor's ordering survives. */
function migrate(values: string[] | undefined) {
  if (!values?.length) return null;
  const next = [...new Set(values.flatMap((value) => RENAMES[value] ?? [value]))];
  return next.join("|") === values.join("|") ? null : next;
}

async function run() {
  const docs = await client.fetch<
    { _id: string; title: string; disciplines?: string[]; roles?: string[] }[]
  >(`*[_type == "project"]{_id, title, disciplines, roles}|order(title asc)`);

  console.log(write ? "WRITING to production\n" : "DRY RUN — nothing will be written\n");
  let touched = 0;

  for (const doc of docs) {
    const disciplines = migrate(doc.disciplines);
    const roles = migrate(doc.roles);
    if (!disciplines && !roles) continue;
    touched += 1;
    console.log(doc.title);
    if (disciplines) {
      console.log(`   work  ${doc.disciplines!.join(", ")}`);
      console.log(`      →  ${disciplines.join(", ")}`);
    }
    if (roles) {
      console.log(`   role  ${doc.roles!.join(", ")}`);
      console.log(`      →  ${roles.join(", ")}`);
    }
    if (write) {
      await client
        .patch(doc._id)
        .set({ ...(disciplines ? { disciplines } : {}), ...(roles ? { roles } : {}) })
        .commit();
      console.log("   → patched");
    }
    console.log("");
  }

  console.log(
    touched === 0
      ? "Nothing to migrate."
      : write
        ? `${touched} documents patched.`
        : `${touched} documents would change. Re-run with  -- --write`
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
