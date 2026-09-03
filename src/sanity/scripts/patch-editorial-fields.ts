/**
 * Field-only editorial patch. Does not replace documents or touch media.
 * Snapshot:  npx tsx src/sanity/scripts/patch-editorial-fields.ts
 * Apply:     npx sanity exec src/sanity/scripts/patch-editorial-fields.ts --with-user-token
 *
 * Refuse to run if APPLY is unset during sanity exec? We check argv/env.
 * Set HBW_APPLY_EDITORIAL_PATCH=1 to mutate.
 */
import { createClient } from "@sanity/client";
import { portableBlocks } from "./portable-blocks";
import { CHRIS_COPY, CHRIS_DOCUMENT_ID } from "./chris-content";
import { CLOSED_COPY, CLOSED_DOCUMENT_ID } from "./closed-content";
import { KOJA_COPY, KOJA_DOCUMENT_ID } from "./koja-content";
import { SCK_COPY, SCK_DOCUMENT_ID } from "./sck-content";

const PROJECT_ID = "aagd1kcy";
const DATASET = "production";
const API_VERSION = "2025-02-19";

const SNAPSHOT_IDS = [
  SCK_DOCUMENT_ID,
  CLOSED_DOCUMENT_ID,
  KOJA_DOCUMENT_ID,
  CHRIS_DOCUMENT_ID,
  "project-sub3",
  "project-our-boy-roy",
] as const;

const SNAPSHOT_QUERY = `*[_id in $ids]{
  _id,
  _rev,
  _type,
  title,
  "slug": slug.current,
  proposition,
  year,
  location,
  sectors,
  disciplines,
  portfolioOrder,
  context,
  roles,
  workingContext,
  collaborators[]{ _key, name, contribution, url },
  idea,
  shift,
  system,
  outcome,
  "previewRef": preview.asset._ref,
  "movementCount": count(movements),
  "mediaFingerprint": movements[]{
    _key,
    mediaType,
    alt,
    scale,
    pace,
    relation,
    infoHint,
    presentationOverride,
    "still": still.asset._ref,
    "poster": poster.asset._ref,
    "video": video.asset._ref,
    "webm": webm.asset._ref
  }
}`;

type Snapshot = {
  _id: string;
  _rev: string;
  _type: string;
  title: string;
  slug: string;
  proposition: string;
  year: string;
  location?: string;
  sectors?: string[];
  disciplines?: string[];
  portfolioOrder?: number;
  context?: unknown;
  roles?: string[];
  workingContext?: string;
  collaborators?: Array<{ _key?: string; name?: string; contribution?: string; url?: string }>;
  idea?: { heading?: string; body?: unknown };
  shift?: { heading?: string; body?: unknown };
  system?: { heading?: string; body?: unknown };
  outcome?: unknown;
  previewRef?: string;
  movementCount: number;
  mediaFingerprint: unknown;
};

function readClient() {
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    useCdn: false,
    perspective: "published",
  });
}

async function writeClient() {
  const { getCliClient } = await import("sanity/cli");
  return getCliClient({
    apiVersion: API_VERSION,
    projectId: PROJECT_ID,
    dataset: DATASET,
  });
}

function caseStudy(heading: string, body: string, prefix: string) {
  return {
    _type: "caseStudyBlock",
    heading,
    body: portableBlocks(prefix, body),
  };
}

function plainBlocks(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value
    .map((block) => {
      if (!block || typeof block !== "object" || !("children" in block)) return "";
      const children = (block as { children?: Array<{ text?: string }> }).children ?? [];
      return children.map((child) => child.text ?? "").join("");
    })
    .filter(Boolean)
    .join("\n\n");
}

function sectionPlain(section: { heading?: string; body?: unknown } | undefined) {
  if (!section) return null;
  return { heading: section.heading ?? "", body: plainBlocks(section.body) };
}

function summarize(doc: Snapshot) {
  return {
    id: doc._id,
    rev: doc._rev,
    type: doc._type,
    slug: doc.slug,
    title: doc.title,
    proposition: doc.proposition,
    year: doc.year,
    location: doc.location ?? null,
    sectors: doc.sectors ?? [],
    disciplines: doc.disciplines ?? [],
    portfolioOrder: doc.portfolioOrder ?? null,
    movementCount: doc.movementCount,
    previewRef: doc.previewRef ?? null,
    roles: doc.roles ?? [],
    workingContext: doc.workingContext ?? null,
    collaborators: (doc.collaborators ?? []).map((item) => `${item.name} — ${item.contribution}`),
    hasOutcome: doc.outcome != null,
    context: plainBlocks(doc.context),
    idea: sectionPlain(doc.idea),
    shift: sectionPlain(doc.shift),
    system: sectionPlain(doc.system),
    outcome: sectionPlain(doc.outcome as { heading?: string; body?: unknown } | undefined),
    mediaFingerprint: doc.mediaFingerprint,
  };
}

function fingerprint(doc: Snapshot) {
  return JSON.stringify({
    id: doc._id,
    type: doc._type,
    slug: doc.slug,
    title: doc.title,
    proposition: doc.proposition,
    year: doc.year,
    location: doc.location ?? null,
    sectors: doc.sectors ?? [],
    disciplines: doc.disciplines ?? [],
    portfolioOrder: doc.portfolioOrder ?? null,
    previewRef: doc.previewRef ?? null,
    movementCount: doc.movementCount,
    mediaFingerprint: doc.mediaFingerprint,
  });
}

async function loadSnapshots(client: {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>;
}) {
  const docs = await client.fetch<Snapshot[]>(SNAPSHOT_QUERY, { ids: [...SNAPSHOT_IDS] });
  const byId = new Map(docs.map((doc) => [doc._id, doc]));
  return SNAPSHOT_IDS.map((id) => {
    const doc = byId.get(id);
    if (!doc) throw new Error(`Missing published document ${id}`);
    return doc;
  });
}

