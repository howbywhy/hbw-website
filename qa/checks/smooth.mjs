/**
 * The site holds its frame rate while you scroll it.
 *
 * This is the one check in here that opens a real browser window, and it has
 * to. Every other check runs headless, which rasterises in software and skips
 * most of what makes a page feel slow — during the session that produced this
 * file, headless reported a clean seventeen millisecond frame on a project
 * page that was dropping one frame in five on the machine in front of us. Two
 * rounds of fixes went to the wrong things on the strength of it.
 *
 * So: a window appears for about a minute when this runs. That is the price
 * of measuring the thing we actually care about.
 *
 * It exists because three separate rules were keyed to something that was
 * true when written and quietly stopped being true — "the first project",
 * which became an eight-frame launch; a flag that drew every frame of a
 * project, added when pages had no width of their own and kept after they
 * did; and one `sizes` figure for frames of every shape. Each was correct
 * and well commented when written. None had anything watching it, and each
 * was found by hand, late, after someone said the site felt slow.
 *
 * Proved the only way worth proving: checked out the three files as they
 * stood before any of it was fixed, built that, and ran this. Made by
 * Madelen failed at 6.7% — the page that was reported, and the only one that
 * fails, because it was the only one that was actually slow. On the code as
 * it ships, every page reports zero.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

/*
 * Home and every project. The front page has never been the problem and is
 * here as the control: if it fails too, the cause is the machine or the
 * build, not the page.
 */
const PAGES = [
  "/",
  "/projects/made-by-madelen",
  "/projects/sck",
  "/projects/sub-3",
  "/projects/bar-closed",
  "/projects/koja",
  "/projects/chris-sisarich",
  "/projects/our-boy-roy",
];

/*
 * A frame that takes longer than this is one a reader can see.
 *
 * 33ms is two frames missed on a sixty hertz screen and four on a hundred and
 * twenty. The budget is deliberately loose — the worst page measured nineteen
 * per cent before this was fixed and every page measures under half a per
 * cent after, so anything between is a regression worth a morning, and the
 * gap is wide enough that a busy machine does not cry wolf.
 */
const JANKY_MS = 33;
const MAX_JANKY = 0.04;
/* And one stall is a stutter even if the average hides it. */
const MAX_P99_MS = 50;
/* Fewer samples than this and the run says nothing worth reporting. */
const MIN_FRAMES = 150;

/** A real window, on the real GPU. Headless cannot answer this question. */
async function shownBrowser() {
  const { default: puppeteer } = await import("puppeteer-core");
  return puppeteer.launch({
    executablePath:
      process.env.CHROME ??
      process.env.PUPPETEER_EXECUTABLE_PATH ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: false,
    args: [
      "--no-sandbox",
      "--autoplay-policy=no-user-gesture-required",
      "--window-size=1440,900",
      "--window-position=0,0",
    ],
    defaultViewport: null,
  });
}

async function measure(b, path) {
  const p = await b.newPage();
  await p.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await sleep(6500);

  /*
   * What moves is recorded as well as how smoothly.
   *
   * A scroll that scrolls nothing produces a perfect frame rate, which is a
   * check that can only pass. If nothing moved, this reports unmeasured.
   */
  await p.evaluate(() => {
    window.__before = window.scrollY;
    /* Every scroller, not the first one found. The gallery's band is well
       down the document, so taking the first match measured a container that
       never moves and reported that nothing had happened. */
    window.__boxes = [];
    for (const el of document.querySelectorAll("*")) {
      if (el.scrollHeight > el.clientHeight + 4 || el.scrollWidth > el.clientWidth + 4) {
        window.__boxes.push([el, el.scrollTop, el.scrollLeft]);
      }
    }
    window.__f = [];
    let last = performance.now();
    const tick = () => {
      const n = performance.now();
      window.__f.push(n - last);
      last = n;
      if (window.__on !== false) requestAnimationFrame(tick);
    };
    window.__on = true;
    requestAnimationFrame(tick);
  });

  await p.mouse.move(700, 500);
  for (let i = 0; i < 60; i += 1) {
    await p.mouse.wheel({ deltaY: 110 });
    await sleep(45);
  }
  await sleep(400);

  const out = await p.evaluate(() => {
    window.__on = false;
    const f = window.__f.filter((x) => x > 0).sort((a, b) => a - b);
    const q = (x) => (f.length ? f[Math.floor(f.length * x)] : 0);
    const movedWindow = Math.abs(window.scrollY - window.__before);
    let movedBox = 0;
    for (const [el, top, left] of window.__boxes) {
      movedBox += Math.abs(el.scrollTop - top) + Math.abs(el.scrollLeft - left);
    }
    return {
      frames: f.length,
      median: Number(q(0.5).toFixed(1)),
      p99: Number(q(0.99).toFixed(1)),
      worst: Number((f[f.length - 1] ?? 0).toFixed(0)),
      janky: f.filter((x) => x > 33).length,
      moved: Math.round(movedWindow + movedBox),
    };
  });
  await p.close();
  return out;
}

export default async function run() {
  const s = sheet("the site holds its frame rate while you scroll");
  let b;
  try {
    b = await shownBrowser();
  } catch (error) {
    /* No window to open — a headless box, say. Better to say so than to
       quietly measure nothing and call it green. */
    s.ok("a real window to measure in", null, error.message.slice(0, 80));
    return s;
  }

  for (const path of PAGES) {
    let m;
    try {
      m = await measure(b, path);
    } catch (error) {
      s.ok(path, null, "could not measure: " + error.message.slice(0, 60));
      continue;
    }
    const share = m.frames ? m.janky / m.frames : 0;
    const note =
      `${m.janky}/${m.frames} frames over ${JANKY_MS}ms (${(share * 100).toFixed(1)}%), ` +
      `median ${m.median}ms, p99 ${m.p99}ms, worst ${m.worst}ms, scrolled ${m.moved}px`;

    if (m.frames < MIN_FRAMES) s.ok(path, null, note + " — too few frames to judge");
    else if (!m.moved) s.ok(path, null, note + " — nothing scrolled, so nothing was tested");
    else s.ok(path, share <= MAX_JANKY && m.p99 <= MAX_P99_MS, note);
  }

  await b.close();
  return s;
}
