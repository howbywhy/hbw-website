import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "mobile-ux");
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
  const frames = [];
  client.on("Page.screencastFrame", async ({ data, sessionId }) => {
    const file = join(dir, `f-${String(n).padStart(5, "0")}.jpg`);
    n += 1;
    frames.push(file);
    writeFileSync(file, Buffer.from(data, "base64"));
    await client.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await client.send("Page.startScreencast", { format: "jpeg", quality: 72, everyNthFrame: 1 });
  return {
    frames,
    async stop() {
      await client.send("Page.stopScreencast").catch(() => {});
    },
  };
}

async function record(page, name, act) {
  const dir = join(OUT, `frames-${name}`);
  rmSync(dir, { recursive: true, force: true });
  const cap = await startCapture(page, dir);
  await sleep(100);
  const t0 = Date.now();
  await act();
  const elapsed = Math.max(0.4, (Date.now() - t0) / 1000);
  await cap.stop();
  const fps = Math.max(8, Math.round((cap.frames.length / elapsed) * 10) / 10);
  const dest = join(OUT, `${name}.mp4`);
  return { dest, ok: encode(dir, dest, fps), frames: cap.frames.length, fps, elapsed };
}

const GEOM = `(() => {
  function box(node) {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { x: Math.round(r.x*10)/10, y: Math.round(r.y*10)/10, w: Math.round(r.width*10)/10, h: Math.round(r.height*10)/10, cx: Math.round((r.x+r.width/2)*10)/10, right: Math.round(r.right*10)/10, bottom: Math.round(r.bottom*10)/10 };
  }
  const tb = document.querySelector(".hbw-poster-toolbar");
  const tools = [...document.querySelectorAll(".hbw-poster-toolbar__primary .hbw-poster-tool")];
  return {
    toolbar: tb ? { ...box(tb), display: getComputedStyle(tb).display, bottom: getComputedStyle(tb).bottom, transform: getComputedStyle(tb).transform, width: getComputedStyle(tb).width } : null,
    write: box(tools[0]),
    draw: box(tools[1]),
    add: box(tools[2]),
    email: box(document.querySelector(".hbw-poster-input")),
    send: box(document.querySelector(".hbw-poster-send-open")),
    how: box(document.querySelector(".hbw-mark-how")),
    by: box(document.querySelector(".hbw-mark-by")),
    why: box(document.querySelector(".hbw-mark-why")),
    close: box(document.querySelector(".hbw-home-strip__exit.is-on, .hbw-nav-projects__hit")),
    info: box([...document.querySelectorAll(".hbw-nav-sub__view button")].find((el) => /Info|Close/.test(el.textContent)) || null),
    emailFont: document.querySelector(".hbw-poster-input") && getComputedStyle(document.querySelector(".hbw-poster-input")).fontSize,
    vv: window.visualViewport && { w: visualViewport.width, h: visualViewport.height, offsetTop: visualViewport.offsetTop },
    inset: getComputedStyle(document.documentElement).getPropertyValue("--hbw-vv-inset").trim(),
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    touchAction: document.querySelector(".hbw-poster-field canvas") && getComputedStyle(document.querySelector(".hbw-poster-field canvas")).touchAction,
  };
})()`;

async function launchMobile(w, h) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [`--window-size=${w},${h}`, "--hide-scrollbars"],
    defaultViewport: { width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  });
}

async function gotoEntered(page, path = "/") {
  await page.evaluateOnNewDocument(() => {
    try { sessionStorage.setItem("hbw.entered.v2", "1"); } catch {}
  });
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.addStyleTag({ content: "nextjs-portal, [data-next-badge-root], [data-nextjs-toast] { display: none !important; }" });
  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 8000 });
  await sleep(220);
}

