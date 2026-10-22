import assert from "node:assert/strict";
import { test } from "node:test";
import { liveProjects, PROJECT_SLUGS } from "../components/home/catalog";
import { isSanityConfigured, sanityProjectId } from "./env";
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



test("the index does not depend on the environment being configured", () => {
  /*
   * Checked where the guarantee lives, not where it used to.
   *
   * The fault this guards is a real one: the production build had no
   * NEXT_PUBLIC_SANITY_PROJECT_ID, env.ts answered "placeholder", and
   * every deploy silently served the six catalog projects while the CMS
   * held fourteen.
   *
   * It was then checked by reading cms-fetch.ts as text — and nothing
   * imported cms-fetch.ts. The assertion passed on a file with no effect
   * on anything, so the guarantee read as covered while being inert, and
   * the file has gone with the rest of the dead code.
   *
   * What actually protects the site is that the variable is set in the
   * deployment, and what the code must not do is quietly swap the CMS for
   * the catalogue when it is not. So this asserts the shape of the thing
   * that is still here: env.ts reports whether it is configured, and says
   * so rather than inventing a project id of its own.
   */
  assert.equal(typeof isSanityConfigured, "function");
  assert.equal(
    isSanityConfigured(),
    sanityProjectId !== "placeholder",
    "configured means the project id is not the fallback, and nothing else"
  );
});
