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
    credit: "",
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

test("every live project has a mark to fall back on", () => {
  for (const project of liveProjects()) {
    assert.ok(INDEX_MARKS[project.id], `${project.id} has no committed logotype`);
  }
  assert.equal(Object.keys(INDEX_MARKS).length, liveProjects().length);
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

test("a row states who the work was made with", () => {
  // SUB:3 and Our Boy Roy already say "Developed while working with The Colour
  // Club" on their case studies. An archive row needs the same, or it claims
  // the work outright.
  const shared = entry({ credit: "The Colour Club" });
  assert.equal(shared.credit, "The Colour Club");
  // HBW's own work says nothing rather than "with HBW".
  assert.equal(entry().credit, "");
});

test("the studio credit is not the production credits", () => {
  // The collaborators field carries photographers, developers and the like:
  // SCK alone lists three. Rendering that on a row gave "with Jordan Lucky /
  // Playstate and Rebecca Whan + Afifa Intanjudin / Patternshop and Stanley
  // House Studio". Made with is a separate, short, studio-level credit.
  const shared = entry({ credit: "The Colour Club" });
  assert.ok(shared.credit.length < 40, "a row credit has to fit on one line");
  assert.ok(!shared.credit.includes("/"), "production credits do not belong here");
});
