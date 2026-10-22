/**
 * The front page is handled the same way at every size.
 *
 * narrow asks whether anything runs off the side of a phone. This asks a
 * different question: whether the things you do with a finger still mean
 * what they should once the arrangement changes shape. The front page is
 * one screen with its own gestures — a swipe steps, a press opens — and a
 * tablet got neither the phone's layout nor the desk's.
 *
 * It was written for a fault found on an iPad. The column listens to the
 * whole arrangement so that a swipe anywhere steps, which also meant a
 * downward stroke across the poster was read as a swipe: going to paint
 * stepped off Talk and opened the project before it. Nothing in the suite
 * was looking between 390px and the desk, and nothing was drawing on the
 * poster at all.
 *
 * Headless on purpose. These are questions about what the page does with
 * an event, not about how many frames it drew, so none of it needs a real
 * window and none of it should open one.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

/* A phone, both iPads, and a desk. */
const SIZES = [
  { name: "a phone", width: 390, height: 844, touch: true },
  { name: "a small tablet", width: 768, height: 1024, touch: true },
  { name: "a tablet", width: 820, height: 1180, touch: true },
  { name: "a large tablet", width: 1024, height: 1366, touch: true },
  { name: "a desk", width: 1440, height: 900, touch: false },
];

/** Drag a finger, in one direction, from one point. */
async function stroke(p, from, way, steps = 8, step = 14) {
  const touch = await p.createCDPSession();
  const at = (i) => ({
    x: from.x + (way === "across" ? i * step : 0),
    y: from.y + (way === "down" ? i * step : way === "up" ? -i * step : 0),
  });
  await touch.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: from.x, y: from.y }],
  });
  for (let i = 1; i <= steps; i += 1) {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [at(i)],
    });
  }
  await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await touch.detach().catch(() => {});
}

const where = (p) =>
  p.evaluate(() => ({
    at: [...document.querySelectorAll(".hbw-ind__bars li")].findIndex(
      (li) => li.dataset.here === "true"
    ),
    talk: Boolean(document.querySelector('.hbw-ind[data-talk="true"]')),
  }));

/** Open the front page and let it finish arriving. */
async function land(b, size) {
  const p = await b.newPage();
  await p.setViewport({
    width: size.width,
    height: size.height,
    isMobile: size.touch,
    hasTouch: size.touch,
    deviceScaleFactor: 2,
  });
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  /* Past the hold, so the first project is open and the column is still. */
  await sleep(4600);
  return p;
}

export default async function run() {
  const b = await browser();
  const s = sheet("the front page is handled the same way at every size");

  for (const size of SIZES) {
    const p = await land(b, size);

    /* Open Talk, by the row on a phone or the bar everywhere else. */
    await p.evaluate(() =>
      document.querySelector('.hbw-ind__bars li[data-talk] > button')?.click()
    );
    await sleep(1800);
    /* On a phone the drawing waits behind a row; press it so there is
       something to draw on at every size. */
    await p.evaluate(() => {
      const door = document.querySelector(".hbw-ind__draw");
      if (door && getComputedStyle(door).display !== "none") door.click();
    });
    await sleep(1200);

    const room = await p.evaluate(() => {
      const e = document.querySelector(".hbw-ind__shot--talk");
      if (!e) return null;
      const r = e.getBoundingClientRect();
      if (!(r.width > 20 && r.height > 20)) return null;
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 3) };
    });

    if (!room) {
      s.ok(`${size.name}: the drawing is reachable`, false, "no room to draw in");
      await p.close();
      continue;
    }

    if (size.touch) {
      const before = await where(p);
      await stroke(p, room, "down");
      await sleep(1200);
      const after = await where(p);
      /*
       * The one the iPad found. A stroke down the poster is painting, and
       * painting must not walk out of the bar it is in.
       */
      s.ok(
        `${size.name}: painting down the poster stays in Talk`,
        before.talk && after.talk && before.at === after.at,
        `talk ${before.talk} → ${after.talk}, bar ${before.at} → ${after.at}`
      );
    } else {
      /* No finger here; the wheel is the gesture that could steal it. */
      const before = await where(p);
      await p.mouse.move(room.x, room.y);
      for (let i = 0; i < 6; i += 1) {
        await p.mouse.wheel({ deltaY: 120 });
        await sleep(40);
      }
      await sleep(900);
      const after = await where(p);
      s.ok(
        `${size.name}: the wheel over the poster stays in Talk`,
        before.talk && after.talk && before.at === after.at,
        `talk ${before.talk} → ${after.talk}, bar ${before.at} → ${after.at}`
      );
    }

    await p.close();
  }

  /*
   * And the gesture still works where it is supposed to.
   *
   * Exempting the drawing is only right if the column still steps when the
   * stroke is on the column — otherwise the fix above has quietly traded
   * one broken gesture for another.
   */
  for (const size of SIZES.filter((one) => one.touch)) {
    /*
     * On a bar and on the picture, which is what a thumb is actually on.
     *
     * The first draft of this took the middle of the column, which on a
     * tablet is the gap between the stack at the top and the stack at the
     * foot — nothing anybody aims at, and a bar caught mid-move when they
     * do. It reported three sizes broken and the site was fine.
     */
    for (const [what, find] of [
      [
        "a bar",
        () => {
          const li = [...document.querySelectorAll(".hbw-ind__bars li")]
            .filter((one) => !one.dataset.talk)
            .pop();
          const r = li.getBoundingClientRect();
          return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
        },
      ],
      [
        "the picture",
        () => {
          const e = document.querySelector(".hbw-ind__shot");
          const r = e.getBoundingClientRect();
          if (!(r.width > 20 && r.height > 20)) return null;
          return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
        },
      ],
    ]) {
      const p = await land(b, size);
      const spot = await p.evaluate(find);
      if (!spot) {
        await p.close();
        continue;
      }
      const before = await where(p);
      await stroke(p, spot, "up");
      await sleep(1200);
      const after = await where(p);
      s.ok(
        `${size.name}: a swipe on ${what} steps`,
        after.at !== before.at,
        `bar ${before.at} → ${after.at}`
      );
      await p.close();
    }
  }

  await b.close();
  return s;
}
