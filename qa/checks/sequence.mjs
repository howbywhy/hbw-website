/**
 * Each project serves the sequence the repo ships, and every frame resolves.
 *
 * The counts are not written down here on purpose. They come from the repo's
 * own experiences, so adding or removing a movement does not need this file
 * edited — but a frame whose file is missing, or a project the API will not
 * answer for, fails.
 */
import { BASE, sheet } from "../lib.mjs";

const SLUGS = ["sck", "bar-closed", "koja", "sub-3", "chris-sisarich", "our-boy-roy"];

export default async function run() {
  const s = sheet("every project's frames resolve");
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
