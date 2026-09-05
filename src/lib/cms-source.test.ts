import assert from "node:assert/strict";
import { test } from "node:test";
import { CHRIS_DOCUMENT_ID } from "../sanity/scripts/chris-content";
import { CLOSED_DOCUMENT_ID } from "../sanity/scripts/closed-content";
import { KOJA_DOCUMENT_ID } from "../sanity/scripts/koja-content";
import { OBR_DOCUMENT_ID } from "../sanity/scripts/obr-content";
import { SCK_DOCUMENT_ID } from "../sanity/scripts/sck-content";
import { SUB3_DOCUMENT_ID } from "../sanity/scripts/sub3-content";
import {
  CMS_BACKED_PROJECTS,
  CMS_PREVIEW_SLUGS,
  catalogIdForSlug,
  cmsBackedProject,
  cmsProjectByCmsSlug,
  cmsProjectByPreviewSlug,
  sourceFlagForProject,
  sourceFlagFromEnv,
} from "./cms-source";

test("registry covers the six live CMS projects and no others", () => {
  assert.deepEqual(
    CMS_BACKED_PROJECTS.map((project) => project.routeSlug),
    ["sck", "bar-closed", "koja", "chris-sisarich", "sub-3", "our-boy-roy"]
  );
  assert.deepEqual(CMS_PREVIEW_SLUGS, ["sck", "closed", "koja", "chris-sisarich", "sub-3", "our-boy-roy"]);
  assert.equal(cmsBackedProject("bistro-nido"), undefined);
  assert.equal(cmsProjectByPreviewSlug("bar-closed"), undefined);
});

test("CLOSED keeps public, CMS, preview, and redirect identities distinct", () => {
  const closed = cmsBackedProject("bar-closed");
  assert.equal(closed?.cmsSlug, "closed");
  assert.equal(closed?.previewSlug, "closed");
  assert.equal(closed?.publicPath, "/projects/bar-closed");
  assert.equal(closed?.previewPath, "/preview/closed");
  assert.deepEqual(closed?.aliases, [{ source: "/projects/closed", destination: "/projects/bar-closed" }]);
  assert.equal(catalogIdForSlug("closed"), "bar-closed");
  assert.equal(cmsProjectByCmsSlug("closed")?.routeSlug, "bar-closed");
  assert.equal(cmsProjectByPreviewSlug("closed")?.routeSlug, "bar-closed");
});

test("registry document IDs stay aligned with the seed/content constants", () => {
  assert.equal(cmsProjectByCmsSlug("sck")?.documentId, SCK_DOCUMENT_ID);
  assert.equal(cmsProjectByCmsSlug("closed")?.documentId, CLOSED_DOCUMENT_ID);
  assert.equal(cmsProjectByCmsSlug("koja")?.documentId, KOJA_DOCUMENT_ID);
  assert.equal(cmsProjectByCmsSlug("chris-sisarich")?.documentId, CHRIS_DOCUMENT_ID);
  assert.equal(cmsProjectByCmsSlug("sub-3")?.documentId, SUB3_DOCUMENT_ID);
  assert.equal(cmsProjectByCmsSlug("our-boy-roy")?.documentId, OBR_DOCUMENT_ID);
});

test("source flags stay independent and default to local", () => {
  for (const project of CMS_BACKED_PROJECTS) {
    assert.equal(sourceFlagFromEnv(project.envKey, {}), "local");
    assert.equal(sourceFlagFromEnv(project.envKey, { [project.envKey]: "nope" }), "local");
    assert.equal(sourceFlagForProject(project, { [project.envKey]: "sanity" }), "sanity");
  }

  const mixed = {
    HBW_SCK_SOURCE: "local",
    HBW_CLOSED_SOURCE: "sanity",
    HBW_KOJA_SOURCE: "local",
    HBW_CHRIS_SOURCE: "sanity",
    HBW_SUB3_SOURCE: "sanity",
    HBW_OBR_SOURCE: "local",
  } as const;
  assert.equal(sourceFlagForProject(CMS_BACKED_PROJECTS[0], mixed), "local");
  assert.equal(sourceFlagForProject(CMS_BACKED_PROJECTS[1], mixed), "sanity");
  assert.equal(sourceFlagForProject(CMS_BACKED_PROJECTS[2], mixed), "local");
  assert.equal(sourceFlagForProject(CMS_BACKED_PROJECTS[5], mixed), "local");
});
