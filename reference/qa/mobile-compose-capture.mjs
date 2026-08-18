import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "mobile-compose");
const BASE = "http://127.0.0.1:3000";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const MEASURE = `(() => {
  const box = (n) => {
    if (!n) return null;
    const r = n.getBoundingClientRect();
    const cs = getComputedStyle(n);
    return {
      x: +r.x.toFixed(1),
      y: +r.y.toFixed(1),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      r: +r.right.toFixed(1),
      b: +r.bottom.toFixed(1),
      font: cs.fontSize,
      lh: cs.lineHeight,
    };
  };
  const hit = (n) => {
    if (!n) return null;
    const r = n.getBoundingClientRect();
    const before = getComputedStyle(n, "::before");
    return {
      visual: box(n),
      before: { w: before.width, h: before.height },
      text: (n.textContent || "").replace(/\\s+/g, " ").trim(),
    };
  };
  const strip = document.querySelector(".hbw-home-strip");
  const win = document.querySelector(".hbw-window");
  const media = document.querySelector(".hbw-project-view.is-active .hbw-mv .hbw-mv__media, .hbw-project-view.is-active .hbw-mv .hbw-mv__poster");
  const mv = document.querySelector(".hbw-project-view.is-active .hbw-mv");
  const mv2 = document.querySelectorAll(".hbw-project-view.is-active .hbw-mv")[1];
  const close =
    document.querySelector(".hbw-home-strip__exit.is-on") ||
    document.querySelector(".hbw-nav-studio.is-sheet-close") ||
    document.querySelector(".hbw-nav-projects__hit");
  const info = [...document.querySelectorAll(".hbw-nav-sub__view button")].find((el) => /Info|Close/.test(el.textContent || ""));
  const mark = document.querySelector(".hbw-home-strip__mark");
  const how = document.querySelector(".hbw-mark-how");
  const by = document.querySelector(".hbw-mark-by");
  const why = document.querySelector(".hbw-mark-why");
  const sheet = document.querySelector(".hbw-inspector.is-visible");
  const firstSheet = sheet && sheet.firstElementChild;
  return {
    text: mark?.innerText.replace(/\\s+/g, " ").trim(),
    classes: document.querySelector(".hbw-home")?.className,
    header: box(strip),
    window: box(win),
    media: box(media),
    mv: box(mv),
    mv2: box(mv2),
    gap: mv && mv2 ? +(mv2.getBoundingClientRect().y - mv.getBoundingClientRect().bottom).toFixed(1) : null,
    close: hit(close),
    info: hit(info),
    how: box(how),
    by: box(by),
    why: box(why),
    mark: box(mark),
    sheet: sheet ? { ...box(sheet), padTop: getComputedStyle(sheet).paddingTop, firstY: firstSheet ? +firstSheet.getBoundingClientRect().y.toFixed(1) : null } : null,
    insetL: media ? +media.getBoundingClientRect().x.toFixed(1) : null,
    insetR: media ? +(innerWidth - media.getBoundingClientRect().right).toFixed(1) : null,
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    vw: innerWidth,
    vh: innerHeight,
  };
})()`;

async function launch(w, h, mobile = true) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [`--window-size=${w},${h}`, "--hide-scrollbars"],
    defaultViewport: { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile },
  });
}

async function gotoEntered(page, path = "/") {
  await page.evaluateOnNewDocument(() => {
    try {
      sessionStorage.setItem("hbw.entered.v2", "1");
    } catch {}
  });
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.addStyleTag({
    content: "nextjs-portal, [data-next-badge-root], [data-nextjs-toast] { display: none !important; }",
  });
  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 8000 });
  await sleep(240);
}

async function openSub3(page) {
  await page.click(".hbw-mark-by");
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), { timeout: 5000 });
  await sleep(400);
  await page.waitForSelector('[data-hbw-project="sub-3"]', { timeout: 8000 });
  await page.click('[data-hbw-project="sub-3"]');
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(900);
}

