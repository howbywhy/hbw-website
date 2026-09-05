import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "aagd1kcy",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  },
  studioHost: "hbw",
  deployment: {
    appId: "uo7c5b3lz506ak3jlumxb3xt",
  },
  // Vite would otherwise copy the Next.js public/ site assets into Studio dist.
  vite: {
    publicDir: false,
  },
});
