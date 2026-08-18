import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire("/Users/markblackler/Documents/GitHub/hbw-website/package.json");
const qaRequire = createRequire("/Users/markblackler/Documents/GitHub/HBW-Site-QA/package.json");
const puppeteer = qaRequire("puppeteer-core");

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, "make-tool");
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

async function launch(width, height) {
  return puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [`--window-size=${width},${height}`, "--hide-scrollbars"],
    defaultViewport: { width, height, deviceScaleFactor: 1 },
  });
}

const TEXT_STATE = `(() => {
  const area = document.querySelector(".hbw-poster-edit");
  const objects = JSON.parse(sessionStorage.getItem("hbw.workspace.v1") || "null");
  return {
    editing: Boolean(area),
    value: area?.value || "",
    count: (area?.value.match(/e/g) || []).length,
    objectCount: objects?.poster?.objects?.length ?? null,
    active: document.activeElement === area,
    placeholder: document.querySelector(".hbw-poster-input")?.placeholder,
    inputType: document.querySelector(".hbw-poster-input")?.type,
    status: document.querySelector(".hbw-poster-send-status")?.textContent || "",
    invalid: document.querySelector(".hbw-poster-input")?.classList.contains("is-invalid") || false,
  };
})()`;

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, "type-frames"), { recursive: true });
  mkdirSync(join(OUT, "send-frames"), { recursive: true });

  const browser = await launch(1440, 900);
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("hbw.entered.v2", "1");
  });
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector(".hbw-poster-toolbar", { timeout: 8000 });
  await sleep(200);

  const rec = await startCapture(page, join(OUT, "type-frames"));
  await page.click('.hbw-poster-tool[aria-label="Write"]');
  await page.waitForFunction(() => document.querySelector(".hbw-poster-field")?.classList.contains("is-write"));
  await page.screenshot({ path: join(OUT, "01-select-text.png") });
  await page.click(".hbw-poster-field canvas", { offset: { x: 220, y: 180 } });
  await page.waitForSelector(".hbw-poster-edit", { timeout: 4000 });
  await page.waitForFunction(() => document.activeElement?.classList.contains("hbw-poster-edit"));
  await page.screenshot({ path: join(OUT, "02-place-text.png") });

  await page.type(".hbw-poster-edit", "We decide how by understanding why. The canvas holds the problem.", { delay: 12 });
  const afterType = await page.evaluate(TEXT_STATE);
  await page.screenshot({ path: join(OUT, "03-two-sentences.png") });

  await page.click(".hbw-poster-edit");
  await page.keyboard.down("Alt");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.up("Alt");
  await page.keyboard.type(" still");
  const afterEdit = await page.evaluate(TEXT_STATE);
  await page.screenshot({ path: join(OUT, "04-edit-within.png") });

  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  const afterBackspace = await page.evaluate(TEXT_STATE);
  await page.screenshot({ path: join(OUT, "05-backspace.png") });

  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("A second line.");
  const afterReturn = await page.evaluate(TEXT_STATE);
  await page.screenshot({ path: join(OUT, "06-multiline.png") });

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector(".hbw-poster-edit"), { timeout: 4000 });
  const afterExit = await page.evaluate(TEXT_STATE);
  await page.screenshot({ path: join(OUT, "07-exit.png") });

  await page.click(".hbw-poster-field canvas", { offset: { x: 230, y: 185 } });
  await page.waitForSelector(".hbw-poster-edit", { timeout: 4000 });
  await page.keyboard.press("End");
  await page.type(".hbw-poster-edit", " again");
  const afterReenter = await page.evaluate(TEXT_STATE);
  await page.screenshot({ path: join(OUT, "08-reenter.png") });
  await rec.stop();
  encode(join(OUT, "type-frames"), join(OUT, "typing.mp4"), 30);

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector(".hbw-poster-edit"), { timeout: 4000 });

  const sendRec = await startCapture(page, join(OUT, "send-frames"));
  const responses = [];
  page.on("response", async (res) => {
    if (!res.url().includes("/api/hbw/email")) return;
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    responses.push({ status: res.status(), body });
  });

  await page.click(".hbw-poster-send-open");
  await sleep(120);
  const emptySend = await page.evaluate(TEXT_STATE);
  await page.screenshot({ path: join(OUT, "09-empty-send.png") });

  await page.click(".hbw-poster-input");
  await page.keyboard.type("not-an-email");
  await page.click(".hbw-poster-send-open");
  await sleep(120);
  const badSend = await page.evaluate(TEXT_STATE);
  await page.screenshot({ path: join(OUT, "10-malformed-send.png") });

  await page.click(".hbw-poster-input", { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.keyboard.type("mark@howbywhy.com");
  await page.click(".hbw-poster-send-open");
  await page.waitForFunction(() => {
    const el = document.querySelector(".hbw-poster-send-status");
    return el && el.textContent && el.textContent !== "Sending…";
  }, { timeout: 8000 });
  const validSend = await page.evaluate(TEXT_STATE);
  await page.screenshot({ path: join(OUT, "11-valid-send.png") });
  await sleep(200);
  await sendRec.stop();
  encode(join(OUT, "send-frames"), join(OUT, "send.mp4"), 30);

  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobile.evaluateOnNewDocument(() => {
    sessionStorage.setItem("hbw.entered.v2", "1");
  });
  await mobile.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await mobile.waitForSelector(".hbw-poster-toolbar", { timeout: 8000 });
  const mobileState = await mobile.evaluate(() => {
    const input = document.querySelector(".hbw-poster-input");
    const toolbar = document.querySelector(".hbw-poster-toolbar");
    const send = document.querySelector(".hbw-poster-send-open");
    return {
      inputType: input?.type,
      inputMode: input?.getAttribute("inputmode"),
      placeholder: input?.placeholder,
      toolbar: toolbar?.getBoundingClientRect(),
      send: send?.getBoundingClientRect(),
    };
  });
  await mobile.screenshot({ path: join(OUT, "12-mobile-toolbar.png") });
  await mobile.close();
  await browser.close();

  const report = {
    typing: { afterType, afterEdit, afterBackspace, afterReturn, afterExit, afterReenter },
    send: { emptySend, badSend, validSend, responses },
    mobile: mobileState,
  };
  writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
