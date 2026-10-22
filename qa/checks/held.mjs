/**
 * Work is never cut to, and never left invisible.
 *
 * The front page used to open its field on the ladder and then fill in
 * underneath it: eighty-four pictures landing one at a time over six hundred
 * milliseconds, each appearing the moment it arrived. The rows were clipped
 * from the served markup and uncovered together, a row behind a row, once the
 * pictures on the first screen had decoded — and that hold is what this file
 * was written to guard.
 *
 * That field is gone. The front page is the index now: one column of bars and
 * one picture, which has nothing to hold. The hold was not loosened or
 * broken, it stopped having a subject, and a check whose subject has gone is
 * worse than no check — it goes green on a page it is no longer looking at.
 *
 * So this now guards the two things that outlived the field, which are the
 * two faults the hold existed to prevent in the first place:
 *
 *   1. Work is never cut to. The front page's picture changes every time a
 *      reader steps, and it is uncovered by a seam travelling across it. A
 *      cut is the one move this site does not make. Counting whether the
 *      picture ended up visible is satisfied by a picture that snapped there
 *      in one frame, so this counts the distinct mask positions it passes
 *      through on the way — the same argument the clip count made.
 *
 *      Verified by taking the animation off: twenty-odd positions become one
 *      and this row fails.
 *
 *   2. Work is never left invisible. A project page still serves its strip as
 *      rows, and they must be uncovered with script and without — the floor
 *      that --sheet-wait exists for, and the reason a page that never
 *      hydrates is not a page of invisible work.
 *
 * What it does NOT guard, said plainly so nobody reads more into a green run
 * than is in it: the two clocks colliding. While the field existed the script
 * and the stylesheet could each uncover a row, and a mishandled hand-over
 * once fired them thirteen milliseconds apart. That race could never be
 * provoked on demand and has never been seen by this file.
 */
import { BASE, browser, track, sleep, sheet } from "../lib.mjs";
import puppeteer from "puppeteer-core";

/** A wipe passes through intermediate positions; a cut does not. */
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
async function land({ mbit, noJs = false, path = "" }) {
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

  await p.goto(BASE + path, { waitUntil: "load" });
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
  const s = sheet("work is never cut to, nor left invisible");

  /*
   * 1. The front page holds nothing, because it has nothing to hold.
   *
   * Stated rather than assumed: if a field of rows ever comes back to the
   * front page it will arrive unheld, and this is the row that says so.
   */
  const front = await fetch(BASE).then((r) => r.text());
  const turns = front.match(/data-hold="true"/g)?.length ?? 0;
  s.ok(
    "the front page holds nothing, having one picture and not a field",
    turns === 0,
    `${turns} turns held in the HTML`
  );

  /* 2. And its picture is uncovered by a seam, not cut to. */
  const seam = await seamSteps();
  s.ok(
    "stepping a project uncovers the next picture, it does not cut to it",
    seam.steps >= STEPS,
    seam.steps === null
      ? "no picture found to watch"
      : `the picture passed through ${seam.steps} mask positions (a cut shows 1 or 2)`
  );
  s.ok(
    "and the seam crosses right to left",
    seam.first !== null && seam.last !== null && seam.first < seam.last,
    `${seam.first}% to ${seam.last}%`
  );

  /*
   * And the seam bends to the two pictures rather than ruling straight.
   *
   * This is the least-difference edge, and it is the one part of the move
   * that can fail silently: lose the row profiles, lose the canvas, lose
   * --seam-linger, and the page still wipes correctly on the even gradient.
   * It would look fine and be a different transition.
   *
   * So the built mask is read back — it is a data URI, so a canvas may draw
   * it — and each row's turnover point found. An even seam turns over at the
   * same place in every row; a bent one does not.
   */
  const bend = await seamBend();
  s.ok(
    "and it bends to where the two pictures differ",
    bend.spread !== null && bend.spread >= 12,
    bend.spread === null
      ? bend.why
      : `rows turn over across ${bend.spread} of ${bend.width} mask pixels` +
        ` (an even seam spreads 0)`
  );

  /*
   * 3. A project page's rows are uncovered — with script and without.
   *
   * The floor. The strip is served as rows, and a reader whose script never
   * runs must still get the work rather than a page of empty plates.
   */
  const run1 = await land({ mbit: 4, path: "/projects/koja" });
  if (!run1.rows) {
    s.ok("a project's rows are uncovered", null, "no .hbw-sheet found — nothing after this was measured");
    return s;
  }
  s.ok(
    "a project's rows are not left covered",
    run1.covered === 0,
    `${run1.rows} rows, ${run1.covered} still clipped`
  );

  const bare = await land({ mbit: 4, noJs: true, path: "/projects/koja" });
  s.ok(
    "with no script, the stylesheet uncovers them anyway",
    bare.rows > 0 && bare.covered === 0,
    bare.rows ? `${bare.rows} rows, ${bare.covered} still clipped` : "no rows found"
  );

  /* And it holds nothing either, having nothing to show behind the window. */
  const koja = await fetch(`${BASE}/projects/koja`).then((r) => r.text());
  const kojaHeld = koja.match(/data-hold="true"/g)?.length ?? 0;
  s.ok(
    "a project page holds nothing, having nothing to show",
    kojaHeld === 0,
    `${kojaHeld} turns held on /projects/koja`
  );

  return s;
}

