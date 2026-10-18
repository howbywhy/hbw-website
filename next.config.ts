import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  agentRules: false,
  /*
   * A new build is a new site, and an open tab has to be told.
   *
   * Every project page is force-static, so its contents cannot change inside
   * one deployment — they change when the next one lands. Until then a tab
   * that was already open kept serving what it had: the client router holds a
   * page it has visited for --stale-time, and no client navigation goes back
   * to the server inside that window. Swap a project's pictures and deploy,
   * and anyone mid-visit walks into the old case study until they refresh.
   *
   * Vercel gives each deployment an id, and naming it here makes the client
   * send it with every request: when the two disagree the payload is fetched
   * again rather than taken from the cache. Left unset off Vercel — locally a
   * rebuild is a new build with no id to compare, so a refresh is still the
   * way to see it.
   */
  ...(process.env.VERCEL_DEPLOYMENT_ID ? { deploymentId: process.env.VERCEL_DEPLOYMENT_ID } : {}),
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
    /*
     * And the window is as near closed as Next will allow.
     *
     * Five minutes is the default and it is meant for pages that are
     * expensive to fetch and cheap to be slightly wrong about. These are
     * neither: they are prerendered files, and being wrong about one means
     * showing work that has been replaced.
     *
     * This said 0, which Next 16 rejects — "Number must be greater than or
     * equal to 30 at experimental.staleTimes.static" — and a rejected option
     * is not a strict one, it is no option at all: the whole block was
     * dropped and the cache ran on its own five-minute default, which is the
     * behaviour this was written to stop. Thirty seconds is the floor Next
     * offers, so thirty seconds it is.
     */
    staleTimes: { static: 30, dynamic: 0 },
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
       * Not permanent, for the same reason as the work addresses below: this is
       * an editorial decision about where the words live, and a 308 is cached
       * by browsers in a way that is painful to take back.
       */
      { source: "/manifesto", destination: "/practice", permanent: false },
      /**
       * /projects is the front page.
       *
       * It was a page of its own for a while, and a second list of the same
       * projects is a second place to keep them — competing in search and,
       * worse, making the work follow one rule inside a project and another
       * across all of them. The work is the front page.
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
