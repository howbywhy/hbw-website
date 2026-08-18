import { spawn, execSync } from "node:child_process";
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
  try { execSync(`lsof -ti tcp:${port} | xargs kill -9`, { stdio: "ignore" }); } catch {}
  await sleep(200);
  const userData = mkdtempSync(join(tmpdir(), "hbw-r-"));
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
  function cdp(method, params = {}, timeout = 20000) {
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
  await sleep(800);
  return { chrome, ws, cdp, evalExpr };
}

const SNAP = `(() => {
  function box(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) };
  }
  const figure = document.querySelector(".hbw-projects.is-open .hbw-browse__figure");
  const shown = document.querySelector(".hbw-projects.is-open .hbw-showreel__layer.is-shown");
  const mark = document.querySelector(".hbw-projects.is-open .hbw-showreel__layer.is-mark.is-shown");
  const record = document.querySelector(".hbw-browse__record");
  const peek = document.querySelector(".hbw-nav-peek");
  const overlay = document.querySelector(".hbw-inspector.is-overlay.is-visible");
  const manifesto = document.querySelector('.hbw-inspector.is-overlay.is-manifesto.is-visible');
  const inspector = document.querySelector(".hbw-inspector.is-visible");
  const infoBtn = document.querySelector(".hbw-nav-sub__view button");
  const meta = document.querySelector(".hbw-nav-sub__meta");
  const studioBtn = document.querySelector(".hbw-nav-studio");
  const poster = document.querySelector(".hbw-poster-toolbar") || document.querySelector(".hbw-window > :not(.hbw-inspector)");
  const recede = document.querySelector(".hbw-home.is-studio .hbw-window > :not(.hbw-inspector)");
  const stage = document.querySelector(".hbw-project-view.is-active, .hbw-project-view.is-rising, .hbw-project-view.is-handoff-in");
  const windowEl = document.querySelector(".hbw-window");
  const home = document.querySelector(".hbw-home");
  return {
    url: location.pathname + location.search,
    mode: home?.className || null,
    origin: home?.getAttribute("data-hbw-origin") || null,
    projectsClass: document.querySelector(".hbw-projects")?.className || null,
    identity: (document.querySelector(".hbw-home-strip__mark")?.textContent + " " + document.querySelector(".hbw-home-strip__times")?.textContent + " " + document.querySelector(".hbw-home-strip__project")?.textContent).replace(/\\s+/g, " ").trim(),
    studioLabel: studioBtn?.textContent.trim() || null,
    infoLabel: infoBtn?.textContent.trim() || null,
    infoSize: infoBtn ? getComputedStyle(infoBtn).fontSize : null,
    metaSize: meta ? getComputedStyle(meta).fontSize : null,
    metaText: meta?.textContent.replace(/\\s+/g, " ").trim() || null,
    projects: box(document.querySelector(".hbw-nav-projects__hit")),
    visual: box([...document.querySelectorAll(".hbw-nav-sub__browse button")].find((n) => n.textContent.trim() === "Visual")),
    indexBtn: box([...document.querySelectorAll(".hbw-nav-sub__browse button")].find((n) => n.textContent.trim() === "Index")),
    window: box(windowEl),
    figure: box(figure),
    reelId: figure?.getAttribute("data-hbw-reel") || null,
    reelActive: figure?.getAttribute("data-hbw-reel-active") || null,
    shownType: shown?.className || null,
    mark: !!mark,
    markText: mark?.textContent.trim() || null,
    record: !!record,
    peekOpen: peek?.classList.contains("is-open") || false,
    peekPresent: !!peek,
    overlay: !!overlay,
    manifesto: !!manifesto,
    manifestoBox: box(manifesto),
    inspectorBox: box(inspector),
    recedeFilter: recede ? getComputedStyle(recede).filter : null,
    recedeOpacity: recede ? getComputedStyle(recede).opacity : null,
    studioSharp: overlay ? getComputedStyle(overlay).filter : null,
    toolbar: poster ? getComputedStyle(poster).opacity !== "0" : false,
    stage: box(stage),
    intakeLink: [...document.querySelectorAll("a")].some((n) => (n.getAttribute("href") || "").includes("/intake")),
    recoveredIntake: !!document.querySelector(".intake-container"),
  };
})()`;

const dir = join(OUT, "frames-showreel-desktop");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const s = await session(9546, "1440,900", BASE + "/");
let n = 0;
async function shot() {
  try {
    const { data } = await s.cdp("Page.captureScreenshot", { format: "jpeg", quality: 70 });
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
    await sleep(90);
  }
}
async function click(selector, text) {
  await s.evalExpr(`(() => {
    const needle = ${JSON.stringify(text || "")};
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((n) => !needle || (n.textContent || "").includes(needle));
    if (!el) throw new Error("missing " + ${JSON.stringify(selector)} + " " + needle);
    el.click();
    return true;
  })()`);
}
async function hoverXY(x, y) {
  await s.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
}