async function main() {
  const apply = process.env.HBW_APPLY_EDITORIAL_PATCH === "1";
  const reader = readClient();
  const before = await loadSnapshots(reader);
  const beforeById = Object.fromEntries(before.map((doc) => [doc._id, summarize(doc)]));

  console.log(JSON.stringify({ phase: "before", apply, documents: beforeById }, null, 2));

  if (!apply) {
    console.log("snapshot only — set HBW_APPLY_EDITORIAL_PATCH=1 to mutate");
    return;
  }

  const writer = await writeClient();
  const sck = before.find((doc) => doc._id === SCK_DOCUMENT_ID);
  const closed = before.find((doc) => doc._id === CLOSED_DOCUMENT_ID);
  const koja = before.find((doc) => doc._id === KOJA_DOCUMENT_ID);
  const chris = before.find((doc) => doc._id === CHRIS_DOCUMENT_ID);
  if (!sck || !closed || !koja || !chris) throw new Error("Required documents missing before patch");

  if (sck.movementCount !== 21) throw new Error(`SCK movement count unexpected: ${sck.movementCount}`);
  if (closed.movementCount !== 9) throw new Error(`CLOSED movement count unexpected: ${closed.movementCount}`);
  if (koja.movementCount !== 8) throw new Error(`KOJA movement count unexpected: ${koja.movementCount}`);
  if (chris.movementCount !== 8) throw new Error(`Chris movement count unexpected: ${chris.movementCount}`);

  await writer
    .patch(SCK_DOCUMENT_ID)
    .ifRevisionId(sck._rev)
    .set({
      context: portableBlocks("ctx", SCK_COPY.context),
      roles: SCK_COPY.roles,
      idea: caseStudy(SCK_COPY.idea.heading, SCK_COPY.idea.body, "idea"),
      shift: caseStudy(SCK_COPY.shift.heading, SCK_COPY.shift.body, "shift"),
      system: caseStudy(SCK_COPY.system.heading, SCK_COPY.system.body, "sys"),
    })
    .unset(["outcome"])
    .commit({ autoGenerateArrayKeys: true });

  await writer
    .patch(CLOSED_DOCUMENT_ID)
    .ifRevisionId(closed._rev)
    .set({
      context: portableBlocks("ctx", CLOSED_COPY.context),
      roles: CLOSED_COPY.roles,
      workingContext: CLOSED_COPY.workingContext,
      collaborators: CLOSED_COPY.collaborators.map((item) => ({
        _type: "collaborator",
        name: item.name,
        contribution: item.contribution,
      })),
      idea: caseStudy(CLOSED_COPY.idea.heading, CLOSED_COPY.idea.body, "idea"),
      shift: caseStudy(CLOSED_COPY.shift.heading, CLOSED_COPY.shift.body, "shift"),
      system: caseStudy(CLOSED_COPY.system.heading, CLOSED_COPY.system.body, "sys"),
    })
    .commit({ autoGenerateArrayKeys: true });

  await writer
    .patch(KOJA_DOCUMENT_ID)
    .ifRevisionId(koja._rev)
    .set({
      context: portableBlocks("ctx", KOJA_COPY.context),
      roles: KOJA_COPY.roles,
      idea: caseStudy(KOJA_COPY.idea.heading, KOJA_COPY.idea.body, "idea"),
      shift: caseStudy(KOJA_COPY.shift.heading, KOJA_COPY.shift.body, "shift"),
      system: caseStudy(KOJA_COPY.system.heading, KOJA_COPY.system.body, "sys"),
    })
    .commit({ autoGenerateArrayKeys: true });

  await writer
    .patch(CHRIS_DOCUMENT_ID)
    .ifRevisionId(chris._rev)
    .set({
      context: portableBlocks("ctx", CHRIS_COPY.context),
      roles: CHRIS_COPY.roles,
      idea: caseStudy(CHRIS_COPY.idea.heading, CHRIS_COPY.idea.body, "idea"),
      shift: caseStudy(CHRIS_COPY.shift.heading, CHRIS_COPY.shift.body, "shift"),
      system: caseStudy(CHRIS_COPY.system.heading, CHRIS_COPY.system.body, "sys"),
    })
    .commit({ autoGenerateArrayKeys: true });

  const after = await loadSnapshots(readClient());
  const checks = after.map((doc) => {
    const previous = before.find((item) => item._id === doc._id);
    if (!previous) throw new Error(`Missing before snapshot for ${doc._id}`);
    return {
      id: doc._id,
      previousRev: previous._rev,
      nextRev: doc._rev,
      revisionChanged: doc._rev !== previous._rev,
      identityUnchanged: fingerprint(previous) === fingerprint(doc),
      movementCountBefore: previous.movementCount,
      movementCountAfter: doc.movementCount,
      hasOutcome: doc.outcome != null,
      roles: doc.roles ?? [],
      workingContext: doc.workingContext ?? null,
      collaborators: (doc.collaborators ?? []).map((item) => `${item.name} — ${item.contribution}`),
    };
  });

  const patched = new Set([SCK_DOCUMENT_ID, CLOSED_DOCUMENT_ID, KOJA_DOCUMENT_ID, CHRIS_DOCUMENT_ID]);
  for (const check of checks) {
    if (!check.identityUnchanged) throw new Error(`${check.id} media/identity fingerprint changed`);
    if (patched.has(check.id) && !check.revisionChanged) throw new Error(`${check.id} revision did not change`);
    if (!patched.has(check.id) && check.revisionChanged) throw new Error(`${check.id} should have been unchanged`);
  }

  console.log(JSON.stringify({ phase: "after", checks }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
