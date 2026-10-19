/**
 * The site's moves are quick, not merely smooth.
 *
 * `smooth` measures the frame rate while scrolling and the site passed it
 * every time — on a real GPU, not one frame dropped. It was still described
 * as laggy, and it was: opening a project from the front page took two and
 * nine tenths of a second to finish assembling itself, and the nav alone
 * took the better part of a second to travel. Nothing stuttered. Everything
 * waited.
 *
 * So this measures duration rather than pacing, and it measures it the way a
 * reader experiences it: from the press to the last thing finishing. The nav
 * is timed separately because the nav leads — the work is deliberately held
 * until the chrome has arrived, which means a slow nav makes the whole page
 * slow behind it.
 *
 * Proved by putting the old durations back: every budget below fails, the
 * worst by seven hundred milliseconds.
 */
import { BASE, sleep, sheet } from "../lib.mjs";

/*
 * What each move is allowed to take, measured from the press.
 *
 * These are roughly half again on top of what the site does now, so an
 * ordinary slow run does not fail and a return to the old choreography
 * cannot pass. Opening a project gets more room because it fetches a
 * sequence on the way.
 */
const BUDGET = {
  "landing on the front page": { settled: 1700, nav: 900 },
  "opening About": { settled: 1700, nav: 700 },
  "opening a project": { settled: 2400, nav: 1300 },
};

/** Every arrival on the page, timed from a mark we set ourselves. */
const WATCH = `(() => {
  window.__ev = []; window.__t0 = performance.now();
  window.__mark = () => { window.__t0 = performance.now(); window.__ev = []; };
  const name = (el) => (el.className || "").toString().split(" ")[0] || el.tagName;
  document.addEventListener("animationstart", (e) => {
    if (e.target instanceof Element) window.__ev.push(["start", Math.round(performance.now() - window.__t0), name(e.target)]);
  }, true);
  document.addEventListener("animationend", (e) => {
    if (e.target instanceof Element) window.__ev.push(["end", Math.round(performance.now() - window.__t0), name(e.target)]);
  }, true);
})()`;

async function read(p) {
  const ev = await p.evaluate(() => window.__ev);
  const ends = ev.filter((e) => e[0] === "end");
  if (!ends.length) return null;
  const navEnd = ends.filter((e) => /^hbw-bar/.test(e[2])).pop();
  return {
    settled: ends[ends.length - 1][1],
    nav: navEnd ? navEnd[1] : null,
    moves: ev.filter((e) => e[0] === "start").length,
  };
}

function judge(s, label, m) {
  const want = BUDGET[label];
  if (!m) return s.ok(label, null, "nothing animated, so nothing was timed");
  const note =
    `settled ${m.settled}ms (budget ${want.settled}), ` +
    `nav ${m.nav === null ? "—" : m.nav + "ms (budget " + want.nav + ")"}, ` +
    `${m.moves} moves`;
  if (m.nav === null) return s.ok(label, null, note + " — the nav never moved, so it was not timed");
  s.ok(label, m.settled <= want.settled && m.nav <= want.nav, note);
}

export default async function run() {
  const { browser } = await import("../lib.mjs");
  const b = await browser();
  const s = sheet("the moves are quick");

  let p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.evaluateOnNewDocument(WATCH);
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await sleep(4000);
  judge(s, "landing on the front page", await read(p));

  await p.evaluate(() => window.__mark());
  await p.evaluate(() => {
    const a = [...document.querySelectorAll(".hbw-bar a, .hbw-bar button")].find((x) => x.textContent.trim() === "About");
    a && a.click();
  });
  await sleep(3500);
  judge(s, "opening About", await read(p));
  await p.close();

  p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.evaluateOnNewDocument(WATCH);
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await sleep(5000);
  await p.evaluate(() => window.__mark());
  await p.evaluate(() => document.querySelector(".hbw-cell a, a.hbw-cell")?.click());
  await sleep(4000);
  judge(s, "opening a project", await read(p));
  await p.close();

  await b.close();
  return s;
}
