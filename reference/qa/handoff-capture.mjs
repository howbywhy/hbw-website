import { mkdirSync, writeFileSync, rmSync, copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "handoff");
const BASE = "http://127.0.0.1:3000";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ffmpegPath() {
  try {
    return require("ffmpeg-static");
  } catch {
    return null;
  }
}

function encode(dir, dest, fps) {
  const bin = ffmpegPath();
  if (!bin) return false;
  const r = spawnSync(
    bin,
    [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      join(dir, "f-%05d.jpg"),
      "-vf",
      "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-pix_fmt",
      "yuv420p",
      dest,
    ],
    { encoding: "utf8" }
  );
  if (r.status !== 0) {
    console.error(r.stderr);
    return false;
  }
  return true;
}

async function startCapture(page, dir) {
  mkdirSync(dir, { recursive: true });
  const client = await page.createCDPSession();
  let n = 0;
  const frames = [];
  client.on("Page.screencastFrame", async ({ data, sessionId }) => {
    const file = join(dir, `f-${String(n).padStart(5, "0")}.jpg`);
    n += 1;
    frames.push(file);
    writeFileSync(file, Buffer.from(data, "base64"));
    await client.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await client.send("Page.startScreencast", { format: "jpeg", quality: 78, everyNthFrame: 1 });
  return {
    frames,
    async stop() {
      await client.send("Page.stopScreencast").catch(() => {});
    },
  };
}

const METRICS = `(() => {
  const home = document.querySelector(".hbw-home");
  const views = [...document.querySelectorAll(".hbw-project-view")];
  const title = document.querySelector(".hbw-home-strip__project")?.textContent?.trim() || "";
  const meta = document.querySelector(".hbw-nav-sub__meta")?.textContent?.replace(/\\s+/g, " ").trim() || null;
  return {
    homeClass: home?.className || "",
    phase: home?.getAttribute("data-hbw-motion") || "",
    project: home?.getAttribute("data-hbw-project") || "",
    title,
    meta,
    views: views.map((el) => ({
      phase: [...el.classList].find((c) => c.startsWith("is-")) || "",
      className: el.className,
      index: el.getAttribute("data-hbw-index"),
      opacity: getComputedStyle(el).opacity,
      transform: getComputedStyle(el).transform,
      vt: el.style.viewTransitionName || getComputedStyle(el).viewTransitionName,
    })),
  };
})()`;

async function boot(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(900);
}

async function toOutro(page) {
  await page.$eval(".hbw-project-view.is-active", (el) => el.focus());
  for (let i = 0; i < 24; i++) {
    const done = await page.evaluate(() => {
      const meta = document.querySelector(".hbw-nav-sub__meta")?.textContent || "";
      const parts = meta.replace(/\s+/g, "").split("/");
      return parts.length === 2 && parts[0] === parts[1] && Number(parts[0]) > 0;
    });
    if (done) break;
    await page.keyboard.press("ArrowRight");
    await sleep(150);
  }
  await sleep(280);
}

async function clickNext(page) {
  await page.waitForSelector(".hbw-outro__preview", { timeout: 8000 });
  await page.$eval(".hbw-outro__preview", (el) => el.click());
}

function copyStill(framesDir, index, dest) {
  const src = join(framesDir, `f-${String(Math.max(0, index)).padStart(5, "0")}.jpg`);
  copyFileSync(src, dest);
}

async function shot(page, name) {
  const metrics = await page.evaluate(METRICS);
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  return { name, file, metrics };
}

async function record(page, name) {
  const dir = join(OUT, `frames-${name}`);
  rmSync(dir, { recursive: true, force: true });
  const cap = await startCapture(page, dir);
  const t0 = Date.now();
  await sleep(200);
  await clickNext(page);
  await sleep(1300);
  await cap.stop();
  const elapsed = Math.max(0.5, (Date.now() - t0) / 1000);
  const fps = Math.round((cap.frames.length / elapsed) * 10) / 10;
  const dest = join(OUT, `${name}.mp4`);
  const ok = encode(dir, dest, fps);
  const clickAt = 0.2;
  const idx = (ms) => Math.min(cap.frames.length - 1, Math.round(((clickAt + ms / 1000) / elapsed) * cap.frames.length));
  copyStill(dir, Math.max(0, idx(0) - 2), join(OUT, `${name}-1-before.jpg`));
  copyStill(dir, idx(80), join(OUT, `${name}-2-early.jpg`));
  copyStill(dir, idx(240), join(OUT, `${name}-3-mid.jpg`));
  copyStill(dir, idx(400), join(OUT, `${name}-4-m01.jpg`));
  copyStill(dir, idx(700), join(OUT, `${name}-5-settled.jpg`));
  return { dest, ok, frames: cap.frames.length, fps, elapsed };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("hbw.entered.v1", "1");
    sessionStorage.setItem("hbw.entered.v2", "1");
  });

  await boot(page, "/projects/sub-3");
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("ArrowRight");
    await sleep(180);
  }
  const midProject = await page.evaluate(METRICS);
  await toOutro(page);
  const beforeSub3 = await page.evaluate(METRICS);
  const recSub3 = await record(page, "sub3-to-koja");

  await boot(page, "/projects/koja");
  await toOutro(page);
  const recKoja = await record(page, "koja-to-closed");

  await boot(page, "/projects/chris-sisarich");
  await toOutro(page);
  const recChris = await record(page, "chris-to-roy");

  const report = {
    viewport: "1440x900",
    fromLaterMovement: midProject,
    recordings: { recSub3, recKoja, recChris },
    beforeSub3,
  };
  writeFileSync(join(OUT, "metrics.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
