import type { MetadataRoute } from "next";
import { liveProjects } from "@/components/home/catalog";

const origin = "https://www.hbw.works";

/** Build time. Every page here is statically generated, so they share it. */
const lastModified = new Date();

/**
 * /manifesto is deliberately absent: it serves the same body as /practice and
 * now canonicalises to it. Listing it would ask search engines to index a page
 * that points elsewhere. /work and /projects are absent for the same reason:
 * both redirect to the front page, which carries the work in both of its
 * arrangements.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* Home, About, and the work. There is nothing else to crawl. */
  return [
    { url: origin, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${origin}/practice`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    ...liveProjects().map((project) => ({
      url: `${origin}${project.href}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
