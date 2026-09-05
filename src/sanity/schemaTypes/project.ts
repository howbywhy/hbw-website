import { defineField, defineType } from "sanity";
import { PROJECT_DISCIPLINES, PROJECT_ROLES, PROJECT_SECTORS } from "../constants";
import {
  outcomeHintWarning,
  terminalPairMessage,
  uniqueMovementKeyMessage,
  type EditorMovement,
} from "./editorRules";

function list(values: readonly string[]) {
  return values.map((value) => ({ title: value, value }));
}

function requiredSectionBody(section: string, headingRequired = false) {
  return (value: unknown) => {
    const block = value as { heading?: string; body?: unknown[] } | undefined;
    if (headingRequired && !block?.heading?.trim()) return `${section} needs a heading`;
    if (!block?.body?.length) return `${section} needs body text`;
    return true;
  };
}

function hasOutcomeBody(value: unknown) {
  const block = value as { body?: unknown[] } | undefined;
  return Boolean(block?.body?.length);
}

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  description:
    "Publishing rebuilds www.hbw.works from this published document. The live page updates after that production build succeeds. Draft preview is immediate and does not wait for the rebuild.",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "projectInfo", title: "Project Info" },
    { name: "sequence", title: "Sequence" },
    { name: "presentation", title: "Portfolio / Presentation" },
    { name: "internal", title: "Internal" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "identity",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "identity",
      description: "CMS and preview identity. Public CLOSED remains /projects/bar-closed.",
      options: { source: "title", maxLength: 96 },
      validation: (rule) =>
        rule.required().custom(async (slug, context) => {
          const current = slug && typeof slug === "object" && "current" in slug ? slug.current : "";
          if (!current || !context.document?._id) return true;
          const id = context.document._id.replace(/^drafts\./, "");
          const client = context.getClient({ apiVersion: "2025-02-19" });
          const count = await client.fetch<number>(
            `count(*[_type == "project" && slug.current == $slug && !(_id in [$id, $draft])])`,
            { slug: current, id, draft: `drafts.${id}` }
          );
          return count === 0 || "Another project already uses this slug.";
        }),
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "string",
      group: "identity",
      validation: (rule) => rule.required().regex(/^\d{4}$/, { name: "year" }),
    }),
    defineField({
      name: "sectors",
      title: "Sectors",
      type: "array",
      group: "identity",
      of: [{ type: "string" }],
      options: { list: list(PROJECT_SECTORS), layout: "grid" },
    }),
    defineField({
      name: "disciplines",
      title: "Disciplines",
      type: "array",
      group: "identity",
      description: "Browse-filter labels. Authorship uses Roles.",
      of: [{ type: "string" }],
      options: { list: list(PROJECT_DISCIPLINES), layout: "grid" },
    }),
    defineField({
      name: "proposition",
      title: "Proposition",
      type: "string",
      group: "identity",
      description: "The positioning line.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      group: "identity",
    }),
    defineField({
      name: "context",
      title: "Context",
      type: "projectPortableText",
      group: "projectInfo",
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "roles",
      title: "Role",
      type: "array",
      group: "projectInfo",
      of: [{ type: "string" }],
      options: { list: list(PROJECT_ROLES), layout: "grid" },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "workingContext",
      title: "Working Context",
      type: "string",
      group: "projectInfo",
      description: "Optional provenance. Distinct from With. Not a required Independent default.",
    }),
    defineField({
      name: "collaborators",
      title: "With",
      type: "array",
      group: "projectInfo",
      of: [{ type: "collaborator" }],
    }),
    defineField({
      name: "idea",
      title: "Idea",
      type: "caseStudyBlock",
      group: "projectInfo",
      description: "Heading and body are both required.",
      validation: (rule) => rule.required().custom(requiredSectionBody("Idea", true)),
    }),
    defineField({
      name: "shift",
      title: "Shift",
      type: "caseStudyBlock",
      group: "projectInfo",
      validation: (rule) => rule.required().custom(requiredSectionBody("Shift")),
    }),
    defineField({
      name: "system",
      title: "System",
      type: "caseStudyBlock",
      group: "projectInfo",
      validation: (rule) => rule.required().custom(requiredSectionBody("System")),
    }),
    defineField({
      name: "outcome",
      title: "Outcome",
      type: "caseStudyBlock",
      group: "projectInfo",
      description: "Optional. Leave empty when the case study has no outcome.",
    }),
    defineField({
      name: "testimonials",
      title: "Testimonials",
      type: "array",
      group: "projectInfo",
      of: [{ type: "testimonial" }],
      description: "Optional. Approved client testimonials for possible future use. Not shown on the site.",
    }),
    defineField({
      name: "movements",
      title: "Movements",
      type: "array",
      group: "sequence",
      of: [{ type: "movement" }],
      description:
        "Gallery order is this list order. Each row should read like 03 — STILL — MAJOR — PAUSE. Drag to reorder with the built-in control.",
      validation: (rule) => [
        rule.required().min(1),
        rule.custom((movements) => terminalPairMessage(movements as EditorMovement[] | undefined)),
        rule.custom((movements) => uniqueMovementKeyMessage(movements as EditorMovement[] | undefined)),
        rule
          .custom((movements, context) =>
            outcomeHintWarning(
              movements as EditorMovement[] | undefined,
              hasOutcomeBody(context.document?.outcome)
            )
          )
          .warning(),
      ],
    }),
    defineField({
      name: "preview",
      title: "Preview",
      type: "image",
      group: "presentation",
      description: "Stored portfolio still. Browse Visual / Index currently read catalog.ts, not this field.",
      options: { hotspot: true },
    }),
    defineField({
      name: "portfolioOrder",
      title: "Portfolio order",
      type: "number",
      group: "presentation",
      description: "Manual editorial order. Not derived from year. Does not drive the live site yet.",
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: "contributionNotes",
      title: "Contribution notes",
      type: "text",
      group: "internal",
      rows: 4,
    }),
    defineField({
      name: "editorialPurpose",
      title: "Editorial purpose",
      type: "string",
      group: "internal",
      description: "Portfolio rationale. Example: Definition / Future.",
    }),
    defineField({
      name: "replacementPriority",
      title: "Replacement priority",
      type: "number",
      group: "internal",
      validation: (rule) => rule.integer().min(1).max(10),
    }),
  ],
  orderings: [
    {
      title: "Portfolio order",
      name: "portfolioOrderAsc",
      by: [{ field: "portfolioOrder", direction: "asc" }],
    },
    {
      title: "Title",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      year: "year",
      slug: "slug.current",
      media: "preview",
      movements: "movements",
    },
    prepare({ title, year, slug, media, movements }) {
      const count = Array.isArray(movements) ? movements.length : 0;
      return {
        title: title || "Untitled project",
        subtitle: [year, slug, count ? `${count} movements` : null].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
