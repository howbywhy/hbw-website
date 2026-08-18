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
  const userData = mkdtempSync(join(tmpdir(), "hbw-g-"));
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
  const peekName = document.querySelector(".hbw-nav-peek__name");
  const inspector = document.querySelector(".hbw-inspector.is-visible");
  const panel = document.querySelector(".hbw-panel.is-visible");
  const preview = document.querySelector(".hbw-browse__figure");
  const cells = [...document.querySelectorAll(".hbw-browse__cell")];
  const indexName = document.querySelector(".hbw-browse__row-name");
  const indexYear = document.querySelector(".hbw-browse__row-year");
  const visual = [...document.querySelectorAll(".hbw-nav-sub__browse button")].find((n) => n.textContent.trim() === "Visual");
  const indexBtn = [...document.querySelectorAll(".hbw-nav-sub__browse button")].find((n) => n.textContent.trim() === "Index");
  const projectsBtn = document.querySelector(".hbw-nav-projects__hit > button");
  const methodBtn = [...document.querySelectorAll(".hbw-home-strip__nav > button")].find((n) => n.textContent.trim() === "Method");
  const mark = document.querySelector(".hbw-home-strip__mark");
  const identity = document.querySelector(".hbw-home-strip__identity");
  const mv = [...document.querySelectorAll(".hbw-mv")];
  const last = mv[mv.length - 1];
  const outro = document.querySelector(".hbw-outro");
  const outroId = document.querySelector(".hbw-outro__id");
  const outroPreview = document.querySelector(".hbw-outro__preview");
  const stage = document.querySelector(".hbw-project-view");
  const track = document.querySelector(".hbw-project-view__track");
  const films = [...document.querySelectorAll(".hbw-mv__film")].map((el) => {
    const poster = el.querySelector(".hbw-mv__poster");
    const video = el.querySelector("video");
    const fallback = el.querySelector("img.hbw-mv__media");
    const posterOn = poster && Number(getComputedStyle(poster).opacity) > 0.05 && poster.naturalWidth > 0;
    const videoReady = video && video.readyState >= 2 && video.videoWidth > 0;
    const imgOn = fallback && fallback.naturalWidth > 0;
    return { posterOn: !!posterOn, videoReady: !!videoReady, blank: !(posterOn || videoReady || imgOn), paused: video ? video.paused : null, t: video ? Math.round(video.currentTime * 10) / 10 : null };
  });
  const cellYs = [...new Set(cells.map((el) => Math.round(el.getBoundingClientRect().top)))].sort((a, b) => a - b);
  const cellXs = cells.filter((el) => Math.round(el.getBoundingClientRect().top) === cellYs[0]).length;
  const inspectBg = inspector ? getComputedStyle(inspector).backgroundColor : null;
  return {
    url: location.pathname + location.search,
    mode: document.querySelector(".hbw-home")?.className || null,
    identity: (mark?.textContent || "") + (identity?.textContent || ""),
    identityOn: identity?.classList.contains("is-on") || false,
    identityY: identity ? Math.round(identity.getBoundingClientRect().top) : null,
    markY: mark ? Math.round(mark.getBoundingClientRect().top) : null,
    markSize: mark ? getComputedStyle(mark).fontSize : null,
    identitySize: identity ? getComputedStyle(identity).fontSize : null,
    brand: box(document.querySelector(".hbw-home-strip__brand")),
    mark: box(mark),
    projects: box(projectsBtn),
    method: box(methodBtn),
    time: box(document.querySelector(".hbw-home-strip__time")),
    window: box(document.querySelector(".hbw-window")),
    headerH: Math.round(document.querySelector(".hbw-home-strip")?.getBoundingClientRect().height || 0),
    peekOpen: peek?.classList.contains("is-open") || false,
    peekCount: thumbs.length,
    peekSize: thumbs[0] ? { w: Math.round(thumbs[0].getBoundingClientRect().width), h: Math.round(thumbs[0].getBoundingClientRect().height) } : null,
    peekGap: thumbs.length > 1 ? Math.round(thumbs[1].getBoundingClientRect().left - thumbs[0].getBoundingClientRect().right) : null,
    peekName: peekName?.textContent.trim() || "",
    peekNameShown: peekName?.classList.contains("is-shown") || false,
    peekBox: box(peek),
    visual: box(visual),
    indexBtn: box(indexBtn),
    preview: box(preview),
    gridCols: cellXs,
    cell: cells[0] ? box(cells[0]) : null,
    indexName: box(indexName),
    indexYear: box(indexYear),
    counter: document.querySelector('.hbw-nav-sub[data-face="view"] .hbw-nav-sub__meta')?.textContent.trim() || null,
    viewPhase: stage?.className || null,
    stage: box(stage),
    trackX: track ? track.style.transform : null,
    inspector: !!inspector,
    inspectorBox: box(inspector),
    inspectBg,
    panel: !!panel,
    panelBox: box(panel),
    lastMv: box(last),
    outro: box(outro),
    outroId: box(outroId),
    outroPreview: box(outroPreview),
    outroName: document.querySelector(".hbw-outro__name")?.textContent.trim() || null,
    stage1: last && outroId ? Math.round(outroId.getBoundingClientRect().left - last.getBoundingClientRect().right) : null,
    stage2: outroId && outroPreview ? Math.round(outroPreview.getBoundingClientRect().left - outroId.getBoundingClientRect().right) : null,
    films,
    blank: films.some((f) => f.blank),
  };
})()`;

const dir = join(OUT, "frames-gallery-desktop");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const s = await session(9522, "1440,900", BASE + "/");
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

await hoverXY(home.projects.x + 24, home.projects.y + 8);
await rec(420);
const peekOpen = await s.evalExpr(SNAP);

if (peekOpen.peekBox) {
  await hoverXY(peekOpen.peekBox.x + 24, peekOpen.peekBox.y + 18);
  await rec(280);
}
const peekNamed = await s.evalExpr(SNAP);

await click(".hbw-nav-projects__hit > button", "Projects");
await rec(520);
const visual = await s.evalExpr(SNAP);

await hoverXY(visual.projects.x + 24, visual.projects.y + 8);
await rec(360);
const peekInBrowse = await s.evalExpr(SNAP);
if (visual.indexBtn) {
  await hoverXY(visual.indexBtn.x + 18, visual.indexBtn.y + 6);
  await rec(280);
}
const peekClosedOnIndex = await s.evalExpr(SNAP);

await click(".hbw-nav-sub button", "Index");
await rec(280);
const index = await s.evalExpr(SNAP);

await click(".hbw-nav-sub button", "Visual");
await rec(240);
for (const id of ["sub-3", "koja", "bar-closed", "our-boy-roy", "chris-sisarich", "bistro-nido"]) {
  await s.evalExpr(`(() => {
    const el = document.querySelector(${JSON.stringify(`.hbw-browse__cell[data-hbw-project="${id}"]`)});
    el?.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    el?.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    return true;
  })()`);
  await rec(120);
}
await s.evalExpr(`document.querySelector('.hbw-browse__cell[data-hbw-project="sub-3"]')?.click()`);
await rec(1100);
const sub3 = await s.evalExpr(SNAP);

const wheelQa = await s.evalExpr(`(() => {
  const stage = document.querySelector(".hbw-project-view");
  const track = document.querySelector(".hbw-project-view__track");
  if (!stage || !track) return { ok: false };
  const before = track.style.transform;
  stage.dispatchEvent(new WheelEvent("wheel", { deltaY: 140, bubbles: true, cancelable: true }));
  const mid = track.style.transform;
  return new Promise((resolve) => {
    setTimeout(() => {
      const after = track.style.transform;
      resolve({ before, mid, after, moved: before !== mid, settled: mid === after });
    }, 420);
  });
})()`, true);

await rec(200);
const afterWheel = await s.evalExpr(SNAP);

await click(".hbw-nav-sub button", "Info");
await rec(700);
const infoOpen = await s.evalExpr(SNAP);
const infoPos = { trackX: infoOpen.trackX, counter: infoOpen.counter, identity: infoOpen.identity };

await s.evalExpr(`document.querySelector(".hbw-inspector")?.scrollBy(0, 80)`);
await rec(240);

await s.evalExpr(`document.querySelector(".hbw-inspector__close")?.click()`);
await rec(700);
const infoClosed = await s.evalExpr(SNAP);

for (let i = 0; i < 14; i++) {
  await s.evalExpr(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))`);
  await rec(140);
}
const boundary = await s.evalExpr(SNAP);

