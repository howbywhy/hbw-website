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
      /*
       * The studio is the Practice and contact is the Talk.
       *
       * The old addresses are the ones in the wild — in the sitemap search
       * engines already have, in anything anyone has linked — so they keep
       * working. Not permanent: a 308 is cached by browsers in a way that is
       * painful to take back, and these are names, which are the kind of
       * decision that gets revisited.
       */
      { source: "/studio", destination: "/practice", permanent: false },
      { source: "/contact", destination: "/talk", permanent: false },
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
      { source: "/manifesto", destination: "/practice", permanent: false },
      /**
       * /projects is a page again: the index of the work.
       *
       * It redirected here because two indexes of the same projects compete
       * with each other in search, and the front page is the one that should
       * carry the ranking. It still is — the index does not repeat the work,
       * it names it — and the front page stays the canonical home of the
       * catalogue. Someone who knows which project they want should not have
       * to scroll the whole of it to reach one.
       */
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
