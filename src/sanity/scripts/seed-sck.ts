/**
 * One-project seed: SCK only.
 * Run: npx sanity exec src/sanity/scripts/seed-sck.ts --with-user-token
 * Does not touch the public site.
 */
import { createReadStream } from "node:fs";
import { basename, extname } from "node:path";
import { getCliClient } from "sanity/cli";
import { SCK_COPY, SCK_DOCUMENT_ID, SCK_IDENTITY, SCK_MOVEMENTS } from "./sck-content";

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
  const contentType =
    kind === "file"
      ? "video/mp4"
      : extname(path) === ".png"
        ? "image/png"
        : "image/jpeg";
  console.log(`upload ${kind} ${filename}`);
  const asset = await client.assets.upload(kind, createReadStream(path), { filename, contentType });
  return asset._id;
}

async function main() {
  const others = await client.fetch<string[]>(
    `*[_type == "project" && !(slug.current in ["sck", "closed", "koja"])].slug.current`
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

  const previewId = await assetId("public/projects/sck/1.jpg", "image");

  const movements = [];
  for (const movement of SCK_MOVEMENTS) {
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
    if (movement.narrow) {
      row.presentationOverride = { _type: "presentationOverride", frameWidth: "narrow" };
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
    _id: SCK_DOCUMENT_ID,
    _type: "project",
    title: SCK_IDENTITY.title,
    slug: { _type: "slug", current: SCK_IDENTITY.slug },
    proposition: SCK_IDENTITY.proposition,
    year: SCK_IDENTITY.year,
    sectors: SCK_IDENTITY.sectors,
    disciplines: SCK_IDENTITY.disciplines,
    portfolioOrder: SCK_IDENTITY.portfolioOrder,
    preview: imageRef(previewId),
    context: [block("ctx", SCK_COPY.context)],
    roles: SCK_COPY.roles,
    idea: { _type: "caseStudyBlock", heading: SCK_COPY.idea.heading, body: [block("idea", SCK_COPY.idea.body)] },
    shift: { _type: "caseStudyBlock", heading: SCK_COPY.shift.heading, body: [block("shift", SCK_COPY.shift.body)] },
    system: { _type: "caseStudyBlock", heading: SCK_COPY.system.heading, body: [block("sys", SCK_COPY.system.body)] },
    outcome: {
      _type: "caseStudyBlock",
      heading: SCK_COPY.outcome.heading,
      body: [block("out", SCK_COPY.outcome.body)],
    },
    movements,
    editorialPurpose: SCK_IDENTITY.editorialPurpose,
    contributionNotes: SCK_IDENTITY.contributionNotes,
    replacementPriority: SCK_IDENTITY.replacementPriority,
  };

  await client.createOrReplace(document);
  console.log(`wrote ${SCK_DOCUMENT_ID} with ${movements.length} movements`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