async function stillsFor(w, h, name) {
  const browser = await launch(w, h, true);
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await gotoEntered(page, "/");
  const out = {};
  await page.screenshot({ path: join(OUT, `${name}-make.png`) });
  out.make = await page.evaluate(MEASURE);

  await page.click(".hbw-mark-by");
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), { timeout: 5000 });
  await sleep(450);
  await page.screenshot({ path: join(OUT, `${name}-projects.png`) });
  out.projects = await page.evaluate(MEASURE);

  await page.waitForSelector('[data-hbw-project="sub-3"]', { timeout: 8000 });
  await page.click('[data-hbw-project="sub-3"]');
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(900);
  await page.screenshot({ path: join(OUT, `${name}-sub3-m01.png`) });
  out.view = await page.evaluate(MEASURE);

  await page.$eval(".hbw-project-view.is-active", (el) => el.scrollBy({ top: 720, behavior: "auto" }));
  await sleep(350);
  await page.screenshot({ path: join(OUT, `${name}-sub3-later.png`) });
  out.later = await page.evaluate(MEASURE);

  await page.$eval(".hbw-project-view.is-active", (el) => {
    el.scrollTop = 0;
  });
  await sleep(200);
  const info = await page.evaluate(() => {
    const el = [...document.querySelectorAll(".hbw-nav-sub__view button")].find((b) => b.textContent.trim() === "Info");
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.touchscreen.tap(info.x, info.y);
  await sleep(500);
  await page.screenshot({ path: join(OUT, `${name}-sub3-info.png`) });
  out.info = await page.evaluate(MEASURE);

  await browser.close();
  return out;
}

async function practice(w, h, name) {
  const browser = await launch(w, h, true);
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await gotoEntered(page, "/");
  await page.click(".hbw-mark-why");
  await page.waitForFunction(
    () =>
      document.querySelector(".hbw-home")?.classList.contains("is-studio") ||
      document.querySelector(".hbw-inspector.is-visible"),
    { timeout: 8000 }
  );
  await sleep(420);
  await page.screenshot({ path: join(OUT, `${name}-practice.png`) });
  const metrics = await page.evaluate(MEASURE);
  await browser.close();
  return metrics;
}

async function desktop() {
  const browser = await launch(1440, 900, false);
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await gotoEntered(page, "/");
  await page.screenshot({ path: join(OUT, "desktop-1440-make.png") });
  const make = await page.evaluate(() => {
    const how = document.querySelector(".hbw-mark-how .hbw-mark-word--rest")?.getBoundingClientRect();
    const by = document.querySelector(".hbw-mark-by .hbw-mark-word--rest")?.getBoundingClientRect();
    const why = document.querySelector(".hbw-mark-why .hbw-mark-word--rest")?.getBoundingClientRect();
    const tb = document.querySelector(".hbw-poster-toolbar")?.getBoundingClientRect();
    return {
      howX: how ? +how.x.toFixed(1) : null,
      byCx: by ? +(by.x + by.width / 2).toFixed(1) : null,
      whyRight: why ? +why.right.toFixed(1) : null,
      toolbar: tb
        ? { x: +tb.x.toFixed(1), y: +tb.y.toFixed(1), w: +tb.width.toFixed(1), h: +tb.height.toFixed(1) }
        : null,
    };
  });
  await browser.close();
  return make;
}

async function landscape() {
  const browser = await launch(844, 390, true);
  const page = await browser.newPage();
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await gotoEntered(page, "/");
  const make = await page.evaluate(MEASURE);
  await page.screenshot({ path: join(OUT, "844x390-make.png") });
  await openSub3(page);
  await page.screenshot({ path: join(OUT, "844x390-sub3.png") });
  const view = await page.evaluate(MEASURE);
  await browser.close();
  return { make, view };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const s390 = await stillsFor(390, 844, "390x844");
  const practice390 = await practice(390, 844, "390x844");
  const s375 = await stillsFor(375, 812, "375x812");
  const s430 = await stillsFor(430, 932, "430x932");
  const land = await landscape();
  const desk = await desktop();
  const report = { s390: { ...s390, practice: practice390 }, s375, s430, land, desk };
  writeFileSync(join(OUT, "metrics.json"), JSON.stringify(report, null, 2));
  const pick = (m) => ({
    headerH: m.header?.h,
    mediaY: m.media?.y,
    mediaW: m.media?.w,
    insetL: m.insetL,
    insetR: m.insetR,
    close: m.close && { w: m.close.visual?.w, h: m.close.visual?.h, before: m.close.before, y: m.close.visual?.y },
    info: m.info && { w: m.info.visual?.w, h: m.info.visual?.h, before: m.info.before, y: m.info.visual?.y },
    text: m.text,
    gap: m.gap,
    overflow: m.overflow,
    sheetPad: m.sheet?.padTop,
    sheetFirstY: m.sheet?.firstY,
  });
  console.log(
    JSON.stringify(
      {
        "390-make": pick(s390.make),
        "390-projects": pick(s390.projects),
        "390-view": pick(s390.view),
        "390-later": pick(s390.later),
        "390-info": pick(s390.info),
        "390-practice": pick(practice390),
        "375-view": pick(s375.view),
        "375-info": pick(s375.info),
        "430-view": pick(s430.view),
        land: { overflowMake: land.make.overflow, overflowView: land.view.overflow, header: land.view.header?.h, mediaW: land.view.media?.w },
        desk,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
