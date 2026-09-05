import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { sanityDataset, sanityProjectId } from "./src/sanity/env";
import { schemaTypes } from "./src/sanity/schemaTypes";

const STUDIO_PROJECT_ID = sanityProjectId === "placeholder" ? "aagd1kcy" : sanityProjectId;
const STUDIO_DATASET = sanityDataset || "production";

/**
 * Standalone hosted Studio. Not the public /studio practice page.
 *
 * Embedded NextStudio at /cms was rejected for this repo:
 * public /studio is already the practice surface, and Sanity 6's
 * @sanity/workbench development export is raw TypeScript that Next 16
 * Turbopack cannot compile — that error poisoned every local route.
 *
 * Run `npm run cms` (sanity dev / Vite) locally, or open the hosted Studio.
 */
export default defineConfig({
  name: "hbw-website",
  title: "HBW Projects",
  projectId: STUDIO_PROJECT_ID,
  dataset: STUDIO_DATASET,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("Projects")
              .schemaType("project")
              .child(
                S.documentTypeList("project")
                  .title("Projects")
                  .defaultOrdering([{ field: "portfolioOrder", direction: "asc" }])
              ),
          ]),
    }),
  ],
  schema: { types: schemaTypes },
});
