/**
 * The nav's place, and the flag that moves it.
 *
 * Someone was watched reading the middle row as a heading for the project
 * rather than as the way around the site. Renaming the shoulder fixed the
 * sentence; whether the middle line is also part of it is a question for a
 * person, so ?nav=top exists to put the two side by side.
 *
 * Two things here are worth a check and one is not. The variant itself is
 * meant to be thrown away, so nothing below asserts that it is handsome.
 * What it asserts is that the default is untouched by its existence — the
 * nav still on the middle line, and no ResizeObserver running to support a
 * comparison nobody asked for — and that when the flag is on, the work is
 * not left underneath the chrome.
 *
 * Should the variant ever be removed, this check fails rather than going
 * quietly green, which is the right way round: the one check in here that
 * stopped looking at its subject sat passing for weeks.
 *
 * It clears the store before each arm. The flag is remembered on purpose,
 * so it survives the walk from the index into a project, and every page in
 * one browser shares that store — the first draft of this loaded the
 * default arm second and measured a profile the variant arm had flagged.
 * Four of eight rows said "default" while looking at the variant.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

const SIZES = [
  { name: "a phone", width: 390, height: 844, touch: true },
  { name: "a short phone", width: 390, height: 667, touch: true },
  { name: "a tablet", width: 820, height: 1180, touch: true },
  { name: "a laptop", width: 1440, height: 900, touch: false },
];

const probe = () => {
  const bar = document.querySelector(".hbw-bar");
  if (!bar) return null;
  const r = bar.getBoundingClientRect();
  const bars = [...document.querySelectorAll(".hbw-ind__bars li")].map((e) => e.getBoundingClientRect());
  return {
    flag: document.documentElement.dataset.nav ?? null,
    barH: getComputedStyle(document.documentElement).getPropertyValue("--bar-h").trim() || null,
    top: Math.round(r.top),
    bottom: Math.round(r.bottom),
    centre: Math.round(((r.top + r.height / 2) / window.innerHeight) * 100),
    /* A bar genuinely under the chrome, not merely touching its edge. */
    covered: bars.filter((q) => q.bottom > r.top + 1 && q.top < r.bottom - 1).length,
    offBottom: bars.filter((q) => q.bottom > window.innerHeight + 1).length,
    sideways: document.documentElement.scrollWidth > window.innerWidth,
  };
};

/** Load the index at `url` with nothing remembered from the arm before. */
async function land(b, size, url) {
  const p = await b.newPage();
  await p.setViewport({
    width: size.width,
    height: size.height,
    isMobile: size.touch,
    hasTouch: size.touch,
    deviceScaleFactor: 2,
  });
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await p.evaluate(() => {
    try {
      localStorage.clear();
    } catch {
      /* A profile that refuses storage reads as never flagged, which is
         the default — so there is nothing to recover from here. */
    }
  });
  await p.goto(BASE + url, { waitUntil: "domcontentloaded" });
  await sleep(4600);
  return p;
}

export default async function run() {
  const b = await browser();
  const s = sheet("the nav's place, and the flag that moves it");

  for (const size of SIZES) {
    const plain = await land(b, size, "/");
    const was = await plain.evaluate(probe);
    await plain.close();

    if (!was) {
      s.ok(`${size.name}: the nav is there to measure`, null, "no .hbw-bar");
      continue;
    }

    /* The default, which is the site everybody gets. */
    s.ok(
      `${size.name}: with no flag the nav is on the middle line`,
      was.flag === null && was.centre === 50,
      `flag ${was.flag}, centre ${was.centre}% of the window`
    );
    s.ok(
      `${size.name}: and the variant costs it nothing`,
      was.barH === null,
      was.barH === null ? "--bar-h unset, so nothing is measuring the bar" : `--bar-h is ${was.barH}`
    );

    const flagged = await land(b, size, "/?nav=top");
    const now = await flagged.evaluate(probe);
    await flagged.close();

    s.ok(
      `${size.name}: ?nav=top puts the nav at the top`,
      now.flag === "top" && now.top === 0,
      `flag ${now.flag}, top ${now.top} (was ${was.top})`
    );
    s.ok(
      `${size.name}: and the work is not left underneath it`,
      now.covered === 0 && now.offBottom === 0 && !now.sideways,
      `${now.covered} bars under the chrome, ${now.offBottom} past the foot, sideways ${now.sideways}`
    );
  }

  /*
   * And it is remembered, because the comparison is the whole journey —
   * a flag that fell off at the first project would be comparing the
   * index's nav with the project page's.
   */
  const p = await land(b, SIZES[3], "/?nav=top");
  await p.goto(BASE + "/projects/koja", { waitUntil: "domcontentloaded" });
  await sleep(2500);
  const carried = await p.evaluate(() => document.documentElement.dataset.nav ?? null);
  s.ok("the flag survives the walk into a project", carried === "top", `flag ${carried} with no query in the address`);

  await p.goto(BASE + "/?nav=centre", { waitUntil: "domcontentloaded" });
  await sleep(2000);
  const cleared = await p.evaluate(() => document.documentElement.dataset.nav ?? null);
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await sleep(2000);
  const stays = await p.evaluate(() => document.documentElement.dataset.nav ?? null);
  s.ok(
    "?nav=centre gives the middle line back, and it stays given",
    cleared === null && stays === null,
    `after centre ${cleared}, on the next plain load ${stays}`
  );
  await p.close();

  await b.close();
  return s;
}
