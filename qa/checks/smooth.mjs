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
import { BASE, sleep, sheet, track } from "../lib.mjs";

/*
 * Home and every project. The front page was the control — it had never been
 * the problem — and it is still useful as one, though it is now the index
 * and is driven differently from the rest; see the note in measure().
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
  /* Tracked like the headless ones. A throw in here used to leave a visible
     Chrome window open for the rest of the run. */
  return track(
    puppeteer.launch({
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
    })
  );
}

/**
 * Measure one page, and always put its tab away.
 *
 * The work is in watch() so that this can wrap it in a finally without
 * indenting sixty lines. That finally is the point: when watch() threw,
 * the close below it never ran, so a failed page stayed open for the rest
 * of the run — and eight pages into a browser already struggling is how
 * one bad measurement turned into four.
 */
async function measure(b, path) {
  const p = await b.newPage();
  try {
    return await watch(p, path);
  } finally {
    await p.close().catch(() => {});
  }
}

async function watch(p, path) {
  await p.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await sleep(6500);

  /*
   * Whether the page left while it was being measured.
   *
   * A scroll that reaches the end of a project's gallery can hand over to
   * the next one, which is a navigation in the middle of the run: the
   * frame detaches and whatever is mid-flight comes back as "Attempted to
   * use detached Frame", or the wheel lands on a closed target. That is a
   * real thing to know about and an unreadable way to be told it, so it
   * is watched for and said plainly. Attached after the landing, so the
   * arrival itself is not mistaken for leaving.
   */
  let left = null;
  const here = new URL(p.url()).pathname;
  p.on("framenavigated", (frame) => {
    if (frame !== p.mainFrame()) return;
    /*
     * By path, not by the whole address.
     *
     * A project page writes a frame into its own query string as the
     * gallery moves, which is the same page still — compared whole, every
     * project reported that it had left for itself.
     */
    let gone;
    try {
      gone = new URL(frame.url()).pathname;
    } catch {
      return;
    }
    if (gone !== here) left = gone;
  });

  /*
   * What moves is recorded as well as how smoothly.
   *
   * A scroll that scrolls nothing produces a perfect frame rate, which is a
   * check that can only pass. If nothing moved, this reports unmeasured.
   */
  await p.evaluate(() => {
    window.__before = window.scrollY;
    /* Which project the index is on, so a page that steps instead of
       scrolling still reports what it moved. */
    const at = () => [...document.querySelectorAll(".hbw-ind__bars li")].findIndex(
      (li) => li.dataset.here === "true"
    );
    window.__atBefore = at();
    window.__at = at;
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

  /*
   * How the page is driven depends on what it does with a wheel.
   *
   * Everywhere else a wheel scrolls, and sixty of them forty-five
   * milliseconds apart is a flick with its tail. The front page does not
   * scroll: it steps, one project per gesture, and it tells a gesture from
   * its tail by waiting for the wheel to go quiet. Driven at forty-five
   * milliseconds it reads the whole run as one gesture, steps once, and
   * reports a perfect frame rate for a page that moved almost nothing —
   * which is the check that can only pass, in a new costume.
   *
   * So the index is driven in separate gestures, far enough apart to be
   * separate, and what moved is counted in steps rather than pixels.
   */
  const steps = await p.evaluate(() => !!document.querySelector(".hbw-ind"));
  await p.mouse.move(700, 500);
  if (steps) {
    for (let i = 0; i < 14; i += 1) {
      await p.mouse.wheel({ deltaY: 110 });
      await sleep(230);
    }
  } else {
    for (let i = 0; i < 60; i += 1) {
      await p.mouse.wheel({ deltaY: 110 });
      await sleep(45);
    }
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
    /* A step counts as movement. Scaled to pixels only so the two can be
       added — the number in the note is "something happened", not a
       distance. */
    const movedSteps =
      window.__atBefore === undefined ? 0 : Math.abs(window.__at() - window.__atBefore) * 100;
    return {
      frames: f.length,
      median: Number(q(0.5).toFixed(1)),
      p99: Number(q(0.99).toFixed(1)),
      worst: Number((f[f.length - 1] ?? 0).toFixed(0)),
      janky: f.filter((x) => x > 33).length,
      moved: Math.round(movedWindow + movedBox + movedSteps),
    };
  });
  if (left) {
    throw new Error(`the page left for ${left} while it was being measured`);
  }
  return out;
}

export default async function run() {
  const s = sheet("the site holds its frame rate while you scroll");

  /*
   * Only when asked, because this one takes the screen.
   *
   * It needs a real window on a real GPU — headless answers this question
   * with a perfect frame rate on a page that is dropping them — and a
   * real window means Chrome opening over whatever you were doing, eight
   * times, for about a minute. Run during ordinary work that is both an
   * interruption and a worse measurement: a window competing for the
   * compositor with everything else on the screen is exactly the
   * condition that produced "detached Frame" and "Target closed" through
   * most of a day's runs.
   *
   * So it is off unless QA_SHOWN is set, and says so in one line rather
   * than reporting eight pages unmeasured. It is not reported as passing:
   * a check that did not run has not passed.
   */
  if (!process.env.QA_SHOWN) {
    s.ok(
      "measured in a real window",
      null,
      "not run — it opens Chrome over your work. QA_SHOWN=1 to measure"
    );
    return s;
  }

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
    let why = null;
    /*
     * Twice at most, in a clean window the second time.
     *
     * The failures here are not the page failing — they are the harness
     * losing its grip on a real Chrome under load: a target closed, a
     * frame detached, a navigation aborted. A browser that has just done
     * one of those is not a browser the next page should be measured in
     * either, so it is replaced rather than reused; before that was done,
     * one bad page reported four.
     *
     * The second attempt is for the hiccup, not for the result. Nothing
     * here retries a measurement that came back and did not like what it
     * found — a page over budget is reported the first time and every
     * time. This only takes a second run at a page that never produced a
     * number at all.
     */
    for (let go = 0; go < 2 && !m; go += 1) {
      if (go > 0) {
        await b.close().catch(() => {});
        try {
          b = await shownBrowser();
        } catch (again) {
          s.ok("a window for the pages that are left", null, again.message.slice(0, 80));
          return s;
        }
      }
      try {
        m = await measure(b, path);
      } catch (error) {
        why = error.message.slice(0, 70);
      }
    }
    if (!m) {
      s.ok(path, null, "could not measure, twice over: " + why);
      await b.close().catch(() => {});
      try {
        b = await shownBrowser();
      } catch (again) {
        s.ok("a window for the pages that are left", null, again.message.slice(0, 80));
        return s;
      }
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
