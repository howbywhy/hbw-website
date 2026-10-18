import assert from "node:assert/strict";
import { test } from "node:test";
import { homePreviewProjects, liveProjects, PROJECTS, PROJECT_SLUGS } from "../components/home/catalog";
import { getExperience, PROJECT_EXPERIENCES } from "../components/home/projects/experiences";
import { nextProject } from "../components/home/sequence";
import {
  CMS_BACKED_PROJECTS,
  CMS_SLUGS,
  defineCmsProject,
  unknownCmsProjectSlugQuery,
} from "./cms-source";

test("every CMS project has a live catalog row and a local rollback experience", () => {
  for (const project of CMS_BACKED_PROJECTS) {
    const catalog = PROJECTS.find((row) => row.id === project.routeSlug);
    assert.ok(catalog, `${project.label} missing from catalog`);
    assert.equal(catalog?.href, project.publicPath);
    assert.ok(getExperience(project.routeSlug), `${project.label} missing local experience`);
    assert.match(project.envKey, /^HBW_[A-Z0-9]+_SOURCE$/);
  }
});

test("retired Nido stays local-only and out of the catalog", () => {
  assert.ok(PROJECT_EXPERIENCES["bistro-nido"]);
  assert.equal(
    PROJECTS.find((project) => project.id === "bistro-nido"),
    undefined
  );
  assert.equal(
    CMS_BACKED_PROJECTS.find((project) => project.routeSlug === "bistro-nido"),
    undefined
  );
});

test("Home peek stays the five flagged live projects in catalog order", () => {
  assert.deepEqual(
    homePreviewProjects().map((project) => project.id),
    ["sck", "bar-closed", "koja", "sub-3", "chris-sisarich"]
  );
  assert.equal(
    liveProjects().find((project) => project.id === "our-boy-roy")?.homeSelected,
    undefined
  );
});

test("Continue order is live catalog order and wraps to the first project", () => {
  assert.deepEqual(PROJECT_SLUGS, liveProjects().map((project) => project.id));
  const last = PROJECT_SLUGS[PROJECT_SLUGS.length - 1];
  assert.equal(nextProject(last)?.id, PROJECT_SLUGS[0]);
  for (let i = 0; i < PROJECT_SLUGS.length - 1; i++) {
    assert.equal(nextProject(PROJECT_SLUGS[i])?.id, PROJECT_SLUGS[i + 1]);
  }
});

test("registry derives public/preview paths and seed unknown-slug query", () => {
  const created = defineCmsProject({
    routeSlug: "example",
    cmsSlug: "example-cms",
    documentId: "project-example",
    envKey: "HBW_EXAMPLE_SOURCE",
    label: "Example",
  });
  assert.equal(created.publicPath, "/projects/example");
  assert.equal(created.previewSlug, "example-cms");
  assert.equal(created.previewPath, "/preview/example-cms");
  assert.deepEqual(created.aliases, []);

  const query = unknownCmsProjectSlugQuery();
  for (const slug of CMS_SLUGS) {
    assert.match(query, new RegExp(`"${slug}"`));
  }
});
