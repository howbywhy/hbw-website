import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "nav-index");
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
    ["-y", "-framerate", String(fps), "-i", join(dir, "f-%05d.jpg"), "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-pix_fmt", "yuv420p", dest],
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
  await client.send("Page.startScreencast", { format: "jpeg", quality: 78, everyNthFrame: 1 });
  return {
    async stop() {
      await client.send("Page.stopScreencast").catch(() => {});
    },
  };
}

const HIT = `(() => {
  const box = (n) => {
    if (!n) return null;
    const r = n.getBoundingClientRect();
    const before = getComputedStyle(n, "::before");
    return {
      x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
      text: (n.querySelector(".hbw-mark-word--rest")?.textContent || n.textContent || "").trim(),
      swap: (n.querySelector(".hbw-mark-word--swap")?.textContent || "").trim(),
      before: { w: before.width, h: before.height },
    };
  };
  const how = document.querySelector(".hbw-mark-how");
  const by = document.querySelector(".hbw-mark-by");
  const why = document.querySelector(".hbw-mark-why");
  const rows = [...document.querySelectorAll(".hbw-projects.is-index .hbw-browse__row")];
  const thumbs = [...document.querySelectorAll(".hbw-nav-peek a")];
  const peek = document.querySelector(".hbw-nav-peek");
  return {
    cls: document.documentElement.className,
    intent: document.querySelector(".hbw-home-strip__mark")?.getAttribute("data-hbw-intent"),
    identity: document.querySelector(".hbw-home-strip__mark")?.innerText.replace(/\\s+/g, " ").trim(),
    how: box(how), by: box(by), why: box(why),
    gapHowBy: how && by ? +(by.getBoundingClientRect().x - how.getBoundingClientRect().right).toFixed(1) : null,
    gapByWhy: by && why ? +(why.getBoundingClientRect().x - by.getBoundingClientRect().right).toFixed(1) : null,
    peek: peek ? { open: peek.classList.contains("is-open"), ...box(peek), count: thumbs.length, thumbs: thumbs.map((a) => {
      const r = a.getBoundingClientRect();
      const img = a.querySelector("img");
      return { id: a.getAttribute("data-hbw-peek"), w: +r.width.toFixed(1), h: +r.height.toFixed(1), src: img?.currentSrc || img?.src || "" };
    }) } : null,
    index: {
      rows: rows.length,
      first: rows[0] ? box(rows[0]) : null,
      thumb: rows[0]?.querySelector(".hbw-browse__row-thumb") ? box(rows[0].querySelector(".hbw-browse__row-thumb")) : null,
      name: rows[0]?.querySelector(".hbw-browse__row-name")?.textContent || null,
      idea: rows[0]?.querySelector(".hbw-browse__row-idea")?.textContent || null,
      gap: rows[0] && rows[1] ? +(rows[1].getBoundingClientRect().y - rows[0].getBoundingClientRect().bottom).toFixed(1) : null,
      visible: rows.filter((el) => el.getBoundingClientRect().bottom > 0 && el.getBoundingClientRect().top < innerHeight).length,
      overflowX: document.documentElement.scrollWidth > innerWidth + 1 || (document.querySelector(".hbw-projects")?.scrollWidth || 0) > innerWidth + 1,
    },
  };
})()`;

async function launch(w, h, mobile) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [`--window-size=${w},${h}`, "--hide-scrollbars"],
    defaultViewport: { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile },
  });
}

