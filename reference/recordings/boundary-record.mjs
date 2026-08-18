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
  const userData = mkdtempSync(join(tmpdir(), "hbw-b-"));
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
  const sub = document.querySelector(".hbw-nav-sub:not(.is-idle)");
  const outro = document.querySelector(".hbw-project-view.is-active .hbw-outro, .hbw-project-view.is-handoff-out .hbw-outro, .hbw-outro");
  const or = outro?.getBoundingClientRect();
  return {
    url: location.pathname,
    mode: home?.className,
    phase: home?.getAttribute("data-hbw-motion"),
    nav: sub?.innerText.replace(/\\s+/g, " ").trim() || null,
    project: home?.getAttribute("data-hbw-project"),
    counter: document.querySelector('.hbw-nav-sub[data-face="view"] .hbw-nav-sub__meta')?.textContent.trim() || null,
    outroOn: outro ? or.right > 8 && or.left < 1440 && or.bottom > 8 && or.top < 900 : false,
    outroLabel: outro?.innerText.replace(/\\s+/g, " ").trim().slice(0, 70) || null,
    task: !!document.querySelector(".hbw-task"),
  };
})()`;

const PEEK = `(() => {
  const view = document.querySelector(".hbw-project-view.is-active, .hbw-project-view.is-rising, .hbw-project-view.is-handoff-in");
  const track = view?.querySelector(".hbw-project-view__track");
  const door = view?.querySelector(".hbw-outro__door");
  const outro = view?.querySelector(".hbw-outro");
  if (!view || !track || !door) return { ok: false };
  const x = Math.max(0, door.getBoundingClientRect().left - track.getBoundingClientRect().left - view.clientWidth * 0.52);
  track.style.transition = "none";
  track.style.transform = "translate3d(" + (-x) + "px,0,0)";
  const or = outro?.getBoundingClientRect();
  return { ok: true, x: Math.round(x), left: Math.round(or?.left || 0), width: Math.round(or?.width || 0) };
})()`;

async function runDesktop() {
  const dir = join(OUT, "frames-boundary-desktop");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const s = await session(9461, "1440,900", BASE + "/");
  let n = 0;
  async function shot() {
    try {
      const { data } = await s.cdp("Page.captureScreenshot", { format: "jpeg", quality: 70 });
      n += 1;
      writeFileSync(join(dir, `f${String(n).padStart(5, "0")}.jpg`), Buffer.from(data, "base64"));
    } catch (err) {
      console.log("shot skip", String(err.message || err).slice(0, 90));
    }
  }
  async function recPeek(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      await s.evalExpr(PEEK);
      await shot();
      await sleep(80);
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

  await click(".hbw-nav-projects > button", "Projects");
  await sleep(280);
  await open("CLOSED");
  await sleep(900);
  await rec(500);
  const enter = await s.evalExpr(SNAP);
  await s.evalExpr(`Promise.race([
    Promise.all([...document.querySelectorAll(".hbw-project-view.is-active img")].slice(0, 4).map((el) => el.complete ? 1 : new Promise((r) => { el.onload = r; el.onerror = r; }))),
    new Promise((r) => setTimeout(r, 1200))
  ])`, true);
  await sleep(200);
  const peeked = await s.evalExpr(PEEK);
  await recPeek(500);
  const outro = await s.evalExpr(SNAP);
  await s.evalExpr(`document.querySelector(".hbw-outro__door")?.click()`);
  await sleep(280);
  await rec(700);
  const handoff = await s.evalExpr(SNAP);
  await click(".hbw-nav-projects > button", "Projects");
  await rec(550);
  await open("KOJA");
  await sleep(800);
  await rec(400);
  await s.evalExpr(`Promise.race([
    Promise.all([...document.querySelectorAll(".hbw-project-view.is-active img")].slice(0, 4).map((el) => el.complete ? 1 : new Promise((r) => { el.onload = r; el.onerror = r; }))),
    new Promise((r) => setTimeout(r, 1200))
  ])`, true);
  await sleep(200);
  await s.evalExpr(PEEK);
  await sleep(80);
  await s.evalExpr(PEEK);
  await sleep(220);
  await recPeek(350);
  await s.evalExpr(`document.querySelector(".hbw-outro__door")?.click()`);
  await sleep(280);
  await rec(650);
  const kojaClosed = await s.evalExpr(SNAP);
  await s.evalExpr(`history.back(); true`);
  await sleep(600);
  await rec(500);
  const back = await s.evalExpr(SNAP);
  await click(".hbw-nav-projects > button", "Projects");
  await sleep(350);
  await shot();
  const final = await s.evalExpr(SNAP);
  s.ws.close();
  s.chrome.kill();
  return { frames: n, enter, outro, peeked, handoff, kojaClosed, back, final };
}

async function runMobile() {
  const dir = join(OUT, "frames-boundary-mobile");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const s = await session(9462, "390,844", BASE + "/");
  let n = 0;
  async function shot() {
    try {
      const { data } = await s.cdp("Page.captureScreenshot", { format: "jpeg", quality: 70 });
      n += 1;
      writeFileSync(join(dir, `f${String(n).padStart(5, "0")}.jpg`), Buffer.from(data, "base64"));
    } catch (err) {
      console.log("shot skip", String(err.message || err).slice(0, 90));
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
      const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((n) => (n.textContent || "").trim() === ${JSON.stringify(text)});
      if (!el) throw new Error("missing " + ${JSON.stringify(text)});
      el.click();
      return true;
    })()`);
  }
  await click(".hbw-nav-projects > button", "Projects");
  await sleep(220);
  await click(".hbw-nav-sub button", "Visual");
  await sleep(180);
  await s.evalExpr(`(() => {
    const el = [...document.querySelectorAll(".hbw-browse__cell")].find((c) => c.getAttribute("aria-label") === "SUB:3");
    el.click();
    return true;
  })()`);
  await sleep(800);
  await rec(400);
  const enter = await s.evalExpr(SNAP);
  await s.evalExpr(`document.querySelector(".hbw-project-view")?.scrollTo({ top: 20000, behavior: "instant" }); true`);
  await sleep(350);
  await shot();
  const outro = await s.evalExpr(SNAP);
  await s.evalExpr(`document.querySelector(".hbw-outro__door")?.click()`);
  await sleep(280);
  await rec(700);
  const next = await s.evalExpr(SNAP);
  await s.evalExpr(`history.back(); true`);
  await sleep(600);
  await rec(550);
  const back = await s.evalExpr(SNAP);
  s.ws.close();
  s.chrome.kill();
  return { frames: n, enter, outro, next, back };
}

mkdirSync(OUT, { recursive: true });
const desktop = await runDesktop();
console.log("desktop", desktop.frames, desktop.peeked, desktop.enter, desktop.outro, desktop.handoff, desktop.back);
const mobile = await runMobile();
console.log("mobile", mobile.frames, mobile.enter, mobile.outro, mobile.next, mobile.back);
writeFileSync(join(OUT, "boundary-pass-report.json"), JSON.stringify({ desktop, mobile }, null, 2));
