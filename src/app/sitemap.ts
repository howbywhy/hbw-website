import type { MetadataRoute } from "next";
import { liveProjects } from "@/components/home/catalog";

const origin = "https://www.hbw.works";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/studio", "/manifesto"];
  return [
    ...pages.map((path) => ({ url: `${origin}${path}` })),
    ...liveProjects().map((project) => ({ url: `${origin}${project.href}` })),
  ];
}
