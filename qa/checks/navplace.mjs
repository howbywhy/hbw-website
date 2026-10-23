/**
 * The nav is at the top, and the work is not underneath it.
 *
 * The index used to lift the nav to the middle line and run the work past
 * it. Someone was watched using the site and could not tell what that
 * middle row was: the mark between the shoulders turns over to the
 * project's name, so `Work · KOJA · About` read as a header for KOJA
 * rather than two places and a title.
 *
 * Renaming the shoulder fixed the sentence. Whether the middle line was
 * also part of it was a question for a person, so both were built and
 * compared on the real site behind ?nav=top. The top row won, and the
 * index now wears the nav the way every other surface already did.
 *
 * What is worth holding is not that the nav is at the top — one rule says
 * so and it is hard to break by accident. It is the consequence: the
 * index reserves the nav's height from .hbw-ind, out of a measured
 * --bar-h, and the bar column measures its own clientHeight to place the
 * stack waiting at the foot. Get that reserve wrong in either direction
 * and the project you are on is either underneath the chrome or floating
 * a long way below it, and both look deliberate in a screenshot.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

const SIZES = [
  { name: "a phone", width: 390, height: 844, touch: true },
  { name: "a short phone", width: 390, height: 667, touch: true },
  { name: "a tablet", width: 820, height: 1180, touch: true },
  { name: "a laptop", width: 1440, height: 900, touch: false },
  { name: "a desk", width: 1920, height: 1080, touch: false },
];

/** The gap between the foot of the chrome and the top of the work. */
const probe = () => {
  const bar = document.querySelector(".hbw-bar");
  if (!bar) return null;
  const r = bar.getBoundingClientRect();
  const bars = [...document.querySelectorAll(".hbw-ind__bars li")].map((e) => e.getBoundingClientRect());
  const open = bars.find((_, i) =>
    document.querySelectorAll(".hbw-ind__bars li")[i].dataset.here === "true"
  );
  return {
    barH: getComputedStyle(document.documentElement).getPropertyValue("--bar-h").trim() || null,
    top: Math.round(r.top),
    bottom: Math.round(r.bottom),
    /* A bar genuinely under the chrome, not merely touching its edge. */
    covered: bars.filter((q) => q.bottom > r.top + 1 && q.top < r.bottom - 1).length,
    offBottom: bars.filter((q) => q.bottom > window.innerHeight + 1).length,
    sideways: document.documentElement.scrollWidth > window.innerWidth,
    gap: open ? Math.round(open.top - r.bottom) : null,
    picture: (() => {
      const e = document.querySelector(".hbw-ind__shot");
      return e ? Math.round(e.getBoundingClientRect().top - r.bottom) : null;
    })(),
  };
};

export default async function run() {
  const b = await browser();
  const s = sheet("the nav is at the top, and the work is not underneath it");

  for (const size of SIZES) {
    const p = await b.newPage();
    await p.setViewport({
      width: size.width,
      height: size.height,
      isMobile: size.touch,
      hasTouch: size.touch,
      deviceScaleFactor: 2,
    });
    await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await sleep(4600);
    const now = await p.evaluate(probe);

    if (!now) {
      s.ok(`${size.name}: the nav is there to measure`, null, "no .hbw-bar");
      await p.close();
      continue;
    }

    s.ok(`${size.name}: the nav is at the top of the window`, now.top === 0, `top ${now.top}`);
    s.ok(
      `${size.name}: and the bar measures itself for the index to reserve`,
      now.barH !== null,
      `--bar-h ${now.barH} against a chrome ${now.bottom}px deep`
    );
    /*
     * The reserve, from both sides.
     *
     * Too little and the project you are on is behind the chrome; too
     * much and it floats. The picture starts at the same line, so it is
     * measured too — it is the larger surface and a gap shows there first.
     */
    s.ok(
      `${size.name}: the work starts just under the chrome, not behind or below it`,
      now.covered === 0 && now.picture !== null && now.picture >= 0 && now.picture <= 8,
      `${now.covered} bars under it, picture ${now.picture}px below it, open bar ${now.gap}px below it`
    );
    s.ok(
      `${size.name}: and nothing is pushed past the foot or off the side`,
      now.offBottom === 0 && !now.sideways,
      `${now.offBottom} bars past the foot, sideways ${now.sideways}`
    );

    await p.close();
  }

  await b.close();
  return s;
}
