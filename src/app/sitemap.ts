import type { MetadataRoute } from "next";
import { liveProjects } from "@/components/home/catalog";

const origin = "https://www.hbw.works";

/** Build time. Every page here is statically generated, so they share it. */
const lastModified = new Date();

/**
 * /manifesto is deliberately absent: it serves the same body as /studio and
 * now canonicalises to it. Listing it would ask search engines to index a page
 * that points elsewhere.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: origin, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${origin}/projects`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${origin}/studio`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    ...liveProjects().map((project) => ({
      url: `${origin}${project.href}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
