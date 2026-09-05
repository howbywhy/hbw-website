import assert from "node:assert/strict";
import { test } from "node:test";
import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { CMS_BACKED_PROJECTS } from "../../lib/cms-source";
import { sckReadClient } from "../scripts/fetch-sck";
import { decideRebuild, parseRebuildPayload } from "./authorize";
import { processCmsRebuild } from "./process";
import {
  assertNoPublicRebuildSecrets,
  isVercelDeployHookUrl,
  SANITY_WEBHOOK_SECRET_ENV,
  VERCEL_DEPLOY_HOOK_URL_ENV,
} from "./secrets";
import { triggerProductionRebuild } from "./trigger";

const SECRET = "test-webhook-secret";
const HOOK = "https://api.vercel.com/v1/integrations/deploy/prj_test/hook_test";
const ENV = {
  [SANITY_WEBHOOK_SECRET_ENV]: SECRET,
  [VERCEL_DEPLOY_HOOK_URL_ENV]: HOOK,
};

const obr = {
  _id: "project-our-boy-roy",
  _type: "project",
  _rev: "rev-1",
  slug: "our-boy-roy",
};

async function signedRequest(body: unknown, secret = SECRET, signature?: string) {
  const raw = JSON.stringify(body);
  const header = signature ?? (await encodeSignatureHeader(raw, Date.now(), secret));
  return new Request("https://www.hbw.works/api/cms/rebuild", {
    method: "POST",
    headers: { [SIGNATURE_HEADER_NAME]: header, "content-type": "application/json" },
    body: raw,
  });
}

test("rebuild secrets are server-only and reject public prefixes", () => {
  assert.equal(SANITY_WEBHOOK_SECRET_ENV, "SANITY_WEBHOOK_SECRET");
  assert.equal(VERCEL_DEPLOY_HOOK_URL_ENV, "VERCEL_DEPLOY_HOOK_URL");
  assert.ok(!SANITY_WEBHOOK_SECRET_ENV.startsWith("NEXT_PUBLIC_"));
  assert.ok(!VERCEL_DEPLOY_HOOK_URL_ENV.startsWith("NEXT_PUBLIC_"));
  assert.ok(isVercelDeployHookUrl(HOOK));
  assert.equal(isVercelDeployHookUrl("https://example.com/deploy"), false);
  assert.throws(
    () => assertNoPublicRebuildSecrets({ NEXT_PUBLIC_SANITY_WEBHOOK_SECRET: "x" }),
    /must not use NEXT_PUBLIC_/
  );
});

test("missing or invalid webhook signature is rejected", async () => {
  assert.deepEqual(
    decideRebuild({ configured: true, signatureValid: false, payload: obr }),
    { ok: false, status: 401, reason: "invalid-signature" }
  );
  const missing = await processCmsRebuild(
    new Request("https://www.hbw.works/api/cms/rebuild", {
      method: "POST",
      body: JSON.stringify(obr),
    }),
    { env: ENV, fetchImpl: async () => new Response("nope") }
  );
  assert.equal(missing.status, 401);
  const invalid = await processCmsRebuild(await signedRequest(obr, "wrong-secret"), {
    env: ENV,
    fetchImpl: async () => {
      throw new Error("should not deploy");
    },
  });
  assert.equal(invalid.status, 401);
});

test("valid signed published project update is accepted", () => {
  const decision = decideRebuild({ configured: true, signatureValid: true, payload: obr });
  assert.equal(decision.ok, true);
  if (decision.ok) {
    assert.equal(decision.action, "trigger");
    assert.equal(decision.documentId, "project-our-boy-roy");
  }
});

test("draft, unrelated type, and unknown project are ignored", () => {
  const draft = decideRebuild({
    configured: true,
    signatureValid: true,
    payload: { ...obr, _id: "drafts.project-our-boy-roy" },
  });
  const otherType = decideRebuild({
    configured: true,
    signatureValid: true,
    payload: { _id: "settings", _type: "siteSettings" },
  });
  const unknown = decideRebuild({
    configured: true,
    signatureValid: true,
    payload: { _id: "project-nido", _type: "project", slug: "bistro-nido" },
  });
  assert.equal(draft.ok && draft.action, "ignore");
  assert.equal(otherType.ok && otherType.action, "ignore");
  assert.equal(unknown.ok && unknown.action, "ignore");
});

test("only the six current CMS document IDs can trigger a rebuild", () => {
  for (const project of CMS_BACKED_PROJECTS) {
    const decision = decideRebuild({
      configured: true,
      signatureValid: true,
      payload: { _id: project.documentId, _type: "project", _rev: project.documentId, slug: project.cmsSlug },
    });
    assert.equal(decision.ok && decision.action, "trigger", project.label);
  }
  const closedPublicId = decideRebuild({
    configured: true,
    signatureValid: true,
    payload: { _id: "project-bar-closed", _type: "project" },
  });
  assert.equal(closedPublicId.ok && closedPublicId.action, "ignore");
});

test("duplicate revision and short bursts coalesce without another deploy", () => {
  const first = decideRebuild({ configured: true, signatureValid: true, payload: obr, now: 1_000 });
  assert.equal(first.ok && first.action, "trigger");
  const duplicate = decideRebuild({
    configured: true,
    signatureValid: true,
    payload: obr,
    now: 2_000,
    last: { rev: "rev-1", at: 1_000 },
  });
  assert.equal(duplicate.ok && duplicate.action, "coalesce");
  const burst = decideRebuild({
    configured: true,
    signatureValid: true,
    payload: { ...obr, _rev: "rev-2" },
    now: 10_000,
    last: { rev: "rev-1", at: 1_000 },
  });
  assert.equal(burst.ok && burst.action, "coalesce");
});

test("valid webhook calls the deploy hook once; failure stays off the live alias", async () => {
  let calls = 0;
  const ok = await processCmsRebuild(await signedRequest(obr), {
    env: ENV,
    fetchImpl: async (url) => {
      calls += 1;
      assert.equal(url, HOOK);
      return Response.json({ job: { id: "job_test", state: "PENDING" } });
    },
  });
  assert.equal(ok.status, 202);
  assert.deepEqual(ok.body, { ok: true, documentId: "project-our-boy-roy", jobId: "job_test" });
  assert.equal(calls, 1);

  const failed = await triggerProductionRebuild(ENV, async () => new Response("no", { status: 500 }));
  assert.equal(failed.ok, false);
  assert.equal(failed.status, 502);
});

test("public published loader stays unauthenticated and catalog IDs stay code-owned", () => {
  const config = sckReadClient().config();
  assert.equal(config.perspective, "published");
  assert.equal(config.token, undefined);
  assert.deepEqual(
    CMS_BACKED_PROJECTS.map((project) => project.documentId),
    [
      "project-sck",
      "project-closed",
      "project-koja",
      "project-chris-sisarich",
      "project-sub3",
      "project-our-boy-roy",
    ]
  );
});

test("payload parse accepts projected slug strings", () => {
  assert.deepEqual(parseRebuildPayload(JSON.stringify(obr)), obr);
  assert.equal(parseRebuildPayload("not-json"), null);
});
