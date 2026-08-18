import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "nav-preview");
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

function encode(dir, dest, fps = 20) {
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
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
  };
  const how = document.querySelector(".hbw-mark-how");
  const by = document.querySelector(".hbw-mark-by");
  const why = document.querySelector(".hbw-mark-why");
  const peek = document.querySelector(".hbw-nav-peek");
  const thumbs = [...document.querySelectorAll(".hbw-nav-peek a")];
  const name = document.querySelector(".hbw-nav-peek__name");
  const sheet = document.querySelector(".hbw-sheet.is-global-right");
  const row = document.querySelector(".hbw-nav-peek__row");
  const gap = thumbs[0] && thumbs[1]
    ? +(thumbs[1].getBoundingClientRect().x - thumbs[0].getBoundingClientRect().right).toFixed(1)
    : null;
  return {
    intent: document.querySelector(".hbw-home-strip__mark")?.getAttribute("data-hbw-intent"),
    identity: document.querySelector(".hbw-home-strip__mark")?.innerText.replace(/\\s+/g, " ").trim(),
    home: document.querySelector(".hbw-home")?.className,
    how: box(how), by: box(by), why: box(why),
    peek: peek ? {
      open: peek.classList.contains("is-open"),
      ...box(peek),
      row: box(row),
      gap,
      count: thumbs.length,
      thumbs: thumbs.map((a) => {
        const r = a.getBoundingClientRect();
        const img = a.querySelector("img");
        return {
          id: a.getAttribute("data-hbw-peek"),
          active: a.getAttribute("data-hbw-peek-active"),
          x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
          src: (img?.currentSrc || img?.src || "").replace("http://127.0.0.1:3000", ""),
        };
      }),
      name: name ? { ...box(name), text: name.textContent.trim(), on: name.classList.contains("is-on") } : null,
    } : null,
    sheet: sheet ? {
      preview: sheet.getAttribute("data-hbw-sheet-preview"),
      cls: sheet.className,
      ...box(sheet),
      exposed: +(Math.min(innerWidth, sheet.getBoundingClientRect().right) - Math.max(0, sheet.getBoundingClientRect().x)).toFixed(1),
    } : null,
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
  await shot(page, "02-by-hover", report);

  await page.hover('[data-hbw-peek="sub-3"]');
  await sleep(180);
  await shot(page, "03-sub3-name", report);

  await page.hover('[data-hbw-peek="bar-closed"]');
  await sleep(180);
  await shot(page, "04-closed-name", report);

  await page.hover('[data-hbw-peek="our-boy-roy"]');
  await sleep(180);
  await shot(page, "05-obr-name", report);

  const byBox = await page.evaluate(() => {
    const el = document.querySelector(".hbw-mark-by");
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.move(byBox.x, byBox.y);
  await sleep(200);
  const peekMid = await page.evaluate(() => {
    const el = document.querySelector(".hbw-nav-peek");
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + 40 };
  });
  await page.mouse.move(peekMid.x, peekMid.y, { steps: 8 });
  await sleep(160);
  await shot(page, "06-pointer-into-field", report);

  await page.mouse.move(12, 400);
  await sleep(400);
  await shot(page, "12-return-rest-mid", report);

  const rec = await startCapture(page, join(OUT, "frames-system"));
  await page.hover(".hbw-mark-how");
  await sleep(320);
  await page.hover(".hbw-mark-by");
  await sleep(280);
  for (const id of ["sub-3", "koja", "bar-closed", "chris-sisarich", "our-boy-roy"]) {
    await page.hover(`[data-hbw-peek="${id}"]`);
    await sleep(220);
  }
  await page.mouse.move(12, 400);
  await sleep(420);
  await page.hover(".hbw-mark-why");
  await sleep(120);
  await shot(page, "07-why-early", report);
  await sleep(320);
  await shot(page, "08-why-settled", report);

  const sheetPoint = await page.evaluate(() => {
    const el = document.querySelector(".hbw-sheet.is-global-right");
    const r = el.getBoundingClientRect();
    return { x: r.x + Math.min(80, r.width / 2), y: Math.max(120, r.y + 140) };
  });
  await page.mouse.move(sheetPoint.x, sheetPoint.y, { steps: 6 });
  await sleep(200);
  await shot(page, "09-pointer-onto-sheet", report);

  await page.mouse.click(sheetPoint.x, sheetPoint.y);
  await sleep(120);
  await shot(page, "10-partial-to-full", report);
  await page.waitForFunction(() => document.querySelector(".hbw-home")?.classList.contains("is-studio"), { timeout: 5000 });
  await sleep(420);
  await shot(page, "11-full-practice", report);

  await page.click(".hbw-nav-studio.is-sheet-close");
  await sleep(450);
  await rec.stop();
  encode(join(OUT, "frames-system"), join(OUT, "system-sequence.mp4"), 18);

  await page.mouse.move(12, 400);
  await sleep(200);
  await shot(page, "12-resting", report);

  const sameSheet = await page.evaluate(() => {
    const a = document.querySelector(".hbw-sheet.is-global-right");
    return a ? a.getAttribute("data-hbw-sheet") : null;
  });
  report.sameDomSheet = sameSheet;

  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    rest: report["01-rest"]?.identity,
    by: report["02-by-hover"]?.peek,
    sub3: report["03-sub3-name"]?.peek?.name,
    closed: report["04-closed-name"]?.peek?.name,
    obr: report["05-obr-name"]?.peek?.name,
    whyEarly: report["07-why-early"]?.sheet,
    whySettled: report["08-why-settled"]?.sheet,
    onto: report["09-pointer-onto-sheet"]?.sheet,
    partial: report["10-partial-to-full"]?.sheet,
    full: report["11-full-practice"]?.sheet,
    rest2: report["12-resting"]?.identity,
  }, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
