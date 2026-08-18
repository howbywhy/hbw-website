import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "reflow");
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

function encode(dir, dest, fps = 30) {
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
  function box(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x * 10) / 10,
      y: Math.round(r.y * 10) / 10,
      w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10,
    };
  }
  const view = document.querySelector(".hbw-project-view.is-active, .hbw-project-view");
  const track = document.querySelector(".hbw-project-view__track");
  const sheet = document.querySelector(".hbw-sheet.is-visible");
  const close = document.querySelector("[data-hbw-sheet-close]");
  const title = sheet?.querySelector(".hbw-sheet__lead, .hbw-sheet__opening, h2");
  const position = sheet?.querySelector(".hbw-sheet__kicker");
  const heading = sheet?.querySelector("section h2");
  const body = sheet?.querySelector("section p, .hbw-sheet__opening");
  const meta = sheet?.querySelector(".hbw-sheet__facts, .hbw-inspector__meta, .hbw-sheet__place");
  const current = document.querySelector(".hbw-project-view.is-active .hbw-mv.is-current");
  const mvs = [...document.querySelectorAll(".hbw-project-view.is-active .hbw-mv")];
  const t = track?.style.transform || "";
  const m = t.match(/translate3d\\((-?[\\d.]+)px/);
  const cs = getComputedStyle(document.documentElement);
  return {
    homeClass: document.querySelector(".hbw-home")?.className || "",
    meta: document.querySelector(".hbw-nav-sub__meta")?.textContent?.replace(/\\s+/g, " ").trim() || null,
    viewIndex: view?.getAttribute("data-hbw-index") || null,
    viewXAttr: view?.getAttribute("data-hbw-track-x") || null,
    viewXInline: m ? Math.abs(Number(m[1])) : null,
    trackDisplay: track ? getComputedStyle(track).display : null,
    trackTransform: track ? getComputedStyle(track).transform : null,
    reflowing: view?.classList.contains("is-reflowing") || false,
    mvCount: mvs.length,
    current: current
      ? {
          id: current.getAttribute("data-hbw-mv"),
          label: current.getAttribute("aria-label"),
          ...box(current),
        }
      : null,
    sheet: sheet ? { ...box(sheet), paddingLeft: getComputedStyle(sheet).paddingLeft } : null,
    close: close ? { ...box(close), text: (close.textContent || "").trim() } : null,
    title: title ? box(title) : null,
    position: position ? box(position) : null,
    heading: heading ? box(heading) : null,
    body: body ? box(body) : null,
    metadata: meta ? box(meta) : null,
    contentStart: sheet?.querySelector(":scope > *") ? box(sheet.querySelector(":scope > *")) : null,
    studio: cs.getPropertyValue("--hbw-x-studio").trim(),
    space3: cs.getPropertyValue("--hbw-space-3").trim(),
    duplicateGrids: document.querySelectorAll(".hbw-project-view").length,
  };
})()`;

async function clickSel(page, sel) {
  await page.waitForSelector(sel, { timeout: 8000 });
  await page.$eval(sel, (el) => el.click());
}

async function shot(page, name) {
  const metrics = await page.evaluate(METRICS);
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  return { name, file, metrics };
}

async function boot(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(1000);
}

async function goToMovement(page, index) {
  for (let i = 0; i < index; i++) {
    await page.keyboard.press("ArrowRight");
    await sleep(320);
  }
  await sleep(200);
}

async function recordOpenClose(page, name) {
  const dir = join(OUT, `frames-${name}`);
  rmSync(dir, { recursive: true, force: true });
  const cap = await startCapture(page, dir);
  const t0 = Date.now();
  await sleep(180);
  await clickSel(page, ".hbw-nav-sub__view button");
  await sleep(1100);
  await clickSel(page, "[data-hbw-sheet-close='info']");
  await sleep(1100);
  await cap.stop();
  const elapsed = Math.max(0.5, (Date.now() - t0) / 1000);
  const fps = Math.round((cap.frames.length / elapsed) * 10) / 10;
  await sleep(80);
  const dest = join(OUT, `${name}.mp4`);
  const ok = encode(dir, dest, fps);
  return { dest, ok, frames: cap.frames.length, fps, elapsed };
}

async function stillSequence(page, prefix) {
  const before = await shot(page, `${prefix}-1-before`);
  await clickSel(page, ".hbw-nav-sub__view button");
  await sleep(320);
  const midOpen = await shot(page, `${prefix}-2-mid-open`);
  await sleep(800);
  const settled = await shot(page, `${prefix}-3-settled`);
  await clickSel(page, "[data-hbw-sheet-close='info']");
  await sleep(320);
  const midClose = await shot(page, `${prefix}-4-mid-close`);
  await sleep(800);
  const restored = await shot(page, `${prefix}-5-restored`);
  return { before, midOpen, settled, midClose, restored };
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
  const recM01 = await recordOpenClose(page, "sub3-m01-info-close");
  await boot(page, "/projects/sub-3");
  const stillsM01 = await stillSequence(page, "sub3-m01");

  await boot(page, "/projects/sub-3");
  await goToMovement(page, 5);
  const m06Before = await page.evaluate(METRICS);
  const recM06 = await recordOpenClose(page, "sub3-m06-info-close");
  await boot(page, "/projects/sub-3");
  await goToMovement(page, 5);
  const stillsM06 = await stillSequence(page, "sub3-m06");

  await boot(page, "/projects/chris-sisarich");
  const recChris = await recordOpenClose(page, "chris-sisarich-info-close");
  await boot(page, "/projects/chris-sisarich");
  const stillsChris = await stillSequence(page, "chris");

  await boot(page, "/projects/sub-3");
  await clickSel(page, ".hbw-nav-sub__view button");
  await sleep(900);
  const infoAlign = await page.evaluate(METRICS);
  await clickSel(page, "[data-hbw-sheet-close='info']");
  await sleep(700);
  await clickSel(page, ".hbw-nav-studio");
  await sleep(800);
  const studioAlign = await page.evaluate(METRICS);
  await page.$eval(".hbw-sheet.is-visible .hbw-inspector__link, .hbw-sheet.is-visible .hbw-sheet__link", (el) =>
    el.click()
  );
  await sleep(800);
  const manifestoAlign = await page.evaluate(METRICS);

  const report = {
    viewport: "1440x900",
    recordings: { recM01, recM06, recChris },
    alignment: {
      info: {
        sheetX: infoAlign.sheet?.x,
        contentX: infoAlign.contentStart?.x,
        closeX: infoAlign.close?.x,
        titleX: infoAlign.title?.x,
        bodyX: infoAlign.body?.x,
        metadataX: infoAlign.metadata?.x,
        headingX: infoAlign.heading?.x,
        positionX: infoAlign.position?.x,
        paddingLeft: infoAlign.sheet?.paddingLeft,
      },
      studio: {
        sheetX: studioAlign.sheet?.x,
        contentX: studioAlign.contentStart?.x,
        closeX: studioAlign.close?.x,
        titleX: studioAlign.title?.x,
        bodyX: studioAlign.body?.x,
      },
      manifesto: {
        sheetX: manifestoAlign.sheet?.x,
        contentX: manifestoAlign.contentStart?.x,
        closeX: manifestoAlign.close?.x,
        titleX: manifestoAlign.title?.x,
        bodyX: manifestoAlign.body?.x,
      },
    },
    m01: {
      before: {
        index: stillsM01.before.metrics.viewIndex,
        x: stillsM01.before.metrics.viewXAttr,
        xInline: stillsM01.before.metrics.viewXInline,
        current: stillsM01.before.metrics.current,
      },
      settled: {
        index: stillsM01.settled.metrics.viewIndex,
        current: stillsM01.settled.metrics.current,
        trackDisplay: stillsM01.settled.metrics.trackDisplay,
        duplicateGrids: stillsM01.settled.metrics.duplicateGrids,
        reflowing: stillsM01.settled.metrics.reflowing,
      },
      restored: {
        index: stillsM01.restored.metrics.viewIndex,
        x: stillsM01.restored.metrics.viewXAttr,
        xInline: stillsM01.restored.metrics.viewXInline,
        current: stillsM01.restored.metrics.current,
      },
    },
    m06: {
      beforeRecord: {
        index: m06Before.viewIndex,
        x: m06Before.viewXAttr,
        xInline: m06Before.viewXInline,
        current: m06Before.current,
        meta: m06Before.meta,
      },
      before: {
        index: stillsM06.before.metrics.viewIndex,
        x: stillsM06.before.metrics.viewXAttr,
        xInline: stillsM06.before.metrics.viewXInline,
        current: stillsM06.before.metrics.current,
        meta: stillsM06.before.metrics.meta,
      },
      midOpen: {
        reflowing: stillsM06.midOpen.metrics.reflowing,
        trackDisplay: stillsM06.midOpen.metrics.trackDisplay,
        current: stillsM06.midOpen.metrics.current,
      },
      settled: {
        trackDisplay: stillsM06.settled.metrics.trackDisplay,
        current: stillsM06.settled.metrics.current,
        duplicateGrids: stillsM06.settled.metrics.duplicateGrids,
      },
      restored: {
        index: stillsM06.restored.metrics.viewIndex,
        x: stillsM06.restored.metrics.viewXAttr,
        xInline: stillsM06.restored.metrics.viewXInline,
        current: stillsM06.restored.metrics.current,
        meta: stillsM06.restored.metrics.meta,
      },
    },
    chris: {
      before: {
        index: stillsChris.before.metrics.viewIndex,
        x: stillsChris.before.metrics.viewXAttr,
        xInline: stillsChris.before.metrics.viewXInline,
        current: stillsChris.before.metrics.current,
      },
      restored: {
        index: stillsChris.restored.metrics.viewIndex,
        x: stillsChris.restored.metrics.viewXAttr,
        xInline: stillsChris.restored.metrics.viewXInline,
        current: stillsChris.restored.metrics.current,
      },
    },
  };
  writeFileSync(join(OUT, "metrics.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
