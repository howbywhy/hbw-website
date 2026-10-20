import type { MetadataRoute } from "next";
import { liveProjects } from "@/components/home/catalog";
import { REGISTERED_PROJECTS } from "@/lib/projects.generated";
import { routeFor } from "@/lib/project-look";

const origin = "https://www.hbw.works";

/**
 * When each page was last actually changed.
 *
 * This was `new Date()` — the moment the build ran — written against every
 * URL. So each deploy told search engines that all nine pages had changed,
 * including the six that had not been touched in months, and they all carried
 * the same timestamp to the second. A lastmod that moves when nothing moved is
 * a lastmod a crawler learns to ignore, which costs the pages that genuinely
 * did change.
 *
 * A project's date is its CMS document's _updatedAt, carried into the registry
 * by the sync, so it is the real moment somebody last edited that project. The
 * front page is the work, so it takes the most recent of them. The Practice
 * page says nothing rather than something invented: omitting lastmod is a
 * crawler's cue to decide for itself, which is the honest answer when the copy
 * lives in the repo and the build has no idea when it was written.
 */
/* Keyed by route, not by CMS slug: CLOSED is "closed" in the CMS and
   "bar-closed" on the site, and a map keyed the other way loses exactly that
   one project's date without failing. */
const updatedByRoute = new Map(
  REGISTERED_PROJECTS.map((project) => [routeFor(project.slug), project.updated])
);

function updatedFor(slug: string) {
  const said = updatedByRoute.get(slug);
  if (!said) return undefined;
  const when = new Date(said);
  return Number.isNaN(when.getTime()) ? undefined : when;
}

/**
 * /manifesto is deliberately absent: it serves the same body as /practice and
 * now canonicalises to it. Listing it would ask search engines to index a page
 * that points elsewhere. /work and /projects are absent for the same reason:
 * both redirect to the front page, which carries the work in both of its
 * arrangements.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const work = liveProjects().map((project) => ({
    url: `${origin}${project.href}`,
    lastModified: updatedFor(project.id),
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }));

  const newest = work
    .map((entry) => entry.lastModified)
    .filter((when): when is Date => when instanceof Date)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  /* Home, About, and the work. There is nothing else to crawl. */
  return [
    { url: origin, lastModified: newest, changeFrequency: "monthly", priority: 1 },
    { url: `${origin}/practice`, changeFrequency: "monthly", priority: 0.8 },
    ...work,
  ];
}