async function prepare(page, entered) {
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  if (entered) {
    await page.evaluateOnNewDocument(() => {
      try { sessionStorage.setItem("hbw.entered.v2", "1"); } catch {}
    });
  } else {
    await page.evaluateOnNewDocument(() => {
      try { sessionStorage.removeItem("hbw.entered.v2"); } catch {}
    });
  }
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.addStyleTag({
    content:
      "nextjs-portal,[data-next-badge-root],[data-nextjs-toast],#nextjs-dev-indicator{display:none!important}",
  });
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = {};

  const introB = await launch(390, 844, true);
  const intro = await introB.newPage();
  await intro.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await prepare(intro, false);
  await intro.waitForFunction(() => document.documentElement.classList.contains("hbw-intro-resolve"), { timeout: 8000 });
  await sleep(200);
  await intro.screenshot({ path: join(OUT, "390-intro-settled.png") });
  report.introSettled = await intro.evaluate(HIT);
  await intro.waitForFunction(() => document.documentElement.classList.contains("hbw-nav-teach"), { timeout: 4000 });
  await sleep(80);
  await intro.screenshot({ path: join(OUT, "390-intro-teach.png") });
  report.teach = await intro.evaluate(HIT);
  await intro.waitForFunction(() => !document.documentElement.classList.contains("hbw-nav-teach"), { timeout: 4000 });
  await sleep(120);
  await intro.screenshot({ path: join(OUT, "390-intro-return.png") });
  report.returned = await intro.evaluate(HIT);
  await introB.close();

  const mobB = await launch(390, 844, true);
  const mob = await mobB.newPage();
  await mob.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await prepare(mob, true);
  await mob.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 8000 });
  await sleep(300);
  report.hits = await mob.evaluate(HIT);
  await mob.screenshot({ path: join(OUT, "390-how-by-why.png") });

  const how = await mob.evaluate(() => {
    const el = document.querySelector(".hbw-mark-how");
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  const recHow = await startCapture(mob, join(OUT, "frames-tap-how"));
  await mob.touchscreen.tap(how.x, how.y);
  await sleep(200);
  await mob.screenshot({ path: join(OUT, "390-tap-how.png") });
  report.tapHow = await mob.evaluate(HIT);
  await sleep(500);
  await recHow.stop();
  encode(join(OUT, "frames-tap-how"), join(OUT, "390-tap-how.mp4"), 12);

  await mob.reload({ waitUntil: "domcontentloaded" });
  await mob.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"));
  await sleep(300);
  const by = await mob.evaluate(() => {
    const el = document.querySelector(".hbw-mark-by");
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await mob.touchscreen.tap(by.x, by.y);
  await mob.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), { timeout: 8000 });
  await sleep(450);
  await mob.screenshot({ path: join(OUT, "390-projects-visual.png") });
  report.visual = await mob.evaluate(HIT);

  await mob.evaluate(() => {
    const el = [...document.querySelectorAll(".hbw-nav-sub__browse button")].find((b) => b.textContent.trim() === "Index");
    el?.click();
  });
  await mob.waitForFunction(() => document.querySelector(".hbw-projects")?.classList.contains("is-index"), { timeout: 5000 });
  await sleep(400);
  await mob.screenshot({ path: join(OUT, "390-index-first.png") });
  report.index390 = await mob.evaluate(HIT);
  await mob.$eval(".hbw-projects", (el) => el.scrollBy({ top: 280, behavior: "auto" }));
  await sleep(200);
  await mob.screenshot({ path: join(OUT, "390-index-scrolled.png") });
  report.index390scrolled = await mob.evaluate(HIT);

  const row = await mob.evaluate(() => {
    const el = document.querySelector('[data-hbw-project="koja"]');
    const r = el.getBoundingClientRect();
    return { x: r.x + Math.min(120, r.width / 2), y: r.y + r.height / 2 };
  });
  await mob.touchscreen.tap(row.x, row.y);
  await mob.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(700);
  await mob.screenshot({ path: join(OUT, "390-index-open.png") });
  report.indexOpen = await mob.evaluate(() => ({
    slug: document.querySelector(".hbw-home")?.getAttribute("data-hbw-project"),
    identity: document.querySelector(".hbw-home-strip__mark")?.innerText.replace(/\s+/g, " ").trim(),
    first: document.querySelector(".hbw-project-view.is-active .hbw-mv")?.dataset.hbwMv,
  }));
  await mobB.close();

  const whyB = await launch(390, 844, true);
  const whyP = await whyB.newPage();
  await whyP.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await prepare(whyP, true);
  await whyP.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"));
  await sleep(300);
  const why = await whyP.evaluate(() => {
    const el = document.querySelector(".hbw-mark-why");
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await whyP.touchscreen.tap(why.x, why.y);
  await whyP.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-studio"), { timeout: 8000 });
  await sleep(400);
  await whyP.screenshot({ path: join(OUT, "390-tap-why.png") });
  report.tapWhy = await whyP.evaluate(HIT);
  await whyB.close();

  async function indexAt(w, h, name) {
    const b = await launch(w, h, true);
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await prepare(p, true);
    await p.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 12000 });
    await sleep(500);
    const byHit = await p.evaluate(() => {
      const el = document.querySelector(".hbw-mark-by");
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await p.touchscreen.tap(byHit.x, byHit.y);
    await p.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), { timeout: 12000 });
    await sleep(400);
    await p.evaluate(() => {
      const el = [...document.querySelectorAll(".hbw-nav-sub__browse button")].find((b) => b.textContent.trim() === "Index");
      el?.click();
    });
    await sleep(350);
    await p.screenshot({ path: join(OUT, `${name}-index.png`) });
    const metrics = await p.evaluate(HIT);
    await b.close();
    return metrics;
  }

  report.index375 = await indexAt(375, 812, "375x812");
  report.index430 = await indexAt(430, 932, "430x932");

  const deskB = await launch(1440, 900, false);
  const desk = await deskB.newPage();
  await desk.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await prepare(desk, true);
  await desk.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"));
  await sleep(300);
  await desk.screenshot({ path: join(OUT, "1440-rest.png") });
  report.deskRest = await desk.evaluate(HIT);
  report.deskMarks = await desk.evaluate(() => {
    const how = document.querySelector(".hbw-mark-how .hbw-mark-word--rest")?.getBoundingClientRect();
    const by = document.querySelector(".hbw-mark-by .hbw-mark-word--rest")?.getBoundingClientRect();
    const why = document.querySelector(".hbw-mark-why .hbw-mark-word--rest")?.getBoundingClientRect();
    const tb = document.querySelector(".hbw-poster-toolbar")?.getBoundingClientRect();
    return {
      howX: how ? +how.x.toFixed(1) : null,
      byCx: by ? +(by.x + by.width / 2).toFixed(1) : null,
      whyRight: why ? +why.right.toFixed(1) : null,
      toolbar: tb ? { x: +tb.x.toFixed(1), y: +tb.y.toFixed(1), w: +tb.width.toFixed(1), h: +tb.height.toFixed(1) } : null,
    };
  });
  await desk.hover(".hbw-mark-by");
  await sleep(280);
  await desk.screenshot({ path: join(OUT, "1440-by-hover.png") });
  report.deskHover = await desk.evaluate(HIT);
  const peekBox = await desk.evaluate(() => {
    const a = document.querySelector(".hbw-nav-peek a");
    const r = a?.getBoundingClientRect();
    return r ? { x: r.x + r.width / 2, y: r.y + 8 } : null;
  });
  if (peekBox) {
    await desk.mouse.move(peekBox.x, peekBox.y);
    await sleep(160);
    await desk.screenshot({ path: join(OUT, "1440-peek-pointer.png") });
    report.deskPointer = await desk.evaluate(HIT);
  }
  await desk.hover(".hbw-poster-toolbar");
  await sleep(320);
  await desk.screenshot({ path: join(OUT, "1440-peek-clear.png") });
  report.deskClear = await desk.evaluate(HIT);

  await desk.click(".hbw-mark-by");
  await desk.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"));
  await sleep(400);
  await desk.evaluate(() => {
    const el = [...document.querySelectorAll(".hbw-nav-sub__browse button")].find((b) => b.textContent.trim() === "Index");
    el?.click();
  });
  await sleep(400);
  await desk.screenshot({ path: join(OUT, "1440-index.png") });
  report.deskIndex = await desk.evaluate(HIT);
  await deskB.close();

  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    teach: { intent: report.teach?.intent, identity: report.teach?.identity, how: report.teach?.how?.swap, by: report.teach?.by?.swap, why: report.teach?.why?.swap },
    returned: { intent: report.returned?.intent, identity: report.returned?.identity },
    hits: { how: report.hits?.how, by: report.hits?.by, why: report.hits?.why, gapHowBy: report.hits?.gapHowBy, gapByWhy: report.hits?.gapByWhy },
    tapHow: report.tapHow?.identity,
    visualOverflow: report.visual?.index?.overflowX,
    index390: report.index390?.index,
    index375: report.index375?.index,
    index430: report.index430?.index,
    indexOpen: report.indexOpen,
    deskMarks: report.deskMarks,
    deskHover: { intent: report.deskHover?.intent, identity: report.deskHover?.identity, peek: report.deskHover?.peek },
    deskClear: { intent: report.deskClear?.intent, peekOpen: report.deskClear?.peek?.open },
    deskIndexRows: report.deskIndex?.index,
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
