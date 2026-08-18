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

async function session(port, size, url, cacheDisabled = false) {
  const userData = mkdtempSync(join(tmpdir(), "hbw-p-"));
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
  if (cacheDisabled) {
    await cdp("Network.enable");
    await cdp("Network.setCacheDisabled", { cacheDisabled: true });
  }
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

const METRICS = `(() => {
  const strip = document.querySelector(".hbw-home-strip");
  const brand = document.querySelector(".hbw-home-strip__brand");
  const projects = [...document.querySelectorAll(".hbw-nav-projects > button")].find((n) => n.textContent.trim() === "Projects");
  const method = [...document.querySelectorAll(".hbw-home-strip__nav > button")].find((n) => n.textContent.trim() === "Method");
  const time = document.querySelector(".hbw-home-strip__time");
  const sub = document.querySelector(".hbw-nav-sub");
  const windowEl = document.querySelector(".hbw-window");
  const intro = document.querySelector(".hbw-poster-intro");
  const grid = document.querySelector(".hbw-browse__grid");
  const index = document.querySelector(".hbw-browse__index");
  const years = [...document.querySelectorAll(".hbw-browse__row-year")];
  const lastYear = years[years.length - 1];
  const preview = document.querySelector(".hbw-browse__figure");
  const record = document.querySelector(".hbw-browse__record");
  const track = document.querySelector(".hbw-project-view.is-active .hbw-project-view__track, .hbw-project-view.is-rising .hbw-project-view__track");
  const mvs = track ? [...track.querySelectorAll(".hbw-mv")] : [];
  let galleryGap = null;
  if (mvs.length >= 2) {
    const a = mvs[0].getBoundingClientRect();
    const b = mvs[1].getBoundingClientRect();
    galleryGap = Math.round(b.left - a.right);
  }
  const shown = document.querySelector(".hbw-browse__figure img.is-shown");
  function box(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) };
  }
  return {
    url: location.pathname + location.search,
    mode: document.querySelector(".hbw-home")?.className || null,
    intro: !!intro,
    header: box(strip),
    brand: box(brand),
    projects: box(projects),
    method: box(method),
    time: box(time),
    sub: box(sub),
    window: box(windowEl),
    preview: box(preview),
    record: box(record),
    grid: box(grid),
    index: box(index),
    year: box(lastYear),
    previewSrc: shown?.currentSrc || shown?.src || null,
    galleryGap,
    counter: document.querySelector('.hbw-nav-sub[data-face="view"] .hbw-nav-sub__meta')?.textContent.trim() || null,
    subFace: sub?.getAttribute("data-face") || null,
  };
})()`;

const PEEK = "(function(){ var view = document.querySelector('.hbw-project-view.is-active') || document.querySelector('.hbw-project-view.is-rising'); var track = view && view.querySelector('.hbw-project-view__track'); var outro = view && view.querySelector('.hbw-outro'); if (!view || !track || !outro) return { ok: false }; var x = Math.max(0, outro.getBoundingClientRect().left - track.getBoundingClientRect().left - 8); track.style.transition = 'none'; track.style.transform = 'translate3d(' + String(-x) + 'px, 0, 0)'; return { ok: true, x: Math.round(x) }; })()";

const dir = join(OUT, "frames-precision-desktop");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const s = await session(9482, "1440,900", BASE + "/");
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
    await sleep(80);
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
async function hoverCell(name) {
  return s.evalExpr(`new Promise((resolve) => {
    const el = [...document.querySelectorAll(".hbw-browse__cell")].find((c) => c.getAttribute("aria-label") === ${JSON.stringify(name)});
    el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    el.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve(document.querySelector(".hbw-browse__name")?.textContent || null);
    }));
  })`, true);
}
async function hoverRow(name) {
  return s.evalExpr(`new Promise((resolve) => {
    const el = [...document.querySelectorAll(".hbw-browse__row")].find((c) => c.querySelector(".hbw-browse__row-name")?.textContent.trim() === ${JSON.stringify(name)});
    el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    el.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      resolve({
        name: document.querySelector(".hbw-browse__name")?.textContent || null,
        src: document.querySelector(".hbw-browse__figure img.is-shown")?.getAttribute("src") || null,
      });
    }));
  })`, true);
}
async function open(name) {
  await s.evalExpr(`(() => {
    const el = [...document.querySelectorAll(".hbw-browse__cell")].find((c) => c.getAttribute("aria-label") === ${JSON.stringify(name)});
    el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    el.click();
    return true;
  })()`);
}

const home = await s.evalExpr(METRICS);
await rec(350);
await s.evalExpr(`(() => {
  const input = document.querySelector(".hbw-poster-input");
  const native = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  native.set.call(input, "Hold the line");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
})()`);
await rec(280);
await click(".hbw-nav-projects > button", "Projects");
await rec(700);
const projects = await s.evalExpr(METRICS);
const visualHovers = {};
for (const name of ["SUB:3", "KOJA", "CLOSED", "Our Boy Roy", "Chris Sisarich", "Bistro Nido"]) {
  visualHovers[name] = await hoverCell(name);
  await rec(140);
}
await click(".hbw-nav-sub button", "Index");
await sleep(180);
await rec(250);
const indexLayout = await s.evalExpr(METRICS);
const indexHovers = {};
for (const name of ["SUB:3", "KOJA", "CLOSED", "Our Boy Roy", "Chris Sisarich", "Bistro Nido"]) {
  indexHovers[name] = await hoverRow(name);
  await rec(140);
}
await click(".hbw-nav-sub button", "Visual");
await sleep(160);
await rec(200);
await open("SUB:3");
await sleep(500);
await rec(800);
const view = await s.evalExpr(METRICS);
try {
  await s.evalExpr(PEEK);
} catch (err) {
  console.log("peek skip", String(err.message || err).slice(0, 80));
}
await rec(400);
const sub3End = await s.evalExpr(METRICS);
await s.evalExpr(`document.querySelector(".hbw-outro__door")?.click()`);
await rec(700);
const koja = await s.evalExpr(METRICS);
await click(".hbw-nav-projects > button", "Projects");
await rec(600);
await click(".hbw-home-strip__brand", "How by Why");
await rec(600);
const backHome = await s.evalExpr(METRICS);
const posterKept = await s.evalExpr(`document.querySelector(".hbw-poster-input")?.value || null`);
const firstPass = { home, projects, visualHovers, indexLayout, indexHovers, view, sub3End, koja, backHome, posterKept };
s.ws.close();
s.chrome.kill();

const cold = {};
const names = [
  ["SUB:3", "sub-3"],
  ["KOJA", "koja"],
  ["CLOSED", "bar-closed"],
  ["Our Boy Roy", "our-boy-roy"],
  ["Chris Sisarich", "chris-sisarich"],
  ["Bistro Nido", "bistro-nido"],
];
try {
  const coldSession = await session(9483, "1440,900", BASE + "/", true);
  await coldSession.evalExpr(`(() => {
    const btn = [...document.querySelectorAll(".hbw-nav-projects > button")].find((n) => n.textContent.trim() === "Projects");
    if (btn) btn.click();
    return true;
  })()`);
  await coldSession.evalExpr(`new Promise((r) => { const go = () => document.querySelectorAll(".hbw-browse__cell").length >= 6 ? r(true) : setTimeout(go, 40); go(); })`, true);
  await sleep(500);
  for (const [name] of names) {
    const started = Date.now();
    await coldSession.evalExpr(`(() => {
      const el = [...document.querySelectorAll(".hbw-browse__cell")].find((c) => c.getAttribute("aria-label") === ${JSON.stringify(name)});
      if (!el) throw new Error("missing cell " + ${JSON.stringify(name)} + " have " + [...document.querySelectorAll(".hbw-browse__cell")].map((c) => c.getAttribute("aria-label")).join(","));
      el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
      el.click();
      return true;
    })()`);
    const result = await coldSession.evalExpr(`new Promise((resolve) => {
      const t0 = performance.now();
      const go = () => {
        const view = document.querySelector(".hbw-project-view.is-rising, .hbw-project-view.is-active");
        const img = view && view.querySelector(".hbw-mv img");
        const blank = !view || getComputedStyle(view).visibility === "hidden";
        const ready = view && img && img.naturalWidth > 0 && (img.currentSrc || img.src || "").indexOf(${JSON.stringify(name === "SUB:3" ? "sub3" : name === "KOJA" ? "koja" : name === "CLOSED" ? "closed" : name === "Our Boy Roy" ? "our-boy-roy" : name === "Chris Sisarich" ? "chris-sisarich" : "bistro-nido")}) >= 0;
        if (ready || performance.now() - t0 > 2400) {
          resolve({
            ms: Math.round(performance.now() - t0),
            phase: view && view.className || null,
            blank,
            natural: img && img.naturalWidth || 0,
            src: ((img && (img.currentSrc || img.src)) || "").slice(-48),
          });
          return;
        }
        requestAnimationFrame(go);
      };
      go();
    })`, true);
    cold[name] = { ...result, elapsed: Date.now() - started };
    await coldSession.evalExpr(`(() => {
      const btn = [...document.querySelectorAll(".hbw-nav-projects > button")].find((n) => n.textContent.trim() === "Projects");
      if (btn) btn.click();
      return true;
    })()`);
    await coldSession.evalExpr(`new Promise((r) => { const t = setTimeout(() => r(false), 2800); const go = () => { if (document.querySelectorAll(".hbw-browse__cell").length >= 6 && !document.querySelector(".hbw-project-view.is-active") && !document.querySelector(".hbw-project-view.is-exiting")) { clearTimeout(t); r(true); return; } setTimeout(go, 40); }; go(); })`, true);
    await sleep(280);
  }
  coldSession.ws.close();
  coldSession.chrome.kill();
} catch (err) {
  cold.error = String(err.message || err).slice(0, 200);
}

const report = {
  frames: n,
  home,
  projects,
  visualHovers,
  indexLayout,
  indexHovers,
  view,
  sub3End,
  koja,
  backHome,
  posterKept,
  cold,
  deltas: {
    windowY: {
      home: home.window?.y,
      projects: projects.window?.y,
      view: view.window?.y,
      homeToProjects: (projects.window?.y ?? 0) - (home.window?.y ?? 0),
      projectsToView: (view.window?.y ?? 0) - (projects.window?.y ?? 0),
    },
    headerH: {
      home: home.header?.h,
      projects: projects.header?.h,
      view: view.header?.h,
    },
    brandY: { home: home.brand?.y, projects: projects.brand?.y, view: view.brand?.y },
    subY: { home: home.sub?.y, projects: projects.sub?.y, view: view.sub?.y },
    right: {
      time: projects.time?.r,
      grid: projects.grid?.r,
      index: indexLayout.index?.r,
      year: indexLayout.year?.r,
    },
    galleryGap: view.galleryGap,
    introRemoved: !home.intro,
  },
};
writeFileSync(join(OUT, "precision-pass-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.deltas, null, 2));
console.log("indexHovers", JSON.stringify(indexHovers, null, 2));
console.log("cold", JSON.stringify(cold, null, 2));
console.log("posterKept", posterKept, "frames", n);

if (existsSync(FFMPEG) && n > 4) {
  const mp4 = join(OUT, "hbw-precision-desktop.mp4");
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
