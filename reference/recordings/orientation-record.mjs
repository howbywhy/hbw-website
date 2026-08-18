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
  const userData = mkdtempSync(join(tmpdir(), "hbw-o-"));
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
  function cdp(method, params = {}, timeout = 16000) {
    const next = ++id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(next);
        reject(new Error("timeout " + method));
      }, timeout);
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
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise });
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || "eval");
        return result.result?.value;
      } catch (err) {
        const text = String(err.message || err);
        if (!/context was destroyed|Cannot find context|Not attached|timeout Runtime|SyntaxError/i.test(text) || attempt === 7) {
          throw err;
        }
        await sleep(180);
      }
    }
  }
  await evalExpr(`new Promise((r) => { const go = () => document.querySelector(".hbw-home-strip") ? r(true) : setTimeout(go, 40); go(); })`, true);
  await sleep(280);
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
  const labels = [...document.querySelectorAll(".hbw-nav-peek__label")].map((n) => n.textContent.trim());
  const panel = document.querySelector(".hbw-panel.is-visible");
  const preview = document.querySelector(".hbw-browse__figure");
  const indexName = document.querySelector(".hbw-browse__row-name");
  const indexYear = document.querySelector(".hbw-browse__row-year");
  const visual = [...document.querySelectorAll(".hbw-nav-sub__browse button")].find((n) => n.textContent.trim() === "Visual");
  const mv = [...document.querySelectorAll(".hbw-mv")];
  const last = mv[mv.length - 1];
  const outro = document.querySelector(".hbw-outro");
  const films = [...document.querySelectorAll(".hbw-mv__film")].map((el) => {
    const poster = el.querySelector(".hbw-mv__poster");
    const video = el.querySelector("video");
    const fallback = el.querySelector("img.hbw-mv__media");
    const posterOn = poster && Number(getComputedStyle(poster).opacity) > 0.05 && poster.naturalWidth > 0;
    const videoReady = video && video.readyState >= 2 && video.videoWidth > 0;
    const imgOn = fallback && fallback.naturalWidth > 0;
    return { posterOn: !!posterOn, videoReady: !!videoReady, blank: !(posterOn || videoReady || imgOn) };
  });
  return {
    url: location.pathname + location.search,
    mode: document.querySelector(".hbw-home")?.className || null,
    peekOpen: peek?.classList.contains("is-open") || false,
    peekCount: thumbs.length,
    peekLabels: labels,
    peekSize: thumbs[0] ? { w: Math.round(thumbs[0].getBoundingClientRect().width), h: Math.round(thumbs[0].getBoundingClientRect().height) } : null,
    peekYs: thumbs.map((img) => Math.round(img.getBoundingClientRect().top)),
    brand: box(document.querySelector(".hbw-home-strip__mark")),
    brandBtn: box(document.querySelector(".hbw-home-strip__brand")),
    times: document.querySelector(".hbw-home-strip__times")?.classList.contains("is-on") || false,
    projectName: document.querySelector(".hbw-home-strip__project.is-on")?.textContent.trim() || "",
    projectNameBox: box(document.querySelector(".hbw-home-strip__project")),
    projects: box([...document.querySelectorAll(".hbw-nav-projects > button")].find((n) => n.textContent.trim() === "Projects")),
    method: box([...document.querySelectorAll(".hbw-home-strip__nav > button")].find((n) => n.textContent.trim() === "Method")),
    time: box(document.querySelector(".hbw-home-strip__time")),
    window: box(document.querySelector(".hbw-window")),
    headerH: Math.round(document.querySelector(".hbw-home-strip")?.getBoundingClientRect().height || 0),
    panel: !!panel,
    panelBox: box(panel),
    preview: box(preview),
    visual: box(visual),
    indexName: box(indexName),
    indexYear: box(indexYear),
    counter: document.querySelector('.hbw-nav-sub[data-face="view"] .hbw-nav-sub__meta')?.textContent.trim() || null,
    viewPhase: document.querySelector(".hbw-project-view")?.className || null,
    lastMv: box(last),
    outro: box(outro),
    outroName: document.querySelector(".hbw-outro__name")?.textContent.trim() || null,
    gap: last && outro ? Math.round(outro.getBoundingClientRect().left - last.getBoundingClientRect().right) : null,
    films,
    blank: films.some((f) => f.blank),
  };
})()`;

const dir = join(OUT, "frames-orientation-desktop");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const s = await session(9511, "1440,900", BASE + "/");
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
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((n) => (n.textContent || "").includes(${JSON.stringify(text)}));
    if (!el) throw new Error("missing " + ${JSON.stringify(text)});
    el.click();
    return true;
  })()`);
}
async function hoverXY(x, y) {
  await s.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
}

const home = await s.evalExpr(SNAP);
await rec(240);

await hoverXY(home.projects.x + 20, home.projects.y + 8);
await rec(420);
const peekOpen = await s.evalExpr(SNAP);

