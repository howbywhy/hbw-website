/**
 * The nav leads, and what follows waits.
 *
 * The site has one rule about order and this is it. Every scene below is a
 * real move a visitor makes; for each, the bar's own animations are watched
 * and so is whatever arrives after them.
 *
 * Three outcomes, not two. The nav moved and something followed: compare
 * them. The nav had nothing to do but something still arrived: the rule holds
 * trivially, and saying so is honest. Nothing moved at all: the scene did not
 * measure anything, which is NOT a pass — six of these used to report exactly
 * that and were counted green, which is how an inert gate survived.
 */
import { BASE, browser, sleep, sheet, MOVING } from "../lib.mjs";

const FOLLOW = [".hbw-lamp__field", ".hbw-studio-sheet__panel", ".hbw-board", ".hbw-lamp__info"];

/* Wrapped as one expression on purpose: page.evaluate takes an expression,
   not a statement sequence, so an unwrapped version of this threw silently
   and every interaction scene reported that nothing had moved. */
const WATCH = (follow, landing) => `(() => {
  ${MOVING}
  window.__landing = ${landing};
  window.__L = [];
  window.__t = performance.now();
  (() => {
    const follow = ${JSON.stringify(follow)};
    const tick = () => {
      const bar = document.querySelector(".hbw-bar");
      let after = false;
      for (const sel of follow) {
        const e = document.querySelector(sel);
        if (!e) continue;
        /* On a landing everything is arriving, so there is no flag to find.
           Opening the writing is its own case: the gallery arrived long ago
           and only the reading is coming in. */
        const arriving =
          window.__landing ||
          e.closest('[data-arriving="true"]') ||
          e.closest('.hbw-lamp[data-reading="true"] .hbw-lamp__info') ||
          (e.closest(".hbw-studio-sheet") && !e.closest('.hbw-studio-sheet[data-going="true"]'));
        if (arriving && window.__moving(e)) { after = true; break; }
      }
      window.__L.push({ t: Math.round(performance.now() - window.__t), nav: window.__moving(bar), after });
      if (performance.now() - window.__t < 2400) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })();
})()`;

async function scene(b, s, name, path, act, follow = FOLLOW) {
  const landing = act === null;
  const page = await b.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  /* A landing is watched from the navigation, not from five seconds after it.
     Started late the whole arrival has already happened, and the scene
     reports that nothing moved — which used to count as a pass. */
  if (landing) await page.evaluateOnNewDocument(WATCH(follow, true));
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  if (!landing) {
    await sleep(4500);
    await page.evaluate(WATCH(follow, false));
    await page.evaluate(act);
  }
  await sleep(2600);
  const L = await page.evaluate(() => window.__L || []).catch(() => []);
  const navFrames = L.filter((r) => r.nav);
  const afterFrames = L.filter((r) => r.after);
  const navEnd = navFrames.length ? navFrames[navFrames.length - 1].t : null;
  const afterStart = afterFrames.length ? afterFrames[0].t : null;
  const note =
    "nav moves " + (navFrames.length ? navFrames[0].t + "–" + navEnd : "(not at all)") +
    "ms, what follows starts " + (afterStart === null ? "(not at all)" : afterStart + "ms");
  if (afterStart === null) s.ok(name, null, note);
  else s.ok(name, navEnd === null || afterStart >= navEnd - 60,
            note + (navEnd === null ? "   (nav had nothing to do)" : ""));
  await page.close();
}

export default async function run() {
  const b = await browser();
  const s = sheet("the nav leads, and what follows waits");
  /* Self-invoking, because page.evaluate takes an expression: an arrow on its
     own evaluates to a function and is never called, so the press never
     happened and every scene reported that nothing moved. */
  const press = (word) =>
    `(() => { const a = [...document.querySelectorAll(".hbw-bar nav a")].find(x => x.textContent.trim() === "${word}"); a && a.click(); })()`;
  const foot = (word) =>
    `(() => { const n = [...document.querySelectorAll("button, a")].find(x => new RegExp("${word}").test(x.textContent || "")); n && n.click(); })()`;

  await scene(b, s, "about opens over the front page", "/", press("About"));
  await scene(b, s, "a project opens from the front page", "/", `(() => document.querySelector('a[href*="/projects/"]').click())()`);
  await scene(b, s, "about opens over a project", "/projects/sub-3?f=3", press("About"));
  await scene(b, s, "the next project hands over", "/projects/sub-3?f=3", foot("Next"));
  await scene(b, s, "the writing opens", "/projects/sub-3?f=3", foot("Information"), [".hbw-lamp__info > *"]);
  await scene(b, s, "practice lands", "/practice", null, [...FOLLOW, ".hbw-board__mod", ".hbw-board__facts"]);
  await scene(b, s, "talk lands", "/talk", null, [...FOLLOW, ".hbw-board__mod", ".hbw-board__facts"]);

  await b.close();
  return s;
}
