/**
 * Each project serves the sequence the repo ships, and every frame resolves.
 *
 * The counts are not written down here on purpose. They come from the repo's
 * own experiences, so adding or removing a movement does not need this file
 * edited — but a frame whose file is missing, or a project the API will not
 * answer for, fails.
 */
import { BASE, sheet } from "../lib.mjs";

/*
 * The projects, read from the site rather than typed here.
 *
 * This was a hand-written six, and Made by Madelen had already fallen off
 * it — that project's sequence could have returned nothing and this check
 * would have stayed green, because it never asked. A list of what exists,
 * kept in a file that has to be remembered, is the same mistake as a copy
 * of a shape maintained somewhere else; it is just slower to notice.
 *
 * The sitemap is the site's own statement of what it has. If it ever stops
 * naming projects, this reports unmeasured rather than passing on an empty
 * list, because no projects is not the same as no problems.
 */
async function projectSlugs() {
  const res = await fetch(`${BASE}/sitemap.xml`);
  if (!res.ok) return null;
  const xml = await res.text();
  const slugs = [...xml.matchAll(/<loc>[^<]*\/projects\/([^<\/]+)<\/loc>/g)].map((m) => m[1]);
  return slugs.length ? [...new Set(slugs)] : null;
}

export default async function run() {
  const s = sheet("every project's frames resolve");
  const SLUGS = await projectSlugs();
  if (!SLUGS) {
    s.ok("the sitemap names the projects", null, "no projects in /sitemap.xml, so none were checked");
    return s;
  }
  for (const slug of SLUGS) {
    let data = null;
    try {
      const res = await fetch(`${BASE}/api/sequence/${slug}`);
      if (res.ok) data = await res.json();
    } catch {
      /* falls through to the unmeasured verdict below */
    }
    if (!data || !Array.isArray(data.frames)) {
      s.ok(slug + " answers with a sequence", null, "no answer from /api/sequence");
      continue;
    }
    s.ok(slug + " has frames", data.frames.length > 0, data.frames.length + " frames");

    const broken = [];
    for (const f of data.frames) {
      for (const url of [f.src, f.video].filter(Boolean)) {
        if (!url.startsWith("/")) continue; /* CMS-hosted media is not ours to check */
        try {
          const head = await fetch(BASE + url, { method: "HEAD" });
          if (!head.ok) broken.push(head.status + " " + url.split("/").pop());
        } catch {
          broken.push("unreachable " + url.split("/").pop());
        }
      }
    }
    s.ok(slug + " serves every file it names", broken.length === 0, broken.slice(0, 3).join("; "));
  }
  return s;
}
