import assert from "node:assert/strict";
import { test } from "node:test";
import { CMS_BACKED_PROJECTS } from "../../lib/cms-source";
import { AdapterError } from "../adapter/types";
import { sckReadClient } from "../scripts/fetch-sck";
import { canAccessCmsPreview, isCmsPreviewAllowed } from "./allowed";
import { authorizeDraftPreview } from "./enable";
import { loadDraftFrontendProject } from "./load-draft";
import { previewPathForCmsSlug, previewPathFromRedirect, safePreviewErrorMessage } from "./paths";
import { DraftPreviewError, SANITY_API_READ_TOKEN_ENV, assertNoPublicPreviewSecrets, sanityReadToken } from "./token";

test("production Vercel anonymous preview stays blocked; draft session may open it", () => {
  const production = { VERCEL_ENV: "production", NODE_ENV: "production" };
  assert.equal(isCmsPreviewAllowed(production), false);
  assert.equal(canAccessCmsPreview(false, production), false);
  assert.equal(canAccessCmsPreview(true, production), true);
});

test("Vercel preview deployments still allow published CMS preview without a draft session", () => {
  const preview = { VERCEL_ENV: "preview", NODE_ENV: "production" };
  assert.equal(isCmsPreviewAllowed(preview), true);
  assert.equal(canAccessCmsPreview(false, preview), true);
});

test("CLOSED maps CMS slug closed to preview/closed and never to public bar-closed", () => {
  assert.equal(previewPathForCmsSlug("closed"), "/preview/closed");
  assert.equal(previewPathForCmsSlug("bar-closed"), null);
  assert.equal(previewPathFromRedirect("/preview/closed"), "/preview/closed");
  assert.equal(previewPathFromRedirect("/projects/bar-closed"), null);
  assert.equal(previewPathFromRedirect("/preview/bar-closed"), null);
  assert.equal(previewPathFromRedirect("https://www.hbw.works/preview/closed?x=1"), "/preview/closed");
});

test("preview paths exist for all six CMS projects and reject unknown slugs", () => {
  for (const project of CMS_BACKED_PROJECTS) {
    assert.equal(previewPathForCmsSlug(project.cmsSlug), project.previewPath, project.label);
    assert.equal(previewPathFromRedirect(project.previewPath), project.previewPath, project.label);
  }
  assert.equal(previewPathForCmsSlug("bistro-nido"), null);
  assert.equal(previewPathFromRedirect("/preview/not-a-project"), null);
  assert.equal(previewPathFromRedirect("/"), null);
});

test("invalid preview auth fails; unknown redirect fails; configured missing fails", () => {
  assert.deepEqual(authorizeDraftPreview({ isValid: false }, true), {
    ok: false,
    status: 401,
    message: "Invalid preview secret.",
  });
  assert.deepEqual(authorizeDraftPreview({ isValid: true, redirectTo: "/preview/closed" }, false), {
    ok: false,
    status: 503,
    message: "Draft preview is not configured.",
  });
  assert.deepEqual(authorizeDraftPreview({ isValid: true, redirectTo: "/projects/sck" }, true), {
    ok: false,
    status: 404,
    message: "Unknown preview project.",
  });
  assert.deepEqual(authorizeDraftPreview({ isValid: true, redirectTo: "/preview/closed" }, true), {
    ok: true,
    location: "/preview/closed",
  });
});

test("draft preview token env is server-only", () => {
  assert.equal(SANITY_API_READ_TOKEN_ENV, "SANITY_API_READ_TOKEN");
  assert.ok(!SANITY_API_READ_TOKEN_ENV.startsWith("NEXT_PUBLIC_"));
  assert.equal(sanityReadToken({}), undefined);
  assert.throws(
    () => assertNoPublicPreviewSecrets({ NEXT_PUBLIC_SANITY_API_READ_TOKEN: "sk" }),
    /must not use NEXT_PUBLIC_/
  );
});

test("published Sanity client stays published-only and unauthenticated", () => {
  const config = sckReadClient().config();
  assert.equal(config.perspective, "published");
  assert.equal(config.token, undefined);
  assert.equal(config.projectId, "aagd1kcy");
  assert.equal(config.dataset, "production");
});

test("draft loader rejects public or unknown slugs without fetching", async () => {
  await assert.rejects(() => loadDraftFrontendProject("bar-closed"), /received "bar-closed"/);
  await assert.rejects(() => loadDraftFrontendProject("not-a-project"), /received "not-a-project"/);
});

test("broken drafts surface a preview error instead of published content", () => {
  assert.equal(
    safePreviewErrorMessage(new AdapterError("MISSING_MEDIA", "Still movement is missing an image")),
    "This draft is incomplete: Still movement is missing an image"
  );
  assert.equal(
    safePreviewErrorMessage(new DraftPreviewError("missing", "No draft or published project was found for \"koja\".")),
    "No draft or published project was found for \"koja\"."
  );
  assert.equal(safePreviewErrorMessage(new Error("secret stack\ntrace")), "This draft could not be rendered.");
});
