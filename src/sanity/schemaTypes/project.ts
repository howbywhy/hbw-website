import { defineField, defineType } from "sanity";
import { PROJECT_DISCIPLINES, PROJECT_ROLES, PROJECT_SECTORS } from "../constants";

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

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  groups: [
    { name: "context", title: "Context", default: true },
    { name: "caseStudy", title: "Case Study" },
    { name: "sequence", title: "Sequence" },
    { name: "identity", title: "Identity" },
    { name: "internal", title: "Internal" },
  ],
  fields: [
    defineField({
      name: "context",
      title: "Context",
      type: "projectPortableText",
      group: "context",
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "roles",
      title: "Roles",
      type: "array",
      group: "context",
      of: [{ type: "string" }],
      options: { list: list(PROJECT_ROLES), layout: "grid" },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "workingContext",
      title: "Working context",
      type: "string",
      group: "context",
      description: "Optional provenance. Distinct from collaborators. Not a required Independent default.",
    }),
    defineField({
      name: "collaborators",
      title: "Collaborators",
      type: "array",
      group: "context",
      of: [{ type: "collaborator" }],
    }),
    defineField({
      name: "idea",
      title: "Idea",
      type: "caseStudyBlock",
      group: "caseStudy",
      description: "Heading and body are both required.",
      validation: (rule) => rule.required().custom(requiredSectionBody("Idea", true)),
    }),
    defineField({
      name: "shift",
      title: "Shift",
      type: "caseStudyBlock",
      group: "caseStudy",
      validation: (rule) => rule.required().custom(requiredSectionBody("Shift")),
    }),
    defineField({
      name: "system",
      title: "System",
      type: "caseStudyBlock",
      group: "caseStudy",
      validation: (rule) => rule.required().custom(requiredSectionBody("System")),
    }),
    defineField({
      name: "outcome",
      title: "Outcome",
      type: "caseStudyBlock",
      group: "caseStudy",
      description: "Optional. Leave empty when the case study has no outcome.",
    }),
    defineField({
      name: "movements",
      title: "Sequence",
      type: "array",
      group: "sequence",
      of: [{ type: "movement" }],
      validation: (rule) => rule.required().min(1),
    }),
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
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
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
      name: "year",
      title: "Year",
      type: "string",
      group: "identity",
      validation: (rule) => rule.required().regex(/^\d{4}$/, { name: "year" }),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      group: "identity",
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
      name: "preview",
      title: "Preview",
      type: "image",
      group: "identity",
      description: "Projects Visual / Index thumbnail.",
      options: { hotspot: true },
    }),
    defineField({
      name: "portfolioOrder",
      title: "Portfolio order",
      type: "number",
      group: "identity",
      description: "Manual editorial order. Not derived from year.",
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
      proposition: "proposition",
      media: "preview",
      order: "portfolioOrder",
    },
    prepare({ title, year, proposition, media, order }) {
      const prefix = typeof order === "number" ? `${String(order).padStart(2, "0")} · ` : "";
      return {
        title: `${prefix}${title || "Untitled project"}`,
        subtitle: [year, proposition].filter(Boolean).join(" — "),
        media,
      };
    },
  },
});
