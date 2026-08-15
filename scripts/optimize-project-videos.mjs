import { spawn } from "node:child_process";
import { mkdirSync, statSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = "/Users/markblackler/Documents/GitHub/hbw-website";
const FFMPEG = "/tmp/ffm/node_modules/ffmpeg-static/ffmpeg";
const ORIGINALS = join(ROOT, "reference/video-originals");
const MANIFEST = join(ROOT, "reference/video-manifest.json");

const HOME_ORIG =
  "reference/downloaded/cd/0/inline/DGIQwlztii5y_fbx1hvohwtwY0uztSVQ0ZZ7Qv1nZwQCvvZidpYKJF0R99-iRTaO4twnjqtHOyc7hYBqtb-qVjEQYMejyCe_UuFAcxIjN0-o9Q4kgetdrisBPFYB_zhBybw/file";
const IMAGES_ORIG =
  "reference/downloaded/cd/0/inline/DGJmtH-WIEXoOXoQ5ACNMOxKyh8wVxoXAz0ugD9-JdMcDsJVq4HXp9IIYQGalkcopN91AB6Lp3EBqKaLykbMn7oIFxsqxt_V4i72Pa9LOH-Z-I8W-DSva4tQKMIV--2F7qY/file";

const JOBS = [
  {
    project: "SUB:3",
    file: "SUB3-Type-Stretch-Texture.mp4",
    src: "public/projects/sub3/SUB3-Type-Stretch-Texture.mp4",
    url: "https://www.dropbox.com/scl/fi/bbv73jc00oa2wzsm7vz3w/SUB3-Type-Stretch-Texture.mp4?rlkey=qg41f118ag163kv00ap28obav&raw=1",
    out: "public/projects/sub3/web/SUB3-Type-Stretch-Texture",
    max: 1440,
    webm: true,
  },
  {
    project: "SUB:3",
    file: "SUB3-SKUBAR-Type-Count.mp4",
    src: "public/projects/sub3/SUB3-SKUBAR-Type-Count.mp4",
    url: "https://www.dropbox.com/scl/fi/o5jh92ngfkfxoz0mrf44b/SUB3-SKUBAR-Type-Count.mp4?rlkey=zyntvz7bkfzzszuf9ocu89wvg&raw=1",
    out: "public/projects/sub3/web/SUB3-SKUBAR-Type-Count",
    max: 1440,
    webm: true,
  },
  {
    project: "SUB:3",
    file: "68ff161f1a7117df3b375675_TCCWEB-SUB3-PackGIF.gif",
    src: "public/projects/sub3/68ff161f1a7117df3b375675_TCCWEB-SUB3-PackGIF.gif",
    url: "https://cdn.prod.website-files.com/66587cf3c4f4a7905421e299/68ff161f1a7117df3b375675_TCCWEB-SUB3-PackGIF.gif",
    out: "public/projects/sub3/web/SUB3-PackGIF",
    max: 1440,
    webm: true,
    gif: true,
  },
  {
    project: "KOJA",
    file: "HBW-KOJA-Peanut-Fudge-Protein-Bar-1080x1080.mp4",
    src: "public/projects/koja/HBW-KOJA-Peanut-Fudge-Protein-Bar-1080x1080.mp4",
    url: "https://www.dropbox.com/scl/fi/upx2f37k86dxeb9vysayf/HBW-KOJA-Peanut-Fudge-Protein-Bar-1080x1080.mp4?rlkey=wj0fmy1olgqykx4m05k10hs86&raw=1",
    out: "public/projects/koja/web/KOJA-Peanut-Fudge",
    max: 1080,
    webm: true,
  },
  {
    project: "KOJA",
    file: "KOJA-Logo-1920x1080px.mp4",
    src: "public/projects/koja/KOJA-Logo-1920x1080px.mp4",
    url: "https://www.dropbox.com/scl/fi/6wnnoi49dxuqflq6jz6q6/KOJA-Logo-1920x1080px.mp4?rlkey=9qxeoqgnx9vr609v2t62jufig&raw=1",
    out: "public/projects/koja/web/KOJA-Logo",
    max: 1440,
    light: true,
  },
  {
    project: "KOJA",
    file: "KOJA-BickieBites-Packaging.mp4",
    src: "public/projects/koja/KOJA-BickieBites-Packaging.mp4",
    url: "https://www.dropbox.com/scl/fi/1mcd4zndmq0p6wqv4jxsh/KOJA-BickieBites-Packaging.mp4?rlkey=zmz81tkj1r9v5k3apxevt9a0x&raw=1",
    out: "public/projects/koja/web/KOJA-BickieBites",
    max: 1440,
  },
  {
    project: "KOJA",
    file: "KOJA-Oat-Bites.mp4",
    src: "public/projects/koja/KOJA-Oat-Bites.mp4",
    url: "https://www.dropbox.com/scl/fi/jpdxg8lfut381szabg25b/KOJA-Oat-Bites.mp4?rlkey=bq9an88up52nyvtemuh28hg7a&raw=1",
    out: "public/projects/koja/web/KOJA-Oat-Bites",
    max: 1440,
  },
  {
    project: "KOJA",
    file: "69268bc4ef16ed1ed283878d_HBWKOJA1125-Oat-Bites-Box-Dielines.gif",
    src: "public/projects/koja/69268bc4ef16ed1ed283878d_HBWKOJA1125-Oat-Bites-Box-Dielines.gif",
    url: "https://cdn.prod.website-files.com/66587cf3c4f4a7905421e299/69268bc4ef16ed1ed283878d_HBWKOJA1125-Oat-Bites-Box-Dielines.gif",
    out: "public/projects/koja/web/KOJA-Oat-Bites-Dielines",
    max: 1440,
    webm: true,
    gif: true,
  },
  {
    project: "CLOSED",
    file: "CLOSED-Eyes-1920x1080px.mp4",
    src: "public/projects/closed/CLOSED-Eyes-1920x1080px.mp4",
    url: "https://www.dropbox.com/scl/fi/9pg3p1vuat8kz4drptkg7/CLOSED-Eyes-1920x1080px.mp4?rlkey=a5cxxwfd866l717hq5cd511gg&raw=1",
    out: "public/projects/closed/web/CLOSED-Eyes",
    max: 1440,
    light: true,
  },
  {
    project: "CLOSED",
    file: "HBWxCLOSED-Collage-Movement.mp4",
    src: "public/projects/closed/HBWxCLOSED-Collage-Movement.mp4",
    url: "https://www.dropbox.com/scl/fi/s6wg4e9y3rfpoo7ta5wle/HBWxCLOSED-Collage-Movement.mp4?rlkey=6c73srse4muwkf1jica1alt1g&st=wlt5um6t&raw=1",
    out: "public/projects/closed/web/CLOSED-Collage",
    max: 1440,
  },
  {
    project: "Our Boy Roy",
    file: "Our-Boy-Animation-Colour-Change.mp4",
    src: "public/projects/our-boy-roy/Our-Boy-Animation-Colour-Change.mp4",
    url: "https://www.dropbox.com/scl/fi/abliru5azmgmjnkfjqibh/Our-Boy-Animation-Colour-Change.mp4?rlkey=zwrm0pjzw9nvdrq9fx3vc4cc2&raw=1",
    out: "public/projects/our-boy-roy/web/OBR-Colour-Change",
    max: 1440,
  },
  {
    project: "Our Boy Roy",
    file: "OBR-Mortadella-Month-1080x1350px.mp4",
    src: "public/projects/our-boy-roy/OBR-Mortadella-Month-1080x1350px.mp4",
    url: "https://www.dropbox.com/scl/fi/797f8v7d7jvvfae7wozay/OBR-Mortadella-Month-1080x1350px.mp4?rlkey=kj29ddaq0aztl8h35sj4sxizv&raw=1",
    out: "public/projects/our-boy-roy/web/OBR-Mortadella",
    max: 1350,
    light: true,
  },
  {
    project: "Chris Sisarich",
    file: "HBWxChrisSisarich-System-1080x1350px.mp4",
    src: "public/projects/chris-sisarich/HBWxChrisSisarich-System-1080x1350px.mp4",
    url: "https://www.dropbox.com/scl/fi/shbk8ckq36f46xy37yy67/HBWxChrisSisarich-System-1080x1350px.mp4?rlkey=espk37v6avtc9qyg40rpg5v3f&st=gxj0vtbk&raw=1",
    out: "public/projects/chris-sisarich/web/CS-System",
    max: 1350,
  },
  {
    project: "Chris Sisarich",
    file: "HBWCSHOME-Website.mp4",
    src: HOME_ORIG,
    url: "https://www.dropbox.com/scl/fi/a727lufqt3trweawpl08h/HBWCSHOME-Website.mp4?rlkey=16aw4hz3cpbqas2lz722iiw92&raw=1",
    out: "public/projects/chris-sisarich/web/HBWCSHOME-Website",
    max: 1440,
    fps: 30,
    keepOriginal: "HBWCSHOME-Website.mp4",
  },
  {
    project: "Chris Sisarich",
    file: "HBWCSIMAGES-Website.mp4",
    src: IMAGES_ORIG,
    url: "https://www.dropbox.com/scl/fi/oaha3bcpv6quo4ijgaqy2/HBWCSIMAGES-Website.mp4?rlkey=no4bnzs5fl79l4ywn0yhtw9wo&raw=1",
    out: "public/projects/chris-sisarich/web/HBWCSIMAGES-Website",
    max: 1440,
    fps: 30,
    keepOriginal: "HBWCSIMAGES-Website.mp4",
  },
];

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
    });
    child.on("exit", (code) => {
      if (code === 0) resolve(err);
      else reject(new Error((err.slice(-1800) || `exit ${code}`).trim()));
    });
  });
}

