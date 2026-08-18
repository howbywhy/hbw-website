import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://127.0.0.1:3000";
const OUT = "/Users/markblackler/Documents/GitHub/hbw-website/reference/recordings";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function session(port, size, url) {
  const userData = mkdtempSync(join(tmpdir(), "hbw-c-"));
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
      }, 12000);
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
        if (!/context was destroyed|Cannot find context|Not attached|timeout Runtime/i.test(text) || attempt === 5) {
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
  const home = document.querySelector(".hbw-home");
  const intro = document.querySelector(".hbw-poster-intro");
  const view = document.querySelector(".hbw-project-view.is-active, .hbw-project-view.is-rising");
  const stage = view && getComputedStyle(view).backgroundColor;
  const preview = document.querySelector(".hbw-browse__name")?.textContent || null;
  const year = [...document.querySelectorAll(".hbw-browse__row-year")].map((n) => n.textContent).join(" ");
  const outro = document.querySelector(".hbw-project-view.is-active .hbw-outro");
  const or = outro?.getBoundingClientRect();
  return {
    url: location.pathname,
    mode: home?.className,
    intro: intro?.className || null,
    introText: intro?.innerText.replace(/\\s+/g, " ").trim() || null,
    leak: !!document.querySelector(".hbw-proj-leak"),
    preview,
    years: year,
    stage,
    counter: document.querySelector('.hbw-nav-sub[data-face="view"] .hbw-nav-sub__meta')?.textContent.trim() || null,
    outroOn: outro ? or.right > 8 && or.left < 1440 && or.bottom > 8 && or.top < 900 : false,
    outroLabel: outro?.innerText.replace(/\\s+/g, " ").trim().slice(0, 70) || null,
  };
})()`;

const PEEK = `(() => {
  const view = document.querySelector(".hbw-project-view.is-active");
  const track = view?.querySelector(".hbw-project-view__track");
  const door = view?.querySelector(".hbw-outro__door");
  if (!view || !track || !door) return { ok: false };
  const x = Math.max(0, door.getBoundingClientRect().left - track.getBoundingClientRect().left - view.clientWidth * 0.55);
  track.style.transition = "none";
  track.style.transform = "translate3d(" + (-x) + "px,0,0)";
  return { ok: true, x: Math.round(x) };
})()`;

const dir = join(OUT, "frames-cleanup-desktop");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const s = await session(9471, "1440,900", BASE + "/");
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
async function open(name) {
  await s.evalExpr(`(() => {
    const el = [...document.querySelectorAll(".hbw-browse__cell")].find((c) => c.getAttribute("aria-label") === ${JSON.stringify(name)});
    el.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    el.click();
    return true;
  })()`);
}

const home = await s.evalExpr(SNAP);
await rec(400);
await s.evalExpr(`(() => {
  const input = document.querySelector(".hbw-poster-input");
  const native = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  native.set.call(input, "A");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
})()`);
await rec(350);
const typed = await s.evalExpr(SNAP);
await click(".hbw-poster-reset", "Reset");
await sleep(80);
await click(".hbw-poster-reset", "Reset?");
await rec(350);
const reset = await s.evalExpr(SNAP);
await click(".hbw-nav-projects > button", "Projects");
await sleep(280);
await rec(350);
const projects = await s.evalExpr(SNAP);
for (const name of ["KOJA", "CLOSED", "Our Boy Roy", "SUB:3"]) {
  await s.evalExpr(`(() => {
    const el = [...document.querySelectorAll(".hbw-browse__cell")].find((c) => c.getAttribute("aria-label") === ${JSON.stringify(name)});
    el.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    return true;
  })()`);
  await rec(160);
}
await s.evalExpr(`document.querySelector(".hbw-browse__browser")?.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }))`);
await rec(280);
const restored = await s.evalExpr(SNAP);
await click(".hbw-nav-sub button", "Index");
await sleep(180);
await rec(250);
for (const name of ["KOJA", "CLOSED", "Our Boy Roy", "Chris Sisarich", "Bistro Nido", "SUB:3"]) {
  await s.evalExpr(`(() => {
    const el = [...document.querySelectorAll(".hbw-browse__row")].find((c) => c.querySelector(".hbw-browse__row-name")?.textContent.trim() === ${JSON.stringify(name)});
    el.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    return true;
  })()`);
  await rec(120);
}
const index = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-browse__browser")?.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }))`);
await rec(220);
await click(".hbw-nav-sub button", "Visual");
await sleep(160);
await open("SUB:3");
await sleep(900);
await rec(400);
await s.evalExpr(PEEK);
await rec(400);
const sub3Outro = await s.evalExpr(SNAP);
await s.evalExpr(`document.querySelector(".hbw-outro__door")?.click()`);
await sleep(400);
await rec(500);
const koja = await s.evalExpr(SNAP);
await click(".hbw-nav-projects > button", "Projects");
await rec(500);
await open("CLOSED");
await sleep(900);
await rec(400);
await s.evalExpr(`(() => {
  const view = document.querySelector(".hbw-project-view.is-active");
  const track = view?.querySelector(".hbw-project-view__track");
  const second = view?.querySelectorAll(".hbw-mv")[1];
  if (!view || !track || !second) return false;
  const x = Math.max(0, second.getBoundingClientRect().left - track.getBoundingClientRect().left - 80);
  track.style.transition = "none";
  track.style.transform = "translate3d(" + (-x) + "px,0,0)";
  return true;
})()`);
await rec(450);
const closed = await s.evalExpr(SNAP);
await click(".hbw-nav-projects > button", "Projects");
await rec(400);
await click(".hbw-home-strip__brand", "How by Why");
await rec(350);
const end = await s.evalExpr(SNAP);
s.ws.close();
s.chrome.kill();
writeFileSync(join(OUT, "cleanup-pass-report.json"), JSON.stringify({ frames: n, home, typed, reset, projects, restored, index, sub3Outro, koja, closed, end }, null, 2));
console.log("frames", n);
console.log(JSON.stringify({ home, typed, reset, restored, index, sub3Outro, koja, closed, end }, null, 2));
