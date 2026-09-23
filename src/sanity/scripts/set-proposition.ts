/**
 * Sets a project's positioning line — the grey line beside its name.
 *
 * The archive entries were seeded without one on purpose: a line invented to
 * fill a gap is what put "Dinner, Sorted" on the site under Our Boy Roy. They
 * get filled in here, one at a time, as Mark supplies the real one.
 *
 *   npx sanity exec src/sanity/scripts/set-proposition.ts --with-user-token -- <doc-id> "<line>"
 *
 * Example:
 *   … -- project-test-by-xvlabs "The Foundation"
 */
import { getCliClient } from "sanity/cli";

// `sanity exec` rebuilds argv, so the separator is not where you left it.
// The two values we want are the last two, and a doc id never has a slash.
const [id, line] = process.argv.slice(-2);

if (!id || !line || id.includes("/")) {
  console.error('Usage: … -- <doc-id> "<positioning line>"');
  process.exit(1);
}

const client = getCliClient({
  apiVersion: "2025-02-19",
  projectId: "aagd1kcy",
  dataset: "production",
});

client
  .patch(id)
  .set({ proposition: line })
  .commit()
  .then((doc) => {
    const written = (doc as { proposition?: string }).proposition;
    console.log(`  ${doc.title} → "${written}"`);
  })
  .catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
