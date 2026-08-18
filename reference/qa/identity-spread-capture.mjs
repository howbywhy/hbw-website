import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "identity-spread");
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

function encode(dir, dest) {
  const bin = ffmpegPath();
  if (!bin) return false;
  const r = spawnSync(
    bin,
    [
      "-y",
      "-framerate",
      "30",
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
  await client.send("Page.startScreencast", { format: "jpeg", quality: 80, everyNthFrame: 1 });
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
      right: Math.round(r.right * 10) / 10,
      opacity: Number(cs.opacity).toFixed(2),
      fontSize: cs.fontSize,
      textTransform: cs.textTransform,
      text: (node.textContent || "").replace(/\\s+/g, " ").trim(),
    };
  }
  const mark = document.querySelector(".hbw-home-strip__mark");
  const how = document.querySelector(".hbw-mark-how");
  const by = document.querySelector(".hbw-mark-by");
  const why = document.querySelector(".hbw-mark-why");
  const thought = document.querySelector(".hbw-intro-thought");
  const toolbar = document.querySelector(".hbw-poster-toolbar");
  const descriptor = document.querySelector(".hbw-mark-descriptor");
  return {
    intro: document.documentElement.classList.contains("hbw-intro"),
    yield: document.documentElement.classList.contains("hbw-intro-yield"),
    resolve: document.documentElement.classList.contains("hbw-intro-resolve"),
    entered: document.documentElement.classList.contains("hbw-entered"),
    intent: mark?.getAttribute("data-hbw-intent"),
    homeClass: document.querySelector(".hbw-home")?.className,
    thought: thought ? { ...box(thought), lines: thought.innerText } : null,
    mark: box(mark),
    how: box(how),
    by: box(by),
    why: box(why),
    descriptor: descriptor
      ? { ...box(descriptor), display: getComputedStyle(descriptor).display }
      : null,
    toolbar: toolbar
      ? {
          ...box(toolbar),
          bottom: Math.round((window.innerHeight - toolbar.getBoundingClientRect().bottom) * 10) / 10,
        }
      : null,
    overflow: {
      wrap: thought ? thought.scrollWidth > thought.clientWidth + 1 : false,
      bodyScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      markText: mark?.innerText.replace(/\\s+/g, " ").trim(),
    },
    viewport: { w: window.innerWidth, h: window.innerHeight },
  };
})()`;

async function launch(width, height, mobile = false) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [`--window-size=${width},${height}`, "--hide-scrollbars"],
    defaultViewport: {
      width,
      height,
      deviceScaleFactor: 1,
      isMobile: mobile,
      hasTouch: mobile,
    },
  });
}

async function clearAndGoto(page, url = BASE + "/") {
  await page.evaluateOnNewDocument(() => {
    try {
      sessionStorage.removeItem("hbw.entered.v2");
      sessionStorage.removeItem("hbw.intro.media.v1");
    } catch {}
  });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.addStyleTag({
    content: "nextjs-portal, [data-next-badge-root], [data-nextjs-toast] { display: none !important; }",
  });
}

async function desktopAt(width, height, shots) {
  const browser = await launch(width, height);
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  const rec = shots ? await startCapture(page, join(OUT, "frames-desktop")) : null;
  await clearAndGoto(page);

  const result = { size: { width, height } };

  await page.waitForFunction(() => {
    const el = document.querySelector(".hbw-intro-thought");
    return document.documentElement.classList.contains("hbw-intro") && el && parseFloat(getComputedStyle(el).opacity) > 0.85;
  }, { timeout: 8000 });
  if (shots) await page.screenshot({ path: join(OUT, "d-01-lockup.png") });
  result.lockup = await page.evaluate(MEASURE);

  await page.waitForFunction(() => {
    const support = [...document.querySelectorAll(".hbw-intro-support")];
    return (
      document.documentElement.classList.contains("hbw-intro-yield") &&
      !document.documentElement.classList.contains("hbw-intro-resolve") &&
      support.length &&
      support.every((el) => parseFloat(getComputedStyle(el).opacity) < 0.85)
    );
  }, { timeout: 5000 });
  if (shots) await page.screenshot({ path: join(OUT, "d-02-dismantle.png") });
  result.dismantle = await page.evaluate(MEASURE);

  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-intro-resolve"), { timeout: 4000 });
  await sleep(80);
  if (shots) await page.screenshot({ path: join(OUT, "d-03-travelling.png") });
  result.travelling = await page.evaluate(MEASURE);

  await page.waitForFunction(() => {
    const toolbar = document.querySelector(".hbw-poster-toolbar");
    return (
      document.documentElement.classList.contains("hbw-intro-resolve") &&
      !document.documentElement.classList.contains("hbw-entered") &&
      toolbar &&
      parseFloat(getComputedStyle(toolbar).opacity) > 0.08 &&
      parseFloat(getComputedStyle(toolbar).opacity) < 0.95
    );
  }, { timeout: 4000 });
  if (shots) await page.screenshot({ path: join(OUT, "d-04-arriving.png") });
  result.arriving = await page.evaluate(MEASURE);

  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 4000 });
  await sleep(160);
  if (shots) await page.screenshot({ path: join(OUT, "d-05-settled.png") });
  if (shots) await page.screenshot({ path: join(OUT, "d-09-make.png") });
  result.settled = await page.evaluate(MEASURE);

  if (shots) {
    await page.hover(".hbw-mark-how");
    await sleep(180);
    await page.screenshot({ path: join(OUT, "d-06-hover-how.png") });
    result.how = await page.evaluate(MEASURE);
    await page.mouse.move(width / 2, 80);
    await sleep(160);
    await page.hover(".hbw-mark-by");
    await sleep(180);
    await page.screenshot({ path: join(OUT, "d-07-hover-by.png") });
    result.by = await page.evaluate(MEASURE);
    await page.mouse.move(width / 2, 80);
    await sleep(160);
    await page.hover(".hbw-mark-why");
    await sleep(180);
    await page.screenshot({ path: join(OUT, "d-08-hover-why.png") });
    result.why = await page.evaluate(MEASURE);
    await page.mouse.move(width / 2, 80);
    await sleep(160);

    await page.click(".hbw-mark-by");
    await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), { timeout: 4000 });
    await sleep(420);
    await page.screenshot({ path: join(OUT, "d-10-projects.png") });
    result.projects = await page.evaluate(MEASURE);

    await page.click(".hbw-mark-how");
    await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-make"), { timeout: 4000 });
    await sleep(380);
    await page.click(".hbw-mark-why");
    await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-studio"), { timeout: 4000 });
    await sleep(500);
    await page.screenshot({ path: join(OUT, "d-11-practice.png") });
    result.practice = await page.evaluate(MEASURE);
  }

  if (rec) {
    await rec.stop();
    encode(join(OUT, "frames-desktop"), join(OUT, "desktop.mp4"));
  }
  await browser.close();
  return result;
}

async function mobileAt(width, height, shots) {
  const browser = await launch(width, height, true);
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const rec = shots ? await startCapture(page, join(OUT, "frames-mobile")) : null;
  await clearAndGoto(page);

  const result = { size: { width, height } };

  await page.waitForFunction(() => {
    const el = document.querySelector(".hbw-intro-thought");
    return document.documentElement.classList.contains("hbw-intro") && el && parseFloat(getComputedStyle(el).opacity) > 0.85;
  }, { timeout: 8000 });
  if (shots) await page.screenshot({ path: join(OUT, "m-01-lockup.png") });
  result.lockup = await page.evaluate(MEASURE);

  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-intro-resolve"), { timeout: 5000 });
  await sleep(120);
  if (shots) await page.screenshot({ path: join(OUT, "m-02-travelling.png") });
  result.travelling = await page.evaluate(MEASURE);

  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 4000 });
  await sleep(160);
  if (shots) await page.screenshot({ path: join(OUT, "m-03-settled.png") });
  result.settled = await page.evaluate(MEASURE);

  await page.tap(".hbw-mark-by");
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), { timeout: 4000 });
  await sleep(420);
  if (shots) await page.screenshot({ path: join(OUT, "m-04-projects.png") });
  result.projects = await page.evaluate(MEASURE);

  await page.tap(".hbw-mark-how");
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-make"), { timeout: 4000 });
  await sleep(380);
  await page.evaluate(() => document.querySelector(".hbw-mark-why")?.click());
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-studio"), { timeout: 6000 });
  await sleep(500);
  if (shots) await page.screenshot({ path: join(OUT, "m-05-practice.png") });
  result.practice = await page.evaluate(MEASURE);

  if (rec) {
    await rec.stop();
    encode(join(OUT, "frames-mobile"), join(OUT, "mobile.mp4"));
  }
  await browser.close();
  return result;
}

async function main() {
  rmSync(join(OUT, "frames-desktop"), { recursive: true, force: true });
  rmSync(join(OUT, "frames-mobile"), { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const desktop = await desktopAt(1440, 900, true);
  const wide = await desktopAt(1728, 900, false);
  const m390 = await mobileAt(390, 844, true);
  const m375 = await mobileAt(375, 812, false);
  const m430 = await mobileAt(430, 932, false);

  const report = {
    timing: {
      composedMs: 380 + 520 + 240 + 240 + 240 + 520 + 140,
      phases: {
        occupy: { token: "spatial", ms: 380, at: "0–380" },
        read: { token: "continuity+ui+ui", ms: 1000, at: "380–1380" },
        yield: { token: "ui", ms: 240, at: "1380–1620" },
        expand: { token: "continuity", ms: 520, at: "1620–2140" },
        toolbar: { token: "spatial", ms: 380, delay: 1860, at: "1860–2240" },
        settle: { token: "micro", ms: 140, at: "2140–2280" },
      },
    },
    desktop1440: desktop,
    desktop1728: wide,
    mobile: { "390x844": m390, "375x812": m375, "430x932": m430 },
  };
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
