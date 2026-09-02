/**
 * One-project seed: SUB:3 only.
 * Run: npx sanity exec src/sanity/scripts/seed-sub3.ts --with-user-token
 * Seeds project-sub3. Public /projects/sub-3 stays local unless HBW_SUB3_SOURCE=sanity.
 */
import { createReadStream } from "node:fs";
import { basename, extname } from "node:path";
import { getCliClient } from "sanity/cli";
import { SUB3_COPY, SUB3_DOCUMENT_ID, SUB3_IDENTITY, SUB3_MOVEMENTS } from "./sub3-content";

const client = getCliClient({
  apiVersion: "2025-02-19",
  projectId: "aagd1kcy",
  dataset: "production",
}).withConfig({ timeout: 300000 });

function block(key: string, text: string) {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
  };
}

function imageRef(id: string) {
  return { _type: "image", asset: { _type: "reference", _ref: id } };
}

function fileRef(id: string) {
  return { _type: "file", asset: { _type: "reference", _ref: id } };
}

function fileContentType(path: string) {
  return extname(path) === ".webm" ? "video/webm" : "video/mp4";
}

function imageContentType(path: string) {
  const ext = extname(path);
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

async function existingAsset(filename: string, kind: "image" | "file") {
  const type = kind === "image" ? "sanity.imageAsset" : "sanity.fileAsset";
  return client.fetch(`*[_type == $type && originalFilename == $filename][0]._id`, { type, filename });
}

async function upload(path: string, kind: "image" | "file") {
  const filename = basename(path);
  const found = await existingAsset(filename, kind);
  if (found) {
    console.log(`reuse ${kind} ${filename}`);
    return found as string;
  }
  const contentType = kind === "file" ? fileContentType(path) : imageContentType(path);
  console.log(`upload ${kind} ${filename}`);
  const asset = await client.assets.upload(kind, createReadStream(path), { filename, contentType });
  return asset._id;
}

async function main() {
  const others = await client.fetch<string[]>(
    `*[_type == "project" && !(slug.current in ["sck", "closed", "koja", "chris-sisarich", "sub-3"])].slug.current`
  );
  if (others.length) {
    throw new Error(`Refusing to seed: dataset already has other projects (${others.join(", ")})`);
  }

  const assets = new Map<string, string>();
  async function assetId(path: string, kind: "image" | "file") {
    const cached = assets.get(path);
    if (cached) return cached;
    const id = await upload(path, kind);
    assets.set(path, id);
    return id;
  }

  const previewId = await assetId(SUB3_MOVEMENTS[0].still as string, "image");

  const movements = [];
  for (const movement of SUB3_MOVEMENTS) {
    const row: Record<string, unknown> = {
      _type: "movement",
      _key: movement.key,
      mediaType: movement.mediaType,
      alt: movement.alt,
      scale: movement.scale,
      pace: movement.pace,
      relation: movement.relation,
    };
    if (movement.infoHint) row.infoHint = movement.infoHint;
    if (movement.mediaType === "still" && movement.still) {
      row.still = imageRef(await assetId(movement.still, "image"));
    }
    if (movement.mediaType === "film" && movement.video && movement.poster) {
      row.video = fileRef(await assetId(movement.video, "file"));
      row.poster = imageRef(await assetId(movement.poster, "image"));
      if (movement.webm) row.webm = fileRef(await assetId(movement.webm, "file"));
    }
    movements.push(row);
  }

  const document = {
    _id: SUB3_DOCUMENT_ID,
    _type: "project",
    title: SUB3_IDENTITY.title,
    slug: { _type: "slug", current: SUB3_IDENTITY.slug },
    proposition: SUB3_IDENTITY.proposition,
    year: SUB3_IDENTITY.year,
    sectors: SUB3_IDENTITY.sectors,
    disciplines: SUB3_IDENTITY.disciplines,
    portfolioOrder: SUB3_IDENTITY.portfolioOrder,
    preview: imageRef(previewId),
    context: [block("ctx", SUB3_COPY.context)],
    roles: SUB3_COPY.roles,
    workingContext: SUB3_COPY.workingContext,
    idea: { _type: "caseStudyBlock", heading: SUB3_COPY.idea.heading, body: [block("idea", SUB3_COPY.idea.body)] },
    shift: { _type: "caseStudyBlock", heading: SUB3_COPY.shift.heading, body: [block("shift", SUB3_COPY.shift.body)] },
    system: { _type: "caseStudyBlock", heading: SUB3_COPY.system.heading, body: [block("sys", SUB3_COPY.system.body)] },
    movements,
    editorialPurpose: SUB3_IDENTITY.editorialPurpose,
    contributionNotes: SUB3_IDENTITY.contributionNotes,
    replacementPriority: SUB3_IDENTITY.replacementPriority,
  };

  await client.createOrReplace(document);
  console.log(`wrote ${SUB3_DOCUMENT_ID} with ${movements.length} movements, Working Context, and no Outcome`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
