import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "type-unify");
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

function encode(dir, dest) {
  const bin = ffmpegPath();
  if (!bin) return false;
  const r = spawnSync(
    bin,
    [
      "-y",
      "-framerate",
      "30",
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
  return r.status === 0;
}

async function startCapture(page, dir) {
  mkdirSync(dir, { recursive: true });
  const client = await page.createCDPSession();
  let n = 0;
  client.on("Page.screencastFrame", async ({ data, sessionId }) => {
    writeFileSync(join(dir, `f-${String(n).padStart(5, "0")}.jpg`), Buffer.from(data, "base64"));
    n += 1;
    await client.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await client.send("Page.startScreencast", { format: "jpeg", quality: 80, everyNthFrame: 1 });
  return {
    async stop() {
      await client.send("Page.stopScreencast").catch(() => {});
    },
  };
}

const TYPEOF = `(() => {
  function typeOf(node) {
    if (!node) return null;
    const cs = getComputedStyle(node);
    const r = node.getBoundingClientRect();
    return {
      text: (node.textContent || "").replace(/\\s+/g, " ").trim(),
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
      fontWeight: cs.fontWeight,
      fontFamily: cs.fontFamily,
      textTransform: cs.textTransform,
      transform: cs.transform,
      display: cs.display,
      height: Math.round(r.height * 10) / 10,
      width: Math.round(r.width * 10) / 10,
      x: Math.round(r.x * 10) / 10,
      y: Math.round(r.y * 10) / 10,
    };
  }
  function sizes() {
    const nodes = [...document.querySelectorAll(
      ".hbw-intro-thought, .hbw-intro-how, .hbw-intro-by, .hbw-intro-why, .hbw-intro-line--role, .hbw-intro-line--practice, .hbw-mark-how .hbw-mark-word--rest, .hbw-mark-by .hbw-mark-word--rest, .hbw-mark-why .hbw-mark-word--rest, .hbw-mark-descriptor, .hbw-nav-sub__browse button, .hbw-nav-sub__meta, .hbw-browse__title, .hbw-browse__row-name, .hbw-browse__row-year, .hbw-poster-tool, .hbw-poster-input, .hbw-poster-send-open, .hbw-inspector h2, .hbw-inspector p, .hbw-sheet__place, .hbw-sheet__kicker, .hbw-sheet__facts dt, .hbw-sheet__facts dd"
    )];
    const seen = new Map();
    for (const node of nodes) {
      const cs = getComputedStyle(node);
      if (cs.display === "none" || Number(cs.opacity) === 0 && !node.closest(".hbw-intro-thought")) continue;
      const key = node.className + "|" + cs.fontSize;
      if (!seen.has(key)) seen.set(key, { sel: node.className?.toString?.().slice(0, 80), fontSize: cs.fontSize, lineHeight: cs.lineHeight, text: (node.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 48) });
    }
    return [...seen.values()];
  }
  return {
    introHow: typeOf(document.querySelector(".hbw-intro-how")),
    introBy: typeOf(document.querySelector(".hbw-intro-by")),
    introWhy: typeOf(document.querySelector(".hbw-intro-why")),
    destHow: typeOf(document.querySelector(".hbw-mark-how .hbw-mark-word--rest")),
    destBy: typeOf(document.querySelector(".hbw-mark-by .hbw-mark-word--rest")),
    destWhy: typeOf(document.querySelector(".hbw-mark-why .hbw-mark-word--rest")),
    descriptor: typeOf(document.querySelector(".hbw-mark-descriptor")),
    lockup: typeOf(document.querySelector(".hbw-intro-thought")),
    role: typeOf(document.querySelector(".hbw-intro-line--role")),
    practice: typeOf(document.querySelector(".hbw-intro-line--practice")),
    samples: sizes(),
    viewport: { w: innerWidth, h: innerHeight },
  };
})()`;

async function launch(width, height, mobile = false) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [`--window-size=${width},${height}`, "--hide-scrollbars"],
    defaultViewport: { width, height, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile },
  });
}

async function gotoFresh(page, path = "/") {
  await page.evaluateOnNewDocument(() => {
    try {
      sessionStorage.removeItem("hbw.entered.v2");
      sessionStorage.removeItem("hbw.intro.media.v1");
    } catch {}
  });
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.addStyleTag({
    content: "nextjs-portal, [data-next-badge-root], [data-nextjs-toast] { display: none !important; }",
  });
}

async function gotoEntered(page, path) {
  await page.evaluateOnNewDocument(() => {
    try {
      sessionStorage.setItem("hbw.entered.v2", "1");
    } catch {}
  });
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.addStyleTag({
    content: "nextjs-portal, [data-next-badge-root], [data-nextjs-toast] { display: none !important; }",
  });
}

async function desktop() {
  const browser = await launch(1440, 900);
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const rec = await startCapture(page, join(OUT, "frames-intro"));
  await gotoFresh(page);

  await page.waitForFunction(() => {
    const el = document.querySelector(".hbw-intro-thought");
    return document.documentElement.classList.contains("hbw-intro") && el && parseFloat(getComputedStyle(el).opacity) > 0.85;
  }, { timeout: 8000 });
  await page.screenshot({ path: join(OUT, "d-01-lockup.png") });
  const lockupType = await page.evaluate(TYPEOF);

  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-intro-resolve") || document.documentElement.classList.contains("hbw-entered"), { timeout: 8000 });
  await sleep(90);
  await page.screenshot({ path: join(OUT, "d-02-mid-transition.png") });
  const midType = await page.evaluate(TYPEOF);

  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 4000 });
  await sleep(180);
  await rec.stop();
  encode(join(OUT, "frames-intro"), join(OUT, "intro.mp4"));

  await page.screenshot({ path: join(OUT, "d-03-settled.png") });
  await page.screenshot({ path: join(OUT, "d-04-make.png") });
  const settledType = await page.evaluate(TYPEOF);

  await page.click(".hbw-mark-by");
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), { timeout: 4000 });
  await sleep(420);
  await page.screenshot({ path: join(OUT, "d-05-projects.png") });

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll(".hbw-nav-sub__browse button")].find((el) => el.textContent.trim() === "Index");
    btn?.click();
  });
  await sleep(380);
  await page.screenshot({ path: join(OUT, "d-10-index.png") });
  const indexType = await page.evaluate(TYPEOF);

  await browser.close();

  const viewBrowser = await launch(1440, 900);
  const view = await viewBrowser.newPage();
  await view.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await gotoEntered(view, "/projects/sub-3");
  await view.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(900);
  await view.screenshot({ path: join(OUT, "d-06-project-view.png") });

  await view.evaluate(() => document.querySelector(".hbw-nav-sub__view button")?.click());
  await sleep(900);
  await view.screenshot({ path: join(OUT, "d-07-project-info.png") });
  const infoType = await view.evaluate(TYPEOF);
  await viewBrowser.close();

  const practiceBrowser = await launch(1440, 900);
  const practice = await practiceBrowser.newPage();
  await practice.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await gotoEntered(practice, "/studio");
  await practice.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-studio"), { timeout: 8000 });
  await sleep(500);
  await practice.screenshot({ path: join(OUT, "d-08-practice.png") });
  const practiceType = await practice.evaluate(TYPEOF);
  await practiceBrowser.close();

  const manifestoBrowser = await launch(1440, 900);
  const manifesto = await manifestoBrowser.newPage();
  await manifesto.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await gotoEntered(manifesto, "/manifesto");
  await sleep(700);
  await manifesto.screenshot({ path: join(OUT, "d-09-manifesto.png") });
  const manifestoType = await manifesto.evaluate(TYPEOF);
  await manifestoBrowser.close();

  return { lockupType, midType, settledType, indexType, infoType, practiceType, manifestoType };
}

async function mobileAt(width, height) {
  const browser = await launch(width, height, true);
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await gotoFresh(page);
  await page.waitForFunction(() => {
    const el = document.querySelector(".hbw-intro-thought");
    return document.documentElement.classList.contains("hbw-intro") && el && parseFloat(getComputedStyle(el).opacity) > 0.8;
  }, { timeout: 8000 });
  const lockup = await page.evaluate(TYPEOF);
  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 5000 });
  await sleep(160);
  const settled = await page.evaluate(TYPEOF);
  const input = await page.evaluate(() => {
    const el = document.querySelector(".hbw-poster-input");
    return el ? getComputedStyle(el).fontSize : null;
  });
  if (width === 390) {
    await page.screenshot({ path: join(OUT, "m-01-lockup.png") });
    await page.screenshot({ path: join(OUT, "m-02-settled.png") });
  }
  await browser.close();
  return { size: { width, height }, lockup, settled, inputFontSize: input };
}

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const desktopStills = await desktop();
  const m390 = await mobileAt(390, 844);
  const m375 = await mobileAt(375, 812);
  const m430 = await mobileAt(430, 932);
  const report = { desktop: desktopStills, mobile: { "390x844": m390, "375x812": m375, "430x932": m430 } };
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
