/**
 * Nothing shouts in the console, and nothing fails to load.
 *
 * Both on the same pass, because they are the same question asked of the
 * browser: did anything go wrong that a visitor would not see but a developer
 * should. Pages are listed rather than crawled, so a page that stops existing
 * is a failure here rather than a quietly smaller run.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

const PAGES = ["/", "/practice", "/talk", "/projects/koja", "/projects/chris-sisarich", "/projects/our-boy-roy", "/projects/sck", "/projects/sub-3", "/projects/bar-closed"];

/*
 * Noise a visitor never sees and a developer cannot fix here.
 *
 * The Vercel analytics script only exists once the site is deployed, so it
 * 404s on every page of a local build. Kept narrow — the path, not the whole
 * of /_vercel — so a real missing asset still fails.
 */
const IGNORE = [
  /favicon\.ico/i,
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /\/_vercel\/insights\//i,
];

export default async function run() {
  const b = await browser();
  const s = sheet("clean console, and every asset loads");
  for (const path of PAGES) {
    const p = await b.newPage();
    await p.setViewport({ width: 1440, height: 900 });
    const shouts = [];
    const missing = [];
    p.on("console", (m) => {
      if (m.type() !== "error" && m.type() !== "warning") return;
      const text = m.text();
      /* A failed resource logs "Failed to load resource: ... 404" with no URL
         in the message at all — the file it was reaching for is only in the
         message's location, so an ignore list of URLs has to be matched
         against that too or it can never match. */
      const where = (m.location && m.location().url) || "";
      if (IGNORE.some((r) => r.test(text) || (where && r.test(where)))) return;
      shouts.push(text.slice(0, 120) + (where ? "  <- " + where.replace(BASE, "").slice(0, 60) : ""));
    });
    p.on("requestfailed", (r) => {
      if (IGNORE.some((x) => x.test(r.url()))) return;
      missing.push(r.url().replace(BASE, "").slice(0, 90));
    });
    p.on("response", (r) => {
      if (r.status() < 400) return;
      if (IGNORE.some((x) => x.test(r.url()))) return;
      missing.push(r.status() + " " + r.url().replace(BASE, "").slice(0, 86));
    });
    const res = await p.goto(BASE + path, { waitUntil: "domcontentloaded" });
    await sleep(4000);
    const status = res ? res.status() : 0;
    s.ok(path + " answers", status >= 200 && status < 400, "status " + status);
    s.ok(path + " loads everything", missing.length === 0, [...new Set(missing)].slice(0, 3).join("; "));
    s.ok(path + " says nothing", shouts.length === 0, [...new Set(shouts)].slice(0, 2).join("; "));
    await p.close();
  }
  await b.close();
  return s;
}
