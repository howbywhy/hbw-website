/**
 * Two plates that read as a pair are two pixels apart.
 *
 * Mark's rule, in his words: "The 2px must be consistent, when it's not
 * visually it's so apparent." It is the one measurement the whole visual
 * system rests on — every plate on the site is --pill-h tall with --edge
 * around it and --pill-gap between it and the next.
 *
 * It is also easy to break by accident, and the way it breaks is always
 * the same: --pill-x gets borrowed for a gap. --pill-x is 7px because
 * that is how far a pill's type sits from its own edge — a measurement
 * about the inside of a plate. Used between two, it is two and a half
 * times the gutter and sits there looking deliberate. The Information
 * button shipped that way.
 *
 * What this cannot do is assert that every gap is 2px, because plenty are
 * meant to be large: the shoulders hold opposite ends of the row, and
 * Previous and Next hold opposite ends of the foot. So it asks a narrower
 * question — if two plates are close enough to read as a pair, are they
 * the family's gutter apart? Anything under NEAR is a pair; anything over
 * it is composition and none of this check's business.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

/* Close enough to read as two plates side by side rather than as two ends
   of a row. Comfortably above 2 and the 7 that goes wrong, far below the
   hundreds that separate a deliberate pair. */
const NEAR = 40;
const GUTTER = 2;

const PAGES = ["/", "/projects/bar-closed", "/projects/koja", "/practice"];

/* Rows that span the window and so must paint all of it. */
const SOLID = [".hbw-lamp__feet", ".hbw-lamp__bar"];
const SIZES = [
  { name: "a phone", width: 390, height: 844, touch: true },
  { name: "a laptop", width: 1440, height: 900, touch: false },
];

/**
 * Every plate in the chrome: something with the family's own field.
 *
 * `near` is passed in rather than closed over. This runs in the page, and
 * the first draft read the module's own constant — which exists in node
 * and not in the browser, so the whole check threw rather than measuring.
 */
const measure = (near) => {
  const inChrome = ".hbw-bar, .hbw-lamp__bar, .hbw-lamp__feet, .hbw-ind__bars";
  const plates = [];
  for (const root of document.querySelectorAll(inChrome)) {
    for (const e of root.querySelectorAll("a, button, p, span, li")) {
      const cs = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      /* A plate is something that paints its own field and is big enough
         to be one. Transparent spans inside a plate are its words. */
      if (cs.backgroundColor === "rgba(0, 0, 0, 0)" || cs.backgroundColor === "transparent") continue;
      if (!(r.width > 10 && r.height > 10)) continue;
      if (cs.visibility === "hidden" || cs.opacity === "0") continue;
      plates.push({
        what: (e.textContent || "").trim().slice(0, 20) || e.className,
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
      });
    }
  }

  /* Pairs sharing a line, nearest neighbour only, and never a plate
     inside another plate — a nested one overlaps rather than sits beside. */
  const pairs = [];
  for (let i = 0; i < plates.length; i += 1) {
    for (let j = 0; j < plates.length; j += 1) {
      if (i === j) continue;
      const a = plates[i];
      const b = plates[j];
      const sameLine = Math.abs(a.top - b.top) < 3 && Math.abs(a.bottom - b.bottom) < 3;
      if (!sameLine) continue;
      const gap = b.left - a.right;
      if (gap < 0) continue;
      if (gap > 0 && gap <= near) pairs.push({ a: a.what, b: b.what, gap: Math.round(gap * 100) / 100 });
    }
  }
  return pairs;
};

/** Any stretch of a full-width chrome row that paints nothing. */
const holes = (rows) => {
  const paints = (e) => {
    const cs = getComputedStyle(e);
    return (
      cs.backgroundColor !== "rgba(0, 0, 0, 0)" &&
      cs.backgroundColor !== "transparent" &&
      cs.visibility !== "hidden" &&
      cs.opacity !== "0"
    );
  };
  const found = [];
  for (const sel of rows) {
    const root = document.querySelector(sel);
    if (!root) continue;
    const rr = root.getBoundingClientRect();
    if (!(rr.width > 10 && rr.height > 6)) continue;
    const plates = [...root.querySelectorAll("*")]
      .filter(paints)
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.width > 6 && r.height > 6);
    if (plates.length === 0) continue;
    const lines = {};
    for (const r of plates) (lines[Math.round(r.top)] ||= []).push(r);
    for (const [top, rs] of Object.entries(lines)) {
      rs.sort((a, b) => a.left - b.left);
      let cur = rr.left;
      for (const r of rs) {
        if (r.left - cur > 3) found.push(`${sel}@${top} ${Math.round(r.left - cur)}px`);
        cur = Math.max(cur, r.right);
      }
      if (rr.right - cur > 3) found.push(`${sel}@${top} ${Math.round(rr.right - cur)}px at the end`);
    }
  }
  return found;
};

export default async function run() {
  const b = await browser();
  const s = sheet("two plates that read as a pair are two pixels apart");

  for (const size of SIZES) {
    for (const path of PAGES) {
      const p = await b.newPage();
      await p.setViewport({
        width: size.width,
        height: size.height,
        isMobile: size.touch,
        hasTouch: size.touch,
        deviceScaleFactor: 2,
      });
      await p.goto(BASE + path, { waitUntil: "domcontentloaded" });
      await sleep(4600);
      const pairs = await p.evaluate(measure, NEAR);
      const gaps = await p.evaluate(holes, SOLID);
      await p.close();

      if (pairs.length === 0) {
        /*
         * No pair found is not a pass. On a page where the chrome is a
         * single plate per row there is genuinely nothing to compare, but
         * a selector that has gone stale looks exactly the same from here.
         */
        s.ok(`${size.name} ${path}: there are plates to compare`, null, "no neighbouring plates found");
        continue;
      }

      const wrong = pairs.filter((one) => Math.abs(one.gap - GUTTER) > 0.5);
      s.ok(
        `${size.name} ${path}: every neighbouring pair is ${GUTTER}px apart`,
        wrong.length === 0,
        wrong.length
          ? wrong.map((one) => `${one.a}|${one.b} ${one.gap}px`).slice(0, 6).join(", ")
          : `${pairs.length} neighbouring pairs, all ${GUTTER}px`
      );

      s.ok(
        `${size.name} ${path}: a row that spans the window paints all of it`,
        gaps.length === 0,
        gaps.length ? gaps.slice(0, 4).join(", ") : "no unpainted runs"
      );
    }
  }

  await b.close();
  return s;
}
