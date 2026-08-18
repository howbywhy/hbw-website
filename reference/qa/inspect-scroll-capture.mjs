import { writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "reflow");
const BASE = "http://127.0.0.1:3000";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function clickSel(page, sel) {
  await page.waitForSelector(sel, { timeout: 8000 });
  await page.$eval(sel, (el) => el.click());
}

async function boot(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(900);
}

async function goToMovement(page, index) {
  for (let i = 0; i < index; i++) {
    await page.keyboard.press("ArrowRight");
    await sleep(320);
  }
  await sleep(200);
}

async function state(page) {
  return page.evaluate(() => {
    const view = document.querySelector(".hbw-project-view.is-active");
    const track = document.querySelector(".hbw-project-view__track");
    const t = track?.style.transform || "";
    const m = t.match(/translate3d\((-?[\d.]+)px/);
    return {
      homeClass: document.querySelector(".hbw-home")?.className || "",
      inspecting: document.querySelector(".hbw-home")?.classList.contains("is-inspect") || false,
      index: view?.getAttribute("data-hbw-index") || null,
      meta: document.querySelector(".hbw-nav-sub__meta")?.textContent?.replace(/\s+/g, " ").trim() || null,
      trackX: view?.getAttribute("data-hbw-track-x") || null,
      trackXInline: m ? Math.abs(Number(m[1])) : null,
      scrollTop: view ? Math.round(view.scrollTop) : null,
      scrollHeight: view ? view.scrollHeight : null,
      clientHeight: view ? view.clientHeight : null,
      overflowY: view ? getComputedStyle(view).overflowY : null,
      display: track ? getComputedStyle(track).display : null,
    };
  });
}

async function openInfo(page) {
  await clickSel(page, ".hbw-nav-sub__view button");
  await sleep(900);
}

async function closeInfo(page) {
  await clickSel(page, "[data-hbw-sheet-close='info']");
  await sleep(900);
}

async function scrollOverview(page, y) {
  return page.evaluate((top) => {
    const view = document.querySelector(".hbw-project-view.is-active");
    if (!view) return null;
    view.scrollTop = top;
    return Math.round(view.scrollTop);
  }, y);
}

async function runCase(page, name, { path, movements = 0, targetScroll }) {
  await boot(page, path);
  if (movements) await goToMovement(page, movements);
  const beforeView = await state(page);
  await openInfo(page);
  const opened = await state(page);
  const max = Math.max(0, (opened.scrollHeight || 0) - (opened.clientHeight || 0));
  const goal = Math.min(targetScroll, max);
  const setTo = await scrollOverview(page, goal);
  const afterSet = await state(page);
  await sleep(3000);
  const afterWait = await state(page);
  await page.mouse.click(200, 500);
  await sleep(400);
  const afterClick = await state(page);
  await closeInfo(page);
  const afterClose = await state(page);
  await openInfo(page);
  const reopened = await state(page);
  await closeInfo(page);
  const restoredView = await state(page);
  return {
    name,
    beforeView,
    opened,
    goal,
    setTo,
    afterSet,
    afterWait,
    afterClick,
    afterClose,
    reopened,
    restoredView,
    stableWhileOpen:
      afterSet.scrollTop === afterWait.scrollTop && afterWait.scrollTop === afterClick.scrollTop,
    reopenRestored: reopened.scrollTop === setTo,
    horizontalUnchanged:
      beforeView.trackXInline === afterClose.trackXInline &&
      beforeView.trackXInline === restoredView.trackXInline &&
      beforeView.index === afterClose.index &&
      beforeView.index === restoredView.index,
  };
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

  const sub3m01 = await runCase(page, "sub3-m01", { path: "/projects/sub-3", movements: 0, targetScroll: 1640 });
  const sub3m06 = await runCase(page, "sub3-m06", { path: "/projects/sub-3", movements: 5, targetScroll: 1640 });
  const chris = await runCase(page, "chris", { path: "/projects/chris-sisarich", movements: 0, targetScroll: 420 });

  await boot(page, "/projects/sub-3");
  await openInfo(page);
  const sub3Set = await scrollOverview(page, 1640);
  await closeInfo(page);
  await clickSel(page, ".hbw-home-strip__exit.is-on");
  await page.waitForSelector(".hbw-projects.is-open, .hbw-browse", { timeout: 8000 });
  await sleep(500);
  await page.evaluate(() => {
    document.querySelector('[data-hbw-project="chris-sisarich"]')?.scrollIntoView({ block: "center" });
  });
  await sleep(200);
  await clickSel(page, '[data-hbw-project="chris-sisarich"]');
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 15000 });
  await sleep(800);
  await openInfo(page);
  const chrisSet = await scrollOverview(page, 420);
  await closeInfo(page);
  await clickSel(page, ".hbw-home-strip__exit.is-on");
  await page.waitForSelector(".hbw-projects.is-open, .hbw-browse", { timeout: 8000 });
  await sleep(500);
  await page.evaluate(() => {
    document.querySelector('[data-hbw-project="sub-3"]')?.scrollIntoView({ block: "center" });
  });
  await sleep(200);
  await clickSel(page, '[data-hbw-project="sub-3"]');
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 15000 });
  await sleep(800);
  await openInfo(page);
  const sub3Back = await state(page);
  await closeInfo(page);
  await clickSel(page, ".hbw-home-strip__exit.is-on");
  await page.waitForSelector(".hbw-projects.is-open, .hbw-browse", { timeout: 8000 });
  await sleep(500);
  await page.evaluate(() => {
    document.querySelector('[data-hbw-project="chris-sisarich"]')?.scrollIntoView({ block: "center" });
  });
  await sleep(200);
  await clickSel(page, '[data-hbw-project="chris-sisarich"]');
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 15000 });
  await sleep(800);
  await openInfo(page);
  const chrisBack = await state(page);

  const report = {
    viewport: "1440x900",
    container: ".hbw-project-view.is-active",
    sub3m01,
    sub3m06,
    chris,
    perProject: {
      sub3Set,
      chrisSet,
      sub3Back: sub3Back.scrollTop,
      chrisBack: chrisBack.scrollTop,
      sub3Restored: sub3Back.scrollTop === sub3Set,
      chrisRestored: chrisBack.scrollTop === chrisSet,
      leaked: sub3Back.scrollTop === chrisSet,
    },
  };
  writeFileSync(join(OUT, "scroll-metrics.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
