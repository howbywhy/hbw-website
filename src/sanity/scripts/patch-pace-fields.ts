/**
 * Field-only pace patch for two approved gallery rhythm edits.
 * Snapshot:  npx tsx src/sanity/scripts/patch-pace-fields.ts
 * Apply:     HBW_APPLY_PACE_PATCH=1 npx sanity exec src/sanity/scripts/patch-pace-fields.ts --with-user-token
 *
 * Patches only:
 *   project-sck   movements[_key=="sk01"].pace  pause → normal
 *   project-closed movements[_key=="c08"].pace  pause → normal
 *
 * Does not replace documents, movement arrays, media, or presentation metadata.
 */
import { createClient } from "@sanity/client";
import { CLOSED_DOCUMENT_ID } from "./closed-content";
import { SCK_DOCUMENT_ID } from "./sck-content";

const PROJECT_ID = "aagd1kcy";
const DATASET = "production";
const API_VERSION = "2025-02-19";

const WATCH_IDS = [
  SCK_DOCUMENT_ID,
  CLOSED_DOCUMENT_ID,
  "project-koja",
  "project-chris-sisarich",
  "project-sub3",
  "project-our-boy-roy",
] as const;

const QUERY = `*[_id in $ids]{
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
  editorialPurpose,
  contributionNotes,
  replacementPriority,
  preview{ asset{ _ref } },
  "movementCount": count(movements),
  movements[]{
    _key,
    mediaType,
    alt,
    scale,
    pace,
    relation,
    infoHint,
    presentationOverride,
    still{ asset{ _ref } },
    poster{ asset{ _ref } },
    video{ asset{ _ref } },
    webm{ asset{ _ref } }
  }
}`;

type MovementSnap = {
  _key: string;
  mediaType?: string;
  alt?: string;
  scale?: string;
  pace?: string;
  relation?: string;
  infoHint?: string;
  presentationOverride?: unknown;
  still?: { asset?: { _ref?: string } };
  poster?: { asset?: { _ref?: string } };
  video?: { asset?: { _ref?: string } };
  webm?: { asset?: { _ref?: string } };
};

