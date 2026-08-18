import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "index-continuity");
const BASE = "http://127.0.0.1:3000";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const MEASURE = `(() => {
  const box = (n) => {
    if (!n) return null;
    const r = n.getBoundingClientRect();
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  };
  const home = document.querySelector(".hbw-home");
  const by = document.querySelector(".hbw-mark-by");
  const thumbs = [...document.querySelectorAll("#hbw-nav-peek a")];
  const first = thumbs[0];
  const view = document.querySelector(".hbw-project-view.is-active");
  const projects = document.querySelector(".hbw-projects");
  const rows = [...document.querySelectorAll(".hbw-browse__row")];
  const row = rows[0];
  const cols = row
    ? {
        thumb: box(row.querySelector(".hbw-browse__row-thumb")),
        name: box(row.querySelector(".hbw-browse__row-name")),
        idea: box(row.querySelector(".hbw-browse__row-idea")),
        disc: box(row.querySelector(".hbw-browse__row-disc")),
        collab: box(row.querySelector(".hbw-browse__row-collab")),
        year: box(row.querySelector(".hbw-browse__row-year")),
        more: box(row.querySelector(".hbw-browse__more")),
        note: box(row.querySelector(".hbw-browse__note")),
      }
    : null;
  const archive = document.querySelector(".hbw-projects.is-index .hbw-browse");
  return {
    path: location.pathname + location.search,
    home: home?.className || null,
    origin: home?.getAttribute("data-hbw-origin") || "none",
    identity: document.querySelector(".hbw-home-strip__mark")?.innerText.replace(/\\s+/g, " ").trim() || null,
    descriptor: document.querySelector(".hbw-mark-descriptor")?.innerText.replace(/\\s+/g, " ").trim() || null,
    by: box(by),
    peekOpen: document.querySelector(".hbw-nav-peek")?.classList.contains("is-open") || false,
    peek: box(document.querySelector(".hbw-nav-peek")),
    firstThumb: first ? box(first) : null,
    thumbCount: thumbs.length,
    viewMore: document.querySelector(".hbw-mark-all")?.textContent?.trim() || null,
    indexBox: box(archive),
    row: row ? box(row) : null,
    rowMin: row ? parseFloat(getComputedStyle(row).minHeight) : null,
    rowPad: row
      ? { top: parseFloat(getComputedStyle(row).paddingTop), bottom: parseFloat(getComputedStyle(row).paddingBottom) }
      : null,
    browsePad: archive
      ? { top: parseFloat(getComputedStyle(archive).paddingTop), bottom: parseFloat(getComputedStyle(archive).paddingBottom) }
      : null,
    cols,
    expanded: !!document.querySelector(".hbw-browse__note"),
    noteText: document.querySelector(".hbw-browse__note")?.textContent?.slice(0, 80) || null,
    moreLabel: document.querySelector(".hbw-browse__more")?.textContent?.trim() || null,
    viewX: view ? Number(view.getAttribute("data-hbw-track-x") || 0) : null,
    viewIndex: view ? Number(view.getAttribute("data-hbw-index") || 0) : null,
    current: box(view?.querySelector(".hbw-mv.is-current")),
    mvs: [...(view?.querySelectorAll(".hbw-mv") || [])].slice(0, 3).map((el, i) => ({ i, ...box(el) })),
    preview: box(view?.querySelector(".hbw-outro.is-next .hbw-outro__preview")),
    previewIn: (() => {
      const p = view?.querySelector(".hbw-outro.is-next .hbw-outro__preview");
      if (!p || !view) return null;
      const pr = p.getBoundingClientRect();
      const vr = view.getBoundingClientRect();
      return { left: +(pr.left - vr.left).toFixed(1), right: +(vr.right - pr.right).toFixed(1), visible: pr.left < vr.right && pr.right > vr.left };
    })(),
    inspect: home?.classList.contains("is-inspect") || false,
  };
})()`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = { notes: [], shots: {} };
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--window-size=1440,900", "--hide-scrollbars"],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });

  async function pageAt(w = 1440, h = 900, mobile = false) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await page.evaluateOnNewDocument(() => {
      try {
        sessionStorage.setItem("hbw.entered.v2", "1");
        sessionStorage.removeItem("hbw.origin.v1");
      } catch {}
    });
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.addStyleTag({
      content: "nextjs-portal,[data-next-badge-root],[data-nextjs-toast],#nextjs-dev-indicator{display:none!important}",
    });
    await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 8000 });
    await sleep(300);
    return page;
  }

  async function shot(page, name) {
    await page.screenshot({ path: join(OUT, `${name}.png`) });
    const metrics = await page.evaluate(MEASURE);
    report.shots[name] = metrics;
    return metrics;
  }

  async function click(page, sel) {
    await page.waitForSelector(sel, { timeout: 8000 });
    await page.$eval(sel, (el) => el.click());
  }

  {
    const page = await pageAt();
    const rest = await shot(page, "01-home-rest");
    await page.hover(".hbw-mark-by");
    await page.waitForSelector(".hbw-nav-peek.is-open");
    await sleep(220);
    const peek = await shot(page, "01-by-preview");
    await page.hover('[data-hbw-peek="sub-3"]');
    await sleep(160);
    const hover = await shot(page, "01-hover-sub3");
    report.notes.push({
      id: "01-peek",
      thumb: peek.firstThumb,
      by: peek.by,
      dx: peek.firstThumb && peek.by ? +(peek.firstThumb.x - peek.by.x).toFixed(1) : null,
      ratio: peek.firstThumb ? +(peek.firstThumb.w / peek.firstThumb.h).toFixed(3) : null,
      count: peek.thumbCount,
      viewMore: peek.viewMore,
      hoverDescriptor: hover.descriptor,
    });
    await click(page, ".hbw-mark-all");
    await page.waitForFunction(() => document.querySelector(".hbw-home.is-browse"));
    await sleep(500);
    await shot(page, "01-view-more");
    await page.close();
  }

  async function indexAt(w, h, prefix) {
    const page = await pageAt(w, h);
    await page.hover(".hbw-mark-by");
    await page.waitForSelector(".hbw-mark-all");
    await click(page, ".hbw-mark-all");
    await page.waitForFunction(() => document.querySelector(".hbw-home.is-browse"));
    await sleep(400);
    await click(page, 'button[aria-label="Index"]');
    await sleep(500);
    const closed = await shot(page, `${prefix}-closed`);
    await page.$eval('.hbw-browse__row[data-hbw-project="sub-3"] .hbw-browse__more', (el) => el.click());
    await sleep(220);
    const open = await shot(page, `${prefix}-open-sub3`);
    await page.$eval('.hbw-browse__row[data-hbw-project="koja"] .hbw-browse__more', (el) => el.click());
    await sleep(220);
    const swapped = await shot(page, `${prefix}-open-koja`);
    report.notes.push({
      id: prefix,
      width: w,
      table: closed.indexBox,
      row: closed.row,
      pad: closed.browsePad,
      rowPad: closed.rowPad,
      cols: closed.cols,
      oneNote: open.expanded && open.noteText,
      swapped: swapped.noteText,
      onlyOne: swapped.expanded && !open.noteText?.startsWith(swapped.noteText || "no"),
    });
    await page.close();
    return closed;
  }

  await indexAt(1440, 900, "02-index-1440");
  await indexAt(1366, 768, "02-index-1366");
  await indexAt(1728, 1117, "02-index-1728");

  {
    const page = await pageAt();
    await page.hover(".hbw-mark-by");
    await click(page, '[data-hbw-peek="sub-3"]');
    await page.waitForFunction(() => document.querySelector('.hbw-home.is-view[data-hbw-project="sub-3"] .hbw-project-view.is-active'));
    await sleep(700);
    const m01 = await shot(page, "03-m01");
    await page.$eval(".hbw-project-view.is-active .hbw-mv:nth-of-type(2)", (el) => el.click());
    await sleep(400);
    const m02 = await shot(page, "03-click-m02");
    await page.$eval(".hbw-project-view.is-active .hbw-mv:nth-of-type(1)", (el) => el.click());
    await sleep(400);
    const back = await shot(page, "03-click-m01");
    for (let i = 0; i < 11; i++) {
      await page.keyboard.press("ArrowRight");
      await sleep(180);
    }
    const m12 = await shot(page, "03-m12");
    await page.keyboard.press("ArrowRight");
    await sleep(600);
    const boundary = await shot(page, "03-boundary");
    await page.keyboard.press("ArrowLeft");
    await sleep(600);
    const reverse = await shot(page, "03-reverse");
    await page.keyboard.press("ArrowRight");
    await sleep(600);
    const again = await shot(page, "03-boundary-again");
    await page.$eval(".hbw-outro.is-next .hbw-outro__preview", (el) => el.click());
    await page.waitForFunction(() => document.querySelector('.hbw-home[data-hbw-project="koja"]'));
    await sleep(700);
    const koja = await shot(page, "03-owned-koja");
    await click(page, ".hbw-home-strip__exit");
    await page.waitForFunction(() => document.querySelector('.hbw-home[data-hbw-project="sub-3"]'));
    await sleep(700);
    const backSub3 = await shot(page, "03-close-sub3");
    await click(page, ".hbw-home-strip__exit");
    await page.waitForFunction(() => document.querySelector(".hbw-home.is-make"));
    await sleep(500);
    const home = await shot(page, "03-close-home");
    report.notes.push({
      id: "03-project",
      clickM02: { from: m01.viewIndex, to: m02.viewIndex },
      clickM01: back.viewIndex,
      m12: { x: m12.viewX, i: m12.viewIndex, preview: m12.previewIn },
      boundary: { x: boundary.viewX, i: boundary.viewIndex, preview: boundary.previewIn },
      reverse: { x: reverse.viewX, i: reverse.viewIndex, preview: reverse.previewIn },
      again: { x: again.viewX, preview: again.previewIn },
      kojaOwned: koja.path,
      closeToSub3: backSub3.path,
      closeToHome: home.path,
    });
    await page.close();
  }

  {
    const page = await pageAt();
    await page.hover(".hbw-mark-by");
    await click(page, ".hbw-mark-all");
    await page.waitForFunction(() => document.querySelector(".hbw-home.is-browse"));
    await sleep(400);
    await click(page, '[data-hbw-project="sub-3"]');
    await page.waitForFunction(() => document.querySelector(".hbw-project-view.is-active"));
    await sleep(700);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowRight");
      await sleep(220);
    }
    const before = await shot(page, "03-info-before");
    await click(page, ".hbw-nav-sub__face--info button");
    await sleep(600);
    await click(page, '[data-hbw-sheet-close="info"]');
    await sleep(700);
    const after = await shot(page, "03-info-after");
    report.notes.push({
      id: "03-info",
      beforeX: before.viewX,
      afterX: after.viewX,
      same: before.viewX === after.viewX && before.viewIndex === after.viewIndex,
    });
    await page.close();
  }

  for (const w of [375, 390, 430]) {
    const page = await pageAt(w, 812, true);
    await click(page, ".hbw-nav-projects__hit");
    await sleep(700);
    const browse = await shot(page, `m-${w}-projects`);
    await click(page, 'button[aria-label="Index"]');
    await sleep(400);
    const index = await shot(page, `m-${w}-index`);
    report.notes.push({
      id: `mobile-${w}`,
      visual: browse.home,
      indexHasMore: Boolean(index.moreLabel),
      indexRow: index.row,
    });
    await page.close();
  }

  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.notes, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