await s.evalExpr(`document.querySelector(".hbw-outro__id")?.click()`);
await rec(900);
const koja = await s.evalExpr(SNAP);

await click(".hbw-home-strip__nav > button", "Method");
await rec(500);
const method = await s.evalExpr(SNAP);
await s.evalExpr(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
await rec(400);
const methodClosed = await s.evalExpr(SNAP);

await s.cdp("Page.navigate", { url: BASE + "/projects/chris-sisarich" });
await sleep(1100);
const chris = await s.evalExpr(SNAP);
await rec(220);

await s.cdp("Page.navigate", { url: BASE + "/projects/our-boy-roy" });
await sleep(900);
const obr = await s.evalExpr(SNAP);
await rec(180);

await click(".hbw-nav-projects__hit > button", "Projects");
await rec(520);
const backProjects = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-home-strip__brand")?.click()`);
await rec(500);
const end = await s.evalExpr(SNAP);

s.ws.close();
s.chrome.kill();

const s1280 = await session(9523, "1280,800", BASE + "/?layer=projects");
await sleep(600);
const visual1280 = await s1280.evalExpr(SNAP);
s1280.ws.close();
s1280.chrome.kill();

const videoQa = [];
const sVid = await session(9524, "1440,900", BASE + "/");
for (const slug of ["sub-3", "koja", "bar-closed", "our-boy-roy", "chris-sisarich", "bistro-nido"]) {
  await sVid.cdp("Page.navigate", { url: BASE + `/projects/${slug}` });
  await sleep(900);
  const snap = await sVid.evalExpr(SNAP);
  videoQa.push({
    slug,
    identity: snap.identity,
    counter: snap.counter,
    blank: snap.blank,
    films: snap.films.slice(0, 2),
    brandR: snap.brand?.r,
    projectsX: snap.projects?.x,
  });
}
sVid.ws.close();
sVid.chrome.kill();

const sameY = (a, b) => a != null && b != null && a === b;
const report = {
  frames: n,
  home,
  peekOpen,
  peekNamed,
  peekInBrowse,
  peekClosedOnIndex,
  visual,
  index,
  sub3,
  wheelQa,
  afterWheel,
  infoOpen,
  infoClosed,
  infoPos,
  boundary,
  koja,
  method,
  methodClosed,
  chris,
  obr,
  backProjects,
  end,
  visual1280,
  videoQa,
  gates: {
    identityOneLine: sub3.identity.replace(/\s+/g, " ").trim() === "How by Why × SUB:3" && sub3.markY === sub3.identityY,
    identityLarge: sub3.markSize === sub3.identitySize && sub3.identitySize === home.markSize,
    longestClear: chris.brand && chris.projects && chris.brand.r + 8 < chris.projects.x,
    headerLocked:
      sameY(home.projects?.y, visual.projects?.y) &&
      sameY(home.projects?.y, sub3.projects?.y) &&
      sameY(home.projects?.y, chris.projects?.y) &&
      sameY(home.projects?.y, obr.projects?.y) &&
      sameY(home.method?.y, sub3.method?.y) &&
      sameY(home.time?.y, sub3.time?.y) &&
      sameY(home.window?.y, sub3.window?.y) &&
      home.headerH === sub3.headerH &&
      home.projects?.x === sub3.projects?.x &&
      home.method?.x === sub3.method?.x,
    peekSmall: peekOpen.peekSize?.h >= 42 && peekOpen.peekSize?.h <= 52,
    peekGap: peekOpen.peekGap >= 6 && peekOpen.peekGap <= 8,
    peekNamesDefaultHidden: peekOpen.peekOpen && peekOpen.peekNameShown === false,
    peekNameOnHover: peekNamed.peekNameShown === true && peekNamed.peekName.length > 1,
    peekClosesOnSubnav: peekClosedOnIndex.peekOpen === false,
    visualFour: visual.gridCols === 4,
    visualThreeAt1280: visual1280.gridCols === 3,
    thumbsSmaller: visual.cell?.h > 0 && visual.cell.h <= 130 && visual.preview?.w >= 430,
    indexAlign: index.indexName && visual.cell ? Math.abs(index.indexName.x - visual.cell.x) <= 2 : false,
    noSnap: wheelQa?.moved === true && wheelQa?.settled === true,
    inspectorSplit: infoOpen.inspector === true && infoOpen.inspectBg?.includes("255") && infoOpen.stage?.w < sub3.stage?.w,
    inspectRestore: infoClosed.trackX === infoPos.trackX && infoClosed.counter === infoPos.counter,
    stage1: boundary.stage1 >= 90 && boundary.stage1 <= 104,
    stage2: boundary.stage2 >= 24 && boundary.stage2 <= 40,
    boundaryNamed: boundary.outroName === "KOJA",
    kojaContinues: /How by Why × KOJA/.test(koja.identity) && koja.counter?.startsWith("01"),
    methodOpens: method.panel === true && method.panelBox?.x < 1400 && method.panelBox?.w > 200,
    methodCloses: methodClosed.panel === false,
    noBlankOpen: videoQa.every((row) => row.blank === false),
  },
};
writeFileSync(join(OUT, "gallery-pass-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.gates, null, 2));
console.log("identity", sub3.identity, "peekH", peekOpen.peekSize?.h, "cols", visual.gridCols, visual1280.gridCols, "stage", boundary.stage1, boundary.stage2, "frames", n);

if (existsSync(FFMPEG) && n > 4) {
  const mp4 = join(OUT, "hbw-gallery-desktop.mp4");
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
