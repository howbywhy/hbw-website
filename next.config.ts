import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  agentRules: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  async redirects() {
    return [
      { source: "/projects/closed", destination: "/projects/bar-closed", permanent: true },
      /**
       * The work index moved to /work, which lays every project out as a grid
       * rather than a browse surface. Two indexes of the same six projects
       * compete with each other in search, so the old address points at the
       * new one.
       *
       * Not permanent, deliberately. /projects is already indexed, and a 308
       * is cached by browsers and hard to take back. Make it permanent once
       * /work has settled and is the address that should carry the ranking.
       *
       * Exact match only: /projects/<slug> is a case study and is untouched.
       */
      { source: "/projects", destination: "/work", permanent: false },
      /**
       * The CMS, on an address that is easy to remember and type.
       *
       * This points at the deployed Studio rather than embedding one: Sanity 6
       * ships @sanity/workbench as raw TypeScript that Next 16's Turbopack
       * cannot compile, and an embedded Studio took every other route down with
       * it. Sanity's own login guards the destination, so the alias is safe to
       * leave public; robots.ts keeps it out of the index.
       *
       * Not permanent — if the Studio is ever embedded here, this becomes a
       * real route and a 308 would be cached against us.
       */
      { source: "/update", destination: "https://hbw.sanity.studio", permanent: false },
      { source: "/update/:path*", destination: "https://hbw.sanity.studio/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
