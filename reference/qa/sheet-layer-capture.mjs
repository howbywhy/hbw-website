import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = require("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "sheets");
const BASE = "http://127.0.0.1:3000";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const COLLECT = `(() => {
  function box(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: Math.round(r.x * 10) / 10,
      y: Math.round(r.y * 10) / 10,
      w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10,
      z: cs.zIndex,
      position: cs.position,
      transform: cs.transform,
    };
  }
  function containingBlock(el) {
    if (!el) return null;
    let n = el.offsetParent || el.parentElement;
    const chain = [];
    let node = el.parentElement;
    while (node && node !== document.documentElement) {
      const s = getComputedStyle(node);
      const traps =
        (s.position !== "static" && s.position !== "static") ||
        s.transform !== "none" ||
        s.filter !== "none" ||
        s.perspective !== "none" ||
        s.contain.includes("paint") ||
        s.contain.includes("strict") ||
        s.willChange.includes("transform");
      chain.push({
        tag: node.tagName,
        className: typeof node.className === "string" ? node.className : "",
        position: s.position,
        transform: s.transform,
        isolation: s.isolation,
        overflow: s.overflow,
        z: s.zIndex,
        traps,
      });
      node = node.parentElement;
    }
    return {
      offsetParent: el.offsetParent
        ? {
            tag: el.offsetParent.tagName,
            className: typeof el.offsetParent.className === "string" ? el.offsetParent.className : "",
          }
        : null,
      chain,
    };
  }
  const view = document.querySelector(".hbw-project-view.is-active, .hbw-project-view");
  const track = document.querySelector(".hbw-project-view__track");
  const sheet = document.querySelector(".hbw-sheet.is-visible");
  const layer = document.querySelector(".hbw-sheet-layer");
  const close = document.querySelector("[data-hbw-sheet-close]");
  const home = document.querySelector(".hbw-home");
  const windowEl = document.querySelector(".hbw-window");
  const strip = document.querySelector(".hbw-home-strip");
  const cs = getComputedStyle(document.documentElement);
  const hits = [0, 2, 8, 20, 40, 56, 80].map((y) => {
    const el = document.elementFromPoint(1100, y);
    return {
      y,
      className: el ? (typeof el.className === "string" ? el.className : el.tagName) : null,
      sheet: !!(el && el.closest(".hbw-sheet")),
      close: !!(el && el.closest("[data-hbw-sheet-close]")),
      nav: !!(el && el.closest(".hbw-home-strip") && !el.closest("[data-hbw-sheet-close]")),
    };
  });
  return {
    homeClass: home?.className || "",
    meta: document.querySelector(".hbw-nav-sub__meta")?.textContent?.replace(/\\s+/g, " ").trim() || null,
    viewIndex: view?.getAttribute("data-hbw-index") || null,
    viewX: view?.getAttribute("data-hbw-track-x") || null,
    trackInline: track?.style.transform || "",
    trackDisplay: track ? getComputedStyle(track).display : null,
    trackTransform: track ? getComputedStyle(track).transform : null,
    viewBox: box(view),
    windowBox: box(windowEl),
    stripBox: box(strip),
    layer: box(layer),
    sheet: sheet
      ? {
          ...box(sheet),
          variant: sheet.getAttribute("data-hbw-sheet"),
          className: sheet.className,
          parent: sheet.parentElement?.className || null,
        }
      : null,
    close: close
      ? {
          ...box(close),
          id: close.getAttribute("data-hbw-sheet-close"),
          text: (close.textContent || "").replace(/\\s+/g, " ").trim(),
        }
      : null,
    containingBlock: containingBlock(sheet || layer),
    z: {
      layer: layer ? getComputedStyle(layer).zIndex : null,
      sheet: sheet ? getComputedStyle(sheet).zIndex : null,
      close: close ? getComputedStyle(close).zIndex : null,
      window: windowEl ? getComputedStyle(windowEl).zIndex : null,
      strip: strip ? getComputedStyle(strip).zIndex : null,
      studio: getComputedStyle(document.querySelector(".hbw-nav-studio") || document.body).zIndex,
    },
    hits,
    headerH: cs.getPropertyValue("--hbw-header-h").trim(),
    paddingTop: sheet ? getComputedStyle(sheet).paddingTop : null,
    contentStartY: (() => {
      const node = sheet?.querySelector(":scope > *");
      return node ? Math.round(node.getBoundingClientRect().y * 10) / 10 : null;
    })(),
    browse: {
      className: document.querySelector(".hbw-projects")?.className || null,
      open: document.querySelector(".hbw-projects")?.classList.contains("is-open") || false,
      opacity: document.querySelector(".hbw-projects")
        ? getComputedStyle(document.querySelector(".hbw-projects")).opacity
        : null,
      visibility: document.querySelector(".hbw-projects")
        ? getComputedStyle(document.querySelector(".hbw-projects")).visibility
        : null,
      titles: [...document.querySelectorAll(".hbw-browse__title")].map((el) => el.textContent.trim()),
    },
    mvCount: document.querySelectorAll(".hbw-project-view.is-active .hbw-mv").length,
    mvLabels: [...document.querySelectorAll(".hbw-project-view.is-active .hbw-mv")].map((el) =>
      el.getAttribute("aria-label")
    ),
    axes: {
      edge: cs.getPropertyValue("--hbw-edge").trim(),
      projects: cs.getPropertyValue("--hbw-x-projects").trim(),
      studio: cs.getPropertyValue("--hbw-x-studio").trim(),
    },
  };
})()`;

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
  await page.goto(`${BASE}/projects/sub-3`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(900);

  const report = [];

  async function shot(name) {
    const metrics = await page.evaluate(COLLECT);
    const file = join(OUT, `${name}.png`);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1440, height: 900 } });
    report.push({ name, file, metrics });
    return metrics;
  }

  async function clickSel(sel) {
    await page.waitForSelector(sel, { timeout: 8000 });
    await page.$eval(sel, (el) => el.click());
  }

  const view = await shot("01-sub3-view");
  await clickSel(".hbw-nav-sub__view button");
  await sleep(1200);
  const info = await shot("02-sub3-info");
  await clickSel("[data-hbw-sheet-close='info']");
  await sleep(700);

  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("ArrowRight");
    await sleep(280);
  }
  const m06Before = await shot("03-sub3-m06-view");
  await clickSel(".hbw-nav-sub__view button");
  await sleep(1200);
  const m06Info = await shot("04-sub3-m06-info");
  await clickSel("[data-hbw-sheet-close='info']");
  await sleep(700);
  const m06After = await shot("05-sub3-m06-after");

  await clickSel(".hbw-nav-studio");
  await sleep(700);
  const studio = await shot("06-sub3-studio");
  await clickSel(".hbw-sheet.is-visible .hbw-inspector__link, .hbw-sheet.is-visible .hbw-sheet__link");
  await sleep(700);
  const manifesto = await shot("07-sub3-manifesto");

  const out = {
    viewport: "1440x900",
    view,
    info,
    m06: { before: m06Before, info: m06Info, after: m06After },
    studio,
    manifesto,
  };
  writeFileSync(join(OUT, "metrics.json"), JSON.stringify(out, null, 2));
  const brief = {
    view: { meta: view.meta, index: view.viewIndex, x: view.viewX },
    info: {
      sheet: info.sheet && { x: info.sheet.x, y: info.sheet.y, w: info.sheet.w, h: info.sheet.h, z: info.sheet.z },
      close: info.close && { x: info.close.x, y: info.close.y, z: info.close.z, text: info.close.text },
      paddingTop: info.paddingTop,
      contentStartY: info.contentStartY,
      trackDisplay: info.trackDisplay,
      mvCount: info.mvCount,
      mvLabels: info.mvLabels,
      browse: info.browse,
    },
    m06: {
      before: { meta: m06Before.meta, index: m06Before.viewIndex, x: m06Before.viewX },
      info: {
        mvCount: m06Info.mvCount,
        mvLabels: m06Info.mvLabels,
        browse: m06Info.browse,
        contentStartY: m06Info.contentStartY,
        close: m06Info.close && { x: m06Info.close.x, y: m06Info.close.y },
      },
      after: { meta: m06After.meta, index: m06After.viewIndex, x: m06After.viewX },
    },
    studio: {
      sheet: studio.sheet && { x: studio.sheet.x, y: studio.sheet.y, w: studio.sheet.w, h: studio.sheet.h },
      close: studio.close && { x: studio.close.x, y: studio.close.y, text: studio.close.text },
      contentStartY: studio.contentStartY,
      trackDisplay: studio.trackDisplay,
    },
    manifesto: {
      sheet: manifesto.sheet && { x: manifesto.sheet.x, y: manifesto.sheet.y, w: manifesto.sheet.w, h: manifesto.sheet.h },
      close: manifesto.close && { x: manifesto.close.x, y: manifesto.close.y, text: manifesto.close.text },
      contentStartY: manifesto.contentStartY,
      trackDisplay: manifesto.trackDisplay,
    },
  };
  console.log(JSON.stringify(brief, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
