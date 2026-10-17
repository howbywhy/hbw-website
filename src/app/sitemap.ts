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
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: origin, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${origin}/practice`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/talk`, lastModified, changeFrequency: "yearly", priority: 0.6 },
    ...liveProjects().map((project) => ({
      url: `${origin}${project.href}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
    /*
     * The written half of each project, at its own address.
     *
     * Not a duplicate of the gallery above it: that page is the pictures and
     * carries the project's own description, this one is the writing and
     * canonicalises to itself. It is the half a crawler can read.
     */
    ...liveProjects().map((project) => ({
      url: `${origin}${project.href}/story`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
}
