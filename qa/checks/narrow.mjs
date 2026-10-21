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
        const over = [...document.querySelectorAll("*")]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && r.right > vw + 1 && !String(e.className).includes("trap");
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
   * And the one field you type into is not small.
   *
   * iOS zooms the page on focus below 16px and cannot be asked not to, which
   * throws the layout about and leaves the reader to pinch back.
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

  await b.close();
  return s;
}
