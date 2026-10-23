/**
 * The studio's line is never left unsaid.
 *
 * At full bleed the bar stands its own copy down and the gallery's row
 * carries the words, because moving the bar's copy meant transforming a
 * backdrop-filtered element inside a fixed parent and Chrome paints that a
 * bar's height above its own box. That hand-over was written against the
 * gallery alone. Open About over a full-bleed frame and the row it hands to
 * is behind the sheet, so the line was said nowhere at all — the one state
 * where the site stopped saying what it is.
 *
 * Two things are measured, because fixing the first by switching the line on
 * would have broken the second: that something on screen always carries the
 * words, and that the bar takes them back on a fade. Nothing in the nav may
 * arrive at full strength in a single frame.
 *
 * Note the mouse. `element.click()` does not put this gallery into full
 * bleed — four attempts to set the state that way measured nothing — and a
 * real click at a coordinate does. If the frame never opens, this reports
 * unmeasured rather than passing on an empty run.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

/** What the bar's line is doing, and whether anything else is saying it. */
const LOOK = () => {
  const what = document.querySelector(".hbw-bar__what");
  const lamp = document.querySelector(".hbw-lamp");
  const row = document.querySelector(".hbw-lamp__says");
  const said = what && what.querySelector(".hbw-bar__studio, .hbw-bar__said");
  const words = (el) => (el && el.textContent.trim().length > 3 ? el.textContent.trim() : "");
  return {
    full: lamp ? lamp.dataset.full === "true" : false,
    sheet: Boolean(document.querySelector(".hbw-studio-sheet")),
    bar: what ? Number(Number(getComputedStyle(what).opacity).toFixed(3)) : null,
    barWords: words(said),
    rowShown: row ? Number(getComputedStyle(row).opacity) > 0.05 : false,
    rowWords: words(row),
  };
};

/** The biggest single-frame step in the bar's line while something happens. */
async function step(p, act) {
  await p.evaluate(() => {
    window.__o = [];
    const w = document.querySelector(".hbw-bar__what");
    window.__iv = setInterval(() => w && window.__o.push(Number(getComputedStyle(w).opacity)), 30);
  });
  await act();
  await sleep(1500);
  return p.evaluate(() => {
    clearInterval(window.__iv);
    const o = window.__o;
    let worst = 0;
    for (let i = 1; i < o.length; i++) worst = Math.max(worst, Math.abs(o[i] - o[i - 1]));
    return { worst: Number(worst.toFixed(2)), frames: o.length, from: o[0], to: o[o.length - 1] };
  });
}

/*
 * A line that never moved was not handed over gently; it was not handed over
 * at all. Judging the step alone passed every one of these rows against a
 * build where the bar's copy stayed dark the whole way through.
 */
const moved = (r) => Math.abs(r.to - r.from) > 0.1;
const faded = (r) => (moved(r) ? r.worst < 0.5 : null);
const told = (r) =>
  moved(r)
    ? `${r.from.toFixed(2)} -> ${r.to.toFixed(2)}, biggest frame step ${r.worst} over ${r.frames} samples`
    : `the line never moved (${r.from.toFixed(2)} throughout) — nothing to judge`;

export default async function run() {
  const b = await browser();
  const s = sheet("the line is always said");
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE + "/projects/sck", { waitUntil: "domcontentloaded" });
  await sleep(5000);

  /*
   * Open the information, then a real click on a frame to reach full bleed.
   *
   * This used to press Grid, because that was where a frame was a way into
   * itself. Pressing a frame now belongs to the writing and nowhere else —
   * looking at the work and going into one piece of it are two different
   * intentions, and only one of them is a press. So the check follows the
   * behaviour to where it lives rather than being relaxed to suit its own
   * old setup: it still reaches full bleed by a real click on a real frame.
   */
  await p.evaluate(() => {
    const g = [...document.querySelectorAll("button, a")].find(
      (x) => x.textContent.trim() === "Information"
    );
    g && g.click();
  });
  await sleep(2200);
  const box = await p.evaluate(() => {
    const e = document.querySelector(".hbw-lamp__pick") ?? document.querySelector(".hbw-lamp__page");
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!box) {
    s.ok("a frame to open", null, "nothing pickable with the writing open");
    await b.close();
    return s;
  }
  const into = await step(p, () => p.mouse.click(box.x, box.y));
  await sleep(1200);
  const bleed = await p.evaluate(LOOK);

  if (!bleed.full) {
    s.ok("the frame opens full bleed", null, "data-full never became true; nothing after this was measured");
    await b.close();
    return s;
  }

  s.ok(
    "at full bleed the gallery's row carries it",
    bleed.bar < 0.05 && bleed.rowShown && bleed.rowWords.length > 3,
    `bar line ${bleed.bar}, row says "${bleed.rowWords.slice(0, 34)}"`
  );
  s.ok("and it stands down on a fade", faded(into), told(into));

  const open = await step(p, () =>
    p.evaluate(() => {
      const a = [...document.querySelectorAll(".hbw-bar nav a, .hbw-bar nav button")].find(
        (x) => x.textContent.trim() === "Studio"
      );
      a && a.click();
    })
  );
  await sleep(1500);
  const over = await p.evaluate(LOOK);

  if (!over.sheet) {
    s.ok("About opens over the frame", null, "no sheet appeared");
    await b.close();
    return s;
  }
  s.ok(
    "with About over it, the bar takes it back",
    over.bar > 0.9 && over.barWords.length > 3,
    `bar line ${over.bar}, says "${over.barWords.slice(0, 40)}"`
  );
  s.ok("handed over, not switched on", faded(open), told(open));

  const shut = await step(p, () =>
    p.evaluate(() => {
      const a = [...document.querySelectorAll(".hbw-bar a, .hbw-bar button")].find(
        (x) => x.textContent.trim() === "Close"
      );
      a && a.click();
    })
  );
  s.ok("and handed back the same way", faded(shut), told(shut));

  await b.close();
  return s;
}
