import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import {
  decideRebuild,
  nextCoalesceState,
  parseRebuildPayload,
  type RebuildCoalesceState,
} from "./authorize";
import { logRebuildEvent, triggerProductionRebuild } from "./trigger";
import { rebuildConfigured, sanityWebhookSecret } from "./secrets";

export async function processCmsRebuild(
  request: Request,
  options: {
    env?: Record<string, string | undefined>;
    last?: RebuildCoalesceState;
    now?: number;
    fetchImpl?: typeof fetch;
  } = {}
) {
  const env = options.env ?? process.env;
  const configured = rebuildConfigured(env);
  const secret = sanityWebhookSecret(env);
  const raw = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) || "";
  const signatureValid = Boolean(secret && signature && (await isValidSignature(raw, signature, secret)));
  const decision = decideRebuild({
    configured,
    signatureValid,
    payload: parseRebuildPayload(raw),
    last: options.last,
    now: options.now,
  });

  if (!decision.ok) {
    logRebuildEvent({ result: "rejected", reason: decision.reason });
    return {
      last: options.last,
      status: decision.status,
      body:
        decision.reason === "unconfigured"
          ? "CMS rebuild is not configured."
          : decision.reason === "invalid-signature"
            ? "Invalid webhook signature."
            : "Invalid webhook body.",
    };
  }

  if (decision.action === "ignore") {
    logRebuildEvent({ result: "ignored", reason: decision.reason, documentId: decision.documentId });
    return { last: options.last, status: 204, body: "" };
  }

  if (decision.action === "coalesce") {
    logRebuildEvent({ result: "coalesced", reason: decision.reason, documentId: decision.documentId });
    return {
      last: options.last,
      status: 202,
      body: { ok: true, coalesced: true, reason: decision.reason },
    };
  }

  const triggered = await triggerProductionRebuild(env, options.fetchImpl ?? fetch);
  if (!triggered.ok) {
    logRebuildEvent({
      result: "trigger-failed",
      reason: triggered.reason,
      documentId: decision.documentId,
    });
    return { last: options.last, status: triggered.status, body: "Production rebuild could not be started." };
  }

  const last = nextCoalesceState(decision, options.last, options.now);
  logRebuildEvent({
    result: "accepted",
    reason: decision.reason,
    documentId: decision.documentId,
    jobId: triggered.jobId,
  });
  return {
    last,
    status: 202,
    body: { ok: true, documentId: decision.documentId, jobId: triggered.jobId },
  };
}
