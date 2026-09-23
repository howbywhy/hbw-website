import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { previewOnHbwAction } from "./src/sanity/actions/previewOnHbw";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { studioDataset, studioProjectId } from "./src/sanity/studio-env";

/**
 * Standalone hosted Studio. Not the public /studio practice page.
 *
 * Embedded NextStudio at /cms was rejected for this repo:
 * public /studio is already the practice surface, and Sanity 6's
 * @sanity/workbench development export is raw TypeScript that Next 16
 * Turbopack cannot compile — that error poisoned every local route.
 *
 * Run `npm run cms` (sanity dev / Vite) locally, or open the hosted Studio.
 *
 * Connection values come from studio-env, not src/sanity/env: the latter
 * reads .env.local off disk, and bundling node:fs and a bare `process` into
 * the browser broke the deployed Studio with "process is not defined".
 */
export default defineConfig({
  name: "hbw-website",
  title: "HBW Projects",
  projectId: studioProjectId,
  dataset: studioDataset,
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
  document: {
    actions: (previous, context) =>
      context.schemaType === "project" ? [...previous, previewOnHbwAction] : previous,
  },
});
