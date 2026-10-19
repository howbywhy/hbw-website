/**
 * Nothing shouts in the console, and nothing fails to load.
 *
 * Both on the same pass, because they are the same question asked of the
 * browser: did anything go wrong that a visitor would not see but a developer
 * should. Pages are listed rather than crawled, so a page that stops existing
 * is a failure here rather than a quietly smaller run.
 */
import { BASE, browser, sleep, sheet } from "../lib.mjs";

/* Home, About, and every project. There is nothing else on the site. */
const PAGES = [
  "/",
  "/practice",
  "/projects/made-by-madelen",
  "/projects/sck",
  "/projects/sub-3",
  "/projects/bar-closed",
  "/projects/koja",
  "/projects/chris-sisarich",
  "/projects/our-boy-roy",
];

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
    /** Media whose range request Chrome cancelled; checked for real afterwards. */
    const aborted = new Set();
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
      /*
       * An aborted media range request is how a video stops, not how it fails.
       *
       * A film with preload="metadata" is fetched until Chrome has what it
       * wants and the rest of the range is then cancelled, which arrives here
       * as ERR_ABORTED on a request whose element is loaded and error-free.
       * Counting those called four working films missing on every page of the
       * site. Anything else that aborts, and every media request that aborts
       * without the element ending up loaded, still fails below.
       */
      if (r.resourceType() === "media" && r.failure()?.errorText === "net::ERR_ABORTED") {
        aborted.add(r.url());
        return;
      }
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
    /*
     * Having excused those aborts, prove them: every film the page cancelled
     * must be sitting there with data and no error. One that aborted and is
     * genuinely broken joins the missing rather than being waved through.
     */
    if (aborted.size) {
      const broken = await p.evaluate((urls) => {
        const out = [];
        for (const v of document.querySelectorAll("video")) {
          const src = v.currentSrc || v.src || v.querySelector("source")?.src || "";
          if (!urls.includes(src)) continue;
          /*
           * A film the page decided not to show is allowed to have nothing.
           *
           * The gallery runs one film at a time and pauses the rest, which
           * cancels whatever they had in flight — an abort on a paused film
           * is the page working, not a file that will not load. What is
           * never allowed is a decode error, or a film that is running with
           * no data to run on.
           */
          if (v.error) {
            out.push(src + " (media error " + v.error.code + ")");
            continue;
          }
          if (!v.paused && v.readyState < 1) out.push(src + " (playing with readyState 0)");
        }
        return out;
      }, [...aborted]);
      for (const one of broken) missing.push(one.slice(0, 90));
    }
    s.ok(path + " loads everything", missing.length === 0, [...new Set(missing)].slice(0, 3).join("; "));
    s.ok(path + " says nothing", shouts.length === 0, [...new Set(shouts)].slice(0, 2).join("; "));
    await p.close();
  }
  await b.close();
  return s;
}
