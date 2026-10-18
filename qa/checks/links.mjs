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

  /* Not fetched, only named, so a change to where the site points outward is
     visible in the run rather than discovered by a visitor. */
  s.ok("outward links, for the record", true, external.size ? [...external].join("  ") : "none");

  await b.close();
  return s;
}
