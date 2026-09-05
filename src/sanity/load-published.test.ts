import assert from "node:assert/strict";
import { test } from "node:test";
import { projectById } from "../components/home/catalog";
import { CMS_BACKED_PROJECTS, cmsProjectByCmsSlug } from "../lib/cms-source";
import { catalogOwned, loadPublishedFrontendProject } from "./load-published";
import { sckMediaConfig } from "./scripts/fetch-sck";

test("published catalog merge keeps shipped chrome out of Sanity for every CMS project", () => {
  for (const project of CMS_BACKED_PROJECTS) {
    const shipped = projectById(project.routeSlug);
    const catalog = catalogOwned(project.routeSlug);
    assert.equal(catalog.crop, shipped.crop, project.label);
    assert.equal(catalog.layout, shipped.layout, project.label);
    assert.equal(catalog.visualSpan, shipped.visualSpan, project.label);
    assert.equal(catalog.visualStart, shipped.visualStart, project.label);
    assert.equal(catalog.visualBefore, shipped.visualBefore, project.label);
    assert.equal(catalog.homeSelected, shipped.homeSelected, project.label);
    assert.deepEqual(catalog.credits, shipped.credits, project.label);
    assert.deepEqual(catalog.features, shipped.features, project.label);
    assert.equal(catalog.status, shipped.status, project.label);
    assert.deepEqual(catalog.collaborators, shipped.collaborators, project.label);
  }
});

test("published Sanity reader keeps the production project id", () => {
  const media = sckMediaConfig();
  assert.equal(media.projectId, "aagd1kcy");
  assert.equal(media.dataset, "production");
});

test("published loader accepts CMS slugs only and rejects public or unknown slugs", async () => {
  for (const project of CMS_BACKED_PROJECTS) {
    assert.equal(cmsProjectByCmsSlug(project.cmsSlug)?.routeSlug, project.routeSlug, project.label);
  }
  await assert.rejects(() => loadPublishedFrontendProject("bar-closed"), /received "bar-closed"/);
  await assert.rejects(() => loadPublishedFrontendProject("bistro-nido"), /received "bistro-nido"/);
  await assert.rejects(() => loadPublishedFrontendProject("not-a-project"), /received "not-a-project"/);
});
