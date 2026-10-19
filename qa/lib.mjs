/**
 * What every check in here is built out of.
 *
 * Three lessons are baked into this file, each of them learned by shipping a
 * check that was wrong rather than a site that was:
 *
 *   1. A check that can only pass is worse than no check. One of these
 *      reported six of ten scenes green while measuring nothing at all, and
 *      an inert rule survived a clean run for weeks behind it. `ok()` takes
 *      a third state — unmeasured — and the runner fails on it.
 *   2. Measure what a visitor sees, not what is convenient. A helper that
 *      read `inset(N%` off the first value of a clip-path matched nothing,
 *      returned a default of 100, and called a fully hidden panel "shown".
 *   3. Never measure against a server that is being rebuilt underneath you.
 *      It has produced two confident, wrong conclusions. `reachable()` is
 *      the runner's guard against the third.
 */
import puppeteer from "puppeteer-core";

export const BASE = process.env.QA_URL ?? "http://localhost:4409";

/** Chrome, wherever this machine keeps it. puppeteer-core downloads nothing. */
function chrome() {
  return (
    process.env.CHROME ??
    process.env.PUPPETEER_EXECUTABLE_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  );
}

/**
 * Every browser this run has opened, so the runner can shut them.
 *
 * A check closes its own on the way out. One that throws does not, and the
 * leak compounds: the next check starts with a Chrome still holding memory,
 * and far enough into a thirteen-check run the suite starts failing with
 * "detached Frame" at whichever check is unlucky. It moved between runs,
 * which is exactly how a harness fault disguises itself as a flaky site.
 */
const opened = new Set();

export async function closeOpenBrowsers() {
  for (const b of [...opened]) {
    opened.delete(b);
    try {
      if (b.connected ?? true) await b.close();
    } catch {
      /* already gone, which is the outcome we wanted */
    }
  }
}

export async function browser() {
  return track(puppeteer.launch({
    executablePath: chrome(),
    headless: "new",
    args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
  }));
}

/** Remembers a browser so the runner can shut it if a check does not. */
export async function track(launching) {
  const b = await launching;
  opened.add(b);
  return b;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The site is a long page that settles; give it time before asking anything. */
export async function open(b, path, { width = 1440, height = 900, settle = 4500 } = {}) {
  const page = await b.newPage();
  await page.setViewport({ width, height });
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await sleep(settle);
  return page;
}

/**
 * Is anything under this element actually moving right now?
 *
 * Past its delay and before its end — a thing waiting out a delay is not
 * moving, and a thing that has finished is not either. Both of those read as
 * "running" to a naive check, which is how a nav that had stopped kept
 * looking busy.
 */
export const MOVING = `
  window.__moving = (root) => {
    if (!root) return false;
    for (const a of root.getAnimations({ subtree: true })) {
      if (a.playState !== "running" && a.playState !== "finished") continue;
      const c = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      if (!c) continue;
      const t = Number(a.currentTime) || 0;
      const delay = Number(c.delay) || 0;
      const dur = Number(c.activeDuration) || 0;
      if (t > delay + 1 && t < delay + dur - 1) return true;
    }
    return false;
  };
`;

/** How much of an element a visitor can actually see: opacity, then any clip. */
export const SEEN = `
  window.__seen = (el) => {
    if (!el) return null;
    const c = getComputedStyle(el);
    const op = Number.parseFloat(c.opacity);
    if (Number.isFinite(op) && op < 0.05) return 0;
    let clipped = 100;
    const m = /inset\\(([^)]+)\\)/.exec(c.clipPath || "");
    if (m) {
      const parts = m[1].trim().split(/\\s+/);
      const bottom = parts.length > 2 ? parts[2] : parts[0];
      const pc = /^([\\d.]+)%$/.exec(bottom);
      if (pc) clipped = Math.round(100 - Number(pc[1]));
    }
    return Math.round(clipped * (Number.isFinite(op) ? op : 1));
  };
`;

/** A check's result sheet. `ok(name, true|false|null, note)` — null is unmeasured. */
export function sheet(title) {
  const rows = [];
  return {
    ok(name, verdict, note = "") {
      rows.push({ name, verdict, note });
    },
    get rows() {
      return rows;
    },
    report() {
      const pass = rows.filter((r) => r.verdict === true).length;
      const fail = rows.filter((r) => r.verdict === false).length;
      const blank = rows.filter((r) => r.verdict === null).length;
      console.log(`-- ${title} --`);
      for (const r of rows) {
        const mark = r.verdict === true ? "pass" : r.verdict === false ? "FAIL" : "----";
        const tail = r.verdict === null ? "   NOT MEASURED" : "";
        console.log(`  ${mark} ${r.name}${r.note ? "   ::  " + r.note : ""}${tail}`);
      }
      return { pass, fail, blank };
    },
  };
}

/** Refuse to measure a server that is not there, or is mid-rebuild. */
export async function reachable() {
  try {
    const res = await fetch(BASE + "/", { redirect: "manual" });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}
