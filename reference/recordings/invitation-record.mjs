import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://127.0.0.1:3000";
const OUT = "/Users/markblackler/Documents/GitHub/hbw-website/reference/recordings";
const FFMPEG = "/tmp/ffm/node_modules/ffmpeg-static/ffmpeg";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function session(port, size, url) {
  const userData = mkdtempSync(join(tmpdir(), "hbw-i-"));
  const chrome = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userData}`,
    "--no-first-run",
    "--disable-gpu",
    `--window-size=${size}`,
    url,
  ], { stdio: "ignore" });
  let list = [];
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        list = await res.json();
        if (list.find((t) => t.type === "page" && t.webSocketDebuggerUrl && String(t.url).includes("127.0.0.1"))) break;
      }
    } catch {}
    await sleep(120);
  }
  const page = list.find((t) => t.type === "page" && String(t.url).includes("127.0.0.1"));
  if (!page) throw new Error("no page on " + port);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (!msg.id || !pending.has(msg.id)) return;
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  });
  function cdp(method, params = {}) {
    const next = ++id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(next);
        reject(new Error("timeout " + method));
      }, 14000);
      pending.set(next, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      ws.send(JSON.stringify({ id: next, method, params }));
    });
  }
  await cdp("Page.enable");
  await cdp("Runtime.enable");
  async function evalExpr(expression, awaitPromise = false) {
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise });
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || "eval");
        return result.result?.value;
      } catch (err) {
        const text = String(err.message || err);
        if (!/context was destroyed|Cannot find context|Not attached|timeout Runtime|SyntaxError/i.test(text) || attempt === 5) {
          throw err;
        }
        await sleep(180);
      }
    }
  }
  await evalExpr(`new Promise((r) => { const go = () => document.querySelector(".hbw-home-strip") ? r(true) : setTimeout(go, 40); go(); })`, true);
  await sleep(250);
  return { chrome, ws, cdp, evalExpr };
}

const SNAP = `(() => {
  function box(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right) };
  }
  const peek = document.querySelector(".hbw-nav-peek");
  const thumbs = [...document.querySelectorAll(".hbw-nav-peek a img")];
  const intro = document.querySelector(".hbw-poster-intro");
  const panel = document.querySelector(".hbw-panel.is-visible");
  return {
    url: location.pathname + location.search,
    mode: document.querySelector(".hbw-home")?.className || null,
    intro: !!intro,
    peekOpen: peek?.classList.contains("is-open") || false,
    peekCount: thumbs.length,
    peekSize: thumbs[0] ? { w: Math.round(thumbs[0].getBoundingClientRect().width), h: Math.round(thumbs[0].getBoundingClientRect().height) } : null,
    peek: box(peek),
    brand: box(document.querySelector(".hbw-home-strip__brand")),
    projects: box([...document.querySelectorAll(".hbw-nav-projects > button")].find((n) => n.textContent.trim() === "Projects")),
    method: box([...document.querySelectorAll(".hbw-home-strip__nav > button")].find((n) => n.textContent.trim() === "Method")),
    time: box(document.querySelector(".hbw-home-strip__time")),
    window: box(document.querySelector(".hbw-window")),
    headerH: Math.round(document.querySelector(".hbw-home-strip")?.getBoundingClientRect().height || 0),
    panel: !!panel,
    counter: document.querySelector('.hbw-nav-sub[data-face="view"] .hbw-nav-sub__meta')?.textContent.trim() || null,
    viewPhase: document.querySelector(".hbw-project-view")?.className || null,
  };
})()`;

const dir = join(OUT, "frames-invitation-desktop");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const s = await session(9491, "1440,900", BASE + "/");
let n = 0;
async function shot() {
  try {
    const { data } = await s.cdp("Page.captureScreenshot", { format: "jpeg", quality: 72 });
    n += 1;
    writeFileSync(join(dir, `f${String(n).padStart(5, "0")}.jpg`), Buffer.from(data, "base64"));
  } catch (err) {
    console.log("shot skip", String(err.message || err).slice(0, 80));
  }
}
async function rec(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    await shot();
    await sleep(70);
  }
}
async function click(selector, text) {
  await s.evalExpr(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((n) => (n.textContent || "").trim() === ${JSON.stringify(text)});
    if (!el) throw new Error("missing " + ${JSON.stringify(text)});
    el.click();
    return true;
  })()`);
}

