import assert from "node:assert/strict";
import { test } from "node:test";
import { liveProjects, projectById, projectDescription } from "../components/home/catalog";

const EXPECTED: Record<string, string> = {
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
  const ids = liveProjects().map((project) => project.id);
  assert.deepEqual(ids, Object.keys(EXPECTED));
  for (const [id, description] of Object.entries(EXPECTED)) {
    assert.equal(projectDescription(projectById(id)), description);
  }
});
