/**
 * Every link on the site goes somewhere.
 *
 * Crawled rather than listed, because the failure this catches is a link to a
 * page that used to exist — and a list written by hand would be updated at the
 * same moment the link was, which is the moment it stops being a check.
 *
 * Internal links are followed and must answer. External ones are reported but
 * not fetched: a studio's site should not fail its own build because someone
 * else's server is slow, and hitting third parties on every run is rude. The
 * mailto: and tel: links are checked for shape instead, since a typo there is
 * silent — nothing 404s, the mail client just opens on nothing.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

const SEEDS = ["/", "/practice", "/projects/made-by-madelen", "/projects/bar-closed"];

const EMAIL = /^mailto:[^@\s]+@[^@\s.]+\.[^@\s]+$/;
const TEL = /^tel:\+?[0-9]{6,}$/;

export default async function run() {
  const b = await browser();
  const s = sheet("every link goes somewhere");
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });

  const internal = new Set();
  const external = new Set();
  const schemed = new Set();

  for (const seed of SEEDS) {
    await p.goto(BASE + seed, { waitUntil: "domcontentloaded" });
    await sleep(4000);
    /* About holds a good share of the site's links and is not in the markup
       until it is opened, so open it on every seed that has it. */
    await p.evaluate(() => {
      const a = [...document.querySelectorAll(".hbw-bar a, .hbw-bar button")].find(
        (x) => x.textContent.trim() === "About"
      );
      a && a.click();
    });
    await sleep(2500);
    const found = await p.evaluate(() =>
      [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"))
    );
    for (const href of found) {
      if (!href || href.startsWith("#")) continue;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) schemed.add(href);
      else if (/^https?:\/\//i.test(href)) external.add(href);
      else internal.add(href.split("#")[0] || "/");
    }
  }
  await p.close();

  if (!internal.size) {
    s.ok("links were found at all", null, "no internal links on any seed page");
    await b.close();
    return s;
  }

  const broken = [];
  for (const href of internal) {
    try {
      const res = await fetch(BASE + href, { redirect: "manual" });
      /* A redirect is a working link; CLOSED's old address is one on purpose. */
      if (res.status >= 400) broken.push(`${res.status} ${href}`);
    } catch (error) {
      broken.push(`${href} (${error.message})`);
    }
  }
  s.ok(
    `all ${internal.size} internal links answer`,
    broken.length === 0,
    broken.slice(0, 4).join("; ") || [...internal].sort().join(" ")
  );

  const malformed = [...schemed].filter((href) =>
    href.startsWith("mailto:") ? !EMAIL.test(href) : !TEL.test(href)
  );
  if (!schemed.size) s.ok("mail and phone links are well formed", null, "none found");
  else s.ok("mail and phone links are well formed", malformed.length === 0, malformed.join("; ") || [...schemed].join(" "));

  /*
   * Outward links are checked when there are any, and there are none.
   *
   * This row used to pass on the literal `true` — it printed whatever URLs
   * it found and passed regardless, which is not a check. The site links
   * nowhere outward at the moment, so the row only runs when that changes;
   * a row that permanently measures nothing is noise whether it is coloured
   * green or red.
   *
   * Worth knowing while it is quiet: the catalogue holds one outward link
   * that nothing renders — CLOSED's feature in The Brand Identity. It is
   * press the studio has and the site does not show, which is a decision
   * rather than a fault, so it is recorded here and not quietly linked.
   */
  if (external.size) {
    const wrong = [...external].filter(
      (href) => !/^https:\/\//.test(href) || /hbw\.works/.test(href)
    );
    s.ok(
      `all ${external.size} links out are https and go elsewhere`,
      wrong.length === 0,
      wrong.length ? wrong.join("; ") : [...external].join("  ")
    );
  }

  await b.close();
  return s;
}
