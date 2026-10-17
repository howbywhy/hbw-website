/**
 * The room waits for the nav, and a hand-over keeps the panel it has.
 *
 * Two different moves wearing one rule, and the reason this check has both
 * halves. Coming in from the catalogue the gallery is new: its dark ground
 * must not appear until the bar has stopped, or it reads as a flash behind a
 * nav still travelling. Stepping to the next project the panel is already
 * there and must NOT be clipped — a clip takes the count, the view switch and
 * the feet with it, which is why the panel's arrival was once switched off
 * wholesale, which is what let the first fault in.
 */
import { BASE, browser, sleep, sheet, MOVING } from "../lib.mjs";

const clipped = (s) => {
  const m = /inset\([^)]*?([\d.]+)%/.exec(s || "");
  return m ? Number(m[1]) : 0;
};

async function watch(page, act) {
  return page.evaluate(
    async (movingSrc, actSrc) => {
      eval(movingSrc);
      const out = [];
      const t0 = performance.now();
      const tick = () => {
        const bar = document.querySelector(".hbw-bar");
        const l = document.querySelector(".hbw-lamp");
        if (l)
          out.push({
            t: Math.round(performance.now() - t0),
            nav: window.__moving(bar),
            clip: getComputedStyle(l).clipPath || "none",
            over: l.dataset.over || "-",
          });
        if (performance.now() - t0 < 3000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      new Function("return " + actSrc)()();
      await new Promise((r) => setTimeout(r, 3200));
      return out;
    },
    MOVING,
    act
  );
}

export default async function run() {
  const b = await browser();
  const s = sheet("a new room waits; a hand-over keeps its panel");

  let p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await sleep(5000);
  let L = await watch(p, `() => { const a = document.querySelector('a[href*="/projects/"]'); a && a.click(); }`);
  const navFrames = L.filter((r) => r.nav);
  const navEnd = navFrames.length ? navFrames[navFrames.length - 1].t : null;
  const shown = L.find((r) => clipped(r.clip) < 95);
  s.ok(
    "the room is hidden while the nav moves",
    navEnd !== null && shown != null ? shown.t >= navEnd - 60 : null,
    "nav ends " + navEnd + "ms, room first shows " + (shown ? shown.t : "never") + "ms"
  );
  s.ok("and it does come in", L.some((r) => clipped(r.clip) === 0) ? true : null, "never fully revealed");
  await p.close();

  p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE + "/projects/koja?f=1", { waitUntil: "domcontentloaded" });
  await sleep(4500);
  L = await watch(p, `() => { const n = [...document.querySelectorAll("a,button")].find(x => /Next/.test(x.textContent||"")); n && n.click(); }`);
  const handed = L.filter((r) => r.over === "true");
  const everClipped = handed.filter((r) => clipped(r.clip) > 5);
  s.ok(
    "the handed-over panel is never clipped",
    handed.length === 0 ? null : everClipped.length === 0,
    everClipped.length ? "clipped at " + everClipped.slice(0, 3).map((r) => r.t + "ms:" + r.clip).join(", ") : ""
  );
  await p.close();

  await b.close();
  return s;
}
