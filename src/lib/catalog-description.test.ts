import assert from "node:assert/strict";
import { test } from "node:test";
import { liveProjects, projectById, projectDescription } from "../components/home/catalog";

const EXPECTED: Record<string, string> = {
  "made-by-madelen":
    "Made by Madelen — From Making to Moment. Launch strategy, content planning, motion and social content for a fashion label going to market.",
  sck: "SCK (Studio Carson Kelly) — Intersecting Realities. Brand strategy, creative direction and visual identity for an architecture and interiors studio.",
  "bar-closed":
    "CLOSED, a Newcastle bar — A Smuggler’s House. Concept, identity, signage and print. The name emerged during the work.",
  koja: "KOJA — Unapologetically Good. Brand strategy, visual identity and packaging for an established food brand.",
  "sub-3": "SUB:3 — Bending Time & Space. Identity, packaging and motion for a new performance nutrition brand.",
  "chris-sisarich":
    "Chris Sisarich — Beauty Amongst The Mundane. Identity and website for a photographer, built to stay behind the pictures.",
  "our-boy-roy":
    "Our Boy Roy — a hospitality identity organised around Roy, a changing character. Visual identity, signage, print and social.",
};

test("project descriptions stay authored and project-specific", () => {
  // Every live project has an authored description, and nothing is authored
  // for a project that is gone. Order is the rail's business, not this test's.
  const ids = liveProjects().map((project) => project.id);
  assert.deepEqual([...ids].sort(), Object.keys(EXPECTED).sort());
  for (const [id, description] of Object.entries(EXPECTED)) {
    assert.equal(projectDescription(projectById(id)), description);
  }
  /*
   * And nothing falls through to the generic form. A project with no authored
   * description still returns a string — "Name — HBW." — so a missing one is
   * invisible until it is read in a search result or a shared link.
   */
  for (const id of ids) {
    assert.notEqual(
      projectDescription(projectById(id)),
      `${projectById(id).name} — HBW.`,
      `${id} has no authored description`
    );
  }
});