function parseProbe(text) {
  const durationMatch = text.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  const videoMatch = text.match(/(\d{2,5})x(\d{2,5})/);
  const hours = durationMatch ? Number(durationMatch[1]) : 0;
  const minutes = durationMatch ? Number(durationMatch[2]) : 0;
  const seconds = durationMatch ? Number(durationMatch[3]) : 0;
  return {
    duration: hours * 3600 + minutes * 60 + seconds,
    width: videoMatch ? Number(videoMatch[1]) : 0,
    height: videoMatch ? Number(videoMatch[2]) : 0,
  };
}

async function probe(src) {
  try {
    await run(FFMPEG, ["-hide_banner", "-i", src]);
    return parseProbe("");
  } catch (error) {
    return parseProbe(String(error.message || error));
  }
}

function mb(path) {
  if (!existsSync(path)) return 0;
  return Number((statSync(path).size / (1024 * 1024)).toFixed(2));
}

function scaleFilter(max) {
  return `scale='min(${max},iw)':'min(${max},ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`;
}

async function encodeMp4(job, src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  const args = ["-y", "-i", src, "-vf", scaleFilter(job.max)];
  if (job.fps) args.push("-r", String(job.fps));
  args.push(
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    job.light ? "18" : "20",
    "-preset",
    job.keepOriginal ? "veryfast" : "fast",
    "-an",
    "-movflags",
    "+faststart",
    dest
  );
  await run(FFMPEG, args);
}

