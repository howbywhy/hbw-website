import type { MetadataRoute } from "next";
import { loadArticles } from "@/sanity/load-articles";
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
  /*
   * The writing, each piece at its own address.
   *
   * Read from the CMS rather than listed here, so publishing an article puts
   * it in the sitemap without anyone remembering to. An outage returns none,
   * which costs a crawl rather than a broken sitemap.
   */
  const articles = await loadArticles();
  return [
    { url: origin, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${origin}/practice`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/talk`, lastModified, changeFrequency: "yearly", priority: 0.6 },
    ...articles.map((article) => ({
      url: `${origin}/talk/${article.slug}`,
      lastModified: new Date(article.published),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...liveProjects().map((project) => ({
      url: `${origin}${project.href}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
