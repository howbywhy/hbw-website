/**
 * Append the four social cuts to SUB:3, and nothing else.
 *
 * Run: npx sanity exec src/sanity/scripts/add-sub3-films.ts --with-user-token
 *
 * The project's own seed uses createOrReplace, which would rewrite the whole
 * document — every field, every movement — from this repository's copy of it.
 * That is right for a first seed and wrong for an addition: anything edited in
 * the Studio since would go. This patches, appending four rows to the end of
 * movements and leaving every other field untouched.
 *
 * It is also safe to run twice: assets are matched by filename before upload,
 * and a key already present is skipped rather than duplicated.
 */
import { createReadStream } from "node:fs";
import { extname } from "node:path";
import { getCliClient } from "sanity/cli";
import { SUB3_DOCUMENT_ID, SUB3_MOVEMENTS } from "./sub3-content";

const ADDING = ["s320", "s321", "s322", "s323"];

const client = getCliClient({
  apiVersion: "2025-02-19",
  projectId: "aagd1kcy",
  dataset: "production",
}).withConfig({ timeout: 300000 });

const imageType = (path: string) => {
  const ext = extname(path);
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
};

async function assetId(path: string, kind: "image" | "file") {
  const filename = path.split("/").slice(-2).join("-");
  const type = kind === "image" ? "sanity.imageAsset" : "sanity.fileAsset";
  const already = await client.fetch<string | null>(
    `*[_type == $type && originalFilename == $filename][0]._id`,
    { type, filename }
  );
  if (already) {
    console.log(`have  ${filename}`);
    return already;
  }
  console.log(`upload ${filename}`);
  const asset = await client.assets.upload(kind, createReadStream(path), {
    filename,
    contentType: kind === "image" ? imageType(path) : "video/mp4",
  });
  return asset._id;
}

async function main() {
  const doc = await client.fetch<{ movements?: { _key: string }[] } | null>(
    `*[_id == $id][0]{movements[]{_key}}`,
    { id: SUB3_DOCUMENT_ID }
  );
  if (!doc) throw new Error(`${SUB3_DOCUMENT_ID} not found — nothing to add to`);
  const have = new Set((doc.movements ?? []).map((m) => m._key));
  console.log(`${SUB3_DOCUMENT_ID} currently has ${have.size} movements`);

  const rows = [];
  for (const key of ADDING) {
    if (have.has(key)) {
      console.log(`skip  ${key} — already there`);
      continue;
    }
    const movement = SUB3_MOVEMENTS.find((m) => m.key === key);
    if (!movement) throw new Error(`${key} is not in SUB3_MOVEMENTS`);
    if (!movement.video || !movement.poster) throw new Error(`${key} has no film or poster`);
    const row: Record<string, unknown> = {
      _type: "movement",
      _key: movement.key,
      mediaType: "film",
      alt: movement.alt,
      scale: movement.scale,
      pace: movement.pace,
      relation: movement.relation,
      video: { _type: "file", asset: { _type: "reference", _ref: await assetId(movement.video, "file") } },
      poster: { _type: "image", asset: { _type: "reference", _ref: await assetId(movement.poster, "image") } },
    };
    if (movement.infoHint) row.infoHint = movement.infoHint;
    if (movement.narrow) {
      row.presentationOverride = { _type: "presentationOverride", frameWidth: "narrow" };
    }
    rows.push(row);
  }

  if (!rows.length) {
    console.log("nothing to add");
    return;
  }

  await client
    .patch(SUB3_DOCUMENT_ID)
    .setIfMissing({ movements: [] })
    .insert("after", "movements[-1]", rows)
    .commit();
  console.log(`appended ${rows.length} movements to ${SUB3_DOCUMENT_ID}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
