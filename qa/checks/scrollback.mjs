/**
 * The page gets its scroll back when the last thing holding it lets go.
 *
 * The gallery holds the page still while it is open, About opens on top of it,
 * and the poster tool on top of that. Each used to save body.style.overflow,
 * set it to hidden and put the saved value back — which is correct for one
 * holder and wrong for two. The second saved "hidden", because the first was
 * already holding; then a route change unmounted them in whatever order it
 * liked, and About put "hidden" back after the gallery had cleared it. The
 * front page arrived with its scroll held by something no longer on screen.
 *
 * The measure is deliberately not "is overflow hidden" — on a project page it
 * should be, because the gallery is there. It is "is it hidden with nothing
 * left to hold it", which is the only state that is actually a fault. Before
 * the counted lock, two of these six routes ended that way; now none do.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

const state = (p) =>
  p.evaluate(() => ({
    url: location.pathname + location.hash,
    overflow: document.body.style.overflow || "",
    /* Everything that is entitled to hold the page still, counted from the
       DOM rather than from the module, so this measures what shipped. */
    holders:
      (document.querySelector(".hbw-lamp") ? 1 : 0) +
      document.querySelectorAll(".hbw-studio-sheet, .hbw-poster-layer").length,
  }));

const barClick = (text) => async (p) => {
  const found = await p.evaluate((t) => {
    const a = [...document.querySelectorAll(".hbw-bar a, .hbw-bar button")].find(
      (x) => x.textContent.trim() === t
    );
    if (!a) return false;
    a.click();
    return true;
  }, text);
  await sleep(2800);
  return found;
};

const openProject = async (p) => {
  const found = await p.evaluate(() => {
    const a = document.querySelector(".hbw-cell a, a.hbw-cell");
    if (!a) return false;
    a.click();
    return true;
  });
  await sleep(3500);
  return found;
};

/* The logotype sits in the middle of the bar and is a link home. */
const logo = async (p) => {
  const box = await p.evaluate(() => {
    const a = [...document.querySelectorAll(".hbw-bar a")].find((x) => x.getAttribute("href") === "/");
    if (!a) return null;
    const r = a.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!box) return false;
  await p.mouse.click(box.x, box.y);
  await sleep(3500);
  return true;
};

const WALKS = [
  ["nothing touched", []],
  ["About, then Close", [barClick("About"), barClick("Close")]],
  ["into a project, then home by the logo", [openProject, logo]],
  ["a project, About, then Close", [openProject, barClick("About"), barClick("Close")]],
  ["a project, About, then home by the logo", [openProject, barClick("About"), logo]],
  ["a project, then Work", [openProject, barClick("Work")]],
];

export default async function run() {
  const b = await browser();
  const s = sheet("the page gets its scroll back");
  for (const [label, steps] of WALKS) {
    const p = await b.newPage();
    await p.setViewport({ width: 1440, height: 900 });
    await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await sleep(5000);
    let walked = true;
    for (const step of steps) {
      if ((await step(p)) === false) walked = false;
    }
    const r = await state(p);
    const note = `ends at ${r.url}, overflow "${r.overflow || "unset"}", ${r.holders} holding it`;
    if (!walked) {
      /* A step that found nothing to click walked a different route than the
         one named, so whatever it ended on says nothing about this one. */
      s.ok(label, null, note + " — a step found nothing to click");
    } else {
      s.ok(label, !(r.overflow === "hidden" && r.holders === 0), note);
    }
    await p.close();
  }
  await b.close();
  return s;
}
