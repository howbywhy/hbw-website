import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "identity-nav");
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
  client.on("Page.screencastFrame", async ({ data, sessionId }) => {
    const file = join(dir, `f-${String(n).padStart(5, "0")}.jpg`);
    n += 1;
    writeFileSync(file, Buffer.from(data, "base64"));
    await client.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await client.send("Page.startScreencast", { format: "jpeg", quality: 82, everyNthFrame: 1 });
  return {
    async stop() {
      await client.send("Page.stopScreencast").catch(() => {});
    },
  };
}

const MEASURE = `(() => {
  function box(node) {
    if (!node) return null;
    const r = node.getBoundingClientRect();
    const cs = getComputedStyle(node);
    return {
      x: Math.round(r.x * 10) / 10,
      y: Math.round(r.y * 10) / 10,
      width: Math.round(r.width * 10) / 10,
      height: Math.round(r.height * 10) / 10,
      cx: Math.round((r.x + r.width / 2) * 10) / 10,
      cy: Math.round((r.y + r.height / 2) * 10) / 10,
      opacity: Number(cs.opacity).toFixed(2),
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      text: (node.innerText || node.textContent || "").replace(/\\s+/g, " ").trim(),
    };
  }
  const mark = document.querySelector(".hbw-home-strip__mark");
  const swap = document.querySelector(".hbw-mark-swap");
  const toolbar = document.querySelector(".hbw-poster-toolbar");
  const projects = document.querySelector(".hbw-nav-projects__hit");
  const studio = document.querySelector(".hbw-nav-studio");
  const time = document.querySelector(".hbw-home-strip__time");
  const place = document.querySelector(".hbw-sheet__place");
  const sheet = document.querySelector('.hbw-inspector.is-global-right');
  return {
    intent: mark?.getAttribute("data-hbw-intent"),
    entered: document.documentElement.classList.contains("hbw-entered"),
    homeClass: document.querySelector(".hbw-home")?.className,
    mark: box(mark),
    rest: box(document.querySelector(".hbw-mark-rest")),
    swap: box(swap),
    how: box(document.querySelector(".hbw-mark-how")),
    by: box(document.querySelector(".hbw-mark-by")),
    why: box(document.querySelector(".hbw-mark-why")),
    toolbar: toolbar ? { x: box(toolbar).x, cx: box(toolbar).cx, width: box(toolbar).width } : null,
    projects: projects ? { ...box(projects), ariaHidden: projects.getAttribute("aria-hidden") } : null,
    studio: studio ? { ...box(studio), ariaHidden: studio.getAttribute("aria-hidden") } : null,
    time: time ? box(time) : null,
    place: place ? { ...box(place), html: place.innerHTML } : null,
    sheet: sheet ? { scrollTop: sheet.scrollTop, scrollHeight: sheet.scrollHeight, clientHeight: sheet.clientHeight } : null,
  };
})()`;

async function launch() {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--window-size=1440,900", "--hide-scrollbars"],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });
}

async function clearSession(page) {
  await page.evaluateOnNewDocument(() => {
    try {
      sessionStorage.removeItem("hbw.entered.v2");
      sessionStorage.removeItem("hbw.intro.media.v1");
    } catch {}
  });
}

async function main() {
  rmSync(join(OUT, "frames"), { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  mkdirSync(join(OUT, "frames"), { recursive: true });

  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await clearSession(page);

  const rec = await startCapture(page, join(OUT, "frames"));
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), {
    timeout: 8000,
  });
  await sleep(200);

  await page.screenshot({ path: join(OUT, "01-settled-identity.png") });
  const s1 = await page.evaluate(MEASURE);

  await page.hover(".hbw-mark-how");
  await sleep(180);
  await page.screenshot({ path: join(OUT, "02-hover-how.png") });
  const s2 = await page.evaluate(MEASURE);

  await page.mouse.move(720, 80);
  await sleep(160);
  await page.hover(".hbw-mark-by");
  await sleep(180);
  await page.screenshot({ path: join(OUT, "03-hover-by.png") });
  const s3 = await page.evaluate(MEASURE);

  await page.mouse.move(720, 80);
  await sleep(160);
  await page.hover(".hbw-mark-why");
  await sleep(180);
  await page.screenshot({ path: join(OUT, "04-hover-why.png") });
  const s4 = await page.evaluate(MEASURE);

  await page.mouse.move(720, 80);
  await sleep(160);
  await page.click(".hbw-mark-by");
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), {
    timeout: 4000,
  });
  await sleep(420);
  await page.screenshot({ path: join(OUT, "05-projects-identity.png") });
  const s5 = await page.evaluate(MEASURE);

  await page.click(".hbw-mark-how");
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-make"), {
    timeout: 4000,
  });
  await sleep(420);
  await page.click(".hbw-mark-why");
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-studio"), {
    timeout: 4000,
  });
  await sleep(500);
  const sheet = await page.$(".hbw-inspector.is-global-right");
  if (sheet) await sheet.evaluate((el) => { el.scrollTop = 0; });
  await sleep(80);
  await page.screenshot({ path: join(OUT, "06-practice-sheet.png") });
  const s6 = await page.evaluate(MEASURE);

  if (sheet) {
    await sheet.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
  }
  await page.waitForFunction(() => document.querySelector(".hbw-sheet__place"), { timeout: 4000 });
  await sleep(400);
  await page.screenshot({ path: join(OUT, "07-practice-place.png") });
  const s7 = await page.evaluate(MEASURE);

  await rec.stop();
  encode(join(OUT, "frames"), join(OUT, "identity-nav.mp4"), 30);

  const placeApi = await page.evaluate(async () => {
    try {
      const res = await fetch("/api/hbw/place");
      return { status: res.status, body: await res.json() };
    } catch (error) {
      return { error: String(error) };
    }
  });

  const keyboard = await page.evaluate(async () => {
    document.querySelector(".hbw-nav-studio.is-sheet-close")?.click();
    await new Promise((r) => setTimeout(r, 420));
    const how = document.querySelector(".hbw-mark-how");
    how?.focus();
    await new Promise((r) => setTimeout(r, 80));
    return {
      active: document.activeElement?.className,
      intent: document.querySelector(".hbw-home-strip__mark")?.getAttribute("data-hbw-intent"),
      phrase: document.querySelector(".hbw-mark-swap")?.textContent,
    };
  });

  await browser.close();

  const report = {
    stills: { rest: s1, how: s2, by: s3, why: s4, projects: s5, practice: s6, place: s7 },
    placeApi,
    keyboard,
    timing: { hover: { token: "micro", ms: 140 } },
  };
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
