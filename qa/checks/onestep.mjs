/**
 * One flick of the wheel moves About on by one block, not two.
 *
 * The sheet's blocks fill the screen, so the wheel advances the reading
 * rather than scrolling it. A trackpad sends one push and a long tail of
 * small ones for a single flick, so opening a block has to deafen the wheel
 * for a moment afterwards or the tail opens the next one too.
 *
 * That pause lived in the wheel listener's own scope, and the listener was
 * rebuilt whenever the reading moved — so opening a block threw away the
 * pause that was meant to protect it. One flick on the first part went
 * through the second to the third. The pause is held outside the effect now.
 *
 * The flick below is a real one: fifteen events over a quarter of a second,
 * tapering the way a trackpad tapers. A single large wheel event would not
 * reproduce the fault and would pass against the broken code.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

const FLICK = [40, 60, 55, 45, 35, 26, 20, 15, 11, 8, 6, 4, 3, 2, 1];

const open = (p) => p.evaluate(() => document.querySelector('.hbw-part[data-open="true"]')?.dataset.part ?? null);

/** Run the open block's own reading out, so the wheel is handed on. */
const runOut = (p) =>
  p.evaluate(() => {
    const say = document.querySelector('.hbw-part[data-open="true"] .hbw-part__say');
    if (say) say.scrollTop = say.scrollHeight;
  });

async function flick(p, dir) {
  const box = await p.evaluate(() => {
    const e = document.querySelector('.hbw-part[data-open="true"]');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(200, r.height / 2) };
  });
  if (!box) return null;
  await p.mouse.move(box.x, box.y);
  await p.evaluate(() => {
    window.__seen = [];
    window.__mo = new MutationObserver(() => {
      const o = document.querySelector('.hbw-part[data-open="true"]')?.dataset.part;
      if (o && window.__seen[window.__seen.length - 1] !== o) window.__seen.push(o);
    });
    window.__mo.observe(document.querySelector(".hbw-studio-sheet"), {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-open"],
    });
  });
  for (const d of FLICK) {
    await p.mouse.wheel({ deltaY: d * dir });
    await sleep(16);
  }
  await sleep(2200);
  return p.evaluate(() => {
    window.__mo.disconnect();
    return window.__seen;
  });
}

export default async function run() {
  const b = await browser();
  const s = sheet("one flick, one block");
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await sleep(5000);
  await p.evaluate(() => {
    const a = [...document.querySelectorAll(".hbw-bar nav a, .hbw-bar nav button")].find(
      (x) => x.textContent.trim() === "Studio"
    );
    a && a.click();
  });
  await sleep(2600);

  const first = await open(p);
  if (!first) {
    s.ok("About opens on a block", null, "no .hbw-part[data-open] — nothing after this was measured");
    await b.close();
    return s;
  }

  for (const [label, dir] of [["down, from the first part", 1], ["down again", 1], ["and back up", -1]]) {
    await runOut(p);
    await sleep(300);
    const was = await open(p);
    const moved = await flick(p, dir);
    const now = await open(p);
    if (moved === null) {
      s.ok(label, null, "no open block to flick over");
      continue;
    }
    if (moved.length === 0) {
      /* Nothing moved at all: the gesture is not being heard, so this is
         not evidence that it moves by one. */
      s.ok(label, null, `${was} never handed on`);
      continue;
    }
    s.ok(label, moved.length === 1, `${was} -> ${moved.join(" -> ")} (${moved.length} on one flick), now ${now}`);
  }

  await b.close();
  return s;
}
