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
  /*
   * The front page's opening beat, which is a move and not a wait.
   *
   * The index does not land finished. It lands saying How by Why and the
   * positioning line, holds, and then opens its first project: the nav
   * hands its words over and the picture wipes in behind it. That is the
   * page's first sentence, and it is deliberate.
   *
   * Timed as one row it read as a slow landing — 1,819ms settled against a
   * budget of 1,100, and a nav of 1,636ms against 780 — and both numbers
   * were the choreography working. They are split at the hand-over now:
   * everything before it is the landing above, everything from it is this.
   *
   * The budget is the design's own arithmetic rather than what the page
   * happens to do: the chrome may take its 1,100, the hold before the open
   * is --hold, and then the picture waits three quarters of a beat (180ms)
   * and wipes over two of them (480ms).
   *
   * --hold is the reading time for the positioning line and has been
   * raised twice — 120ms, then 720ms, now 2,000ms — because at each of
   * those the work came up before the line had been read. So this number
   * moves with it by design, and it is the one budget here that is mostly
   * a deliberate pause rather than work being done. What it still catches
   * is the rest: a chrome that takes longer to assemble, or a wipe that
   * grows, both of which would push past it without touching the hold.
   */
  "the front page opens its first project": { settled: 3760, nav: 3400 },
  /*
   * About's nav at 450 was inside its own spread, which makes a row that
   * decides by coin toss rather than by the site.
   *
   * Five runs on a machine that was also building measured 433, 455, 456,
   * 457 and 461. The budget sat in the middle of that, so the same page
   * passed and failed in consecutive runs and the failure said nothing
   * about About. It is above the spread now and still nowhere near slow —
   * the fault this is for is a nav that takes the better part of a second,
   * not one that takes an extra five milliseconds on a busy machine.
   */
  "opening About": { settled: 1100, nav: 520 },
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
  /*
   * Opening a project no longer moves the nav, and that is the feature.
   *
   * From the loop's field the nav had to assemble the project's name on
   * the press. From the index it is already saying it: stepping onto a bar
   * hands the nav over to that project, so by the time a reader presses
   * the picture the chrome has said what it is going to say and has
   * nothing left to do. Timing it here measured a move the page is right
   * not to make, and reported the row unmeasured when it did not happen.
   *
   * nav: null says the nav is not timed on this move and is not expected
   * to be. If it ever does animate here, something has gone back to
   * assembling the chrome on the press and the row below will catch it.
   */
  "opening a project": { settled: 1700, nav: null },
};

/** Every arrival on the page, timed from a mark we set ourselves. */
const WATCH = `(() => {
  window.__ev = []; window.__t0 = performance.now();
  window.__mark = () => { window.__t0 = performance.now(); window.__ev = []; window.__over = null; };
  const name = (el) => (el.className || "").toString().split(" ")[0] || el.tagName;
  document.addEventListener("animationstart", (e) => {
    if (e.target instanceof Element) window.__ev.push(["start", Math.round(performance.now() - window.__t0), name(e.target)]);
  }, true);
  document.addEventListener("animationend", (e) => {
    if (e.target instanceof Element) window.__ev.push(["end", Math.round(performance.now() - window.__t0), name(e.target)]);
  }, true);
  /* The index tells the chrome which project it is on through this event.
     The first one carrying a project is the moment the page stops landing
     and starts opening, which is where the two moves are split. */
  window.__over = null;
  window.addEventListener("hbw:over", (e) => {
    if (e.detail && window.__over === null) window.__over = Math.round(performance.now() - window.__t0);
  });
})()`;

/*
 * `part` picks one side of the front page's hand-over: "landing" is
 * everything before it, "opening" everything from it on. Any other page has
 * no hand-over and reads whole.
 */
async function read(p, part) {
  const { ev, over } = await p.evaluate(() => ({ ev: window.__ev, over: window.__over ?? null }));
  let ends = ev.filter((e) => e[0] === "end");
  let starts = ev.filter((e) => e[0] === "start");
  if (part && over !== null) {
    const keep = part === "landing" ? (e) => e[1] < over : (e) => e[1] >= over;
    ends = ends.filter(keep);
    starts = starts.filter(keep);
  }
  if (!ends.length) return null;
  const navEnd = ends.filter((e) => /^hbw-bar/.test(e[2])).pop();
  return {
    settled: ends[ends.length - 1][1],
    nav: navEnd ? navEnd[1] : null,
    moves: starts.length,
  };
}

function judge(s, label, m) {
  const want = BUDGET[label];
  if (!m) return s.ok(label, null, "nothing animated, so nothing was timed");
  const note =
    `settled ${m.settled}ms (budget ${want.settled}), ` +
    `nav ${m.nav === null ? "—" : m.nav + "ms" + (want.nav === null ? " (not budgeted)" : " (budget " + want.nav + ")")}, ` +
    `${m.moves} moves`;

  /* A move whose nav is not budgeted is judged on the whole thing settling,
     and says so rather than reporting itself unmeasured. */
  if (want.nav === null) {
    return s.ok(label, m.settled <= want.settled, note + " — the nav arrived before the press");
  }
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
  /* Past the hold and the wipe that follows it, or the opening half is
     measured while it is still happening. */
  await sleep(5200);
  judge(s, "landing on the front page", await read(p, "landing"));
  judge(s, "the front page opens its first project", await read(p, "opening"));

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
  await sleep(5200);
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
    const a = document.querySelector(".hbw-ind__bars li a, .hbw-cell a, a.hbw-cell");
    return a ? new URL(a.href).pathname.split("/").pop()?.split("?")[0] : null;
  });
  if (first) {
    await p.evaluate((slug) => fetch(`/api/sequence/${slug}`).then((r) => r.json()), first);
    await sleep(400);
  }
  await p.evaluate(() => window.__mark());
  await p.evaluate(() =>
    document.querySelector(".hbw-ind__bars li a, .hbw-cell a, a.hbw-cell")?.click()
  );
  await sleep(4000);
  judge(s, "opening a project", await read(p));
  await p.close();

  await b.close();
  return s;
}
