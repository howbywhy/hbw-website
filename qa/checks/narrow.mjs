/**
 * No page scrolls sideways on a phone.
 *
 * Twice now a row that could not fit has made the document wider than the
 * screen rather than making itself narrower, and both times it was invisible
 * until somebody dragged the page and watched the fixed bar appear to jump.
 *
 * Our Boy Roy, because its two neighbours have the longest names on the site
 * and the feet say nowrap: 425px inside 390. Then the foot, because its
 * column was 1fr — whose floor is min-content, not zero — so setting one
 * label to the size of the rest of the foot took the column to 402 inside
 * 378 and the whole document with it.
 *
 * Neither is a thing anyone would think to look for, and both arrive from
 * ordinary edits: a project added to the registry with a long name, a word
 * set one size larger. So it is measured on every page at the two widths
 * that matter, and anything past the edge is named.
 *
 * The honeypot is excluded: it is positioned off the edge on purpose and
 * does not make the document scroll.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

const PATHS = [
  "/",
  "/practice",
  "/projects/our-boy-roy",
  "/projects/sck",
  "/projects/koja",
  "/projects/sub-3",
  "/projects/bar-closed",
  "/projects/chris-sisarich",
  "/projects/made-by-madelen",
];

/* 390 is an iPhone; 360 is the narrowest Android worth drawing for. */
const WIDTHS = [390, 360];

