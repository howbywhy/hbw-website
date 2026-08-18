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
  const userData = mkdtempSync(join(tmpdir(), "hbw-s-"));
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
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) };
  }
  const peek = document.querySelector(".hbw-nav-peek");
  const thumbs = [...document.querySelectorAll(".hbw-nav-peek a")];
  const peekName = document.querySelector(".hbw-nav-peek__name");
  const overlay = document.querySelector(".hbw-inspector.is-overlay.is-visible");
  const inspector = document.querySelector(".hbw-inspector.is-visible");
  const visual = [...document.querySelectorAll(".hbw-nav-sub__browse button")].find((n) => n.textContent.trim() === "Visual");
  const indexBtn = [...document.querySelectorAll(".hbw-nav-sub__browse button")].find((n) => n.textContent.trim() === "Index");
  const infoBtn = document.querySelector(".hbw-nav-sub__view button");
  const studioBtn = document.querySelector(".hbw-nav-studio");
  const exit = document.querySelector(".hbw-home-strip__exit");
  const mark = document.querySelector(".hbw-home-strip__mark");
  const times = document.querySelector(".hbw-home-strip__times");
  const project = document.querySelector(".hbw-home-strip__project");
  const toolbar = document.querySelector(".hbw-poster-toolbar");
  const stage = document.querySelector(".hbw-project-view.is-active, .hbw-project-view.is-rising");
  const recovered = document.querySelector(".about-contents, .about-container, .hbw-signature, .hbw-floatnav");
  const closeInside = [...document.querySelectorAll(".hbw-inspector button, .hbw-inspector a")].some((n) => n.textContent.trim() === "Close");
  const body = inspector ? inspector.innerText.replace(/\\s+/g, " ").trim() : "";
  return {
    url: location.pathname + location.search,
    mode: document.querySelector(".hbw-home")?.className || null,
    recovered: !!recovered,
    identity: ((mark?.textContent || "") + " " + (times?.textContent || "") + " " + (project?.textContent || "")).replace(/\\s+/g, " ").trim(),
    studioLabel: studioBtn?.textContent.trim() || null,
    infoLabel: infoBtn?.textContent.trim() || null,
    exitOn: exit?.classList.contains("is-on") || false,
    exitLabel: exit?.textContent.trim() || null,
    exitSize: exit ? getComputedStyle(exit).fontSize : null,
    markSize: mark ? getComputedStyle(mark).fontSize : null,
    brand: box(document.querySelector(".hbw-home-strip__brand")),
    projects: box(document.querySelector(".hbw-nav-projects__hit")),
    studio: box(studioBtn),
    exitBox: box(exit),
    visual: box(visual),
    indexBtn: box(indexBtn),
    info: box(infoBtn),
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
    peekTop: peek ? Math.round(peek.getBoundingClientRect().top) : null,
    overlay: !!overlay,
    inspector: !!inspector,
    inspectorBox: box(inspector),
    inspectBg: inspector ? getComputedStyle(inspector).backgroundColor : null,
    studioView: inspector?.getAttribute("data-hbw-studio-view") || null,
    closeInside,
    body: body.slice(0, 280),
    hasOpening: body.includes("You’ve built something real"),
    hasPhilosophy: body.includes("Our Philosophy"),
    hasHow: body.includes("How We Work") && body.includes("(01) Clarify"),
    hasContact: body.includes("mark@hbw.works") && body.includes("Bring me into it"),
    hasManifestoLink: body.includes("HBW Manifesto"),
    hasManifestoOpen: body.includes("Brand is not what you see") && body.includes("It’s what you feel"),
    hasManifestoClose: body.includes("By asking why, we discover how") && body.includes("How by why"),
    hasStudioBack: [...document.querySelectorAll(".hbw-inspector__back")].some((n) => n.textContent.trim() === "Studio"),
    toolbar: toolbar ? getComputedStyle(toolbar).opacity !== "0" && getComputedStyle(toolbar).visibility !== "hidden" : false,
    toolbarBox: box(toolbar),
    stage: box(stage),
    methodLabel: [...document.querySelectorAll("button")].some((n) => n.textContent.trim() === "Method"),
    browserX: document.querySelector(".hbw-home") ? getComputedStyle(document.querySelector(".hbw-home")).getPropertyValue("--hbw-browser-x").trim() : null,
  };
})()`;

const dir = join(OUT, "frames-studio-desktop");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const s = await session(9542, "1440,900", BASE + "/");
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

const home = await s.evalExpr(SNAP);
await rec(240);

await hoverXY(home.projects.x + 20, home.projects.y + 8);
await rec(400);
const peekHome = await s.evalExpr(SNAP);
if (peekHome.peekBox) {
  for (let i = 0; i < 6; i++) {
    await hoverXY(peekHome.peekBox.x + 16 + i * (peekHome.peekSize.w + (peekHome.peekGap || 6)), peekHome.peekBox.y + 16);
    await rec(160);
  }
}
const peekNamed = await s.evalExpr(SNAP);

await hoverXY(8, 8);
await rec(180);
await s.evalExpr(`document.querySelector(".hbw-nav-studio")?.click()`);
await rec(700);
const studioOpen = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-inspector.is-overlay")?.scrollBy(0, 220)`);
await rec(280);
await s.evalExpr(`[...document.querySelectorAll(".hbw-inspector__link")].find((n) => n.textContent.includes("HBW Manifesto"))?.click()`);
await rec(420);
const manifesto = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-inspector__back")?.click()`);
await rec(360);
const studioBack = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-nav-studio")?.click()`);
await rec(520);
const studioClosed = await s.evalExpr(SNAP);

