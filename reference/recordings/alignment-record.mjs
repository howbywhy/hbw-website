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
  const userData = mkdtempSync(join(tmpdir(), "hbw-a-"));
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
  await sleep(320);
  return { chrome, ws, cdp, evalExpr };
}

const SNAP = `(() => {
  function box(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right) };
  }
  const peek = document.querySelector(".hbw-nav-peek");
  const thumbs = [...document.querySelectorAll(".hbw-nav-peek a")];
  const peekName = document.querySelector(".hbw-nav-peek__name");
  const inspector = document.querySelector(".hbw-inspector.is-visible");
  const overlay = document.querySelector(".hbw-inspector.is-overlay.is-visible");
  const record = document.querySelector(".hbw-browse__record");
  const cells = [...document.querySelectorAll(".hbw-browse__cell")];
  const indexName = document.querySelector(".hbw-browse__row-name");
  const indexYear = document.querySelector(".hbw-browse__row-year");
  const visual = [...document.querySelectorAll(".hbw-nav-sub__browse button")].find((n) => n.textContent.trim() === "Visual");
  const indexBtn = [...document.querySelectorAll(".hbw-nav-sub__browse button")].find((n) => n.textContent.trim() === "Index");
  const projectsBtn = document.querySelector(".hbw-nav-projects__hit");
  const methodBtn = [...document.querySelectorAll(".hbw-home-strip__nav > button")].find((n) => n.textContent.trim() === "Method");
  const mark = document.querySelector(".hbw-home-strip__mark");
  const times = document.querySelector(".hbw-home-strip__times");
  const project = document.querySelector(".hbw-home-strip__project");
  const identity = document.querySelector(".hbw-home-strip__identity");
  const mv = [...document.querySelectorAll(".hbw-mv")];
  const last = mv[mv.length - 1];
  const outroId = document.querySelector(".hbw-outro__id");
  const outroPreview = document.querySelector(".hbw-outro__preview");
  const stage = document.querySelector(".hbw-project-view");
  const track = document.querySelector(".hbw-project-view__track");
  const cellYs = [...new Set(cells.map((el) => Math.round(el.getBoundingClientRect().top)))].sort((a, b) => a - b);
  const cellXs = cells.filter((el) => Math.round(el.getBoundingClientRect().top) === cellYs[0]).length;
  const cell = cells[0] ? box(cells[0]) : null;
  const films = [...document.querySelectorAll(".hbw-mv__film")].map((el) => {
    const poster = el.querySelector(".hbw-mv__poster");
    const video = el.querySelector("video");
    const fallback = el.querySelector("img.hbw-mv__media");
    const posterOn = poster && Number(getComputedStyle(poster).opacity) > 0.05 && poster.naturalWidth > 0;
    const videoReady = video && video.readyState >= 2 && video.videoWidth > 0;
    const imgOn = fallback && fallback.naturalWidth > 0;
    return { blank: !(posterOn || videoReady || imgOn) };
  });
  return {
    url: location.pathname + location.search,
    mode: document.querySelector(".hbw-home")?.className || null,
    identity: ((mark?.textContent || "") + " " + (times?.textContent || "") + " " + (project?.textContent || "")).replace(/\\s+/g, " ").trim(),
    identityOn: identity?.classList.contains("is-on") || false,
    markSize: mark ? getComputedStyle(mark).fontSize : null,
    timesSize: times ? getComputedStyle(times).fontSize : null,
    projectSize: project ? getComputedStyle(project).fontSize : null,
    gapMarkTimes: mark && times ? Math.round(times.getBoundingClientRect().left - mark.getBoundingClientRect().right) : null,
    gapTimesName: times && project && project.textContent.trim() ? Math.round(project.getBoundingClientRect().left - times.getBoundingClientRect().right) : null,
    brand: box(document.querySelector(".hbw-home-strip__brand")),
    projects: box(projectsBtn),
    method: box(methodBtn),
    time: box(document.querySelector(".hbw-home-strip__time")),
    window: box(document.querySelector(".hbw-window")),
    headerH: Math.round(document.querySelector(".hbw-home-strip")?.getBoundingClientRect().height || 0),
    peekOpen: peek?.classList.contains("is-open") || false,
    peekCount: thumbs.length,
    peekSize: thumbs[0] ? box(thumbs[0]) : null,
    peekGap: thumbs.length > 1 ? Math.round(thumbs[1].getBoundingClientRect().left - thumbs[0].getBoundingClientRect().right) : null,
    peekName: peekName?.textContent.trim() || "",
    peekNameShown: peekName?.classList.contains("is-shown") || false,
    peekBox: box(peek?.querySelector(".hbw-nav-peek__row")),
    visual: box(visual),
    indexBtn: box(indexBtn),
    preview: box(document.querySelector(".hbw-browse__figure")),
    record: !!record && getComputedStyle(record).display !== "none",
    recordBox: box(record),
    gridCols: cellXs,
    cell,
    cellRatio: cell && cell.h ? Math.round((cell.w / cell.h) * 100) / 100 : null,
    indexName: box(indexName),
    indexYear: box(indexYear),
    counter: document.querySelector('.hbw-nav-sub[data-face="view"] .hbw-nav-sub__meta')?.textContent.trim() || null,
    stage: box(stage),
    trackX: track ? track.style.transform : null,
    inspector: !!inspector,
    overlay: !!overlay,
    inspectorBox: box(inspector),
    inspectBg: inspector ? getComputedStyle(inspector).backgroundColor : null,
    lastMv: box(last),
    outroId: box(outroId),
    outroPreview: box(outroPreview),
    outroName: document.querySelector(".hbw-outro__name")?.textContent.trim() || null,
    stage1: last && outroId ? Math.round(outroId.getBoundingClientRect().left - last.getBoundingClientRect().right) : null,
    stage2: outroId && outroPreview ? Math.round(outroPreview.getBoundingClientRect().left - outroId.getBoundingClientRect().right) : null,
    films,
    blank: films.some((f) => f.blank),
    browserX: document.querySelector(".hbw-home") ? getComputedStyle(document.querySelector(".hbw-home")).getPropertyValue("--hbw-browser-x").trim() : null,
  };
})()`;

