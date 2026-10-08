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
