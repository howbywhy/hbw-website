import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "identity-assemble");
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
  const frames = [];
  client.on("Page.screencastFrame", async ({ data, sessionId }) => {
    const file = join(dir, `f-${String(n).padStart(5, "0")}.jpg`);
    n += 1;
    frames.push(file);
    writeFileSync(file, Buffer.from(data, "base64"));
    await client.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await client.send("Page.startScreencast", { format: "jpeg", quality: 80, everyNthFrame: 1 });
  return {
    frames,
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
      lineHeight: cs.lineHeight,
      fontWeight: cs.fontWeight,
      letterSpacing: cs.letterSpacing,
      textTransform: cs.textTransform,
      text: (node.textContent || "").replace(/\\s+/g, " ").trim(),
    };
  }
  const mark = document.querySelector(".hbw-home-strip__mark");
  const how = document.querySelector(".hbw-mark-how .hbw-mark-word--rest");
  const by = document.querySelector(".hbw-mark-by .hbw-mark-word--rest");
  const why = document.querySelector(".hbw-mark-why .hbw-mark-word--rest");
  const times = document.querySelector(".hbw-mark-times");
  const context = document.querySelector(".hbw-mark-context");
  const suffix = document.querySelector(".hbw-mark-suffix");
  const descriptor = document.querySelector(".hbw-mark-descriptor");
  const exit = document.querySelector(".hbw-home-strip__exit");
  const howBox = how?.getBoundingClientRect();
  const byBox = by?.getBoundingClientRect();
  const whyBox = why?.getBoundingClientRect();
  const timesBox = times?.getBoundingClientRect();
  const contextBox = context?.getBoundingClientRect();
  return {
    assembled: mark?.classList.contains("is-assembled") || false,
    intent: mark?.getAttribute("data-hbw-intent"),
    homeClass: document.querySelector(".hbw-home")?.className,
    markText: mark?.innerText.replace(/\\s+/g, " ").trim(),
    mark: box(mark),
    how: box(how),
    by: box(by),
    why: box(why),
    times: box(times),
    context: box(context),
    suffix: box(suffix),
    descriptor: descriptor
      ? { ...box(descriptor), display: getComputedStyle(descriptor).display }
      : null,
    exit: exit ? { ...box(exit), on: exit.classList.contains("is-on") } : null,
    gaps: {
      howBy: howBox && byBox ? Math.round((byBox.left - howBox.right) * 10) / 10 : null,
      byWhy: byBox && whyBox ? Math.round((whyBox.left - byBox.right) * 10) / 10 : null,
      whyTimes: whyBox && timesBox ? Math.round((timesBox.left - whyBox.right) * 10) / 10 : null,
      timesName: timesBox && contextBox ? Math.round((contextBox.left - timesBox.right) * 10) / 10 : null,
    },
    viewport: { w: window.innerWidth, h: window.innerHeight },
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
  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), {
    timeout: 8000,
  });
  await sleep(200);
}

async function record(page, name, act) {
  const dir = join(OUT, `frames-${name}`);
  rmSync(dir, { recursive: true, force: true });
  const cap = await startCapture(page, dir);
  await sleep(120);
  const t0 = Date.now();
  await act();
  const elapsed = Math.max(0.4, (Date.now() - t0) / 1000);
  await cap.stop();
  const fps = Math.max(8, Math.round((cap.frames.length / elapsed) * 10) / 10);
  const dest = join(OUT, `${name}.mp4`);
  const ok = encode(dir, dest, fps);
  return { dest, ok, frames: cap.frames.length, fps, elapsed };
}

async function toOutro(page) {
  await page.$eval(".hbw-project-view.is-active", (el) => el.focus());
  for (let i = 0; i < 24; i++) {
    const done = await page.evaluate(() => {
      const meta = document.querySelector(".hbw-nav-sub__meta")?.textContent || "";
      const parts = meta.replace(/\s+/g, "").split("/");
      return parts.length === 2 && parts[0] === parts[1] && Number(parts[0]) > 0;
    });
    if (done) break;
    await page.keyboard.press("ArrowRight");
    await sleep(150);
  }
  await sleep(280);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await gotoEntered(page, "/");
  await sleep(240);

  await page.screenshot({ path: join(OUT, "d-01-distributed.png") });
  const distributed = await page.evaluate(MEASURE);

  const recMakeProjects = await record(page, "make-to-projects", async () => {
    await page.click(".hbw-mark-by");
    await page.waitForFunction(
      () => document.querySelector(".hbw-home-strip__mark")?.classList.contains("is-assembled"),
      { timeout: 4000 }
    );
    await sleep(700);
  });

  await page.screenshot({ path: join(OUT, "d-03-assembled-projects.png") });
  const assembledProjects = await page.evaluate(MEASURE);

  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), {
    timeout: 8000,
  });
  await sleep(240);
  await page.click(".hbw-mark-by");
  await sleep(220);
  await page.screenshot({ path: join(OUT, "d-02-mid-contract.png") });
  const midContract = await page.evaluate(MEASURE);
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-browse"), {
    timeout: 4000,
  });
  await sleep(500);

  const recProjectsSub3 = await record(page, "projects-to-sub3", async () => {
    await page.waitForSelector('[data-hbw-project="sub-3"]', { timeout: 8000 });
    await page.click('[data-hbw-project="sub-3"]');
    await page.waitForFunction(
      () => document.querySelector(".hbw-mark-context")?.textContent?.trim() === "SUB:3",
      { timeout: 8000 }
    );
    await page.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
    await sleep(800);
  });

  await page.screenshot({ path: join(OUT, "d-04-assembled-project.png") });
  const assembledProject = await page.evaluate(MEASURE);

  await toOutro(page);
  const recSub3Koja = await record(page, "sub3-to-koja", async () => {
    await page.waitForSelector(".hbw-outro__preview", { timeout: 8000 });
    await page.$eval(".hbw-outro__preview", (el) => el.click());
    await page.waitForFunction(
      () => document.querySelector(".hbw-mark-context")?.textContent?.trim() === "KOJA",
      { timeout: 8000 }
    );
    await sleep(800);
  });

  await page.goto(BASE + "/projects/sub-3", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".hbw-project-view.is-active", { timeout: 20000 });
  await sleep(700);

  const recReturn = await record(page, "sub3-projects-make", async () => {
    await page.click(".hbw-home-strip__exit.is-on");
    await page.waitForFunction(
      () => document.querySelector(".hbw-mark-context")?.textContent?.trim() === "Projects",
      { timeout: 8000 }
    );
    await sleep(520);
    await page.click(".hbw-mark-how");
    await page.waitForFunction(
      () => document.querySelector(".hbw-home")?.classList.contains("is-make"),
      { timeout: 8000 }
    );
    await sleep(700);
  });

  const report = {
    viewport: "1440x900",
    distributed,
    midContract,
    assembledProjects,
    assembledProject,
    recordings: {
      recMakeProjects,
      recProjectsSub3,
      recSub3Koja,
      recReturn,
    },
  };
  writeFileSync(join(OUT, "metrics.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