async function hoverXY(x, y) {
  await s.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
}

const home = await s.evalExpr(SNAP);
await rec(280);

await hoverXY(home.projects.x + 20, home.projects.y + 8);
await rec(450);
const peekOpen = await s.evalExpr(SNAP);

for (const name of ["SUB:3", "KOJA", "CLOSED", "Our Boy Roy", "Chris Sisarich", "Bistro Nido"]) {
  const box = await s.evalExpr(`(() => {
    const el = [...document.querySelectorAll(".hbw-nav-peek a")].find((c) => c.getAttribute("aria-label") === ${JSON.stringify(name)});
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  await hoverXY(box.x, box.y);
  await rec(140);
}

await hoverXY(20, 200);
await rec(280);
const peekClosed = await s.evalExpr(SNAP);

await hoverXY(home.projects.x + 20, home.projects.y + 8);
await sleep(180);
await s.evalExpr(`document.querySelector('.hbw-nav-peek a[aria-label="SUB:3"]')?.click()`);
await rec(900);
const sub3 = await s.evalExpr(SNAP);

await click(".hbw-nav-projects > button", "Projects");
await rec(500);
const visual = await s.evalExpr(SNAP);
await click(".hbw-nav-sub button", "Index");
await rec(280);
for (const name of ["KOJA", "CLOSED", "Our Boy Roy"]) {
  await s.evalExpr(`(() => {
    const el = [...document.querySelectorAll(".hbw-browse__row")].find((c) => c.querySelector(".hbw-browse__row-name")?.textContent.trim() === ${JSON.stringify(name)});
    el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    el.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    return true;
  })()`);
  await rec(140);
}
await click(".hbw-home-strip__brand", "How by Why");
await rec(500);

await hoverXY(home.projects.x + 20, home.projects.y + 8);
await sleep(160);
await s.evalExpr(`document.querySelector('.hbw-nav-peek a[aria-label="KOJA"]')?.click()`);
await rec(900);
const koja = await s.evalExpr(SNAP);

await s.evalExpr(`document.querySelector('.hbw-nav-sub__view button')?.click()`);
await rec(400);
const info = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-nav-projects")?.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }))`);
await rec(250);
const peekDuringInfo = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-panel .hbw-panel__close, .hbw-panel button")?.click() || document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
await rec(350);
await click(".hbw-nav-projects > button", "Projects");
await rec(500);
await click(".hbw-home-strip__brand", "How by Why");
await rec(400);
const end = await s.evalExpr(SNAP);

s.ws.close();
s.chrome.kill();

const report = {
  frames: n,
  home,
  peekOpen,
  peekClosed,
  sub3,
  visual,
  koja,
  info,
  peekDuringInfo,
  end,
  gates: {
    introGone: !home.intro,
    peekAppears: peekOpen.peekOpen === true && peekOpen.peekCount === 6,
    peekCloses: peekClosed.peekOpen === false,
    headerLocked:
      home.projects?.x === peekOpen.projects?.x &&
      home.projects?.y === peekOpen.projects?.y &&
      home.window?.y === peekOpen.window?.y &&
      home.window?.y === sub3.window?.y,
    peekDoesNotLiftHeader: home.headerH === peekOpen.headerH,
    peekSuppressedInView: sub3.peekOpen === false,
    peekSuppressedInInfo: peekDuringInfo.peekOpen === false,
    peekHeight: peekOpen.peekSize?.h,
  },
};
writeFileSync(join(OUT, "invitation-pass-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.gates, null, 2));
console.log("peekSize", peekOpen.peekSize, "frames", n);

if (existsSync(FFMPEG) && n > 4) {
  const mp4 = join(OUT, "hbw-invitation-desktop.mp4");
  await new Promise((resolve, reject) => {
    const ff = spawn(FFMPEG, [
      "-y",
      "-framerate", "12",
      "-i", join(dir, "f%05d.jpg"),
      "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      mp4,
    ], { stdio: "inherit" });
    ff.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("ffmpeg " + code))));
  });
  console.log("wrote", mp4);
}
