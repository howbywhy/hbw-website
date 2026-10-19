/**
 * One-project seed: SCK only.
 * Run: npx sanity exec src/sanity/scripts/seed-sck.ts --with-user-token
 * Does not touch the public site.
 */
import { createHash } from "node:crypto";
import { createReadStream, readFileSync } from "node:fs";
import { extname } from "node:path";
import { getCliClient } from "sanity/cli";
import { portableBlocks } from "./portable-blocks";
import { SCK_COPY, SCK_DOCUMENT_ID, SCK_IDENTITY, SCK_MOVEMENTS } from "./sck-content";

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
 * Asset name from the repo path, not the basename. The sequence numbers restart
 * per folder, so a bare basename collides: a new still and an older one can both
 * be "1.jpg", and web/11.jpg collides with the still 11.jpg. Reusing on that
 * match would silently keep the superseded picture.
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
  // Confirm this is the dataset we think it is before writing. Index-only
  // entries are added through the Studio and are expected here; what matters is
  // that the six case studies are present, since this script replaces one of them.
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
      /* The WebM beside it, where there is one. Three of these seeds never
         looked, so three projects named a WebM in their copy and published
         a document that did not mention it. */
      if (movement.webm) row.webm = fileRef(await assetId(movement.webm, "file"));
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
    context: portableBlocks("ctx", SCK_COPY.context),
    roles: SCK_COPY.roles,
    idea: { _type: "caseStudyBlock", heading: SCK_COPY.idea.heading, body: portableBlocks("idea", SCK_COPY.idea.body) },
    shift: { _type: "caseStudyBlock", heading: SCK_COPY.shift.heading, body: portableBlocks("shift", SCK_COPY.shift.body) },
    system: { _type: "caseStudyBlock", heading: SCK_COPY.system.heading, body: portableBlocks("sys", SCK_COPY.system.body) },
    movements,
    editorialPurpose: SCK_IDENTITY.editorialPurpose,
    contributionNotes: SCK_IDENTITY.contributionNotes,
    replacementPriority: SCK_IDENTITY.replacementPriority,
  };

  await client.createOrReplace(document);
  console.log(`wrote ${SCK_DOCUMENT_ID} with ${movements.length} movements and no Outcome`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
