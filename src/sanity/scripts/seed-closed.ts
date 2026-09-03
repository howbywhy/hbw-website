/**
 * One-project seed: CLOSED only.
 * Run: npx sanity exec src/sanity/scripts/seed-closed.ts --with-user-token
 * Does not touch the public site. /projects/bar-closed stays local.
 */
import { createReadStream } from "node:fs";
import { basename, extname } from "node:path";
import { getCliClient } from "sanity/cli";
import { portableBlocks } from "./portable-blocks";
import {
  CLOSED_COPY,
  CLOSED_DOCUMENT_ID,
  CLOSED_IDENTITY,
  CLOSED_MOVEMENTS,
} from "./closed-content";

const client = getCliClient({
  apiVersion: "2025-02-19",
  projectId: "aagd1kcy",
  dataset: "production",
}).withConfig({ timeout: 300000 });

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
    `*[_type == "project" && !(slug.current in ["sck", "closed", "koja", "chris-sisarich", "sub-3", "our-boy-roy"])].slug.current`
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

  const previewId = await assetId(CLOSED_MOVEMENTS[0].still as string, "image");

  const movements = [];
  for (const movement of CLOSED_MOVEMENTS) {
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
    if (movement.cover) {
      row.presentationOverride = { _type: "presentationOverride", mediaFit: "cover" };
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
    _id: CLOSED_DOCUMENT_ID,
    _type: "project",
    title: CLOSED_IDENTITY.title,
    slug: { _type: "slug", current: CLOSED_IDENTITY.slug },
    proposition: CLOSED_IDENTITY.proposition,
    year: CLOSED_IDENTITY.year,
    location: CLOSED_IDENTITY.location,
    sectors: CLOSED_IDENTITY.sectors,
    disciplines: CLOSED_IDENTITY.disciplines,
    portfolioOrder: CLOSED_IDENTITY.portfolioOrder,
    preview: imageRef(previewId),
    context: portableBlocks("ctx", CLOSED_COPY.context),
    roles: CLOSED_COPY.roles,
    workingContext: CLOSED_COPY.workingContext,
    collaborators: CLOSED_COPY.collaborators.map((item, index) => ({
      _type: "collaborator",
      _key: `col${index + 1}`,
      name: item.name,
      contribution: item.contribution,
    })),
    idea: { _type: "caseStudyBlock", heading: CLOSED_COPY.idea.heading, body: portableBlocks("idea", CLOSED_COPY.idea.body) },
    shift: { _type: "caseStudyBlock", heading: CLOSED_COPY.shift.heading, body: portableBlocks("shift", CLOSED_COPY.shift.body) },
    system: { _type: "caseStudyBlock", heading: CLOSED_COPY.system.heading, body: portableBlocks("sys", CLOSED_COPY.system.body) },
    movements,
    editorialPurpose: CLOSED_IDENTITY.editorialPurpose,
    contributionNotes: CLOSED_IDENTITY.contributionNotes,
    replacementPriority: CLOSED_IDENTITY.replacementPriority,
  };

  await client.createOrReplace(document);
  console.log(`wrote ${CLOSED_DOCUMENT_ID} with ${movements.length} movements and no Outcome`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
