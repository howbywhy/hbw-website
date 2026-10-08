/**
 * One-project seed: Chris Sisarich only.
 * Run: npx sanity exec src/sanity/scripts/seed-chris.ts --with-user-token
 * Seeds project-chris-sisarich only. Public /projects/chris-sisarich stays local unless HBW_CHRIS_SOURCE=sanity.
 */
import { createReadStream } from "node:fs";
import { extname } from "node:path";
import { getCliClient } from "sanity/cli";
import { portableBlocks } from "./portable-blocks";
import { CHRIS_COPY, CHRIS_DOCUMENT_ID, CHRIS_IDENTITY, CHRIS_MOVEMENTS } from "./chris-content";

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

/**
 * Asset name from the repo path, not the basename. Sequence numbers restart per
 * project and per folder, so a bare basename collides: one project's 1.jpg
 * would match an asset another project already uploaded under that name, and a
 * web/ poster would match a still. Reusing on that match keeps the wrong file.
 */
function assetName(path: string) {
  // Mirrors assetIdentities in cms-verify-lib: strip public/ and projects/,
  // then flatten. Not every movement lives under projects/ — some are in
  // global/ — so stripping the pair separately keeps both in step.
  return path.replace(/^public\//, "").replace(/^projects\//, "").replace(/\//g, "-");
}

async function upload(path: string, kind: "image" | "file") {
  const filename = assetName(path);
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
  // Confirm this is the dataset we think it is before writing. Index-only
  // entries are added through the Studio and are expected here; what matters is
  // that the six case studies are present, since this script replaces one.
  const caseStudies = ["sck", "closed", "koja", "chris-sisarich", "sub-3", "our-boy-roy"];
  const present = await client.fetch<string[]>(
    `*[_type == "project" && slug.current in $caseStudies].slug.current`,
    { caseStudies }
  );
  const missing = caseStudies.filter((slug) => !present.includes(slug));
  if (missing.length) {
    throw new Error(`Refusing to seed: not the expected dataset, missing ${missing.join(", ")}`);
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
    context: portableBlocks("ctx", CHRIS_COPY.context),
    roles: CHRIS_COPY.roles,
    idea: { _type: "caseStudyBlock", heading: CHRIS_COPY.idea.heading, body: portableBlocks("idea", CHRIS_COPY.idea.body) },
    shift: { _type: "caseStudyBlock", heading: CHRIS_COPY.shift.heading, body: portableBlocks("shift", CHRIS_COPY.shift.body) },
    system: { _type: "caseStudyBlock", heading: CHRIS_COPY.system.heading, body: portableBlocks("sys", CHRIS_COPY.system.body) },
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
