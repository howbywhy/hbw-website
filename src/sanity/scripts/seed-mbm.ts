/**
 * One-project seed: Made by Madelen only.
 * Run: npx sanity exec src/sanity/scripts/seed-mbm.ts --with-user-token
 * Seeds project-made-by-madelen only. Nothing else in the dataset is touched.
 */
import { createReadStream } from "node:fs";
import { extname } from "node:path";
import { getCliClient } from "sanity/cli";
import { portableBlocks } from "./portable-blocks";
import { MBM_COPY, MBM_DOCUMENT_ID, MBM_IDENTITY, MBM_MOVEMENTS } from "./mbm-content";

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
  // Made by Madelen is deliberately not in that list: this is the script that
  // creates it, so requiring it first would make the project unseedable. The
  // six are only here to prove this is the dataset we think it is.
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

  /*
   * The catalogue's own card, named rather than inferred.
   *
   * Taking it from the first movement broke KOJA the day its sequence opened
   * on a film instead of a still: `still` was undefined, the cast to string
   * hid it from the compiler, and the seed tried to make a filename out of
   * nothing. The preview is the picture the catalogue shows, so it is named
   * in one place and this is it — m08, the one frame entirely in colour.
   */
  const previewId = await assetId("public/projects/made-by-madelen/web/08-full-story.jpg", "image");

  const movements = [];
  for (const movement of MBM_MOVEMENTS) {
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
    _id: MBM_DOCUMENT_ID,
    _type: "project",
    title: MBM_IDENTITY.title,
    slug: { _type: "slug", current: MBM_IDENTITY.slug },
    proposition: MBM_IDENTITY.proposition,
    year: MBM_IDENTITY.year,
    sectors: MBM_IDENTITY.sectors,
    disciplines: MBM_IDENTITY.disciplines,
    portfolioOrder: MBM_IDENTITY.portfolioOrder,
    preview: imageRef(previewId),
    context: portableBlocks("ctx", MBM_COPY.context),
    roles: MBM_COPY.roles,
    idea: { _type: "caseStudyBlock", heading: MBM_COPY.idea.heading, body: portableBlocks("idea", MBM_COPY.idea.body) },
    shift: { _type: "caseStudyBlock", heading: MBM_COPY.shift.heading, body: portableBlocks("shift", MBM_COPY.shift.body) },
    system: { _type: "caseStudyBlock", heading: MBM_COPY.system.heading, body: portableBlocks("sys", MBM_COPY.system.body) },
    movements,
    editorialPurpose: MBM_IDENTITY.editorialPurpose,
    contributionNotes: MBM_IDENTITY.contributionNotes,
    replacementPriority: MBM_IDENTITY.replacementPriority,
  };

  await client.createOrReplace(document);
  console.log(`wrote ${MBM_DOCUMENT_ID} with ${movements.length} movements and no Outcome`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
