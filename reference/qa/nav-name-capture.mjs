import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "nav-name");
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

function encode(dir, dest, fps = 18) {
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
  const box = (n) => {
    if (!n) return null;
    const r = n.getBoundingClientRect();
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), text: (n.querySelector(".hbw-mark-word--swap")?.textContent || n.textContent || "").trim() };
  };
  const thumbs = [...document.querySelectorAll(".hbw-nav-peek a")];
  const mark = document.querySelector(".hbw-home-strip__mark");
  return {
    intent: mark?.getAttribute("data-hbw-intent"),
    work: mark?.getAttribute("data-hbw-work"),
    identity: mark?.innerText.replace(/\\s+/g, " ").trim(),
    how: box(document.querySelector(".hbw-mark-how")),
    by: box(document.querySelector(".hbw-mark-by")),
    why: box(document.querySelector(".hbw-mark-why")),
    named: document.querySelector(".hbw-mark-by")?.classList.contains("is-named"),
    peek: {
      open: document.querySelector(".hbw-nav-peek")?.classList.contains("is-open") || false,
      thumbs: thumbs.map((a) => {
        const r = a.getBoundingClientRect();
        return { id: a.getAttribute("data-hbw-peek"), x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
      }),
    },
    sheet: document.querySelector(".hbw-sheet.is-global-right")?.classList.contains("is-preview") || false,
  };
})()`;

async function shot(page, name, report) {
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  report[name] = await page.evaluate(MEASURE);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const report = {};
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--window-size=1440,900", "--hide-scrollbars"],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await page.evaluateOnNewDocument(() => {
    try { sessionStorage.setItem("hbw.entered.v2", "1"); } catch {}
  });
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.addStyleTag({
    content: "nextjs-portal,[data-next-badge-root],[data-nextjs-toast],#nextjs-dev-indicator{display:none!important}",
  });
  await page.waitForFunction(() => document.documentElement.classList.contains("hbw-entered"), { timeout: 8000 });
  await sleep(400);

  await shot(page, "01-rest", report);

  await page.hover(".hbw-mark-by");
  await page.waitForFunction(() => document.querySelector(".hbw-nav-peek")?.classList.contains("is-open"));
  await sleep(280);
  await shot(page, "02-work-by-hbw", report);

  await page.hover('[data-hbw-peek="sub-3"]');
  await sleep(180);
  await shot(page, "03-sub3", report);

  await page.hover('[data-hbw-peek="bar-closed"]');
  await sleep(180);
  await shot(page, "04-closed", report);

  await page.hover('[data-hbw-peek="our-boy-roy"]');
  await sleep(180);
  await shot(page, "05-obr", report);

  const gap = await page.evaluate(() => {
    const a = document.querySelector('[data-hbw-peek="koja"]');
    const b = document.querySelector('[data-hbw-peek="bar-closed"]');
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    return { x: (ar.right + br.left) / 2, y: Math.min(ar.y, br.y) + 20 };
  });
  await page.mouse.move(gap.x, gap.y);
  await sleep(180);
  await shot(page, "06-between", report);

  await page.hover(".hbw-mark-why");
  await sleep(450);
  await shot(page, "07-why", report);

  await page.mouse.move(12, 400);
  await sleep(400);

  const rec = await startCapture(page, join(OUT, "frames"));
  await page.hover(".hbw-mark-how");
  await sleep(360);
  await page.hover(".hbw-mark-by");
  await sleep(280);
  for (const id of ["sub-3", "koja", "bar-closed", "chris-sisarich", "our-boy-roy"]) {
    await page.hover(`[data-hbw-peek="${id}"]`);
    await sleep(240);
  }
  const mid = await page.evaluate(() => {
    const a = document.querySelector('[data-hbw-peek="koja"]');
    const b = document.querySelector('[data-hbw-peek="bar-closed"]');
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    return { x: (ar.right + br.left) / 2, y: Math.min(ar.y, br.y) + 16 };
  });
  await page.mouse.move(mid.x, mid.y);
  await sleep(240);
  await page.hover(".hbw-mark-why");
  await sleep(500);
  await page.mouse.move(12, 400);
  await sleep(420);
  await rec.stop();
  encode(join(OUT, "frames"), join(OUT, "territories.mp4"), 18);

  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    rest: report["01-rest"]?.identity,
    by: { identity: report["02-work-by-hbw"]?.identity, thumbs: report["02-work-by-hbw"]?.peek?.thumbs },
    sub3: report["03-sub3"]?.identity,
    closed: report["04-closed"]?.identity,
    obr: report["05-obr"]?.identity,
    between: report["06-between"]?.identity,
    why: report["07-why"]?.identity,
    howX: report["02-work-by-hbw"]?.how,
    whyX: report["02-work-by-hbw"]?.why,
    namedHow: report["03-sub3"]?.how,
    namedWhy: report["03-sub3"]?.why,
  }, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
