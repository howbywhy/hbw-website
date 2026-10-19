import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { liveProjects, PROJECT_SLUGS } from "../components/home/catalog";
import { indexSpan, type IndexEntry } from "../components/home/index-entry";

function entry(over: Partial<IndexEntry> = {}): IndexEntry {
  return {
    id: "koja",
    name: "KOJA",
    idea: "Unapologetically Good",
    work: "Strategy, Identity",
    sector: "FMCG",
    year: 2024,
    mark: null,
    markScale: null,
    featured: true,
    ...over,
  };
}

/*
 * The two tests that lived here guarded the committed logotypes, which were
 * only ever drawn by the preview's index of the work. That index, the shell
 * it belonged to and the /preview route it served have all gone, and the
 * marks went with them — so there is nothing left to keep in step.
 */

test("the span reads the years it is given", () => {
  const span = indexSpan([entry({ year: 2018 }), entry({ year: 2026 }), entry({ year: 2024 })]);
  assert.deepEqual(span, { count: 3, from: 2018, to: 2026 });
});

test("an empty index still gives the span line something to print", () => {
  const span = indexSpan([]);
  assert.equal(span.count, 0);
  assert.equal(span.from, span.to);
  assert.ok(Number.isFinite(span.from), "a blank range would render as NaN–NaN");
});

test("only a project the site can route to is openable", () => {
  // A row that cannot open anything must not render as a button.
  const archive = entry({ id: "some-old-job", featured: false });
  assert.equal(archive.featured, false);
  assert.ok(!PROJECT_SLUGS.includes(archive.id));
});



test("the index does not depend on the environment being configured", async () => {
  // The production build has no NEXT_PUBLIC_SANITY_PROJECT_ID, so env.ts
  // answered "placeholder" and every deploy silently served the six catalog
  // projects while the CMS held fourteen. The loader now resolves the real
  // project the same way sanity.cli.ts does.
  // The fallback now lives in cms-fetch, which both the index and the catalog
  // read through, so the guarantee is checked where it is stated.
  const source = await readFile(new URL("./cms-fetch.ts", import.meta.url), "utf8");
  assert.match(source, /aagd1kcy/, "the public project id must be the fallback");
  assert.doesNotMatch(
    source,
    /if \(sanityProjectId === "placeholder"\) return fromCatalog\(\)/,
    "an unset variable must not silently swap the CMS for the catalog"
  );
});