async function tapSel(page, sel) {
  const el = await page.$(sel);
  const box = await el.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

async function stills() {
  const sizes = [
    { w: 375, h: 812, name: "375x812" },
    { w: 390, h: 844, name: "390x844" },
    { w: 430, h: 932, name: "430x932" },
  ];
  const out = {};
  for (const size of sizes) {
    const browser = await launchMobile(size.w, size.h);
    const page = await browser.newPage();
    await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await gotoEntered(page, "/");
    await page.screenshot({ path: join(OUT, `${size.name}-make.png`) });
    out[size.name] = { rest: await page.evaluate(GEOM) };
    await page.evaluate(() => document.documentElement.style.setProperty("--hbw-vv-inset", "336px"));
    await sleep(80);
    await page.screenshot({ path: join(OUT, `${size.name}-keyboard.png`) });
    out[size.name].keyboard = await page.evaluate(GEOM);
    await browser.close();
  }
  return out;
}

async function recordings() {
  const browser = await launchMobile(390, 844);
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await gotoEntered(page, "/");

  const recWrite = await record(page, "write-edit", async () => {
    await tapSel(page, '.hbw-poster-tool[aria-label="Write"]');
    await sleep(120);
    const canvas = await page.evaluate(() => {
      const r = document.querySelector(".hbw-poster-field canvas").getBoundingClientRect();
      return { x: r.x + r.width * 0.42, y: r.y + r.height * 0.32 };
    });
    await page.touchscreen.tap(canvas.x, canvas.y);
    await sleep(180);
    await page.type(".hbw-poster-edit", "Clarity", { delay: 40 });
    await page.keyboard.press("Enter");
    await page.type(".hbw-poster-edit", "for brands", { delay: 40 });
    await page.keyboard.press("Backspace");
    await sleep(200);
    await page.touchscreen.tap(36, 180);
    await sleep(400);
  });

  const recDraw = await record(page, "draw", async () => {
    await tapSel(page, '.hbw-poster-tool[aria-label="Draw"]');
    await sleep(100);
    const field = await page.evaluate(() => {
      const r = document.querySelector(".hbw-poster-field canvas").getBoundingClientRect();
      return { x: r.x + 70, y: r.y + 140 };
    });
    await page.touchscreen.touchStart(field.x, field.y);
    for (let i = 1; i <= 12; i++) {
      await page.touchscreen.touchMove(field.x + i * 12, field.y + Math.sin(i / 2) * 28);
    }
    await page.touchscreen.touchEnd();
    await sleep(350);
  });

  const recSend = await record(page, "email-send", async () => {
    await page.click(".hbw-poster-input");
    await page.type(".hbw-poster-input", "hello@hbw.works", { delay: 25 });
    await sleep(120);
    await tapSel(page, ".hbw-poster-send-open");
    await sleep(500);
  });

  const recProjects = await record(page, "make-projects-project", async () => {
    await tapSel(page, ".hbw-mark-by");
    await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), { timeout: 5000 });
    await sleep(400);
    await page.waitForSelector('[data-hbw-project="sub-3"]', { timeout: 8000 });
    await tapSel(page, '[data-hbw-project="sub-3"]');
    await page.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
    await sleep(700);
  });

  const recNav = await record(page, "project-nav", async () => {
    await page.$eval(".hbw-project-view.is-active", (el) => {
      el.scrollBy({ top: 420, behavior: "smooth" });
    });
    await sleep(500);
    await page.$eval(".hbw-project-view.is-active", (el) => {
      el.scrollBy({ top: 420, behavior: "smooth" });
    });
    await sleep(600);
  });

  const recInfo = await record(page, "project-info", async () => {
    const info = await page.evaluate(() => {
      const el = [...document.querySelectorAll(".hbw-nav-sub__view button")].find((b) => b.textContent.trim() === "Info");
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await page.touchscreen.tap(info.x, info.y);
    await sleep(420);
    await page.$eval(".hbw-sheet.is-visible, .hbw-inspector.is-visible", (el) => {
      el.scrollBy({ top: 280, behavior: "smooth" });
    });
    await sleep(500);
    const close = await page.evaluate(() => {
      const el = [...document.querySelectorAll(".hbw-nav-sub__view button")].find((b) => b.textContent.trim() === "Close")
        || document.querySelector(".hbw-home-strip__exit.is-on");
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await page.touchscreen.tap(close.x, close.y);
    await sleep(420);
  });

  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 8000 });
  await sleep(250);

  const recPractice = await record(page, "practice", async () => {
    await page.click(".hbw-mark-why");
    await page.waitForFunction(
      () =>
        document.querySelector(".hbw-home")?.classList.contains("is-studio") ||
        document.querySelector(".hbw-inspector.is-visible"),
      { timeout: 8000 }
    );
    await sleep(380);
    const sheet = await page.$(".hbw-inspector.is-visible");
    if (sheet) await sheet.evaluate((el) => el.scrollBy({ top: 260, behavior: "smooth" }));
    await sleep(450);
    const close = await page.$(".hbw-nav-studio.is-sheet-close, .hbw-nav-studio");
    if (close) {
      const box = await close.boundingBox();
      if (box) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    }
    await sleep(420);
  });

  await browser.close();
  return { recWrite, recDraw, recSend, recProjects, recNav, recInfo, recPractice };
}

async function desktop() {
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
  await page.click(".hbw-mark-by");
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), { timeout: 4000 });
  await sleep(450);
  await page.screenshot({ path: join(OUT, "desktop-projects.png") });
  const projects = await page.evaluate(() => document.querySelector(".hbw-home-strip__mark")?.innerText.replace(/\s+/g, " ").trim());
  await page.click('[data-hbw-project="sub-3"]');
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(800);
  await page.screenshot({ path: join(OUT, "desktop-project.png") });
  const project = await page.evaluate(() => ({
    text: document.querySelector(".hbw-home-strip__mark")?.innerText.replace(/\s+/g, " ").trim(),
    howX: document.querySelector(".hbw-mark-how .hbw-mark-word--rest")?.getBoundingClientRect().x,
  }));
  await browser.close();
  return { make, projects, project };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const sizeStills = await stills();
  const recs = await recordings();
  const desk = await desktop();
  const report = { sizeStills, recs, desk };
  writeFileSync(join(OUT, "metrics.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    toolbar375: sizeStills["375x812"].rest.toolbar,
    hits375: { write: sizeStills["375x812"].rest.write, send: sizeStills["375x812"].rest.send, how: sizeStills["375x812"].rest.how },
    kb375: sizeStills["375x812"].keyboard.toolbar,
    desktop: { how: desk.make.how, toolbar: desk.make.toolbar, projects: desk.projects, project: desk.project },
    recs: Object.fromEntries(Object.entries(recs).map(([k, v]) => [k, { ok: v.ok, fps: v.fps, elapsed: v.elapsed }])),
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
