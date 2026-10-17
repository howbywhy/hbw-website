/**
 * Nothing in a gallery arrives twice.
 *
 * A hand-over is one arrival. Something that plays its arrival, stops, and
 * plays it again reads as the gallery flashing after it has already settled.
 *
 * It is not always a remount, which is why this watches animations rather
 * than elements: a change of animation-delay on an element whose arrival has
 * finished re-times it, and the browser plays it again. That is exactly how
 * --enter-work behaved while its rule was qualified on data-arriving — the
 * flag came off, the delay jumped from 0 to 960ms, and the field arrived at
 * one second and again at two.
 */
import { BASE, browser, sleep, sheet, MOVING } from "../lib.mjs";

async function scene(b, s, label, view, reading) {
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE + "/projects/sub-3?f=3", { waitUntil: "domcontentloaded" });
  await sleep(4500);
  if (view === "grid") {
    await p.evaluate(() => {
      const g = [...document.querySelectorAll("button, a")].find((x) => x.textContent.trim() === "Grid");
      g && g.click();
    });
    await sleep(2000);
  }
  if (reading) {
    await p.evaluate(() => {
      const i = [...document.querySelectorAll("button, a")].find((x) => /Information/.test(x.textContent || ""));
      i && i.click();
    });
    await sleep(2000);
  }
  const twice = await p.evaluate(
    async (movingSrc) => {
      eval(movingSrc);
      const seen = new Map();
      const t0 = performance.now();
      const tick = () => {
        const l = document.querySelector(".hbw-lamp");
        if (l)
          for (const a of l.getAnimations({ subtree: true })) {
            const c = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
            if (!c) continue;
            if (a.playState !== "running" && a.playState !== "finished") continue;
            const t = Number(a.currentTime) || 0;
            const d = Number(c.delay) || 0;
            const dur = Number(c.activeDuration) || 0;
            if (!(t > d + 1 && t < d + dur - 1)) continue;
            const el = a.effect.target;
            const cls =
              el && el.className && el.className.baseVal === undefined
                ? String(el.className).split(" ")[0]
                : el
                  ? el.tagName
                  : "?";
            const k = (a.animationName || a.transitionProperty || "?") + " @" + cls;
            const now = Math.round(performance.now() - t0);
            const arr = seen.get(k) || [];
            const last = arr[arr.length - 1];
            /* a gap wider than a couple of frames means it stopped and started again */
            if (!last || now - last > 150) arr.push(now);
            else arr[arr.length - 1] = now;
            seen.set(k, arr);
          }
        if (performance.now() - t0 < 3200) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      const n = [...document.querySelectorAll("button, a")].find((x) => /Next/.test(x.textContent || ""));
      n && n.click();
      await new Promise((r) => setTimeout(r, 3400));
      return [...seen.entries()].filter(([, a]) => a.length > 1).map(([k, a]) => k + " at " + a.join("ms and ") + "ms");
    },
    MOVING
  );
  s.ok(label, twice.length === 0, twice.join("; "));
  await p.close();
}

export default async function run() {
  const b = await browser();
  const s = sheet("handing over to the next project");
  await scene(b, s, "gallery, writing shut", "band", false);
  await scene(b, s, "gallery, writing open", "band", true);
  await scene(b, s, "grid, writing shut", "grid", false);
  await scene(b, s, "grid, writing open", "grid", true);
  await b.close();
  return s;
}