const dir = join(OUT, "frames-alignment-desktop");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const s = await session(9540, "1440,900", BASE + "/");
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
await rec(400);
const peekOpen = await s.evalExpr(SNAP);
if (peekOpen.peekBox) {
  const thumbs = 6;
  for (let i = 0; i < thumbs; i++) {
    await hoverXY(peekOpen.peekBox.x + 16 + i * (peekOpen.peekSize.w + (peekOpen.peekGap || 6)), peekOpen.peekBox.y + 16);
    await rec(160);
  }
}
const peekNamed = await s.evalExpr(SNAP);

await hoverXY(home.projects.x + 20, home.projects.y + 8);
await rec(200);
await click(".hbw-nav-projects__hit", "Projects");
await rec(520);
const visual = await s.evalExpr(SNAP);

await hoverXY(visual.projects.x + 20, visual.projects.y + 8);
await rec(320);
const peekInBrowse = await s.evalExpr(SNAP);
await hoverXY(visual.visual.x + 16, visual.visual.y + 6);
await rec(240);
const peekClosedVisual = await s.evalExpr(SNAP);
await hoverXY(visual.projects.x + 20, visual.projects.y + 8);
await rec(280);
await hoverXY(visual.indexBtn.x + 16, visual.indexBtn.y + 6);
await rec(240);
const peekClosedIndex = await s.evalExpr(SNAP);

for (const id of ["koja", "bar-closed", "chris-sisarich"]) {
  await s.evalExpr(`(() => {
    const el = document.querySelector(${JSON.stringify(`.hbw-browse__cell[data-hbw-project="${id}"]`)});
    el?.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    el?.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    return true;
  })()`);
  await rec(140);
}

await click(".hbw-nav-sub button", "Index");
await rec(280);
const index = await s.evalExpr(SNAP);

await click(".hbw-nav-sub button", "Visual");
await rec(200);
await s.evalExpr(`document.querySelector('.hbw-browse__cell[data-hbw-project="bar-closed"]')?.click()`);
await rec(1100);
const closed = await s.evalExpr(SNAP);

