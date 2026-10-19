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
 * These were wrong the first time, in a way worth recording: they were set
 * half again above what the site already did, so every row passed while the
 * site was still described as laggy. A budget written from the status quo
 * only catches a regression; it never catches the thing being too slow in
 * the first place, which is what this was for.
 *
 * They are written from what the site should do now, with about a quarter
 * on top for a machine that is busy. Opening a project gets more room
 * because it fetches a sequence on the way.
 */
const BUDGET = {
  /* A landing assembles the whole chrome from nothing, so its nav carries
     the same words a project does. The old choreography put it at 1,166ms. */
  "landing on the front page": { settled: 1100, nav: 780 },
  "opening About": { settled: 1100, nav: 450 },
  /*
   * A project's nav gets more than the others, for two reasons.
   *
   * "The nav" here is the last word of the chrome arriving, not the bar
   * travelling: the bar lands at about 420ms and its words — the project's
   * name, then the line that turns over under it — assemble behind it on
   * the same ladder as everything else.
   *
   * And this move has a spread the others do not. Five runs measured 1432
   * to 1581 settled and 763 to 915 for the nav: about a hundred and fifty
   * milliseconds, moving together, which is the render after the sequence
   * lands. These sit above the slowest of those. The old choreography put
   * this at 3,061ms settled and 1,494ms nav, so a return to it still fails,
   * and so does anything that adds more than about a tenth of a second.
   */
  "opening a project": { settled: 1700, nav: 1000 },
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
  /*
   * The sequence is fetched first, so this times the choreography and not
   * the server.
   *
   * Opening a project needs that project's frames. On production they are
   * sixty milliseconds away behind a CDN; from `next start` with a cold
   * route they took nearly five hundred, and the nav — which waits for the
   * new state — waited with them. The check was failing on where it was
   * pointed rather than on how the site moves. The site itself asks for this
   * on hover and on the press for exactly the same reason.
   */
  const first = await p.evaluate(() => {
    const a = document.querySelector(".hbw-cell a, a.hbw-cell");
    return a ? new URL(a.href).pathname.split("/").pop()?.split("?")[0] : null;
  });
  if (first) {
    await p.evaluate((slug) => fetch(`/api/sequence/${slug}`).then((r) => r.json()), first);
    await sleep(400);
  }
  await p.evaluate(() => window.__mark());
  await p.evaluate(() => document.querySelector(".hbw-cell a, a.hbw-cell")?.click());
  await sleep(4000);
  judge(s, "opening a project", await read(p));
  await p.close();

  await b.close();
  return s;
}