async function waitFor(expression, ms = 4000) {
  const start = Date.now();
  let value;
  while (Date.now() - start < ms) {
    value = await s.evalExpr(expression);
    if (value) return value;
    await sleep(80);
  }
  throw new Error("timeout waiting " + String(expression).slice(0, 120));
}

const home = await s.evalExpr(SNAP);
const debugPeek = await s.evalExpr(`({
  w: innerWidth,
  h: innerHeight,
  mobile: window.matchMedia("(max-width: 767px)").matches,
  mode: document.querySelector(".hbw-home")?.className,
  peek: !!document.querySelector(".hbw-nav-peek"),
  enabled: document.querySelector(".hbw-nav-projects__hit")?.getAttribute("data-hbw-peek-enabled"),
  hit: (() => { const el = document.querySelector(".hbw-nav-projects__hit"); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()
})`);
console.log("peek debug", JSON.stringify(debugPeek));
await rec(200);
const hit = debugPeek.hit;
if (!hit) throw new Error("projects hit missing");
await hoverXY(hit.x + 20, hit.y + 8);
await sleep(200);
await hoverXY(hit.x + 24, hit.y + 10);
await waitFor(`!!document.querySelector(".hbw-nav-peek.is-open .hbw-nav-peek__row")`, 2500);
await rec(200);
const peekHome = await s.evalExpr(SNAP);
const peekBox = await s.evalExpr(`(() => {
  const row = document.querySelector(".hbw-nav-peek.is-open .hbw-nav-peek__row");
  if (!row) return null;
  const r = row.getBoundingClientRect();
  return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
})()`);
if (!peekBox) throw new Error("peek row missing");
await hoverXY(peekBox.x + 16, peekBox.y + 16);
await rec(160);
await s.evalExpr(`(() => {
  const el = document.querySelector("[data-hbw-peek]");
  if (!el) throw new Error("missing peek");
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, buttons: 1 }));
  el.click();
  return true;
})()`);
await waitFor(`document.querySelector(".hbw-home-strip__project")?.textContent.includes("SUB:3")`, 5000);
await waitFor(`document.querySelector(".hbw-home")?.classList.contains("is-phase-active")`, 2000);
await rec(400);
const fromPeek = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-home-strip__exit")?.click()`);
await waitFor(`document.querySelector(".hbw-home")?.classList.contains("is-make") && !location.search.includes("layer=projects")`, 2500);
await rec(360);
const backHome = await s.evalExpr(SNAP);

await click(".hbw-nav-projects__hit", "Projects");
await waitFor(`document.querySelector(".hbw-home")?.classList.contains("is-browse")`, 1500);
await rec(360);
const browse = await s.evalExpr(SNAP);
await hoverXY(browse.projects.x + 20, browse.projects.y + 8);
await rec(280);
const peekBrowse = await s.evalExpr(SNAP);
await hoverXY(8, 8);
let markSeen = false;
const reelStart = Date.now();
while (Date.now() - reelStart < 12000) {
  await shot();
  await sleep(90);
  if (!markSeen) {
    markSeen = !!(await s.evalExpr(`!!document.querySelector(".hbw-projects.is-open .hbw-showreel__layer.is-mark.is-shown")`));
  }
}
const reel = await s.evalExpr(SNAP);
markSeen = markSeen || !!reel.mark;

const closedCell = await s.evalExpr(`(() => {
  const el = document.querySelector('.hbw-browse__cell[data-hbw-project="bar-closed"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);
if (closedCell) await hoverXY(closedCell.x, closedCell.y);
await rec(240);
const reelStopped = await s.evalExpr(SNAP);
await hoverXY(8, 8);
await rec(400);
const afterLeave = await s.evalExpr(SNAP);
await rec(3400);
const reelResume = await s.evalExpr(SNAP);

await click(".hbw-nav-sub button", "Index");
await rec(280);
const index = await s.evalExpr(SNAP);
await click(".hbw-nav-sub button", "Visual");
await rec(240);
await s.evalExpr(`(() => {
  const el = document.querySelector('.hbw-browse__cell[data-hbw-project="bar-closed"]');
  if (!el) throw new Error("missing closed cell");
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window, buttons: 1 }));
  return true;
})()`);
await waitFor(`document.querySelector(".hbw-home")?.classList.contains("is-view") && document.querySelector(".hbw-home-strip__project")?.textContent.includes("CLOSED")`, 2500);
await waitFor(`[...document.querySelectorAll(".hbw-nav-sub__view button")].some((n) => (n.textContent || "").trim() === "Info")`, 2000);
await rec(400);
const project = await s.evalExpr(SNAP);

await click(".hbw-nav-sub__view button", "Info");
await waitFor(`[...document.querySelectorAll(".hbw-nav-sub__view button")].some((n) => n.textContent.trim() === "Close")`, 1500);
await rec(600);
const infoOpen = await s.evalExpr(SNAP);
await click(".hbw-nav-sub__view button", "Close");
await rec(480);
const infoClosed = await s.evalExpr(SNAP);

await s.evalExpr(`(() => {
  const stage = document.querySelector(".hbw-project-view");
  if (!stage) return false;
  for (let i = 0; i < 28; i++) stage.dispatchEvent(new WheelEvent("wheel", { deltaY: 220, bubbles: true, cancelable: true }));
  return true;
})()`);
await rec(500);
await s.evalExpr(`document.querySelector(".hbw-outro__id")?.click()`);
await waitFor(`document.querySelector(".hbw-home-strip__project")?.textContent.includes("Our Boy Roy")`, 2000);
await rec(500);
const nextProject = await s.evalExpr(SNAP);

await s.evalExpr(`document.querySelector(".hbw-home-strip__exit")?.click()`);
await waitFor(`document.querySelector(".hbw-home-strip__project")?.textContent.includes("CLOSED")`, 2000);
await rec(400);
const originClose = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-home-strip__exit")?.click()`);
await waitFor(`document.querySelector(".hbw-home")?.classList.contains("is-browse")`, 2000);
await rec(400);
const backProjects = await s.evalExpr(SNAP);

