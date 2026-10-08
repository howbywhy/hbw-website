/**
 * Re-encode a video uploaded to the CMS, and point the documents at the result.
 *
 * Sanity's image CDN already resizes and re-encodes stills on request, so
 * images need nothing. Files are served as the exact bytes that went in: a
 * 60MB 120fps export off a timeline ships at 60MB and 120fps. This closes that
 * gap, so an editor can drag in whatever came out of After Effects.
 *
 * What it cannot do is make a clip loop. A seam is a judgement: on this site a
 * nine-frame dissolve took one film's seam to 0.4% and made another's worse,
 * because that one was continuous glitch that never returns to its first
 * frame. So the seam is measured and reported, and a film that wraps badly is
 * flagged for a human rather than quietly crossfaded.
 *
 * Usage: node scripts/optimise-asset.mjs <assetId>
 */
import { createClient } from "@sanity/client";
import { execFile } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";

const run = promisify(execFile);

const PROJECT_ID = process.env.SANITY_PROJECT_ID || "aagd1kcy";
const DATASET = process.env.SANITY_DATASET || "production";
const TOKEN = process.env.SANITY_WRITE_TOKEN;

/**
 * Already been through here. Without this the webhook would chase its own
 * upload. Distinctive on purpose: "-web" would also skip a file an editor
 * happened to name that way.
 */
const MARK = "-hbwopt";

/** Download, encode and measure, but write nothing back. */
const DRY_RUN = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");

/** Delivery sizes. Anything larger is pointless on a page that never shows it bigger. */
const MAX_LANDSCAPE_WIDTH = 1600;
const MAX_PORTRAIT_WIDTH = 1080;
const FPS = 30;
const CRF = 22;

function log(...parts) {
  console.log(...parts);
}

async function ffprobe(file) {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height,r_frame_rate,color_range,color_space,color_transfer,color_primaries",
    "-show_entries", "format=duration",
    "-of", "json",
    file,
  ]);
  const parsed = JSON.parse(stdout);
  const stream = parsed.streams?.[0] ?? {};
  return {
    width: Number(stream.width) || 0,
    height: Number(stream.height) || 0,
    fps: stream.r_frame_rate,
    colorRange: stream.color_range,
    colorSpace: stream.color_space,
    colorTransfer: stream.color_transfer,
    colorPrimaries: stream.color_primaries,
    duration: Number(parsed.format?.duration) || 0,
  };
}

/** Even numbers only — yuv420p cannot encode an odd dimension. */
function even(n) {
  return Math.max(2, Math.round(n / 2) * 2);
}

function deliverySize({ width, height }) {
  const cap = height > width ? MAX_PORTRAIT_WIDTH : MAX_LANDSCAPE_WIDTH;
  if (!width || !height || width <= cap) return { width: even(width), height: even(height) };
  return { width: even(cap), height: even((height * cap) / width) };
}

async function encode(input, output, probe) {
  const { width, height } = deliverySize(probe);
  const colour = [];
  if (probe.colorRange) colour.push("-color_range", probe.colorRange);
  if (probe.colorSpace) colour.push("-colorspace", probe.colorSpace);
  if (probe.colorTransfer) colour.push("-color_trc", probe.colorTransfer);
  if (probe.colorPrimaries) colour.push("-color_primaries", probe.colorPrimaries);
  await run("ffmpeg", [
    "-v", "error", "-y",
    "-i", input,
    "-vf", `scale=${width}:${height},fps=${FPS}`,
    "-c:v", "libx264",
    "-crf", String(CRF),
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    "-x264-params", "scenecut=0:keyint=600",
    ...colour,
    "-movflags", "+faststart",
    "-an",
    output,
  ], { maxBuffer: 1 << 26 });
  return { width, height };
}

/**
 * How far the last frame is from the first, against how far one ordinary frame
 * moves in the same clip. A wrap that changes less than a normal step is
 * invisible; several times more is a visible jump.
 */
async function seam(file, width, height, duration) {
  const w = Math.max(2, Math.round(width / 4) * 2);
  const h = Math.max(2, Math.round(height / 4) * 2);
  const size = w * h;
  const vf = `scale=${w}:${h},format=gray`;

  // Only the frames the answer needs. Decoding a whole clip to grey costs
  // hundreds of megabytes on anything long, for three numbers.
  const grab = async (args) => {
    const { stdout } = await run("ffmpeg", ["-v", "error", ...args, "-vf", vf, "-f", "rawvideo", "-"], {
      encoding: "buffer",
      maxBuffer: 1 << 26,
    });
    const frames = [];
    for (let i = 0; i + size <= stdout.length; i += size) frames.push(stdout.subarray(i, i + size));
    return frames;
  };

  const changed = (a, b) => {
    let n = 0;
    for (let i = 0; i < size; i++) if (Math.abs(a[i] - b[i]) > 8) n++;
    return (100 * n) / size;
  };

  try {
    const [first] = await grab(["-i", file, "-frames:v", "1"]);
    const [last] = await grab(["-sseof", "-0.05", "-i", file, "-frames:v", "1"]);
    const middle = await grab(["-ss", String(Math.max(0, duration / 3)), "-i", file, "-frames:v", "13"]);
    if (!first || !last || middle.length < 2) return null;

    const wrap = changed(last, first);
    let total = 0;
    for (let i = 0; i < middle.length - 1; i++) total += changed(middle[i], middle[i + 1]);
    const step = total / (middle.length - 1);
    return { wrap, step, ratio: step > 0 ? wrap / step : null };
  } catch {
    // A measurement that fails is not a reason to fail the upload.
    return null;
  }
}

