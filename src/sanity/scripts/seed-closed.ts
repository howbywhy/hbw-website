/**
 * One-project seed: CLOSED only.
 * Run: npx sanity exec src/sanity/scripts/seed-closed.ts --with-user-token
 * Does not touch the public site. /projects/bar-closed stays local.
 */
import { createHash } from "node:crypto";
import { createReadStream, readFileSync } from "node:fs";
import { extname } from "node:path";
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
  const contentType =
    kind === "file"
      ? extname(path) === ".webm"
        ? "video/webm"
        : "video/mp4"
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

  /*
   * The picture the catalogue shows, named rather than inferred.
   *
   * This took whatever the first movement happened to carry, which is a
   * different photograph from the one on the card — so the published preview
   * and the shipped record disagreed about both the file and its shape, and
   * said so on every verify run for weeks. KOJA learned this the hard way
   * when its sequence opened on a film; the answer is the same here.
   */
  const previewId = await assetId(
    "public/projects/bar-closed/670ca0219bf6bccf429b9e5b_HBWxCLOSED-Portfolio25.jpg",
    "image"
  );

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
      if (movement.webm) row.webm = fileRef(await assetId(movement.webm, "file"));
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
    /*
     * No Collaborators block, deliberately.
     *
     * CLOSED's copy names nobody now, and createOrReplace drops what it is
     * not given — so re-seeding is what actually takes the three names off
     * the published document. Leaving the field out of the copy alone would
     * only stop the shipped fallback showing them; Sanity would keep them and
     * the site reads Sanity. workingContext stays: the studio context is not
     * a collaborator credit.
     */
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
