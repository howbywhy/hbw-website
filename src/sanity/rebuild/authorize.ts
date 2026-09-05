import { isKnownPublishedProjectId } from "@/lib/cms-source";

export const REBUILD_COALESCE_MS = 90_000;

export type RebuildPayload = {
  _id?: string;
  _type?: string;
  _rev?: string;
  slug?: string;
};

export type RebuildCoalesceState = {
  rev?: string;
  at: number;
};

export type RebuildDecision =
  | { ok: false; status: 400 | 401 | 503; reason: "unconfigured" | "invalid-signature" | "invalid-body" }
  | {
      ok: true;
      action: "ignore" | "coalesce" | "trigger";
      status: 202 | 204;
      reason: string;
      documentId?: string;
      slug?: string;
      rev?: string;
    };

export function parseRebuildPayload(raw: string): RebuildPayload | null {
  try {
    const parsed = raw.trim() ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const body = parsed as Record<string, unknown>;
    const slug =
      typeof body.slug === "string"
        ? body.slug
        : body.slug && typeof body.slug === "object" && typeof (body.slug as { current?: unknown }).current === "string"
          ? (body.slug as { current: string }).current
          : undefined;
    return {
      _id: typeof body._id === "string" ? body._id : undefined,
      _type: typeof body._type === "string" ? body._type : undefined,
      _rev: typeof body._rev === "string" ? body._rev : undefined,
      slug,
    };
  } catch {
    return null;
  }
}

export function decideRebuild(input: {
  configured: boolean;
  signatureValid: boolean;
  payload: RebuildPayload | null;
  now?: number;
  last?: RebuildCoalesceState;
  coalesceMs?: number;
}): RebuildDecision {
  if (!input.configured) return { ok: false, status: 503, reason: "unconfigured" };
  if (!input.signatureValid) return { ok: false, status: 401, reason: "invalid-signature" };
  if (!input.payload) return { ok: false, status: 400, reason: "invalid-body" };

  const id = input.payload._id || "";
  if (id.startsWith("drafts.") || id.startsWith("versions.")) {
    return { ok: true, action: "ignore", status: 204, reason: "draft-or-version", documentId: id };
  }
  if (input.payload._type !== "project") {
    return { ok: true, action: "ignore", status: 204, reason: "unrelated-type", documentId: id || undefined };
  }
  if (!isKnownPublishedProjectId(id)) {
    return { ok: true, action: "ignore", status: 204, reason: "unknown-project", documentId: id || undefined };
  }

  const now = input.now ?? Date.now();
  const coalesceMs = input.coalesceMs ?? REBUILD_COALESCE_MS;
  const rev = input.payload._rev;
  if (rev && input.last?.rev === rev) {
    return {
      ok: true,
      action: "coalesce",
      status: 202,
      reason: "duplicate-revision",
      documentId: id,
      slug: input.payload.slug,
      rev,
    };
  }
  if (input.last && now - input.last.at < coalesceMs) {
    return {
      ok: true,
      action: "coalesce",
      status: 202,
      reason: "coalesced",
      documentId: id,
      slug: input.payload.slug,
      rev,
    };
  }

  return {
    ok: true,
    action: "trigger",
    status: 202,
    reason: "published-project",
    documentId: id,
    slug: input.payload.slug,
    rev,
  };
}

export function nextCoalesceState(
  decision: RebuildDecision,
  previous: RebuildCoalesceState | undefined,
  now = Date.now()
): RebuildCoalesceState | undefined {
  if (!decision.ok || decision.action !== "trigger") return previous;
  return { rev: decision.rev, at: now };
}
