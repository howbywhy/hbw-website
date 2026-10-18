import { NextResponse } from "next/server";
import { liveProjects, PROJECT_SLUGS } from "@/components/home/catalog";
import { resolveProjectExperience } from "@/lib/project-source";
import { inkedLogotype } from "@/components/site/Logotype";
import { shotsOf } from "@/components/site/shots";
import { infoOf } from "@/components/site/project-info";

/**
 * One project's frames, for the page already reading another one.
 *
 * The case studies cannot be stitched together on the server: every project
 * page would then carry every other project's sequence, which is exactly what
 * the repo's payload guard forbids and what made a page twenty megabytes the
 * last time. So the next project is fetched when a visitor actually scrolls
 * far enough to need it, and the page they loaded stays the size it was.
 *
 * No alt text, for the same reason it is kept off the front page: the alts are
 * the case study's writing and they belong to that project's own page.
 */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!PROJECT_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "No such project" }, { status: 404 });
  }
  const record = liveProjects().find((project) => project.id === slug);
  const { experience } = await resolveProjectExperience(slug);
  if (!record || !experience) {
    return NextResponse.json({ error: "No such project" }, { status: 404 });
  }

  return NextResponse.json(
    {
      slug,
      name: record.name,
      idea: record.idea,
      year: record.year,
      mark: inkedLogotype(slug),
      // The same shape the project's own page builds, so the two cannot drift.
      info: infoOf(record, experience),
      /*
       * Built by shotsOf, not by a copy of it.
       *
       * This said it was the same shape the page builds and then built its
       * own, which is how it came to hand the browser twenty-two frames at
       * whatever size the CMS happened to hold them — a 1920 wide still for
       * a cell a hundred and eighty across, four and a half megabytes on a
       * project page before a visitor had moved. The page's own frames had
       * been given widths; these had not, because they were never the same
       * code. Now they are.
       */
      frames: shotsOf(experience.movements),
    },
    {
      /*
       * Cached everywhere except the one place it cannot be corrected.
       *
       * This carried max-age=3600, which is an hour of the visitor's own
       * browser holding a project's frames and never asking again. A project
       * page is force-static, so its pictures change when a deployment lands
       * — and anyone with the old answer in their cache kept walking into the
       * replaced case study until they hard-refreshed. There is no way to
       * reach into a browser and put that right.
       *
       * So the browser asks every time and the shared cache answers: the
       * round trip is off the critical path — the next project is fetched
       * while a visitor is still scrolling toward it, and the hand-over is
       * the leaving animation's own length either way, measured unchanged at
       * three hundred and twenty milliseconds on a three-hundred-millisecond
       * connection. A deployment clears the shared cache, which is the only
       * moment this answer can change.
       */
      headers: { "cache-control": "public, max-age=0, must-revalidate, s-maxage=31536000" },
    }
  );
}
