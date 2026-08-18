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

const PROBE = `(() => {
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
      pe: cs.pointerEvents,
      text: (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 24),
    };
  }
  const sheet = document.querySelector(".hbw-sheet.is-visible");
  const close = document.querySelector("[data-hbw-sheet-close]");
  const track = document.querySelector(".hbw-project-view__track");
  const view = document.querySelector(".hbw-project-view");
  const brand = document.querySelector(".hbw-home-strip__home");
  const exit = document.querySelector(".hbw-home-strip__exit");
  const studio = document.querySelector(".hbw-nav-studio");
  const time = document.querySelector(".hbw-home-strip__time");
  const sr = sheet?.getBoundingClientRect();
  const coveredX = sr ? Math.min(sr.left + 120, sr.right - 16) : 1100;
  const covered = document.elementFromPoint(coveredX, 22);
  const closeHit = close ? document.elementFromPoint(close.getBoundingClientRect().left + 8, close.getBoundingClientRect().top + 8) : null;
  return {
    home: document.querySelector(".hbw-home")?.className,
    meta: document.querySelector(".hbw-nav-sub__meta")?.textContent?.replace(/\\s+/g, " ").trim() || null,
    track: track?.style.transform || "",
    viewX: view?.getAttribute("data-hbw-track-x"),
    viewIndex: view?.getAttribute("data-hbw-index"),
    sheet: sheet ? { ...box(sheet), variant: sheet.getAttribute("data-hbw-sheet") } : null,
    close: close ? { ...box(close), id: close.getAttribute("data-hbw-sheet-close") } : null,
    studio: box(studio),
    brand: box(brand),
    exit: box(exit),
    time: box(time),
    closeOwns: !!(closeHit && close.contains(closeHit)),
    coveredClass: covered?.className || covered?.tagName || null,
    coveredIsSheet: !!(covered && (covered.closest(".hbw-sheet") || covered.closest("[data-hbw-sheet-close]"))),
    coveredIsNav: !!(covered && covered.closest(".hbw-home-strip") && !covered.closest("[data-hbw-sheet-close]")),
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

  async function run(name, size, fn) {
    const page = await browser.newPage();
    await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: 1, isMobile: !!size.mobile, hasTouch: !!size.mobile });
    if (size.mobile) await page.emulate({
      viewport: { width: size.w, height: size.h, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    }).catch(() => {});
    const log = [];
    async function probe(label) {
      const metrics = await page.evaluate(PROBE);
      log.push({ label, metrics });
      return metrics;
    }
    await fn(page, probe);
    await page.close();
    return { name, log };
  }

  async function click(page, sel) {
    await page.waitForSelector(sel, { timeout: 8000 });
    await page.$eval(sel, (el) => el.click());
  }

  const desktop = await run("desktop", { w: 1440, h: 900 }, async (page, probe) => {
    await page.goto(`${BASE}/studio`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hbw-sheet.is-visible", { timeout: 15000 });
    await sleep(600);
    await probe("home-studio");
    await click(page, ".hbw-sheet.is-visible .hbw-inspector__link, .hbw-sheet.is-visible .hbw-sheet__link");
    await sleep(500);
    await probe("home-manifesto");
    await click(page, "[data-hbw-sheet-close]");
    await sleep(700);
    await probe("home-after-manifesto-close");

    await page.goto(`${BASE}/projects/sub-3`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hbw-project-view.is-active", { timeout: 15000 });
    await sleep(800);
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowRight");
      await sleep(260);
    }
    const before = await probe("project-before");
    await click(page, ".hbw-nav-sub__view button");
    await sleep(700);
    await probe("project-info");
    await click(page, "[data-hbw-sheet-close='info']");
    await sleep(700);
    const afterInfo = await probe("project-after-info");
    await click(page, ".hbw-nav-studio");
    await sleep(700);
    await probe("project-studio");
    await click(page, "[data-hbw-sheet-close='studio']");
    await sleep(700);
    await probe("project-after-studio");
    await click(page, ".hbw-nav-studio");
    await sleep(500);
    await click(page, ".hbw-sheet.is-visible .hbw-inspector__link, .hbw-sheet.is-visible .hbw-sheet__link");
    await sleep(500);
    await probe("project-manifesto");
    await page.keyboard.press("Escape");
    await sleep(700);
    const afterEsc = await probe("project-after-escape");
    logNote(before, afterInfo, afterEsc);
  });

  function logNote() {}

  const mobile = await run("mobile", { w: 390, h: 844, mobile: true }, async (page, probe) => {
    await page.goto(`${BASE}/studio`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hbw-sheet.is-visible", { timeout: 15000 });
    await sleep(600);
    await probe("home-studio");
    await click(page, ".hbw-sheet.is-visible .hbw-inspector__link, .hbw-sheet.is-visible .hbw-sheet__link");
    await sleep(500);
    await probe("home-manifesto");
    await click(page, "[data-hbw-sheet-close]");
    await sleep(700);
    await probe("home-after-close");
    await page.goto(`${BASE}/projects/sub-3`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hbw-project-view.is-active", { timeout: 15000 });
    await sleep(900);
    await page.$eval(".hbw-project-view", (el) => {
      el.scrollTop = Math.min(el.scrollHeight, 420);
    });
    await sleep(200);
    const before = await probe("project-before");
    await click(page, ".hbw-nav-sub__view button");
    await sleep(700);
    await probe("project-info");
    await click(page, "[data-hbw-sheet-close='info']");
    await sleep(700);
    await probe("project-after-info");
    void before;
  });

  const out = { desktop, mobile };
  writeFileSync(join(OUT, "close-ownership.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
