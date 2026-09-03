import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogIdForSlug, PROJECT_SLUGS, projectById } from "../components/home/catalog";
import { nextProject } from "../components/home/sequence";
import { previewSlugFromPath, projectSlugFromPath, viewSlugFromPath } from "./workspace-routes";

test("public project slugs stay on /projects", () => {
  assert.equal(projectSlugFromPath("/projects/sck"), "sck");
  assert.equal(projectSlugFromPath("/projects/bar-closed"), "bar-closed");
  assert.equal(projectSlugFromPath("/projects/koja"), "koja");
  assert.equal(projectSlugFromPath("/projects/sub-3"), "sub-3");
  assert.equal(projectSlugFromPath("/projects/chris-sisarich"), "chris-sisarich");
  assert.equal(projectSlugFromPath("/projects/our-boy-roy"), "our-boy-roy");
  assert.equal(projectSlugFromPath("/projects/bistro-nido"), null);
  assert.equal(projectSlugFromPath("/preview/sck"), null);
  assert.equal(projectSlugFromPath("/preview/closed"), null);
  assert.equal(projectSlugFromPath("/preview/koja"), null);
  assert.equal(projectSlugFromPath("/preview/chris-sisarich"), null);
  assert.equal(projectSlugFromPath("/preview/sub-3"), null);
  assert.equal(projectSlugFromPath("/preview/our-boy-roy"), null);
});

test("CMS preview is SCK, CLOSED, KOJA, Chris, SUB:3, and OBR only, and not a public project path", () => {
  assert.equal(previewSlugFromPath("/preview/sck"), "sck");
  assert.equal(previewSlugFromPath("/preview/closed"), "closed");
  assert.equal(previewSlugFromPath("/preview/koja"), "koja");
  assert.equal(previewSlugFromPath("/preview/chris-sisarich"), "chris-sisarich");
  assert.equal(previewSlugFromPath("/preview/sub-3"), "sub-3");
  assert.equal(previewSlugFromPath("/preview/our-boy-roy"), "our-boy-roy");
  assert.equal(previewSlugFromPath("/preview/bistro-nido"), null);
  assert.equal(previewSlugFromPath("/projects/sck"), null);
  assert.equal(previewSlugFromPath("/projects/bar-closed"), null);
  assert.equal(previewSlugFromPath("/projects/koja"), null);
  assert.equal(previewSlugFromPath("/projects/chris-sisarich"), null);
  assert.equal(previewSlugFromPath("/projects/sub-3"), null);
  assert.equal(previewSlugFromPath("/projects/our-boy-roy"), null);
});

test("view slug accepts public routes or CMS preview", () => {
  assert.equal(viewSlugFromPath("/projects/sck"), "sck");
  assert.equal(viewSlugFromPath("/projects/bar-closed"), "bar-closed");
  assert.equal(viewSlugFromPath("/projects/koja"), "koja");
  assert.equal(viewSlugFromPath("/projects/chris-sisarich"), "chris-sisarich");
  assert.equal(viewSlugFromPath("/projects/sub-3"), "sub-3");
  assert.equal(viewSlugFromPath("/preview/sck"), "sck");
  assert.equal(viewSlugFromPath("/preview/closed"), "closed");
  assert.equal(viewSlugFromPath("/preview/koja"), "koja");
  assert.equal(viewSlugFromPath("/preview/chris-sisarich"), "chris-sisarich");
  assert.equal(viewSlugFromPath("/preview/sub-3"), "sub-3");
  assert.equal(viewSlugFromPath("/projects/our-boy-roy"), "our-boy-roy");
  assert.equal(viewSlugFromPath("/preview/our-boy-roy"), "our-boy-roy");
  assert.equal(viewSlugFromPath("/"), null);
});

test("CLOSED CMS slug aliases the public catalog id", () => {
  assert.equal(catalogIdForSlug("closed"), "bar-closed");
  assert.equal(catalogIdForSlug("sck"), "sck");
  assert.equal(catalogIdForSlug("koja"), "koja");
  assert.equal(projectById("closed").id, "bar-closed");
  assert.equal(nextProject("closed")?.id, nextProject("bar-closed")?.id);
});

test("retired Nido is absent from public progression; OBR cycles to SCK", () => {
  assert.deepEqual(PROJECT_SLUGS, ["sck", "bar-closed", "koja", "sub-3", "chris-sisarich", "our-boy-roy"]);
  assert.equal(nextProject("sck")?.id, "bar-closed");
  assert.equal(nextProject("bar-closed")?.id, "koja");
  assert.equal(nextProject("koja")?.id, "sub-3");
  assert.equal(nextProject("sub-3")?.id, "chris-sisarich");
  assert.equal(nextProject("chris-sisarich")?.id, "our-boy-roy");
  assert.equal(nextProject("our-boy-roy")?.id, "sck");
  assert.equal(nextProject("bistro-nido"), null);
});