await click(".hbw-nav-projects__hit", "Projects");
await rec(520);
const browse = await s.evalExpr(SNAP);
await hoverXY(browse.projects.x + 20, browse.projects.y + 8);
await rec(360);
const peekBrowse = await s.evalExpr(SNAP);
await hoverXY(browse.visual.x + 16, browse.visual.y + 6);
await rec(240);
const peekClosedVisual = await s.evalExpr(SNAP);
await hoverXY(browse.projects.x + 20, browse.projects.y + 8);
await rec(280);
await hoverXY(browse.indexBtn.x + 16, browse.indexBtn.y + 6);
await rec(240);
const peekClosedIndex = await s.evalExpr(SNAP);

await click(".hbw-nav-sub button", "Visual");
await rec(200);
await s.evalExpr(`document.querySelector('.hbw-browse__cell[data-hbw-project="bar-closed"]')?.click()`);
await rec(1100);
const project = await s.evalExpr(SNAP);

await s.evalExpr(`document.querySelector(".hbw-nav-studio")?.click()`);
await rec(600);
const studioOverProject = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-nav-studio")?.click()`);
await rec(500);
const studioLeftProject = await s.evalExpr(SNAP);

await click(".hbw-nav-sub__view button", "Info");
await rec(700);
const infoOpen = await s.evalExpr(SNAP);
await click(".hbw-nav-sub__view button", "Close");
await rec(600);
const infoClosed = await s.evalExpr(SNAP);

await s.evalExpr(`document.querySelector(".hbw-home-strip__exit")?.click()`);
await rec(700);
const backProjects = await s.evalExpr(SNAP);

await s.cdp("Page.navigate", { url: BASE + "/studio" });
await s.evalExpr(`new Promise((r) => { const go = () => document.querySelector(".hbw-inspector.is-overlay.is-visible") ? r(true) : setTimeout(go, 40); go(); })`, true);
await rec(400);
const directStudio = await s.evalExpr(SNAP);

await s.cdp("Page.navigate", { url: BASE + "/manifesto" });
await s.evalExpr(`new Promise((r) => { const go = () => document.querySelector('[data-hbw-studio-view="manifesto"]') ? r(true) : setTimeout(go, 40); go(); })`, true);
await rec(400);
const directManifesto = await s.evalExpr(SNAP);

s.ws.close();
s.chrome.kill();

