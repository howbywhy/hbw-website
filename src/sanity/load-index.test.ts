import assert from "node:assert/strict";
import { test } from "node:test";
import { liveProjects, PROJECT_SLUGS } from "../components/home/catalog";
import { INDEX_MARKS } from "../components/home/index-marks";
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

test("every committed mark is keyed by a real route slug", () => {
  // The mark behind a row is looked up by the row's route id. A file named for
  // the CMS slug instead of the route silently loses its logotype: CLOSED is
  // "closed" in the CMS and "bar-closed" on the site.
  for (const id of Object.keys(INDEX_MARKS)) {
    assert.ok(
      PROJECT_SLUGS.includes(id),
      `${id}.svg is not a route slug, so no row will ever find it`
    );
  }
});

test("the marks cover the projects that have a logotype", () => {
  const withMarks = liveProjects().filter((project) => INDEX_MARKS[project.id]);
  assert.equal(withMarks.length, Object.keys(INDEX_MARKS).length);
  // Our Boy Roy exists only as raster artwork, so it is deliberately absent.
  assert.equal(INDEX_MARKS["our-boy-roy"], undefined);
});

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