await s.evalExpr(`document.querySelector(".hbw-nav-studio")?.click()`);
await rec(700);
const studio = await s.evalExpr(SNAP);
await s.evalExpr(`[...document.querySelectorAll(".hbw-inspector__link")].find((n) => n.textContent.includes("HBW Manifesto"))?.click()`);
await rec(700);
const manifesto = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-inspector__back")?.click()`);
await rec(520);
const studioBack = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-nav-studio")?.click()`);
await rec(520);
const studioClosed = await s.evalExpr(SNAP);

await s.cdp("Page.navigate", { url: BASE + "/intake/start" });
await sleep(700);
const intake = await s.evalExpr(SNAP);

s.ws.close();
s.chrome.kill();

const previewBottomGap = browse.figure && browse.window ? browse.window.b - browse.figure.b : null;
const report = {
  frames: n,
  home,
  peekHome,
  fromPeek,
  backHome,
  browse,
  peekBrowse,
  reel,
  markSeen,
  reelStopped,
  afterLeave,
  reelResume,
  index,
  project,
  infoOpen,
  infoClosed,
  nextProject,
  originClose,
  backProjects,
  studio,
  manifesto,
  studioBack,
  studioClosed,
  intake,
  previewBottomGap,
  gates: {
    noRecord: browse.record === false,
    previewTall: previewBottomGap != null && previewBottomGap >= 0 && previewBottomGap <= 16,
    peekHomeOnly: peekHome.peekOpen === true && peekBrowse.peekOpen === false && peekBrowse.peekPresent === false,
    peekReturnsHome: fromPeek.identity.includes("SUB:3") && backHome.mode?.includes("is-make") && (backHome.url === "/" || backHome.url === ""),
    reelRan: Boolean(reel.reelId && reel.reelId !== "cover-sub-3") || /video|mark|is-dissolve/.test(reel.shownType || ""),
    reelStopsOnHover: (reelStopped.reelId || "").includes("bar-closed") || (reelStopped.reelActive === "false"),
    indexHasNoReelClass: /is-index/.test(index.projectsClass || "") && index.mode?.includes("is-browse"),
    infoLarge: infoOpen.infoSize === infoOpen.metaSize && infoOpen.infoLabel === "Close",
    nextHandoff: nextProject.identity.includes("Our Boy Roy"),
    originAfterNext: originClose.identity.includes("CLOSED"),
    originThenBrowse: backProjects.mode?.includes("is-browse"),
    studioRecede: studio.recedeFilter?.includes("blur") && Number(studio.recedeOpacity) <= 0.55 && studio.studioSharp === "none",
    manifestoLeft: manifesto.manifesto === true && manifesto.manifestoBox?.x >= 0 && manifesto.manifestoBox?.x < 40,
    noIntake: intake.recoveredIntake === false && (intake.url === "/studio" || intake.studioLabel === "Close"),
    noIntakeCta: studio.intakeLink === false,
  },
};
writeFileSync(join(OUT, "showreel-pass-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.gates, null, 2));
console.log("previewGap", previewBottomGap, "mark", markSeen, "reelId", reel.reelId, "originClose", originClose.identity, "intake", intake.url, "manifestoX", manifesto.manifestoBox?.x, "backHome", backHome.mode, backHome.url);

if (existsSync(FFMPEG) && n > 4) {
  const mp4 = join(OUT, "hbw-showreel-desktop.mp4");
  await new Promise((resolve, reject) => {
    const ff = spawn(FFMPEG, [
      "-y",
      "-framerate", "11",
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