async function main() {
  const assetId = process.argv[2];
  if (!assetId) throw new Error("Pass an asset id");
  if (!TOKEN && !DRY_RUN) throw new Error("SANITY_WRITE_TOKEN is not set");
  if (DRY_RUN) log("dry run: nothing will be uploaded or repointed\n");

  const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: "2025-02-19",
    ...(TOKEN ? { token: TOKEN } : {}),
    useCdn: false,
  });

  const asset = await client.fetch(
    `*[_id == $id][0]{_id, url, originalFilename, mimeType, size}`,
    { id: assetId }
  );
  if (!asset) return log(`no asset ${assetId}, nothing to do`);
  if (!/^video\//.test(asset.mimeType ?? "")) return log(`${asset.originalFilename} is not a video, leaving it`);
  if ((asset.originalFilename ?? "").includes(MARK)) return log(`${asset.originalFilename} is already optimised`);

  const dir = await mkdtemp(join(tmpdir(), "hbw-media-"));
  try {
    const input = join(dir, "in");
    const output = join(dir, "out.mp4");
    const response = await fetch(asset.url);
    if (!response.ok) throw new Error(`could not download asset: ${response.status}`);
    await pipeline(response.body, createWriteStream(input));

    const probe = await ffprobe(input);
    log(`in  ${asset.originalFilename}  ${probe.width}x${probe.height} @ ${probe.fps}  ${(asset.size / 1e6).toFixed(1)}MB`);

    const { width, height } = await encode(input, output, probe);
    const before = asset.size ?? (await stat(input)).size;
    const after = (await stat(output)).size;
    log(`out ${width}x${height} @ ${FPS}  ${(after / 1e6).toFixed(1)}MB`);

    if (after >= before) {
      return log(`re-encoding did not help (${(after / 1e6).toFixed(1)}MB vs ${(before / 1e6).toFixed(1)}MB) — keeping the original`);
    }

    const base = (asset.originalFilename ?? "clip.mp4").replace(/\.[^.]+$/, "");
    const filename = `${base}${MARK}.mp4`;

    if (DRY_RUN) {
      const referring = await client.fetch(`*[references($id)]._id`, { id: assetId });
      log(`would upload ${filename}`);
      log(`would repoint ${referring.length} document(s): ${referring.join(", ") || "none"}`);
    } else {
      const uploaded = await client.assets.upload("file", await readFile(output), {
        filename,
        contentType: "video/mp4",
      });
      log(`uploaded ${filename} as ${uploaded._id}`);

      // Every document that pointed at the original now points at the new one.
      const referring = await client.fetch(`*[references($id)]._id`, { id: assetId });
      for (const docId of referring) {
        const doc = await client.getDocument(docId);
        const patched = JSON.parse(
          JSON.stringify(doc).split(`"${assetId}"`).join(`"${uploaded._id}"`)
        );
        await client.createOrReplace(patched);
        log(`repointed ${docId}`);
      }
      if (!referring.length) log("no document referenced it yet — it will be picked up when one does");
    }

    const measured = await seam(output, width, height, probe.duration);
    if (measured) {
      // A still middle gives nothing to compare against, but that is the case
      // where a wrap shows most: the picture is not moving, so any jump at the
      // loop is the only thing that does.
      const verdict =
        measured.ratio == null
          ? measured.wrap < 0.5
            ? "wraps cleanly"
            : "WRAPS VISIBLY \u2014 the clip holds still, so the jump is the only movement"
          : measured.ratio <= 1.5
            ? "wraps cleanly"
            : "WRAPS VISIBLY \u2014 worth a look";
      log(
        `loop: seam ${measured.wrap.toFixed(2)}% of pixels, ordinary frame step ${measured.step.toFixed(2)}% — ${verdict}`
      );
      if (process.env.GITHUB_STEP_SUMMARY) {
        const { appendFile } = await import("node:fs/promises");
        await appendFile(
          process.env.GITHUB_STEP_SUMMARY,
          `### ${filename}\n\n` +
            `- ${(before / 1e6).toFixed(1)}MB → ${(after / 1e6).toFixed(1)}MB\n` +
            `- ${probe.width}×${probe.height} → ${width}×${height} at ${FPS}fps\n` +
            `- loop seam ${measured.wrap.toFixed(2)}% against an ordinary step of ${measured.step.toFixed(2)}% — ${verdict}\n\n`
        );
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
