/**
 * The work is held until it is a picture, and then uncovered — three ways.
 *
 * The front page used to open its field on the ladder and then fill in
 * underneath it: eighty-four pictures landing one at a time over six hundred
 * milliseconds, each appearing the moment it arrived. The rows are clipped
 * from the served markup now and uncovered together, a row behind a row, once
 * the pictures actually on the first screen have decoded.
 *
 * Three things have to be true, and only the first is obvious:
 *
 *   1. With script, the rows are held and then uncovered — none left covered.
 *   2. WITHOUT script, they are uncovered too. The hold is in the HTML, so a
 *      page that never hydrates is a page of invisible work unless the
 *      stylesheet can finish the job on its own. That floor is the reason
 *      --sheet-wait exists and the reason it sits past any hydration.
 *   3. The reveal is a wipe, not a cut. Asking only whether a row ended up
 *      visible is satisfied by a row that snapped there in one frame, which
 *      is the fault this whole mechanism exists to remove — so this counts
 *      the distinct clip values the row passes through on the way. Verified
 *      by taking the transition off .hbw-sheet: sixteen clips become two and
 *      this row fails.
 *
 *      What it does NOT guard, said plainly so nobody reads more into a
 *      green run than is in it: the two clocks colliding. The script and the
 *      stylesheet can each uncover a row, and while that hand-over was
 *      mishandled they once fired thirteen milliseconds apart and the row
 *      jumped to its end in three frames. That is fixed in the page — the
 *      script lets a running reveal finish rather than cutting it — but the
 *      collision is a race that could not be provoked on demand, so this
 *      check has never seen it. The fix is reasoned, not covered.
 *
 * And a project page must not hold at all: there the strip is behind a full
 * window carrying no sources, so uncovering it is a move nobody can see that
 * `brisk` nonetheless charges to the project's arrival.
 */
import { BASE, browser, track, sleep, sheet } from "../lib.mjs";
import puppeteer from "puppeteer-core";

/** A wipe passes through intermediate clips; a cut does not. */
const STEPS = 5;

function chrome() {
  return (
    process.env.CHROME ??
    process.env.PUPPETEER_EXECUTABLE_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  );
}

/**
 * Watch a landing on a throttled connection.
 *
 * Throttled on purpose: unthrottled, the pictures decode before the hold has
 * anything to hold and the interesting states never happen. Headless is fine
 * here — this measures clip values and attributes, not frames drawn — but the
 * throttle is not optional.
 */
async function land({ mbit, noJs = false }) {
  const b = await track(
    puppeteer.launch({
      executablePath: chrome(),
      headless: "new",
      args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
    })
  );
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  if (noJs) await p.setJavaScriptEnabled(false);

  const s = await p.target().createCDPSession();
  await s.send("Network.enable");
  await s.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 40,
    downloadThroughput: (mbit * 1024 * 1024) / 8,
    uploadThroughput: (mbit * 1024 * 1024) / 8,
  });

  if (!noJs) {
    await p.evaluateOnNewDocument(() => {
      window.__t0 = performance.now();
      window.__gone = null;
      window.__clips = [];
      /*
       * Polled every frame rather than observed.
       *
       * A MutationObserver has to be given a node, and in here the document
       * is still empty — an earlier version of this attached to a null
       * documentElement, saw nothing, and reported that the script never
       * released a hold it had in fact released.
       */
      const tick = () => {
        const turn = document.querySelector(".hbw-turn");
        if (turn) {
          if (window.__gone === null && !turn.dataset.hold) {
            window.__gone = performance.now() - window.__t0;
          }
          const rows = document.querySelectorAll(".hbw-sheet");
          const row = rows[Math.floor(rows.length / 3)];
          if (row) {
            const c = getComputedStyle(row).clipPath;
            if (window.__clips[window.__clips.length - 1] !== c) window.__clips.push(c);
          }
        }
        if (performance.now() - window.__t0 < 4000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  await p.goto(BASE, { waitUntil: "load" });
  await sleep(4200);

  const out = await p.evaluate(() => {
    const rows = [...document.querySelectorAll(".hbw-sheet")];
    const mid = rows.slice(rows.length / 3, (rows.length / 3) * 2);
    const clips = mid.map((r) => getComputedStyle(r).clipPath);
    return {
      rows: mid.length,
      covered: clips.filter((c) => /100%/.test(c)).length,
      held: document.querySelector(".hbw-turn")?.dataset.hold ?? null,
      gone: window.__gone ?? null,
      seen: window.__clips ?? null,
    };
  });

  await b.close();
  return out;
}

export default async function run() {
  const s = sheet("the work is held, then uncovered");

  /* 1. Served held. If it is not, there is nothing to measure after this. */
  const served = await fetch(BASE).then((r) => r.text());
  const turns = served.match(/data-hold="true"/g)?.length ?? 0;
  s.ok("the front page is served with its rows held", turns === 3, `${turns} of 3 turns held in the HTML`);

  const run1 = await land({ mbit: 4 });
  if (!run1.rows) {
    s.ok("the rows are uncovered", null, "no .hbw-sheet found — nothing after this was measured");
    return s;
  }

  s.ok(
    "and the script lets them go",
    run1.gone !== null,
    run1.gone === null ? "data-hold was never removed" : `released at ${Math.round(run1.gone)}ms`
  );
  s.ok(
    "nothing is left covered",
    run1.covered === 0,
    `${run1.rows} rows, ${run1.covered} still clipped`
  );

  /* 3. A wipe, not a cut. */
  const steps = run1.seen?.length ?? 0;
  s.ok(
    "and it is a wipe, not a cut",
    steps >= STEPS,
    run1.seen === null
      ? "no clips recorded"
      : `the first row passed through ${steps} clips (a cut shows 2 or 3)`
  );

  /* 2. The floor: no script at all. */
  const bare = await land({ mbit: 4, noJs: true });
  s.ok(
    "with no script, the stylesheet uncovers them anyway",
    bare.rows > 0 && bare.covered === 0,
    bare.rows ? `${bare.rows} rows, ${bare.covered} still clipped, data-hold still "${bare.held}"` : "no rows found"
  );

  /* And a project page holds nothing. */
  const koja = await fetch(`${BASE}/projects/koja`).then((r) => r.text());
  const kojaHeld = koja.match(/data-hold="true"/g)?.length ?? 0;
  s.ok(
    "a project page holds nothing, having nothing to show",
    kojaHeld === 0,
    `${kojaHeld} turns held on /projects/koja`
  );

  return s;
}