type DocSnap = {
  _id: string;
  _rev: string;
  _type: string;
  title?: string;
  slug?: string;
  proposition?: string;
  year?: string;
  location?: string;
  sectors?: unknown;
  disciplines?: unknown;
  portfolioOrder?: unknown;
  editorialPurpose?: unknown;
  contributionNotes?: unknown;
  replacementPriority?: unknown;
  preview?: unknown;
  movementCount: number;
  movements: MovementSnap[];
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

function identityWithoutPace(doc: DocSnap) {
  return {
    _id: doc._id,
    _type: doc._type,
    title: doc.title,
    slug: doc.slug,
    proposition: doc.proposition,
    year: doc.year,
    location: doc.location ?? null,
    sectors: doc.sectors ?? [],
    disciplines: doc.disciplines ?? [],
    portfolioOrder: doc.portfolioOrder ?? null,
    editorialPurpose: doc.editorialPurpose ?? null,
    contributionNotes: doc.contributionNotes ?? null,
    replacementPriority: doc.replacementPriority ?? null,
    preview: doc.preview ?? null,
    movementCount: doc.movementCount,
    movements: doc.movements.map(({ pace: _pace, ...rest }) => rest),
  };
}

function paceMap(doc: DocSnap) {
  return Object.fromEntries(doc.movements.map((movement) => [movement._key, movement.pace ?? null]));
}

function findMovement(doc: DocSnap, key: string) {
  return doc.movements.find((movement) => movement._key === key);
}

async function loadDocs(client: { fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T> }) {
  const docs = await client.fetch<DocSnap[]>(QUERY, { ids: [...WATCH_IDS] });
  const byId = new Map(docs.map((doc) => [doc._id, doc]));
  return WATCH_IDS.map((id) => {
    const doc = byId.get(id);
    if (!doc) throw new Error(`Missing published document ${id}`);
    return doc;
  });
}

function summarize(doc: DocSnap) {
  return {
    id: doc._id,
    rev: doc._rev,
    slug: doc.slug,
    movementCount: doc.movementCount,
    paces: paceMap(doc),
  };
}

async function main() {
  const apply = process.env.HBW_APPLY_PACE_PATCH === "1";
  const reader = readClient();
  const before = await loadDocs(reader);
  const sck = before.find((doc) => doc._id === SCK_DOCUMENT_ID);
  const closed = before.find((doc) => doc._id === CLOSED_DOCUMENT_ID);
  if (!sck || !closed) throw new Error("SCK or CLOSED missing before patch");

  const sk01 = findMovement(sck, "sk01");
  const c08 = findMovement(closed, "c08");

  const preflight = {
    apply,
    sck: {
      id: sck._id,
      rev: sck._rev,
      movementCount: sck.movementCount,
      sk01Pace: sk01?.pace ?? null,
      sk01Key: sk01?._key ?? null,
    },
    closed: {
      id: closed._id,
      rev: closed._rev,
      movementCount: closed.movementCount,
      c08Pace: c08?.pace ?? null,
      c08Key: c08?._key ?? null,
    },
    documents: Object.fromEntries(before.map((doc) => [doc._id, summarize(doc)])),
  };

  console.log(JSON.stringify({ phase: "before", ...preflight }, null, 2));

  if (sck.movementCount !== 21) throw new Error(`SCK movement count unexpected: ${sck.movementCount}`);
  if (closed.movementCount !== 9) throw new Error(`CLOSED movement count unexpected: ${closed.movementCount}`);
  if (!sk01) throw new Error("SCK sk01 missing");
  if (!c08) throw new Error("CLOSED c08 missing");
  if (sk01.pace !== "pause") throw new Error(`SCK sk01 pace unexpected: ${sk01.pace}`);
  if (c08.pace !== "pause") throw new Error(`CLOSED c08 pace unexpected: ${c08.pace}`);

  if (!apply) {
    console.log("snapshot only — set HBW_APPLY_PACE_PATCH=1 to mutate");
    return;
  }

  const writer = await writeClient();

  await writer
    .patch(SCK_DOCUMENT_ID)
    .ifRevisionId(sck._rev)
    .set({ 'movements[_key=="sk01"].pace': "normal" })
    .commit();

  await writer
    .patch(CLOSED_DOCUMENT_ID)
    .ifRevisionId(closed._rev)
    .set({ 'movements[_key=="c08"].pace': "normal" })
    .commit();

  const after = await loadDocs(reader);
  const afterSck = after.find((doc) => doc._id === SCK_DOCUMENT_ID);
  const afterClosed = after.find((doc) => doc._id === CLOSED_DOCUMENT_ID);
  if (!afterSck || !afterClosed) throw new Error("SCK or CLOSED missing after patch");

  const checks = after.map((doc) => {
    const previous = before.find((item) => item._id === doc._id);
    if (!previous) throw new Error(`Missing before snapshot for ${doc._id}`);
    const previousPaces = paceMap(previous);
    const nextPaces = paceMap(doc);
    const paceChanges = Object.keys({ ...previousPaces, ...nextPaces })
      .filter((key) => previousPaces[key] !== nextPaces[key])
      .map((key) => ({ key, from: previousPaces[key], to: nextPaces[key] }));
    return {
      id: doc._id,
      previousRev: previous._rev,
      nextRev: doc._rev,
      revisionChanged: doc._rev !== previous._rev,
      identityUnchanged: JSON.stringify(identityWithoutPace(previous)) === JSON.stringify(identityWithoutPace(doc)),
      movementCountBefore: previous.movementCount,
      movementCountAfter: doc.movementCount,
      paceChanges,
    };
  });

  const afterSk01 = findMovement(afterSck, "sk01");
  const afterC08 = findMovement(afterClosed, "c08");
  if (afterSck.movementCount !== 21) throw new Error(`SCK movement count changed: ${afterSck.movementCount}`);
  if (afterClosed.movementCount !== 9) throw new Error(`CLOSED movement count changed: ${afterClosed.movementCount}`);
  if (afterSk01?.pace !== "normal") throw new Error(`SCK sk01 pace after patch: ${afterSk01?.pace}`);
  if (afterC08?.pace !== "normal") throw new Error(`CLOSED c08 pace after patch: ${afterC08?.pace}`);

  for (const check of checks) {
    if (!check.identityUnchanged) throw new Error(`${check.id} identity/media/movement metadata changed`);
    if (check.id === SCK_DOCUMENT_ID) {
      if (!check.revisionChanged) throw new Error("SCK revision did not change");
      if (check.paceChanges.length !== 1 || check.paceChanges[0]?.key !== "sk01") {
        throw new Error(`SCK unexpected pace changes: ${JSON.stringify(check.paceChanges)}`);
      }
    } else if (check.id === CLOSED_DOCUMENT_ID) {
      if (!check.revisionChanged) throw new Error("CLOSED revision did not change");
      if (check.paceChanges.length !== 1 || check.paceChanges[0]?.key !== "c08") {
        throw new Error(`CLOSED unexpected pace changes: ${JSON.stringify(check.paceChanges)}`);
      }
    } else if (check.revisionChanged || check.paceChanges.length > 0) {
      throw new Error(`${check.id} should have been unchanged`);
    }
  }

  console.log(JSON.stringify({ phase: "after", checks }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
