import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "intro-toolbar");
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
      visibility: cs.visibility,
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      letterSpacing: cs.letterSpacing,
    };
  }
  function vt(name) {
    try {
      const cs = getComputedStyle(document.documentElement, "::view-transition-group(" + name + ")");
      if (!cs || cs.display === "none") return null;
      return {
        width: cs.width,
        height: cs.height,
        transform: cs.transform,
        opacity: cs.opacity,
      };
    } catch {
      return null;
    }
  }
  const thought = document.querySelector(".hbw-intro-thought");
  const mark = document.querySelector(".hbw-home-strip__mark");
  const toolbar = document.querySelector(".hbw-poster-toolbar");
  const field = document.querySelector(".hbw-window") || document.querySelector(".hbw-poster-field");
  const fieldBox = box(field);
  const thoughtBox = thought ? { ...box(thought), text: thought.innerText.replace(/\\u00a0/g, " ") } : null;
  return {
    intro: document.documentElement.classList.contains("hbw-intro"),
    yield: document.documentElement.classList.contains("hbw-intro-yield"),
    resolve: document.documentElement.classList.contains("hbw-intro-resolve"),
    entered: document.documentElement.classList.contains("hbw-entered"),
    field: fieldBox,
    thought: thoughtBox,
    optical: thoughtBox && fieldBox
      ? {
          fieldCx: fieldBox.cx,
          fieldCy: fieldBox.cy,
          thoughtCx: thoughtBox.cx,
          thoughtCy: thoughtBox.cy,
          dx: Math.round((thoughtBox.cx - fieldBox.cx) * 10) / 10,
          dy: Math.round((thoughtBox.cy - fieldBox.cy) * 10) / 10,
        }
      : null,
    support: [...document.querySelectorAll(".hbw-intro-support")].map(box),
    source: {
      how: box(document.querySelector(".hbw-intro-how")),
      by: box(document.querySelector(".hbw-intro-by")),
      why: box(document.querySelector(".hbw-intro-why")),
    },
    intermediate: {
      how: vt("hbw-mark-how"),
      by: vt("hbw-mark-by"),
      why: vt("hbw-mark-why"),
    },
    dest: {
      mark: box(mark),
      how: box(document.querySelector(".hbw-mark-how")),
      by: box(document.querySelector(".hbw-mark-by")),
      why: box(document.querySelector(".hbw-mark-why")),
    },
    nav: {
      projects: box(document.querySelector(".hbw-nav-projects")),
      studio: box(document.querySelector(".hbw-nav-studio")),
      time: box(document.querySelector(".hbw-home-strip__time")),
    },
    toolbar: toolbar
      ? { ...box(toolbar), placeholder: toolbar.querySelector(".hbw-poster-input")?.placeholder }
      : null,
  };
})()`;

async function launch(width, height) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [`--window-size=${width},${height}`, "--hide-scrollbars"],
    defaultViewport: { width, height, deviceScaleFactor: 1 },
  });
}

async function main() {
  rmSync(join(OUT, "frames"), { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  mkdirSync(join(OUT, "frames"), { recursive: true });

  const browser = await launch(1440, 900);
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => {
    window.__hbwIntro = { start: 0, entered: 0 };
    const mark = () => {
      const c = document.documentElement.classList;
      if (c.contains("hbw-intro") && !window.__hbwIntro.start) window.__hbwIntro.start = performance.now();
      if (c.contains("hbw-entered") && !window.__hbwIntro.entered) window.__hbwIntro.entered = performance.now();
    };
    new MutationObserver(mark).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  });

  const rec = await startCapture(page, join(OUT, "frames"));
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => {
    const el = document.querySelector(".hbw-intro-thought");
    return (
      document.documentElement.classList.contains("hbw-intro") &&
      el &&
      parseFloat(getComputedStyle(el).opacity) > 0.85
    );
  }, { timeout: 8000 });

  await page.screenshot({ path: join(OUT, "01-centred-thought.png") });
  const s1 = await page.evaluate(MEASURE);

  await page.waitForFunction(() => {
    const support = [...document.querySelectorAll(".hbw-intro-support")];
    if (!document.documentElement.classList.contains("hbw-intro-yield")) return false;
    if (document.documentElement.classList.contains("hbw-intro-resolve")) return false;
    if (!support.length) return false;
    const o = parseFloat(getComputedStyle(support[0]).opacity);
    return o > 0.35 && o < 0.72;
  }, { timeout: 4000 });
  await page.screenshot({ path: join(OUT, "02-support-yield.png") });
  const s2 = await page.evaluate(MEASURE);

  await page.waitForFunction(() => {
    const support = [...document.querySelectorAll(".hbw-intro-support")];
    if (!support.length) return false;
    if (document.documentElement.classList.contains("hbw-intro-resolve")) return false;
    return support.every((el) => parseFloat(getComputedStyle(el).opacity) < 0.2);
  }, { timeout: 4000 });
  await page.screenshot({ path: join(OUT, "03-how-by-why-remain.png") });
  const s3 = await page.evaluate(MEASURE);

  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-intro-resolve"), {
    timeout: 4000,
  });
  await sleep(90);
  await page.screenshot({ path: join(OUT, "04-name-reorganising.png") });
  const s4 = await page.evaluate(MEASURE);

  await page.waitForFunction(() => {
    const toolbar = document.querySelector(".hbw-poster-toolbar");
    const nav = document.querySelector(".hbw-nav-projects");
    if (!toolbar || !nav) return false;
    if (!document.documentElement.classList.contains("hbw-intro-resolve")) return false;
    if (document.documentElement.classList.contains("hbw-entered")) return false;
    const t = parseFloat(getComputedStyle(toolbar).opacity);
    const n = parseFloat(getComputedStyle(nav).opacity);
    return n > 0.2 && t > 0.05 && t < 0.9;
  }, { timeout: 4000 });
  await page.screenshot({ path: join(OUT, "05-name-travelling.png") });
  const s5 = await page.evaluate(MEASURE);

  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), {
    timeout: 4000,
  });
  await sleep(80);
  await page.screenshot({ path: join(OUT, "06-settled-workspace.png") });
  const s6 = await page.evaluate(MEASURE);
  await rec.stop();
  const pageTiming = await page.evaluate(() => window.__hbwIntro || null);

  const persistence = await page.evaluate(() => ({
    entered: sessionStorage.getItem("hbw.entered.v2"),
    media: sessionStorage.getItem("hbw.intro.media.v1"),
  }));
  await page.reload({ waitUntil: "domcontentloaded" });
  await sleep(250);
  const replay = await page.evaluate(() => ({
    intro: document.documentElement.classList.contains("hbw-intro"),
    entered: document.documentElement.classList.contains("hbw-entered"),
    thoughtDisplay: getComputedStyle(document.querySelector(".hbw-intro-thought") || document.body).display,
  }));

  encode(join(OUT, "frames"), join(OUT, "intro-fresh.mp4"), 30);
  await browser.close();

  const reducedBrowser = await launch(1440, 900);
  const reduced = await reducedBrowser.newPage();
  await reduced.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await reduced.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await sleep(120);
  const reducedState = await reduced.evaluate(() => ({
    intro: document.documentElement.classList.contains("hbw-intro"),
    entered: document.documentElement.classList.contains("hbw-entered"),
    thoughtDisplay: getComputedStyle(document.querySelector(".hbw-intro-thought") || document.body).display,
    mark: document.querySelector(".hbw-home-strip__mark")?.textContent,
    toolbarOpacity: document.querySelector(".hbw-poster-toolbar")
      ? Number(getComputedStyle(document.querySelector(".hbw-poster-toolbar")).opacity).toFixed(2)
      : null,
    session: sessionStorage.getItem("hbw.entered.v2"),
  }));
  await reducedBrowser.close();

  const report = {
    stills: {
      centredThought: s1,
      yield: s2,
      remain: s3,
      reorganising: s4,
      travelling: s5,
      settled: s6,
    },
    timing: {
      pageMs:
        pageTiming && pageTiming.start && pageTiming.entered
          ? Math.round(pageTiming.entered - pageTiming.start)
          : null,
      composedMs: 380 + 240 + 520 + 520,
      phases: {
        occupy: { token: "spatial", ms: 380, at: "0–380" },
        hold: { token: "ui", ms: 240, at: "380–620" },
        yield: { token: "continuity", ms: 520, at: "620–1140" },
        nameResolve: { token: "continuity", ms: 520, at: "1140–1660" },
        nav: { token: "spatial", ms: 380, delay: 1140, at: "1140–1520" },
        toolbar: { token: "spatial", ms: 380, delay: 1280, at: "1280–1660" },
      },
      ownership:
        "View Transition names hbw-mark-how / hbw-mark-by / hbw-mark-why move from intro spans onto the persistent nav mark spans",
    },
    persistence: { afterIntro: persistence, reloadDoesNotReplay: replay },
    reducedMotion: reducedState,
  };
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