await click(".hbw-nav-projects > button", "Projects");
await rec(520);
const visual = await s.evalExpr(SNAP);

await click(".hbw-nav-sub button", "Index");
await rec(280);
const index = await s.evalExpr(SNAP);
for (const name of ["SUB:3", "KOJA", "CLOSED", "Our Boy Roy", "Chris Sisarich", "Bistro Nido"]) {
  await s.evalExpr(`(() => {
    const el = [...document.querySelectorAll(".hbw-browse__row")].find((c) => c.querySelector(".hbw-browse__row-name")?.textContent.trim() === ${JSON.stringify(name)});
    el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    el.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    return true;
  })()`);
  await rec(120);
}
const indexHover = await s.evalExpr(SNAP);

await click(".hbw-nav-sub button", "Visual");
await rec(240);
await s.evalExpr(`document.querySelector('.hbw-browse__cell[data-hbw-project="sub-3"]')?.click()`);
await rec(1100);
const sub3 = await s.evalExpr(SNAP);

for (let i = 0; i < 12; i++) {
  await s.evalExpr(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))`);
  await rec(160);
}
const boundary = await s.evalExpr(SNAP);

await s.evalExpr(`document.querySelector(".hbw-outro__door")?.click()`);
await rec(900);
const koja = await s.evalExpr(SNAP);

await click(".hbw-home-strip__nav > button", "Method");
await rec(500);
const method = await s.evalExpr(SNAP);
await s.evalExpr(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
await rec(400);
const methodClosed = await s.evalExpr(SNAP);

await click(".hbw-nav-projects > button", "Projects");
await rec(520);
const backProjects = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-home-strip__brand")?.click()`);
await rec(500);
const end = await s.evalExpr(SNAP);

const videoQa = [];
for (const slug of ["sub-3", "koja", "bar-closed", "our-boy-roy", "chris-sisarich", "bistro-nido"]) {
  const href = slug === "sub-3" || slug === "bar-closed" || slug === "our-boy-roy" || slug === "chris-sisarich" || slug === "bistro-nido"
    ? `/projects/${slug}`
    : `/${slug}`;
  await s.cdp("Page.navigate", { url: BASE + href });
  await sleep(900);
  const t0 = Date.now();
  let snap = await s.evalExpr(SNAP);
  const posterAt = Date.now() - t0;
  await sleep(700);
  snap = await s.evalExpr(SNAP);
  videoQa.push({
    slug,
    projectName: snap.projectName,
    times: snap.times,
    counter: snap.counter,
    blank: snap.blank,
    films: snap.films.slice(0, 3),
    posterMs: posterAt,
    headerY: snap.brand?.y,
    windowY: snap.window?.y,
  });
  await rec(180);
}

s.ws.close();
s.chrome.kill();

const report = {
  frames: n,
  home,
  peekOpen,
  visual,
  index,
  indexHover,
  sub3,
  boundary,
  koja,
  method,
  methodClosed,
  backProjects,
  end,
  videoQa,
  gates: {
    peekSmall: peekOpen.peekSize?.h >= 60 && peekOpen.peekSize?.h <= 76,
    peekNamed: peekOpen.peekLabels?.length === 6 && peekOpen.peekLabels.includes("SUB:3"),
    peekFlat: peekOpen.peekYs && new Set(peekOpen.peekYs).size === 1,
    previewWidth: visual.preview?.w,
    previewInRange: visual.preview?.w >= 430 && visual.preview?.w <= 510,
    indexAlign: index.indexName && index.visual ? Math.abs(index.indexName.x - index.visual.x) <= 24 : false,
    yearRight: index.indexYear?.r >= 1418 && index.indexYear?.r <= 1432,
    identityA: sub3.times === true && sub3.projectName === "SUB:3",
    headerLocked:
      home.brand?.y === visual.brand?.y &&
      home.brand?.y === sub3.brand?.y &&
      home.projects?.y === visual.projects?.y &&
      home.method?.y === sub3.method?.y &&
      home.time?.y === sub3.time?.y &&
      home.window?.y === sub3.window?.y &&
      home.headerH === sub3.headerH,
    boundaryGap: boundary.gap,
    boundaryNamed: boundary.outroName === "KOJA",
    kojaContinues: koja.projectName === "KOJA" && koja.counter?.startsWith("01"),
    methodOpens: method.panel === true && method.panelBox?.x < 1400 && method.panelBox?.w > 200,
    methodCloses: methodClosed.panel === false && methodClosed.projectName === "KOJA",
    noBlankOpen: videoQa.every((row) => row.blank === false),
  },
};
writeFileSync(join(OUT, "orientation-pass-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.gates, null, 2));
console.log("peek", peekOpen.peekSize, "preview", visual.preview?.w, "gap", boundary.gap, "frames", n);

if (existsSync(FFMPEG) && n > 4) {
  const mp4 = join(OUT, "hbw-orientation-desktop.mp4");
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
