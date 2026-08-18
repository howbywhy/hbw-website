import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "origin-pass");
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
  const view = document.querySelector(".hbw-project-view.is-active");
  const projects = document.querySelector(".hbw-projects");
  const field = document.querySelector(".hbw-poster-field");
  const cell = document.querySelector('[data-hbw-project="sub-3"]');
  const title = cell?.querySelector(".hbw-browse__title");
  const idea = cell?.querySelector(".hbw-browse__position");
  const current = view?.querySelector(".hbw-mv.is-current");
  return {
    path: location.pathname + location.search,
    home: home?.className || null,
    origin: home?.getAttribute("data-hbw-origin") || "none",
    browse: home?.getAttribute("data-hbw-browse") || null,
    identity: document.querySelector(".hbw-home-strip__mark")?.innerText.replace(/\\s+/g, " ").trim() || null,
    suffix: document.querySelector(".hbw-mark-context")?.textContent?.trim() || null,
    panel: !!document.querySelector(".hbw-sheet.is-visible"),
    manifesto: home?.classList.contains("is-manifesto") || false,
    studio: home?.classList.contains("is-studio") || false,
    inspect: home?.classList.contains("is-inspect") || false,
    viewX: view ? Number(view.getAttribute("data-hbw-track-x") || 0) : null,
    viewIndex: view ? Number(view.getAttribute("data-hbw-index") || 0) : null,
    viewBox: box(view),
    currentBox: box(current),
    track: view?.querySelector(".hbw-project-view__track")?.style.transform || null,
    browseScroll: projects ? Math.round(projects.scrollTop) : null,
    browseMode: projects?.classList.contains("is-index") ? "index" : projects?.classList.contains("is-visual") ? "visual" : null,
    fieldClass: field?.className || null,
    fieldCursor: field ? getComputedStyle(field.querySelector("canvas") || field).cursor : null,
    titleDisplay: title ? getComputedStyle(title).display : null,
    ideaOpacity: idea ? getComputedStyle(idea).opacity : null,
    ideaText: idea?.textContent?.trim() || null,
    cellTitle: title?.textContent?.trim() || null,
  };
})()`;

function diffKeys(before, after, keys) {
  const diffs = [];
  for (const key of keys) {
    if (JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])) {
      diffs.push({ key, before: before?.[key], after: after?.[key] });
    }
  }
  return diffs;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = { checks: [], notes: [] };
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--window-size=1440,900", "--hide-scrollbars"],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });

  async function freshPage(mobile = false) {
    const page = await browser.newPage();
    if (mobile) {
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    } else {
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    }
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await page.evaluateOnNewDocument(() => {
      try {
        sessionStorage.setItem("hbw.entered.v2", "1");
        sessionStorage.removeItem("hbw.origin.v1");
      } catch {
        /* ignore */
      }
    });
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.addStyleTag({
      content: "nextjs-portal,[data-next-badge-root],[data-nextjs-toast],#nextjs-dev-indicator{display:none!important}",
    });
    await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 8000 });
    await sleep(350);
    return page;
  }

  async function measure(page) {
    return page.evaluate(MEASURE);
  }

  async function shot(page, name, extra) {
    await page.screenshot({ path: join(OUT, `${name}.png`) });
    const metrics = await measure(page);
    report.checks.push({ name, ...extra, metrics });
    return metrics;
  }

  async function waitView(page, slug) {
    await page.waitForFunction(
      (id) => document.querySelector(`.hbw-home.is-view[data-hbw-project="${id}"] .hbw-project-view.is-active`),
      { timeout: 12000 },
      slug
    );
    await sleep(700);
  }

  async function waitBrowse(page) {
    await page.waitForFunction(() => document.querySelector(".hbw-home.is-browse"), { timeout: 12000 });
    await sleep(700);
  }

  async function waitMake(page) {
    await page.waitForFunction(() => document.querySelector(".hbw-home.is-make") && !document.querySelector(".hbw-home.is-view"), {
      timeout: 12000,
    });
    await sleep(700);
  }

  async function click(page, sel) {
    await page.waitForSelector(sel, { timeout: 8000 });
    await page.$eval(sel, (el) => el.click());
  }

  async function openProjects(page) {
    await page.hover(".hbw-mark-by");
    await page.waitForSelector(".hbw-nav-peek.is-open, .hbw-mark-all", { timeout: 8000 });
    await sleep(200);
    await click(page, ".hbw-mark-all");
    await waitBrowse(page);
  }

  // 05 — Make field teach
  {
    const page = await freshPage();
    await page.hover('.hbw-poster-tool[aria-label="Write"]');
    await sleep(120);
    const hoverWrite = await shot(page, "05-hover-write");
    await click(page, '.hbw-poster-tool[aria-label="Write"]');
    await sleep(180);
    const afterWrite = await shot(page, "05-click-write");
    await page.hover('.hbw-poster-tool[aria-label="Draw"]');
    await sleep(80);
    await click(page, '.hbw-poster-tool[aria-label="Draw"]');
    await sleep(180);
    const afterDraw = await shot(page, "05-click-draw");
    let chooserOpened = false;
    const chooserWait = page.waitForFileChooser({ timeout: 2500 }).then((chooser) => {
      chooserOpened = true;
      return chooser.cancel().catch(() => {});
    });
    await click(page, '.hbw-poster-tool[aria-label="Add"]');
    await chooserWait.catch(() => {});
    await sleep(200);
    const afterAdd = await shot(page, "05-click-add", { chooserOpened });
    report.notes.push({
      id: "05-make-teach",
      hoverWriteArmed: /is-write/.test(hoverWrite.fieldClass || "") && /is-armed/.test(hoverWrite.fieldClass || ""),
      hoverWriteCursor: hoverWrite.fieldCursor,
      writeSelected: /is-write/.test(afterWrite.fieldClass || "") && !/is-armed/.test(afterWrite.fieldClass || ""),
      drawSelected: /is-draw/.test(afterDraw.fieldClass || ""),
      addChooser: chooserOpened,
      addFamily: afterAdd.fieldClass,
    });
    await page.close();
  }

  // 01 — Visual hover identity
  {
    const page = await freshPage();
    await openProjects(page);
    const rest = await shot(page, "01-visual-rest");
    const cell = await page.waitForSelector('[data-hbw-project="sub-3"]', { timeout: 8000 });
    await cell.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await cell.hover();
    await sleep(220);
    const hover = await shot(page, "01-visual-hover-sub3");
    await page.mouse.move(20, 20);
    await sleep(220);
    const leave = await shot(page, "01-visual-leave");
    report.notes.push({
      id: "01-visual-hover",
      restSuffix: rest.suffix,
      hoverSuffix: hover.suffix,
      hoverIdentity: hover.identity,
      hoverIdea: hover.ideaText,
      hoverIdeaOpacity: hover.ideaOpacity,
      titleHiddenOnHover: hover.titleDisplay === "none",
      leaveSuffix: leave.suffix,
      scrollUnchanged: rest.browseScroll === hover.browseScroll && hover.browseScroll === leave.browseScroll,
      pathUnchanged: rest.path === hover.path && hover.path === leave.path,
    });
    await page.close();
  }

  // Home → by preview → project → Close → Home
  {
    const page = await freshPage();
    const before = await shot(page, "02-home-before");
    await page.hover(".hbw-mark-by");
    await page.waitForSelector('[data-hbw-peek="sub-3"]', { timeout: 8000 });
    await sleep(180);
    await click(page, '[data-hbw-peek="sub-3"]');
    await waitView(page, "sub-3");
    await shot(page, "02-home-sub3");
    await click(page, ".hbw-home-strip__exit");
    await waitMake(page);
    const after = await shot(page, "02-home-close");
    report.notes.push({
      id: "02-home-close",
      diffs: diffKeys(before, after, ["path", "home", "origin", "suffix", "browseScroll"]),
      returnedHome: after.path === "/" && /is-make/.test(after.home || ""),
      originAfter: after.origin,
    });
    await page.close();
  }

  // Home → by → View more → Projects
  {
    const page = await freshPage();
    await openProjects(page);
    const projects = await shot(page, "02-view-more-projects");
    report.notes.push({
      id: "02-view-more",
      browse: /is-browse/.test(projects.home || ""),
      suffix: projects.suffix,
      path: projects.path,
    });
    await page.close();
  }

  // Projects Visual → SUB:3 → Close → exact Projects position
  {
    const page = await freshPage();
    await openProjects(page);
    await page.$eval(".hbw-projects", (el) => {
      el.scrollTop = 420;
    });
    await sleep(120);
    const before = await shot(page, "02a-visual-before");
    await click(page, '[data-hbw-project="sub-3"]');
    await waitView(page, "sub-3");
    await shot(page, "02a-visual-sub3");
    await click(page, ".hbw-home-strip__exit");
    await waitBrowse(page);
    const after = await shot(page, "02a-visual-close");
    report.notes.push({
      id: "02a-visual-restore",
      beforeScroll: before.browseScroll,
      afterScroll: after.browseScroll,
      mode: after.browseMode,
      origin: after.origin,
      diffs: diffKeys(before, after, ["browseScroll", "browseMode", "path", "suffix"]),
    });
    await page.close();
  }

  // Projects Index → SUB:3 → Close → exact Index position
  {
    const page = await freshPage();
    await openProjects(page);
    await click(page, 'button[aria-label="Index"]');
    await sleep(500);
    await page.$eval(".hbw-projects", (el) => {
      el.scrollTop = 180;
    });
    await sleep(120);
    const before = await shot(page, "02b-index-before");
    await click(page, '[data-hbw-project="sub-3"]');
    await waitView(page, "sub-3");
    await shot(page, "02b-index-sub3");
    await click(page, ".hbw-home-strip__exit");
    await waitBrowse(page);
    const after = await shot(page, "02b-index-close");
    report.notes.push({
      id: "02b-index-restore",
      beforeScroll: before.browseScroll,
      afterScroll: after.browseScroll,
      mode: after.browseMode,
      diffs: diffKeys(before, after, ["browseScroll", "browseMode", "path"]),
    });
    await page.close();
  }

  // Projects → SUB:3 → Info → Close Info
  {
    const page = await freshPage();
    await openProjects(page);
    await click(page, '[data-hbw-project="sub-3"]');
    await waitView(page, "sub-3");
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowRight");
      await sleep(280);
    }
    const before = await shot(page, "03-info-before");
    await click(page, ".hbw-nav-sub__face--info button");
    await sleep(700);
    await shot(page, "03-info-open");
    await click(page, '[data-hbw-sheet-close="info"]');
    await sleep(800);
    const after = await shot(page, "03-info-close");
    report.notes.push({
      id: "03-info-restore",
      beforeX: before.viewX,
      afterX: after.viewX,
      beforeIndex: before.viewIndex,
      afterIndex: after.viewIndex,
      currentDiff: diffKeys(before, after, ["viewX", "viewIndex", "track", "currentBox"]),
    });
    await page.close();
  }

  // Projects → SUB:3 → KOJA → Close → SUB:3 → Close → Projects
  {
    const page = await freshPage();
    await openProjects(page);
    await page.$eval(".hbw-projects", (el) => {
      el.scrollTop = 260;
    });
    await sleep(80);
    const projectsBefore = await shot(page, "02c-projects-before");
    await click(page, '[data-hbw-project="sub-3"]');
    await waitView(page, "sub-3");
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press("ArrowRight");
      await sleep(160);
    }
    await sleep(400);
    const sub3Boundary = await shot(page, "02c-sub3-boundary");
    await page.$eval(".hbw-outro.is-next .hbw-outro__preview", (el) => el.click());
    await waitView(page, "koja");
    await shot(page, "02c-koja");
    await click(page, ".hbw-home-strip__exit");
    await waitView(page, "sub-3");
    const backSub3 = await shot(page, "02c-close-to-sub3");
    await click(page, ".hbw-home-strip__exit");
    await waitBrowse(page);
    const backProjects = await shot(page, "02c-close-to-projects");
    report.notes.push({
      id: "02c-projects-continuation",
      closeToSub3: backSub3.path.includes("sub-3"),
      sub3X: { before: sub3Boundary.viewX, after: backSub3.viewX, indexBefore: sub3Boundary.viewIndex, indexAfter: backSub3.viewIndex },
      closeToProjects: /is-browse/.test(backProjects.home || ""),
      projectsScroll: { before: projectsBefore.browseScroll, after: backProjects.browseScroll },
    });
    await page.close();
  }

  // Home → SUB:3 → KOJA → Close → SUB:3 → Close → Home
  {
    const page = await freshPage();
    await page.hover(".hbw-mark-by");
    await page.waitForSelector('[data-hbw-peek="sub-3"]', { timeout: 8000 });
    await click(page, '[data-hbw-peek="sub-3"]');
    await waitView(page, "sub-3");
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press("ArrowRight");
      await sleep(160);
    }
    await sleep(400);
    await page.$eval(".hbw-outro.is-next .hbw-outro__preview", (el) => el.click());
    await waitView(page, "koja");
    await shot(page, "02d-koja-from-home");
    await click(page, ".hbw-home-strip__exit");
    await waitView(page, "sub-3");
    const backSub3 = await shot(page, "02d-close-to-sub3");
    await click(page, ".hbw-home-strip__exit");
    await waitMake(page);
    const home = await shot(page, "02d-close-to-home");
    report.notes.push({
      id: "02d-home-continuation",
      closeToSub3: backSub3.path.includes("sub-3"),
      closeToHome: /is-make/.test(home.home || "") && home.path === "/",
      originHome: home.origin,
    });
    await page.close();
  }

  // SUB:3 M12 → Info → KOJA boundary → reverse
  {
    const page = await freshPage();
    await openProjects(page);
    await click(page, '[data-hbw-project="sub-3"]');
    await waitView(page, "sub-3");
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("ArrowRight");
      await sleep(180);
    }
    const atM12 = await shot(page, "03-m12");
    await click(page, ".hbw-nav-sub__face--info button");
    await sleep(700);
    await shot(page, "03-m12-info");
    await page.keyboard.press("ArrowRight");
    await sleep(900);
    const boundary = await shot(page, "03-m12-boundary");
    await page.keyboard.press("ArrowLeft");
    await sleep(500);
    const reversed = await shot(page, "03-m12-reverse");
    report.notes.push({
      id: "03-m12-info-boundary",
      m12: { x: atM12.viewX, index: atM12.viewIndex },
      infoClosedOnAdvance: boundary.inspect === false,
      stillSub3: boundary.path.includes("sub-3"),
      boundary: { x: boundary.viewX, index: boundary.viewIndex },
      reversed: { x: reversed.viewX, index: reversed.viewIndex },
    });
    await page.close();
  }

  // Practice → Manifesto → Back → Practice → Close → Home
  {
    const page = await freshPage();
    await click(page, ".hbw-mark-why");
    await sleep(700);
    const practice = await shot(page, "06-practice");
    await click(page, ".hbw-sheet.is-visible .hbw-inspector__link");
    await sleep(600);
    const manifesto = await shot(page, "06-manifesto");
    await click(page, '[data-hbw-sheet-close="manifesto"]');
    await sleep(700);
    const backPractice = await shot(page, "06-back-practice");
    await click(page, '[data-hbw-sheet-close="studio"]');
    await sleep(700);
    const home = await shot(page, "06-practice-close-home");
    report.notes.push({
      id: "06-practice-manifesto",
      practiceOpen: practice.studio,
      manifestoOpen: manifesto.manifesto,
      backKeepsPractice: backPractice.studio && !backPractice.manifesto,
      closeToHome: /is-make/.test(home.home || "") && !home.studio,
    });
    await page.close();
  }

  // Mobile: Home → project → Close, and Projects → project → Close
  {
    const page = await freshPage(true);
    await page.hover(".hbw-mark-by").catch(() => {});
    await click(page, ".hbw-mark-by");
    await sleep(400);
    const peek = await page.$('[data-hbw-peek="sub-3"]');
    if (peek) {
      await peek.click();
      await waitView(page, "sub-3");
      await shot(page, "m-home-sub3");
      await click(page, ".hbw-home-strip__exit");
      await waitMake(page).catch(() => sleep(800));
      const home = await shot(page, "m-home-close");
      report.notes.push({
        id: "mobile-home-close",
        returnedHome: /is-make/.test(home.home || ""),
        path: home.path,
      });
    } else {
      report.notes.push({ id: "mobile-home-close", skipped: "peek not present on mobile tap" });
    }
    await page.close();
  }

  {
    const page = await freshPage(true);
    await click(page, ".hbw-nav-projects__hit");
    await waitBrowse(page).catch(() => sleep(800));
    const before = await shot(page, "m-projects-before");
    const cell = await page.$('[data-hbw-project="sub-3"]');
    if (cell) {
      await cell.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await cell.click();
      await waitView(page, "sub-3");
      await shot(page, "m-projects-sub3");
      await click(page, ".hbw-home-strip__exit");
      await waitBrowse(page).catch(() => sleep(800));
      const after = await shot(page, "m-projects-close");
      report.notes.push({
        id: "mobile-projects-close",
        beforeScroll: before.browseScroll,
        afterScroll: after.browseScroll,
        returnedBrowse: /is-browse/.test(after.home || ""),
        titleStillShown: after.titleDisplay !== "none",
      });
    } else {
      report.notes.push({ id: "mobile-projects-close", skipped: "sub-3 cell missing" });
    }
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
