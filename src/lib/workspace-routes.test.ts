import assert from "node:assert/strict";
import { test } from "node:test";
import { previewSlugFromPath, projectSlugFromPath, viewSlugFromPath } from "./workspace-routes";

test("public project slugs stay on /projects", () => {
  assert.equal(projectSlugFromPath("/projects/sck"), "sck");
  assert.equal(projectSlugFromPath("/preview/sck"), null);
});

test("CMS preview is SCK-only and not a public project path", () => {
  assert.equal(previewSlugFromPath("/preview/sck"), "sck");
  assert.equal(previewSlugFromPath("/preview/koja"), null);
  assert.equal(previewSlugFromPath("/projects/sck"), null);
});

test("view slug accepts either public SCK or CMS preview", () => {
  assert.equal(viewSlugFromPath("/projects/sck"), "sck");
  assert.equal(viewSlugFromPath("/preview/sck"), "sck");
  assert.equal(viewSlugFromPath("/"), null);
});
