import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { previewOnHbwAction } from "./src/sanity/actions/previewOnHbw";
import { LISTING_FEATURED, LISTING_INDEX } from "./src/sanity/schemaTypes/listing";
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
              .title("Featured work")
              .schemaType("project")
              .child(
                S.documentTypeList("project")
                  .title("Featured work")
                  .filter('_type == "project" && listing != $index')
                  .params({ index: LISTING_INDEX })
                  .initialValueTemplates([S.initialValueTemplateItem("project-featured")])
                  .defaultOrdering([{ field: "portfolioOrder", direction: "asc" }])
              ),
            S.listItem()
              .title("Index")
              .schemaType("project")
              .child(
                S.documentTypeList("project")
                  .title("Index")
                  .filter('_type == "project" && listing == $index')
                  .params({ index: LISTING_INDEX })
                  .initialValueTemplates([S.initialValueTemplateItem("project-index")])
                  .defaultOrdering([{ field: "year", direction: "desc" }])
              ),
            S.divider(),
            S.listItem()
              .title("All projects")
              .schemaType("project")
              .child(
                S.documentTypeList("project")
                  .title("All projects")
                  .defaultOrdering([{ field: "year", direction: "desc" }])
              ),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
    // The + button in each list creates the right kind of document, so adding
    // an archive row never starts life as a half-filled case study.
    templates: (previous) => [
      ...previous.filter((template) => template.id !== "project"),
      {
        id: "project-featured",
        title: "Featured project",
        description: "Full case study on the work line.",
        schemaType: "project",
        value: { listing: LISTING_FEATURED },
      },
      {
        id: "project-index",
        title: "Index entry",
        description: "Archive row: name, year, sectors, disciplines, logotype.",
        schemaType: "project",
        value: { listing: LISTING_INDEX },
      },
    ],
  },
  document: {
    actions: (previous, context) =>
      context.schemaType === "project" ? [...previous, previewOnHbwAction] : previous,
  },
});