export default async function run() {
  const b = await browser();
  const s = sheet("nothing runs off the side of a phone");

  for (const width of WIDTHS) {
    const wide = [];
    for (const path of PATHS) {
      const p = await b.newPage();
      await p.setViewport({ width, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      await p.goto(BASE + path, { waitUntil: "networkidle2" });
      await sleep(2600);
      const found = await p.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        /*
         * Past the edge only counts when it can be reached.
         *
         * A row of frames inside a box that clips them is wider than the
         * screen and cannot be scrolled to — that is a gallery, not a
         * fault. What matters is whether anything makes the document
         * itself scroll sideways, so an element with a clipping ancestor
         * is not one of them.
         */
        const clipped = (e) => {
          for (let up = e.parentElement; up; up = up.parentElement) {
            const how = getComputedStyle(up).overflowX;
            if (how === "hidden" || how === "clip" || how === "auto" || how === "scroll") return true;
          }
          return false;
        };
        const over = [...document.querySelectorAll("*")]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            if (!(r.width > 0 && r.right > vw + 1)) return false;
            if (String(e.className).includes("trap")) return false;
            return !clipped(e);
          })
          .map((e) => `${e.tagName.toLowerCase()}.${String(e.className?.baseVal ?? e.className).split(" ")[0]}`);
        return { docW: document.documentElement.scrollWidth, vw, over: [...new Set(over)].slice(0, 3) };
      });
      if (found.docW > found.vw || found.over.length) {
        wide.push(`${path} → ${found.docW}px${found.over.length ? " (" + found.over.join(", ") + ")" : ""}`);
      }
      await p.close();
    }
    s.ok(`at ${width}px, every page is ${width}px wide`, wide.length === 0, wide.join(" | ") || "all nine");
  }

  /*
   * And no field you type into is small.
   *
   * iOS zooms the page on focus below 16px and cannot be asked not to, which
   * throws the layout about and leaves the reader to pinch back.
   *
   * This measured one field, on one page, by its class. The front page then
   * grew a form of its own inside the Talk bar, whose fields came out at
   * just under twelve pixels and would have zoomed on every tap — the exact
   * fault this row exists for, missed because the row was looking at a
   * named element rather than at the question. It asks the question now:
   * every field a reader can type into, wherever it is.
   */
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto(BASE + "/practice", { waitUntil: "networkidle2" });
  await sleep(2200);
  const fs = await p.evaluate(() => {
    const i = document.querySelector(".hbw-end__field input:not(.hbw-end__trap)");
    return i ? parseFloat(getComputedStyle(i).fontSize) : null;
  });
  s.ok("the signup field is 16px, so nothing zooms", fs !== null && fs >= 16, `${fs}px`);
  await p.close();

  /* And every field on the front page, Talk opened so the form is there. */
  const q = await b.newPage();
  await q.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await q.goto(BASE + "/", { waitUntil: "networkidle2" });
  await sleep(4400);
  await q.evaluate(() =>
    document.querySelector('.hbw-ind__bars li[data-talk] > button')?.click()
  );
  await sleep(1800);
  /*
   * Fields that raise a keyboard, which are the only ones that zoom.
   *
   * A colour swatch opens a picker and a checkbox opens nothing, so their
   * type size is a matter of looks rather than of the page being thrown
   * about. Counting them here would have meant either a failing row about
   * nothing or a reason to loosen the one that matters.
   */
  const TYPED = "text,email,tel,url,search,password,number,date,datetime-local,month,time,week";
  const small = await q.evaluate((kinds) =>
    [...document.querySelectorAll("input, textarea")]
      .filter((e) => e.tagName === "TEXTAREA" || kinds.split(",").includes(e.type))
      .filter((e) => !String(e.className).includes("trap") && e.offsetParent !== null)
      .map((e) => ({
        what: e.tagName.toLowerCase() + (e.type ? ":" + e.type : ""),
        px: parseFloat(getComputedStyle(e).fontSize),
      }))
      .filter((e) => e.px < 16)
  , TYPED);
  const counted = await q.evaluate(
    (kinds) =>
      [...document.querySelectorAll("input, textarea")]
        .filter((e) => e.tagName === "TEXTAREA" || kinds.split(",").includes(e.type))
        .filter((e) => !String(e.className).includes("trap") && e.offsetParent !== null).length,
    TYPED
  );
  s.ok(
    "and so is every field you can type into on the front page",
    counted > 0 && small.length === 0,
    small.length
      ? small.map((e) => `${e.what} ${e.px}px`).join(", ")
      : `${counted} fields, all 16px or more`
  );

  /*
   * And the drawing is behind a press here, as everything else is.
   *
   * The poster had the top half of a phone whether anybody wanted it or
   * not — a blank sheet with the instrument floating on it, above the
   * form somebody opened Talk to use. It waits behind a row now.
   *
   * Both halves are checked, because the first attempt got the second one
   * wrong: .hbw-ind__bars button lays out every control in that column
   * and outranks a bare class, so "display: none" did nothing and the row
   * appeared on sheets too — a button offering to reveal something that
   * was already in plain sight.
   */
  const door = await q.evaluate(() => {
    const d = document.querySelector(".hbw-ind__draw");
    const room = document.querySelector(".hbw-ind__shot--talk");
    return {
      shown: d ? getComputedStyle(d).display !== "none" : false,
      away: room ? room.getBoundingClientRect().height === 0 : null,
    };
  });
  s.ok(
    "on a phone the drawing waits behind a row",
    door.shown && door.away === true,
    `row ${door.shown ? "shown" : "missing"}, poster ${door.away ? "away" : "open"}`
  );

  await q.evaluate(() => document.querySelector(".hbw-ind__draw")?.click());
  await sleep(1200);
  const out = await q.evaluate(() => {
    const room = document.querySelector(".hbw-ind__shot--talk");
    return room ? Math.round(room.getBoundingClientRect().height) : 0;
  });
  s.ok("and pressing it brings the drawing out", out > 100, `${out}px of sheet`);
  await q.close();

  /* On a sheet there is no row, because the poster is already in the room. */
  const w = await b.newPage();
  await w.setViewport({ width: 1440, height: 900 });
  await w.goto(BASE + "/", { waitUntil: "networkidle2" });
  await sleep(4400);
  await w.evaluate(() => document.querySelector('.hbw-ind__bars li[data-talk] > button')?.click());
  await sleep(1800);
  const wide = await w.evaluate(() => {
    const d = document.querySelector(".hbw-ind__draw");
    const room = document.querySelector(".hbw-ind__shot--talk");
    return {
      shown: d ? getComputedStyle(d).display !== "none" : false,
      room: room ? Math.round(room.getBoundingClientRect().height) : 0,
    };
  });
  s.ok(
    "and on a sheet there is no row, the poster being in the room already",
    !wide.shown && wide.room > 100,
    `row ${wide.shown ? "shown" : "hidden"}, poster ${wide.room}px`
  );
  await w.close();

  await b.close();
  return s;
}