/**
 * Read the built mask back and measure how far its rows disagree.
 *
 * Returns spread: null with a reason when there is no mask to read, which is
 * a fault here — by this point the page has stepped between two projects.
 */
async function seamBend() {
  const b = await track(
    puppeteer.launch({
      executablePath: chrome(),
      headless: "new",
      args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
    })
  );
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE, { waitUntil: "domcontentloaded" });
  await sleep(4400);
  await p.evaluate(() =>
    document
      .querySelector(".hbw-ind")
      ?.dispatchEvent(new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true }))
  );
  await sleep(500);

  const out = await p.evaluate(async () => {
    const plate = document.querySelector(".hbw-ind__shot");
    if (!plate) return { spread: null, why: "no plate" };
    const map = plate.style.getPropertyValue("--seam-map");
    if (!map) return { spread: null, why: "no --seam-map was built for the step" };
    const src = /url\("?([^")]+)"?\)/.exec(map);
    if (!src) return { spread: null, why: "--seam-map is not a url()" };

    const img = new Image();
    img.src = src[1];
    try {
      await img.decode();
    } catch {
      return { spread: null, why: "the mask would not decode" };
    }
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, c.width, c.height).data;

    /* Where each row crosses half-opaque, which is the seam's own line. */
    const edges = [];
    for (let y = 0; y < c.height; y += 1) {
      for (let x = 0; x < c.width; x += 1) {
        if (px[(y * c.width + x) * 4 + 3] >= 128) { edges.push(x); break; }
      }
    }
    if (!edges.length) return { spread: null, why: "no row ever turns over" };
    return {
      spread: Math.max(...edges) - Math.min(...edges),
      width: c.width,
      why: null,
    };
  });

  await b.close();
  return out;
}

/**
 * Step the front page once and watch the picture arrive.
 *
 * Unthrottled and with a real frame clock: this measures how the picture is
 * uncovered, not how fast it is fetched.
 */
async function seamSteps() {
  const b = await track(
    puppeteer.launch({
      executablePath: chrome(),
      headless: "new",
      args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
    })
  );
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE, { waitUntil: "domcontentloaded" });
  await sleep(4400);

  /*
   * The arriving layer, not whatever picture is first in the plate.
   *
   * There are two now — the one being left, plainly, and the one arriving
   * with the seam cut into it — and this used to take the first match,
   * which is the one underneath and carries no mask at all. It would have
   * reported a cut on a page that wipes perfectly well.
   */
  const shot = ".hbw-ind__over";
  const found = await p.$(shot);
  if (!found) {
    await b.close();
    return { steps: null, first: null, last: null };
  }

  await p.evaluate((sel) => {
    window.__seen = [];
    const t0 = performance.now();
    const tick = () => {
      const el = document.querySelector(sel);
      if (el) {
        const c = getComputedStyle(el);
        const v = c.maskPosition || c.webkitMaskPosition;
        if (window.__seen[window.__seen.length - 1] !== v) window.__seen.push(v);
      }
      if (performance.now() - t0 < 1400) requestAnimationFrame(tick);
    };
    /* The wheel is what the page listens to; a scroll would do nothing,
       because the front page does not scroll. */
    document
      .querySelector(".hbw-ind")
      ?.dispatchEvent(new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true }));
    requestAnimationFrame(tick);
  }, shot);
  await sleep(1600);

  const seen = await p.evaluate(() => window.__seen ?? []);
  await b.close();
  const num = (v) => {
    const m = /^(-?[\d.]+)%/.exec(v ?? "");
    return m ? Math.round(Number(m[1])) : null;
  };
  return { steps: seen.length, first: num(seen[0]), last: num(seen[seen.length - 1]) };
}