const wheelQa = await s.evalExpr(`(() => {
  const stage = document.querySelector(".hbw-project-view");
  const track = document.querySelector(".hbw-project-view__track");
  if (!stage || !track) return { ok: false };
  const before = track.style.transform;
  stage.dispatchEvent(new WheelEvent("wheel", { deltaY: 160, bubbles: true, cancelable: true }));
  const mid = track.style.transform;
  return new Promise((resolve) => {
    setTimeout(() => {
      const after = track.style.transform;
      resolve({ before, mid, after, moved: before !== mid, settled: mid === after });
    }, 420);
  });
})()`, true);
await rec(180);

await click(".hbw-nav-sub button", "Info");
await rec(700);
const infoOpen = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-inspector:not(.is-overlay) .hbw-inspector__close")?.click()`);
await rec(600);
const infoClosed = await s.evalExpr(SNAP);

for (let i = 0; i < 16; i++) {
  await s.evalExpr(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))`);
  await rec(120);
}
const boundary = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-outro__id")?.click()`);
await rec(900);
const next = await s.evalExpr(SNAP);

await click(".hbw-home-strip__nav > button", "Method");
await rec(520);
const method = await s.evalExpr(SNAP);
await s.evalExpr(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
await rec(360);

await click(".hbw-nav-projects__hit", "Projects");
await rec(500);
const backProjects = await s.evalExpr(SNAP);

s.ws.close();
s.chrome.kill();

const axis = (a, b) => a != null && b != null && Math.abs(a - b) <= 2;
const report = {
  frames: n,
  home,
  peekOpen,
  peekNamed,
  visual,
  peekInBrowse,
  peekClosedVisual,
  peekClosedIndex,
  index,
  closed,
  wheelQa,
  infoOpen,
  infoClosed,
  boundary,
  next,
  method,
  backProjects,
  gates: {
    identitySpaced: closed.gapMarkTimes >= 6 && closed.gapMarkTimes <= 10 && closed.gapTimesName >= 6 && closed.gapTimesName <= 10,
    identityOneLine: closed.identity === "How by Why × CLOSED",
    identityLarge: closed.markSize === closed.timesSize && closed.timesSize === closed.projectSize,
    noViewRecord: closed.record === false,
    browseRecord: visual.record === true,
    peekUnderProjects: peekOpen.peekBox && axis(peekOpen.peekBox.x, peekOpen.projects.x),
    peekSmall: peekOpen.peekSize?.h >= 36 && peekOpen.peekSize?.h <= 44,
    peekGap: peekOpen.peekGap >= 5 && peekOpen.peekGap <= 6,
    peekLabel: /KOJA|CLOSED|SUB:3|Our Boy Roy|Chris Sisarich|Bistro Nido/.test(peekNamed.peekName) && peekNamed.peekName.includes("—"),
    peekClosesVisual: peekClosedVisual.peekOpen === false,
    peekClosesIndex: peekClosedIndex.peekOpen === false,
    visualFour: visual.gridCols === 4,
    visual45: visual.cellRatio >= 0.78 && visual.cellRatio <= 0.82,
    thumbScale: visual.cell?.w >= 120 && visual.cell?.w <= 155,
    axisLock: axis(visual.projects?.x, visual.cell?.x) && axis(visual.cell?.x, index.indexName?.x) && axis(visual.visual?.x, visual.cell?.x),
    yearRight: index.indexYear?.r >= 1418 && index.indexYear?.r <= 1432,
    noSnap: wheelQa?.moved === true && wheelQa?.settled === true,
    infoSplit: infoOpen.inspector === true && infoOpen.inspectBg === "rgb(255, 255, 255)",
    methodWhite: method.overlay === true && method.inspectBg === "rgb(255, 255, 255)",
    stage1: boundary.stage1 >= 90 && boundary.stage1 <= 104,
    stage2: boundary.stage2 >= 24 && boundary.stage2 <= 40,
    headerLocked: home.projects?.x === closed.projects?.x && home.method?.x === closed.method?.x && home.window?.y === closed.window?.y,
  },
};
writeFileSync(join(OUT, "alignment-pass-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.gates, null, 2));
console.log("identity", closed.identity, "gaps", closed.gapMarkTimes, closed.gapTimesName, "peekH", peekOpen.peekSize?.h, "cell", visual.cell, "axis", visual.projects?.x, visual.cell?.x, index.indexName?.x);

if (existsSync(FFMPEG) && n > 4) {
  const mp4 = join(OUT, "hbw-alignment-desktop.mp4");
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
