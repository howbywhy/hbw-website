/**
 * One-project seed: Our Boy Roy only.
 * Run: npx sanity exec src/sanity/scripts/seed-obr.ts --with-user-token
 * Seeds project-our-boy-roy. Public /projects/our-boy-roy stays local unless HBW_OBR_SOURCE=sanity.
 */
import { createHash } from "node:crypto";
import { createReadStream, readFileSync } from "node:fs";
import { extname } from "node:path";
import { getCliClient } from "sanity/cli";
import { OBR_COPY, OBR_DOCUMENT_ID, OBR_IDENTITY, OBR_MOVEMENTS } from "./obr-content";

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

/**
 * The asset already up there under this name, and the bytes it holds.
 *
 * The name alone was enough while a file never changed. Re-encoding one
 * showed the gap: the seed found the old asset by name, reused it, reported
 * "reuse", and the site went on serving the heavy original from the CDN with
 * nothing to say the two had diverged. Sanity records a sha1 of every asset,
 * so the file on disk and the file being served can simply be compared.
 */
async function existingAsset(filename: string, kind: "image" | "file") {
  const type = kind === "image" ? "sanity.imageAsset" : "sanity.fileAsset";
  return client.fetch<{ _id: string; sha1hash?: string } | null>(
    `*[_type == $type && originalFilename == $filename][0]{_id, sha1hash}`,
    { type, filename }
  );
}

/** The same digest Sanity stores, so the two are comparable. */
function sha1Of(path: string) {
  return createHash("sha1").update(readFileSync(path)).digest("hex");
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
  if (found?._id) {
    if (!found.sha1hash || found.sha1hash === sha1Of(path)) {
      console.log(`reuse ${kind} ${filename}`);
      return found._id;
    }
    console.log(`changed ${kind} ${filename} — uploading the new bytes`);
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
    "public/projects/our-boy-roy/web/08-full-tall.jpg",
    "image"
  );

  const movements = [];
  for (const movement of OBR_MOVEMENTS) {
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
      /* The WebM beside it, where there is one. Three of these seeds never
         looked, so three projects named a WebM in their copy and published
         a document that did not mention it. */
      if (movement.webm) row.webm = fileRef(await assetId(movement.webm, "file"));
    }
    movements.push(row);
  }

  const document = {
    _id: OBR_DOCUMENT_ID,
    _type: "project",
    title: OBR_IDENTITY.title,
    slug: { _type: "slug", current: OBR_IDENTITY.slug },
    proposition: OBR_IDENTITY.proposition,
    year: OBR_IDENTITY.year,
    sectors: OBR_IDENTITY.sectors,
    disciplines: OBR_IDENTITY.disciplines,
    portfolioOrder: OBR_IDENTITY.portfolioOrder,
    preview: imageRef(previewId),
    context: [block("ctx", OBR_COPY.context)],
    roles: OBR_COPY.roles,
    workingContext: OBR_COPY.workingContext,
    idea: { _type: "caseStudyBlock", heading: OBR_COPY.idea.heading, body: [block("idea", OBR_COPY.idea.body)] },
    shift: { _type: "caseStudyBlock", heading: OBR_COPY.shift.heading, body: [block("shift", OBR_COPY.shift.body)] },
    system: { _type: "caseStudyBlock", heading: OBR_COPY.system.heading, body: [block("sys", OBR_COPY.system.body)] },
    movements,
    editorialPurpose: OBR_IDENTITY.editorialPurpose,
    contributionNotes: OBR_IDENTITY.contributionNotes,
    replacementPriority: OBR_IDENTITY.replacementPriority,
  };

  await client.createOrReplace(document);
  console.log(`wrote ${OBR_DOCUMENT_ID} with ${movements.length} movements, Working Context, and no Outcome`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
