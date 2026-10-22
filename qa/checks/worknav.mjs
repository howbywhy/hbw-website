/**
 * The nav is Work and About, and Work runs one ending wherever it is pressed.
 *
 * There used to be an Index arrangement here as well, and a shoulder that
 * changed what it said depending on it. Work goes back to the start: a sheet
 * over the work shuts first and the page follows; away from the front page
 * the site plays its leaving and then goes; standing on the front page there
 * is nowhere to go, so it runs the whole sequence again.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

export default async function run() {
  const b = await browser();
  const s = sheet("the nav, and the way back to the work");
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });

  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await sleep(4500);
  const nav = await p.$$eval(".hbw-bar__nav a", (a) => a.map((x) => x.textContent.trim()));
  s.ok("two shoulders, no more", nav.length === 2, JSON.stringify(nav));
  s.ok("they read Work then About", nav[0] === "Work" && nav[1] === "About", JSON.stringify(nav));
  s.ok("Work points at the front page", (await p.$eval(".hbw-bar__nav a", (a) => a.getAttribute("href"))) === "/");

  s.ok("the old spread arrangement is gone", (await p.$$(".hbw-spread")).length === 0);
  s.ok("no mark box at the head of a row", (await p.$$(".hbw-cell--mark")).length === 0);

  /*
   * The front page is the index: one column of bars, one picture.
   *
   * It was the loop — three identical turns of a scrolling field, wrapping
   * so the wrap never showed — and this asserted all three were there. The
   * loop is not rendered anywhere now; the front page is the arrangement
   * that used to live at /try/index.
   */
  s.ok("the front page runs one arrangement, not a loop", (await p.$$(".hbw-ind")).length === 1);
  s.ok(
    "and the loop is down to a single pass",
    (await p.$eval(".hbw-loop", (e) => e.dataset.turns)) === "1"
  );
  s.ok("a bar for every project", (await p.$$(".hbw-ind__bars li a")).length >= 5);

  /*
   * A way to get in touch on the front page, and the signup.
   *
   * This counted three feet, three addresses and three signup fields: one
   * per turn of the loop. The reason behind the count outlived the loop,
   * and it is written down here because it has now been lost twice.
   *
   * The front page once had no foot at all, on the argument that the nav
   * carries the two moves the page needs and the rest lives in About. That
   * was wrong in a specific way: the newsletter existed nowhere a visitor
   * would meet it, and the front page was the one page on the site with no
   * way to get in touch on it. So a foot went into every turn.
   *
   * The index has no foot under it by design — the foot was a row saying
   * the same four things, and the last bar opens to say them instead. But
   * that bar was built from the foot's line mode, which omitted the
   * address on the same argument as before (About is a press away), and
   * the front page quietly lost its address a second time. The bar is not
   * a foot: it is the row a reader opens *because* they want to reach the
   * studio. Both live in it now, and this checks the bar, not the foot.
   */
  s.ok("the way out is the last bar", (await p.$$('.hbw-ind__bars li[data-talk] button')).length === 1);
  await p.$eval('.hbw-ind__bars li[data-talk] button', (b) => b.click());
  await sleep(1800);
  const talk = await p.evaluate(() => ({
    mail: document.querySelectorAll('.hbw-ind__talk a[href^="mailto:"]').length,
    field: document.querySelectorAll(".hbw-ind__talk .hbw-end__field").length,
    form: Boolean(document.querySelector(".hbw-ind__talk form.hbw-write")),
    wrote: Boolean(document.querySelector(".hbw-write textarea")),
    sends: Boolean(document.querySelector('.hbw-write__foot button[type="submit"]')),
  }));
  s.ok("opened, it carries a way to get in touch", talk.mail >= 1, `${talk.mail} addresses`);
  /*
   * And a form, which is the only one of them that is not somewhere else.
   *
   * An address is a thing to copy into another application; this is the
   * way in that happens here. Checked for its parts rather than its
   * presence, because a form missing the field somebody writes in is a
   * form that looks finished and is not.
   */
  s.ok(
    "and a form to write in, with somewhere to write",
    talk.form && talk.wrote && talk.sends,
    `form ${talk.form}, message field ${talk.wrote}, send ${talk.sends}`
  );
  s.ok(
    "and the signup, which lives nowhere else",
    talk.field === 1,
    `${talk.field} signup fields`
  );

  await p.goto(BASE + "/#index", { waitUntil: "domcontentloaded" });
  await sleep(2000);
  s.ok(
    "#index does nothing",
    (await p.$$(".hbw-spread")).length === 0 &&
      (await p.$$eval(".hbw-bar__nav a", (a) => a[0].textContent.trim())) === "Work"
  );

  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await sleep(4500);
  await p.$eval(".hbw-bar__nav a", (a) => a.click());
  await sleep(160);
  const leaving = await p.evaluate(() => document.documentElement.dataset.leaving);
  s.ok("pressed at home, the site plays its leaving", leaving === "true", "data-leaving=" + leaving);

  await p.goto(BASE + "/projects/koja", { waitUntil: "domcontentloaded" });
  await sleep(4000);
  await p.$eval(".hbw-bar__nav a", (a) => a.click());
  await sleep(160);
  const l2 = await p.evaluate(() => document.documentElement.dataset.leaving);
  s.ok("pressed in a project, it leaves before the page changes", l2 === "true", "data-leaving=" + l2);
  await sleep(2600);
  s.ok("and it lands back at the start", new URL(p.url()).pathname === "/", p.url());

  await sleep(1500);
  const about = await p.$$(".hbw-bar__nav a");
  await about[1].click();
  await sleep(1800);
  s.ok("About still opens a sheet", (await p.$$(".hbw-studio-sheet")).length > 0);

  await b.close();
  return s;
}
