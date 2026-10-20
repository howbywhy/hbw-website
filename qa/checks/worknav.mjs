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

  s.ok("the index arrangement is gone", (await p.$$(".hbw-spread")).length === 0);
  s.ok("the loop keeps its three turns", (await p.$eval(".hbw-loop", (e) => e.dataset.turns)) === "3");
  s.ok("no mark box at the head of a row", (await p.$$(".hbw-cell--mark")).length === 0);
  /*
   * A foot on the front page, once per turn.
   *
   * This asserted the opposite, which was right while the argument held:
   * the nav carries the two moves the page needs and the foot's contents
   * live in About. It did not hold. The newsletter existed nowhere a
   * visitor would meet it, and the front page was the one page on the site
   * with no way to get in touch on it.
   *
   * Three, because the turns have to stay identical for the loop to wrap
   * without a jump — two would mean one turn is short and the wrap shows.
   */
  const feet = await p.$$(".hbw-end__to");
  s.ok("a foot in every turn", feet.length === 3, `${feet.length} feet`);
  s.ok(
    "and a way to get in touch in it",
    (await p.$$('footer a[href^="mailto:"]')).length === 3
  );
  s.ok(
    "and the signup, which lives nowhere else",
    (await p.$$("footer .hbw-end__field")).length === 3
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
