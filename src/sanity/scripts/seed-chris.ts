/**
 * One-project seed: Chris Sisarich only.
 * Run: npx sanity exec src/sanity/scripts/seed-chris.ts --with-user-token
 * Seeds project-chris-sisarich only. Public /projects/chris-sisarich stays local unless HBW_CHRIS_SOURCE=sanity.
 */
import { createReadStream } from "node:fs";
import { basename, extname } from "node:path";
import { getCliClient } from "sanity/cli";
import { CHRIS_COPY, CHRIS_DOCUMENT_ID, CHRIS_IDENTITY, CHRIS_MOVEMENTS } from "./chris-content";

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
    `*[_type == "project" && !(slug.current in ["sck", "closed", "koja", "chris-sisarich"])].slug.current`
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

  const previewId = await assetId(
    "public/projects/chris-sisarich/6663143cb87a78fa3d4c90be_HBWxChrisSisarich-uPortfolio5.jpg",
    "image"
  );

  const movements = [];
  for (const movement of CHRIS_MOVEMENTS) {
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
    if (movement.cover || movement.graphic) {
      row.presentationOverride = {
        _type: "presentationOverride",
        ...(movement.cover ? { mediaFit: "cover" } : {}),
        ...(movement.graphic ? { mediaType: "graphic" } : {}),
      };
    }
    if (movement.mediaType === "still" && movement.still) {
      row.still = imageRef(await assetId(movement.still, "image"));
    }
    if (movement.mediaType === "film" && movement.video && movement.poster) {
      row.video = fileRef(await assetId(movement.video, "file"));
      row.poster = imageRef(await assetId(movement.poster, "image"));
    }
    movements.push(row);
  }

  const document = {
    _id: CHRIS_DOCUMENT_ID,
    _type: "project",
    title: CHRIS_IDENTITY.title,
    slug: { _type: "slug", current: CHRIS_IDENTITY.slug },
    proposition: CHRIS_IDENTITY.proposition,
    year: CHRIS_IDENTITY.year,
    sectors: CHRIS_IDENTITY.sectors,
    disciplines: CHRIS_IDENTITY.disciplines,
    portfolioOrder: CHRIS_IDENTITY.portfolioOrder,
    preview: imageRef(previewId),
    context: [block("ctx", CHRIS_COPY.context)],
    roles: CHRIS_COPY.roles,
    idea: { _type: "caseStudyBlock", heading: CHRIS_COPY.idea.heading, body: [block("idea", CHRIS_COPY.idea.body)] },
    shift: { _type: "caseStudyBlock", heading: CHRIS_COPY.shift.heading, body: [block("shift", CHRIS_COPY.shift.body)] },
    system: { _type: "caseStudyBlock", heading: CHRIS_COPY.system.heading, body: [block("sys", CHRIS_COPY.system.body)] },
    movements,
    editorialPurpose: CHRIS_IDENTITY.editorialPurpose,
    contributionNotes: CHRIS_IDENTITY.contributionNotes,
    replacementPriority: CHRIS_IDENTITY.replacementPriority,
  };

  await client.createOrReplace(document);
  console.log(`wrote ${CHRIS_DOCUMENT_ID} with ${movements.length} movements and no Outcome`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