async function encodeWebm(job, src, dest) {
  const args = ["-y", "-i", src, "-vf", scaleFilter(job.max), "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32", "-deadline", "realtime", "-cpu-used", "6", "-an", dest];
  await run(FFMPEG, args);
}

async function poster(src, dest, duration) {
  const start = Math.min(Math.max(duration * 0.28, 0.25), Math.max(duration - 0.2, 0.05));
  await run(FFMPEG, ["-y", "-ss", start.toFixed(2), "-i", src, "-frames:v", "1", "-q:v", "3", dest]);
}

const rows = [];
mkdirSync(ORIGINALS, { recursive: true });

for (const job of JOBS) {
  const src = join(ROOT, job.src);
  const destMp4 = join(ROOT, `${job.out}.mp4`);
  const destWebm = join(ROOT, `${job.out}.webm`);
  const destPoster = join(ROOT, `${job.out}.jpg`);
  if (!existsSync(src)) {
    rows.push({ project: job.project, file: job.file, error: "missing source" });
    log(`missing ${job.src}`);
    continue;
  }
  if (job.keepOriginal) {
    const copy = join(ORIGINALS, job.keepOriginal);
    if (!existsSync(copy)) copyFileSync(src, copy);
  }
  const info = await probe(src);
  log(`encode ${job.file} ${info.width}x${info.height} ${info.duration}s ${mb(src)}MB`);
  if (!existsSync(destMp4)) await encodeMp4(job, src, destMp4);
  else log(`  skip mp4`);
  if (job.webm && job.gif && !existsSync(destWebm)) await encodeWebm(job, src, destWebm);
  if (!existsSync(destPoster)) await poster(destMp4, destPoster, info.duration || 1);
  const outInfo = await probe(destMp4);
  const row = {
    project: job.project,
    file: job.file,
    sourceUrl: job.url,
    originalFormat: job.gif ? "gif" : "mp4",
    originalDimensions: `${info.width}x${info.height}`,
    originalMb: mb(src),
    duration: Number(info.duration.toFixed(2)),
    localStatus: "local",
    webMp4: `/${job.out.replace(/^public\//, "")}.mp4`,
    webMp4Mb: mb(destMp4),
    webm: existsSync(destWebm) ? `/${job.out.replace(/^public\//, "")}.webm` : null,
    webmMb: existsSync(destWebm) ? mb(destWebm) : null,
    poster: `/${job.out.replace(/^public\//, "")}.jpg`,
    webDimensions: `${outInfo.width}x${outInfo.height}`,
    delivery: "local",
  };
  rows.push(row);
  log(`  → ${row.webMp4} ${row.webMp4Mb}MB ${row.webDimensions} poster ${existsSync(destPoster)}`);
}

writeFileSync(MANIFEST, JSON.stringify(rows, null, 2));
log(`wrote ${MANIFEST}`);
