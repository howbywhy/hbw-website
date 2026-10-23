/**
 * About does not paint until the bar has stopped.
 *
 * The gate is data-settling, set on the sheet while the bar is moving and
 * taken off two frames after it stops — the whole bar, the name turning over
 * included, which is the part every hand-written delay used to miss.
 *
 * The measure matters as much as the rule. A previous version read the first
 * value of a clip-path looking for digits-then-%, never matched
 * `inset(0px 0px 100% 0px)`, fell through to a default of 100, and called a
 * fully hidden panel fully shown. It passed on every build, including the
 * ones where nothing waited for anything.
 */
import { BASE, browser, sleep, sheet, SEEN, MOVING } from "../lib.mjs";

async function from(b, s, label, path) {
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await sleep(5000);
  const L = await p.evaluate(
    async (seenSrc, movingSrc) => {
      eval(seenSrc);
      eval(movingSrc);
      const out = [];
      const t0 = performance.now();
      const tick = () => {
        const bar = document.querySelector(".hbw-bar");
        const sh = document.querySelector(".hbw-studio-sheet");
        const pan = document.querySelector(".hbw-studio-sheet__panel");
        out.push({
          t: Math.round(performance.now() - t0),
          barTop: bar ? Math.round(bar.getBoundingClientRect().top) : null,
          settling: sh ? sh.dataset.settling || "-" : "-",
          shown: pan ? window.__seen(pan) : null,
        });
        if (performance.now() - t0 < 2400) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      const a = [...document.querySelectorAll(".hbw-bar nav a")].find((x) => x.textContent.trim() === "Studio");
      a && a.click();
      await new Promise((r) => setTimeout(r, 2800));
      return out;
    },
    SEEN,
    MOVING
  );
  const navHome = L.find((r) => r.barTop === 0);
  const firstPaint = L.find((r) => r.shown !== null && r.shown > 5);
  const note =
    "nav lands at " + (navHome ? navHome.t : "(already home)") +
    "ms;  sheet first shows at " + (firstPaint ? firstPaint.t : "never") + "ms";
  /* No sheet ever appeared: nothing was measured, which is not a pass. */
  if (!firstPaint) s.ok(label, null, note);
  else s.ok(label, !navHome || firstPaint.t >= navHome.t - 40, note);
  await p.close();
}

export default async function run() {
  const b = await browser();
  const s = sheet("the sheet waits for the nav");
  await from(b, s, "from the front page, where the nav travels", "/");
  await from(b, s, "from a project, where the nav is already home", "/projects/sub-3?f=3");
  await b.close();
  return s;
}
