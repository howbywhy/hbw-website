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
      { source: "/intake/start", destination: "/studio", permanent: true },
      { source: "/projects", destination: "/?layer=projects", permanent: true },
      { source: "/collections", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
