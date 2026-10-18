import assert from "node:assert/strict";
import { test } from "node:test";
import { CHRIS_DOCUMENT_ID } from "../sanity/scripts/chris-content";
import { CLOSED_DOCUMENT_ID } from "../sanity/scripts/closed-content";
import { KOJA_DOCUMENT_ID } from "../sanity/scripts/koja-content";
import { MBM_DOCUMENT_ID } from "../sanity/scripts/mbm-content";
import { OBR_DOCUMENT_ID } from "../sanity/scripts/obr-content";
import { SCK_DOCUMENT_ID } from "../sanity/scripts/sck-content";
import { SUB3_DOCUMENT_ID } from "../sanity/scripts/sub3-content";
import { PROJECT_SLUGS } from "../components/home/catalog";
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

test("registry covers the live CMS projects and no others", () => {
  assert.deepEqual(
    CMS_BACKED_PROJECTS.map((project) => project.routeSlug),
    ["made-by-madelen", "sck", "bar-closed", "koja", "chris-sisarich", "sub-3", "our-boy-roy"]
  );
  assert.deepEqual(CMS_PREVIEW_SLUGS, [
    "made-by-madelen",
    "sck",
    "closed",
    "koja",
    "chris-sisarich",
    "sub-3",
    "our-boy-roy",
  ]);
  /*
   * The registry and the work line are the same set of projects. A project in
   * the catalogue with no registry row gets its page built and then reads the
   * shipped sequence forever, never the CMS, with nothing to say so.
   */
  assert.deepEqual(
    [...CMS_BACKED_PROJECTS.map((project) => project.routeSlug)].sort(),
    [...PROJECT_SLUGS].sort(),
    "every routable project is CMS-backed, and nothing else is"
  );
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
  assert.equal(cmsProjectByCmsSlug("made-by-madelen")?.documentId, MBM_DOCUMENT_ID);
  assert.equal(cmsProjectByCmsSlug("sck")?.documentId, SCK_DOCUMENT_ID);
  assert.equal(cmsProjectByCmsSlug("closed")?.documentId, CLOSED_DOCUMENT_ID);
  assert.equal(cmsProjectByCmsSlug("koja")?.documentId, KOJA_DOCUMENT_ID);
  assert.equal(cmsProjectByCmsSlug("chris-sisarich")?.documentId, CHRIS_DOCUMENT_ID);
  assert.equal(cmsProjectByCmsSlug("sub-3")?.documentId, SUB3_DOCUMENT_ID);
  assert.equal(cmsProjectByCmsSlug("our-boy-roy")?.documentId, OBR_DOCUMENT_ID);
});

test("source flags stay independent, and an env var overrides both ways", () => {
  for (const project of CMS_BACKED_PROJECTS) {
    // Unset, or set to something meaningless, falls through to the project.
    assert.equal(sourceFlagForProject(project, {}), project.defaultSource, project.routeSlug);
    assert.equal(
      sourceFlagForProject(project, { [project.envKey]: "nope" }),
      project.defaultSource,
      project.routeSlug
    );
    // Either direction can be pinned without a deploy.
    assert.equal(sourceFlagForProject(project, { [project.envKey]: "sanity" }), "sanity");
    assert.equal(sourceFlagForProject(project, { [project.envKey]: "local" }), "local");
  }

  /*
   * Named by env key rather than by position: the list is ordered by the work
   * line, so adding a project at the front silently moved every index here
   * onto a different project while the assertions still passed.
   */
  const mixed = {
    HBW_MBM_SOURCE: "local",
    HBW_SCK_SOURCE: "local",
    HBW_CLOSED_SOURCE: "sanity",
    HBW_KOJA_SOURCE: "local",
    HBW_CHRIS_SOURCE: "sanity",
    HBW_SUB3_SOURCE: "sanity",
    HBW_OBR_SOURCE: "local",
  } as const;
  const by = (envKey: string) => {
    const project = CMS_BACKED_PROJECTS.find((item) => item.envKey === envKey);
    assert.ok(project, `${envKey} names no project`);
    return sourceFlagForProject(project, mixed);
  };
  assert.equal(by("HBW_MBM_SOURCE"), "local");
  assert.equal(by("HBW_SCK_SOURCE"), "local");
  assert.equal(by("HBW_CLOSED_SOURCE"), "sanity");
  assert.equal(by("HBW_KOJA_SOURCE"), "local");
  assert.equal(by("HBW_OBR_SOURCE"), "local");
  /* Every project has its own key; one key must never steer two projects. */
  const keys = CMS_BACKED_PROJECTS.map((project) => project.envKey);
  assert.equal(new Set(keys).size, keys.length, "two projects share an env key");
});

/**
 * What the site serves with nothing set is the whole point of the migration,
 * so it is pinned rather than left to whatever the table happens to say.
 */
test("every project reads from the CMS", () => {
  const defaults = Object.fromEntries(
    CMS_BACKED_PROJECTS.map((project) => [project.routeSlug, sourceFlagForProject(project, {})])
  );
  assert.deepEqual(defaults, {
    "made-by-madelen": "sanity",
    sck: "sanity",
    "bar-closed": "sanity",
    koja: "sanity",
    "chris-sisarich": "sanity",
    "sub-3": "sanity",
    "our-boy-roy": "sanity",
  });
});