const axis = (a, b) => a != null && b != null && Math.abs(a - b) <= 2;
const peekHomeGap = peekHome.peekBox && peekHome.projects ? peekHome.peekBox.y - peekHome.projects.b : null;
const peekBrowseGap = peekBrowse.peekBox && peekBrowse.visual ? peekBrowse.peekBox.y - peekBrowse.visual.b : null;
const report = {
  frames: n,
  home,
  peekHome,
  peekNamed,
  studioOpen,
  manifesto,
  studioBack,
  studioClosed,
  browse,
  peekBrowse,
  peekClosedVisual,
  peekClosedIndex,
  project,
  studioOverProject,
  studioLeftProject,
  infoOpen,
  infoClosed,
  backProjects,
  directStudio,
  directManifesto,
  peekHomeGap,
  peekBrowseGap,
  gates: {
    methodGone: home.methodLabel === false && home.studioLabel === "Studio",
    studioOpens: studioOpen.overlay === true && studioOpen.studioLabel === "Close" && studioOpen.hasOpening && studioOpen.hasPhilosophy && studioOpen.hasHow && studioOpen.hasContact,
    studioWhite: studioOpen.inspectBg === "rgb(255, 255, 255)",
    studioWidth: studioOpen.inspectorBox?.w >= 500 && studioOpen.inspectorBox?.w <= 620,
    noInternalClose: studioOpen.closeInside === false && infoOpen.closeInside === false,
    manifestoInPanel: manifesto.hasManifestoOpen && manifesto.hasManifestoClose && manifesto.studioView === "manifesto" && manifesto.studioLabel === "Close",
    manifestoReturn: studioBack.studioView === "studio" && studioBack.hasOpening && studioBack.studioLabel === "Close",
    studioCloses: studioClosed.overlay === false && studioClosed.studioLabel === "Studio" && studioClosed.toolbar === true,
    peekHomeHigh: peekHome.peekOpen === true && peekHomeGap != null && peekHomeGap >= 0 && peekHomeGap <= 14,
    peekBrowseLow: peekBrowse.peekOpen === true && peekHome.peekBox && peekBrowse.peekBox && peekBrowse.peekBox.y > peekHome.peekBox.y + 8,
    peekUnderVisual: peekBrowseGap != null && peekBrowseGap >= 0 && peekBrowseGap <= 16,
    peekSmall: peekHome.peekSize?.h >= 36 && peekHome.peekSize?.h <= 44,
    peekGap: peekHome.peekGap >= 5 && peekHome.peekGap <= 6,
    peekAxis: peekHome.peekBox && axis(peekHome.peekBox.x, peekHome.projects.x),
    peekNameOnly: peekNamed.peekNameShown === true && peekNamed.peekName.length > 0 && !peekNamed.peekName.includes("—") && !/Bending|Unapologetically|Smuggler/.test(peekNamed.peekName),
    peekClosesVisual: peekClosedVisual.peekOpen === false,
    peekClosesIndex: peekClosedIndex.peekOpen === false,
    projectClose: project.exitOn === true && project.exitLabel === "Close" && project.identity.includes("How by Why × CLOSED") && project.exitSize === project.markSize,
    studioOverProjectNoSplit: studioOverProject.overlay === true && studioOverProject.stage && studioOverProject.window && studioOverProject.stage.r >= studioOverProject.window.r - 8,
    infoCloseLabel: infoOpen.infoLabel === "Close" && infoClosed.infoLabel === "Info",
    infoSplit: infoOpen.inspector === true && infoOpen.overlay === false && infoOpen.inspectBg === "rgb(255, 255, 255)",
    projectExitBrowse: backProjects.mode?.includes("is-browse") && backProjects.url.includes("layer=projects"),
    directStudio: directStudio.overlay === true && directStudio.hasOpening && directStudio.recovered === false && directStudio.url === "/studio",
    directManifesto: directManifesto.studioView === "manifesto" && directManifesto.hasManifestoOpen && directManifesto.recovered === false && directManifesto.url === "/manifesto",
    headerLocked: home.projects?.x === project.projects?.x && home.studio?.x === project.studio?.x && home.window?.y === project.window?.y && home.headerH === project.headerH,
  },
};
writeFileSync(join(OUT, "studio-pass-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.gates, null, 2));
console.log("peekHomeGap", peekHomeGap, "peekBrowseGap", peekBrowseGap, "peekName", peekNamed.peekName, "studioW", studioOpen.inspectorBox?.w);

if (existsSync(FFMPEG) && n > 4) {
  const mp4 = join(OUT, "hbw-studio-desktop.mp4");
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
