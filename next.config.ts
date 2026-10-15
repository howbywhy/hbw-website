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
       * The manifesto is in the studio, which is where it was already being
       * read from — the page at this address rendered nothing but its own
       * structured data and pointed its canonical at /studio anyway. One
       * copy of it, at the address that carries the rest of the writing.
       *
       * Not permanent, for the same reason as the work index below: this is
       * an editorial decision about where the words live, and a 308 is cached
       * by browsers in a way that is painful to take back.
       */
      { source: "/manifesto", destination: "/studio", permanent: false },
      /**
       * The work index is the front page. Two indexes of the same six
       * projects compete with each other in search, so the old addresses
       * point at the one that carries them.
       *
       * Not permanent, deliberately. /projects is already indexed, and a 308
       * is cached by browsers and hard to take back. Make it permanent once
       * /work has settled and is the address that should carry the ranking.
       *
       * Exact match only: /projects/<slug> is a case study and is untouched.
       */
      { source: "/projects", destination: "/", permanent: false },
      /**
       * /work was the catalogue and is now the front page. Same reasoning as
       * above: temporary, because the address has been live and a 308 is
       * cached and hard to take back.
       */
      { source: "/work", destination: "/", permanent: false },
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
