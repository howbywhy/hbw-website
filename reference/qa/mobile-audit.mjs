import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "mobile-audit");
const BASE = "http://127.0.0.1:3000";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const SIZES = [
  { w: 375, h: 812, name: "375x812" },
  { w: 390, h: 844, name: "390x844" },
  { w: 393, h: 852, name: "393x852" },
  { w: 430, h: 932, name: "430x932" },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const GEOM = `(() => {
  function box(node) {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    const cs = getComputedStyle(node);
    return {
      x: Math.round(r.x * 10) / 10,
      y: Math.round(r.y * 10) / 10,
      w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10,
      cx: Math.round((r.x + r.width / 2) * 10) / 10,
      right: Math.round(r.right * 10) / 10,
      bottom: Math.round(r.bottom * 10) / 10,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      opacity: Number(cs.opacity).toFixed(2),
      touchAction: cs.touchAction,
      text: (node.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 80),
    };
  }
  const mark = document.querySelector(".hbw-home-strip__mark");
  const toolbar = document.querySelector(".hbw-poster-toolbar");
  const tools = [...document.querySelectorAll(".hbw-poster-toolbar__primary .hbw-poster-tool")].map(box);
  const hits = {
    how: box(document.querySelector(".hbw-mark-how")),
    by: box(document.querySelector(".hbw-mark-by")),
    why: box(document.querySelector(".hbw-mark-why")),
    write: tools[0],
    draw: tools[1],
    add: tools[2],
    send: box(document.querySelector(".hbw-poster-send-open")),
    email: box(document.querySelector(".hbw-poster-input")),
    close: box(document.querySelector(".hbw-home-strip__exit")),
    info: box([...document.querySelectorAll(".hbw-nav-sub__view button")].find((el) => el.textContent.trim() === "Info") || null),
    projectsClose: box(document.querySelector(".hbw-nav-projects__hit")),
  };
  const vv = window.visualViewport;
  return {
    viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
    visualViewport: vv ? { w: vv.width, h: vv.height, offsetTop: vv.offsetTop, offsetLeft: vv.offsetLeft, scale: vv.scale } : null,
    overflow: {
      body: document.documentElement.scrollWidth > innerWidth + 1,
      scrollW: document.documentElement.scrollWidth,
      scrollH: document.documentElement.scrollHeight,
    },
    home: document.querySelector(".hbw-home")?.className,
    mark: { ...box(mark), assembled: mark?.classList.contains("is-assembled"), text: mark?.innerText.replace(/\\s+/g, " ").trim() },
    how: box(document.querySelector(".hbw-mark-how .hbw-mark-word--rest")),
    by: box(document.querySelector(".hbw-mark-by .hbw-mark-word--rest")),
    why: box(document.querySelector(".hbw-mark-why .hbw-mark-word--rest")),
    suffix: box(document.querySelector(".hbw-mark-suffix")),
    toolbar: toolbar ? {
      ...box(toolbar),
      display: getComputedStyle(toolbar).display,
      flexDirection: getComputedStyle(toolbar).flexDirection,
      transform: getComputedStyle(toolbar).transform,
      bottom: getComputedStyle(toolbar).bottom,
      left: getComputedStyle(toolbar).left,
      right: getComputedStyle(toolbar).right,
      widthCss: getComputedStyle(toolbar).width,
      children: [...toolbar.children].map((el) => el.className + ":" + Math.round(el.getBoundingClientRect().width)),
    } : null,
    canvas: box(document.querySelector(".hbw-poster-field canvas")),
    field: box(document.querySelector(".hbw-poster-field")),
    hits,
    hitShort: Object.fromEntries(Object.entries(hits).map(([k, v]) => [k, v ? { w: v.w, h: v.h, x: v.x, y: v.y } : null])),
    emailFont: document.querySelector(".hbw-poster-input") ? getComputedStyle(document.querySelector(".hbw-poster-input")).fontSize : null,
  };
})()`;

async function launch(w, h, landscape = false) {
  const width = landscape ? h : w;
  const height = landscape ? w : h;
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [`--window-size=${width},${height}`, "--hide-scrollbars"],
    defaultViewport: { width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
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
  await sleep(200);
}

async function tap(page, sel) {
  const el = await page.$(sel);
  if (!el) throw new Error("missing " + sel);
  const box = await el.boundingBox();
  if (!box) throw new Error("no box " + sel);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

async function auditSize(size) {
  const browser = await launch(size.w, size.h);
  const page = await browser.newPage();
  await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await gotoEntered(page, "/");
  const make = await page.evaluate(GEOM);
  await page.screenshot({ path: join(OUT, `${size.name}-make.png`) });

  const problems = [];
  if (make.overflow.body) problems.push("document overflow-x");
  if (make.hits.write && make.hits.write.w > size.w * 0.28) problems.push("Write is stretched toward full-width (" + make.hits.write.w + "px)");
  if (make.toolbar && make.toolbar.flexDirection === "column") problems.push("toolbar stacked column, not one centred instrument");
  if (make.hits.email && make.toolbar && make.hits.email.y < make.hits.write.y) problems.push("email row is above Write/Draw/Add");
  for (const [k, v] of Object.entries(make.hitShort)) {
    if (!v) continue;
    if (v.h < 40 && k !== "info" && k !== "close" && k !== "projectsClose") problems.push(k + " hit height " + v.h);
  }
  if (make.emailFont !== "16px") problems.push("email font is " + make.emailFont + " not 16px");

  // keyboard simulation: shrink visual area via inline style like current liftToolbar
  await page.evaluate((kb) => {
    const toolbar = document.querySelector(".hbw-poster-toolbar");
    const vvH = window.innerHeight - kb;
    const inset = Math.max(0, window.innerHeight - vvH);
    if (toolbar) toolbar.style.bottom = inset > 40 ? inset + "px" : "";
    document.documentElement.style.setProperty("--hbw-vv-inset", inset + "px");
  }, 336);
  const kb = await page.evaluate(GEOM);
  await page.screenshot({ path: join(OUT, `${size.name}-keyboard.png`) });
  if (kb.toolbar && kb.toolbar.bottom > kb.viewport.h - 80) problems.push("toolbar still near physical bottom with keyboard inset");
  if (kb.hits.send && kb.hits.send.bottom > kb.viewport.h - 336 + 8) {
    /* send below keyboard */
  }
  const sendCovered = kb.hits.send && kb.hits.send.bottom > size.h - 336;
  if (sendCovered) problems.push("Send covered by simulated keyboard");

  // identity assembled
  await page.evaluate(() => {
    document.querySelector(".hbw-poster-toolbar").style.bottom = "";
  });
  await tap(page, ".hbw-mark-by");
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), { timeout: 5000 });
  await sleep(400);
  const projects = await page.evaluate(GEOM);
  await page.screenshot({ path: join(OUT, `${size.name}-projects.png`) });
  if (projects.mark && projects.mark.right > size.w - 8) problems.push("assembled Projects identity overflows");

  await page.waitForSelector('[data-hbw-project="sub-3"]', { timeout: 8000 });
  await tap(page, '[data-hbw-project="sub-3"]');
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(700);
  const view = await page.evaluate(GEOM);
  await page.screenshot({ path: join(OUT, `${size.name}-project.png`) });
  if (view.mark && view.suffix && view.hits.info) {
    if (view.suffix.right > view.hits.info.x - 4 && view.hits.info.x > 0) problems.push("assembled identity collides with Info");
  }
  if (view.mark && view.mark.right > size.w - 40) problems.push("assembled project identity overflows at " + size.name);

  const viewExtra = await page.evaluate(() => {
    const stage = document.querySelector(".hbw-project-view.is-active");
    const track = document.querySelector(".hbw-project-view__track");
    const info = [...document.querySelectorAll(".hbw-nav-sub__view button")].find((el) => el.textContent.trim() === "Info");
    const meta = document.querySelector(".hbw-nav-sub__meta");
    const close = document.querySelector(".hbw-home-strip__exit");
    const cs = stage ? getComputedStyle(stage) : null;
    return {
      overflow: stage ? getComputedStyle(stage).overflow : null,
      touchAction: stage ? getComputedStyle(stage).touchAction : null,
      trackTransform: track ? getComputedStyle(track).transform : null,
      info: info ? info.getBoundingClientRect().toJSON() : null,
      meta: meta ? meta.textContent.trim() : null,
      close: close ? { ...close.getBoundingClientRect().toJSON(), on: close.classList.contains("is-on") } : null,
      bodyOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });

  const infoBtn = await page.evaluate(() => {
    const el = [...document.querySelectorAll(".hbw-nav-sub__view button")].find((b) => b.textContent.trim() === "Info");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, h: r.height, w: r.width };
  });
  if (infoBtn) {
    await page.touchscreen.tap(infoBtn.x, infoBtn.y);
    await sleep(500);
  }
  const inspect = await page.evaluate(() => ({
    inspect: document.querySelector(".hbw-home")?.classList.contains("is-inspect"),
    sheet: document.querySelector(".hbw-sheet")?.getBoundingClientRect().toJSON() || null,
    sheetOverflow: document.querySelector(".hbw-sheet") ? getComputedStyle(document.querySelector(".hbw-sheet")).overflowY : null,
    bodyScroll: document.documentElement.scrollWidth > innerWidth + 1,
  }));
  await page.screenshot({ path: join(OUT, `${size.name}-info.png`) });

  await browser.close();
  return { size: size.name, problems, make, kb, projects, view, viewExtra, inspect };
}

async function auditWriteDraw(size) {
  const browser = await launch(size.w, size.h);
  const page = await browser.newPage();
  await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await gotoEntered(page, "/");
  const notes = [];

  await tap(page, '.hbw-poster-tool[aria-label="Write"]');
  await sleep(120);
  const writeOn = await page.evaluate(() => document.querySelector(".hbw-poster-field")?.getAttribute("data-hbw-family"));
  const canvas = await page.evaluate(() => {
    const r = document.querySelector(".hbw-poster-field canvas").getBoundingClientRect();
    return { x: r.x + r.width * 0.4, y: r.y + r.height * 0.35, touchAction: getComputedStyle(document.querySelector(".hbw-poster-field canvas")).touchAction };
  });
  await page.touchscreen.tap(canvas.x, canvas.y);
  await sleep(250);
  const afterTap = await page.evaluate(() => {
    const ta = document.querySelector(".hbw-poster-edit");
    return {
      family: document.querySelector(".hbw-poster-field")?.getAttribute("data-hbw-family"),
      textarea: ta ? { exists: true, focused: document.activeElement === ta, value: ta.value, fontSize: getComputedStyle(ta).fontSize } : { exists: false },
      objects: document.querySelector(".hbw-poster-field canvas") ? true : false,
    };
  });
  if (!afterTap.textarea.exists) notes.push("Write + canvas tap did not open textarea");
  if (afterTap.textarea.exists && !afterTap.textarea.focused) notes.push("textarea exists but is not focused");

  if (afterTap.textarea.exists) {
    await page.type(".hbw-poster-edit", "Clarity", { delay: 20 });
    await page.keyboard.press("Enter");
    await page.type(".hbw-poster-edit", "for brands", { delay: 20 });
    const typed = await page.evaluate(() => document.querySelector(".hbw-poster-edit")?.value);
    if (typed !== "Clarity\\nfor brands" && typed !== "Clarity\nfor brands") notes.push("typed text mismatch: " + JSON.stringify(typed));
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    const afterBs = await page.evaluate(() => document.querySelector(".hbw-poster-edit")?.value);
    notes.push("after backspace: " + JSON.stringify(afterBs));
    await page.touchscreen.tap(20, 200);
    await sleep(200);
    const afterAway = await page.evaluate(() => ({
      ta: Boolean(document.querySelector(".hbw-poster-edit")),
      family: document.querySelector(".hbw-poster-field")?.getAttribute("data-hbw-family"),
    }));
    notes.push("tap away: " + JSON.stringify(afterAway));
  }

  await tap(page, '.hbw-poster-tool[aria-label="Draw"]');
  await sleep(80);
  const drawState = await page.evaluate(() => ({
    family: document.querySelector(".hbw-poster-field")?.getAttribute("data-hbw-family"),
    touchAction: getComputedStyle(document.querySelector(".hbw-poster-field canvas")).touchAction,
  }));
  const field = await page.evaluate(() => {
    const r = document.querySelector(".hbw-poster-field canvas").getBoundingClientRect();
    return { x: r.x + 80, y: r.y + 160, x2: r.x + 180, y2: r.y + 220 };
  });
  await page.touchscreen.touchStart(field.x, field.y);
  await page.touchscreen.touchMove(field.x2, field.y2);
  await page.touchscreen.touchEnd();
  await sleep(80);
  const afterDraw = await page.evaluate(() => document.querySelector(".hbw-poster-field")?.getAttribute("data-hbw-family"));

  await page.focus(".hbw-poster-input");
  await page.type(".hbw-poster-input", "not-an-email", { delay: 10 });
  await tap(page, ".hbw-poster-send-open");
  await sleep(150);
  const sendInvalid = await page.evaluate(() => document.querySelector(".hbw-poster-send-status")?.textContent || document.querySelector(".hbw-poster-input")?.className);

  await browser.close();
  return { writeOn, canvas, afterTap, drawState, afterDraw, sendInvalid, notes };
}

async function auditLandscape() {
  const browser = await launch(390, 844, true);
  const page = await browser.newPage();
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await gotoEntered(page, "/");
  const make = await page.evaluate(GEOM);
  await page.screenshot({ path: join(OUT, "landscape-make.png") });
  const cover = make.toolbar && make.field ? make.toolbar.h / make.field.h : null;
  await browser.close();
  return {
    overflow: make.overflow,
    toolbarH: make.toolbar?.h,
    fieldH: make.field?.h,
    coverRatio: cover,
    how: make.how,
    by: make.by,
    why: make.why,
  };
}

async function auditDesktopRegression() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--window-size=1440,900", "--hide-scrollbars"],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  await gotoEntered(page, "/");
  const make = await page.evaluate(GEOM);
  await page.screenshot({ path: join(OUT, "desktop-make.png") });
  await browser.close();
  return {
    howX: make.how?.x,
    byCx: make.by?.cx,
    whyRight: make.why?.right,
    toolbar: make.toolbar && { x: make.toolbar.x, y: make.toolbar.y, w: make.toolbar.w, h: make.toolbar.h, cx: make.toolbar.cx },
    emailFont: make.emailFont,
  };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const sizes = [];
  for (const size of SIZES) sizes.push(await auditSize(size));
  const interaction = await auditWriteDraw(SIZES[0]);
  const landscape = await auditLandscape();
  const desktop = await auditDesktopRegression();
  const report = { sizes, interaction, landscape, desktop };
  writeFileSync(join(OUT, "audit.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    problems: sizes.map((s) => ({ size: s.size, problems: s.problems, writeW: s.make.hits.write?.w, toolbar: { w: s.make.toolbar?.w, h: s.make.toolbar?.h, y: s.make.toolbar?.y, flex: s.make.toolbar?.flexDirection, children: s.make.toolbar?.children }, hits: s.make.hitShort, emailFont: s.make.emailFont, identity: { how: s.make.how?.x, by: s.make.by?.cx, why: s.make.why?.right, assembled: s.projects.mark?.text, project: s.view.mark?.text, collide: s.view.suffix && s.view.hits.info } })),
    interaction: { writeOn: interaction.writeOn, afterTap: interaction.afterTap, notes: interaction.notes, draw: interaction.drawState, sendInvalid: interaction.sendInvalid },
    landscape,
    desktop,
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
