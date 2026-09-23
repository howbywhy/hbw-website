import { defineField, defineType } from "sanity";
import { PROJECT_DISCIPLINES, PROJECT_ROLES, PROJECT_SECTORS } from "../constants";
import {
  outcomeHintWarning,
  terminalPairMessage,
  uniqueMovementKeyMessage,
  type EditorMovement,
} from "./editorRules";
import {
  LISTING_INDEX,
  LISTING_OPTIONS,
  featuredOnly,
  onlyWhenFeatured,
  requiredWhenFeatured,
  requiredWhenIndexed,
} from "./listing";

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
      name: "listing",
      title: "Listing",
      type: "string",
      group: "identity",
      description:
        "Featured projects carry a full case study and sit on the work line. Index entries are archive rows: four fields and a logotype, nothing else. Left empty it reads as Featured, which is what the original six are.",
      options: { list: [...LISTING_OPTIONS], layout: "radio" },
      initialValue: LISTING_INDEX,
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
      description: "CMS and preview identity. Public CLOSED remains /projects/bar-closed.",
      options: { source: "title", maxLength: 96 },
      validation: (rule) =>
        rule.custom(requiredWhenFeatured("Slug")).custom(async (slug, context) => {
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
      validation: (rule) => rule.custom(requiredWhenIndexed("Sectors")),
    }),
    defineField({
      name: "disciplines",
      title: "Disciplines",
      type: "array",
      group: "identity",
      description: "Browse-filter labels. Authorship uses Roles.",
      of: [{ type: "string" }],
      options: { list: list(PROJECT_DISCIPLINES), layout: "grid" },
      validation: (rule) => rule.custom(requiredWhenIndexed("Disciplines")),
    }),
    defineField({
      name: "proposition",
      title: "Proposition",
      type: "string",
      group: "identity",
      description: "The positioning line. On an index row this is the grey line beside the name.",
      validation: (rule) => rule.custom(requiredWhenFeatured("Proposition")),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      group: "identity",
    }),
    defineField({
      name: "madeWith",
      title: "Made with",
      type: "string",
      group: "identity",
      description:
        "The studio the work was made with, if it was not HBW alone — for example The Colour Club. Shown on the index row as \"with …\". Leave empty for HBW's own work. This is the studio credit, not the production credits under With.",
    }),
    defineField({
      name: "logotype",
      title: "Logotype (SVG)",
      type: "file",
      group: "identity",
      description:
        "The client logotype, as SVG. It is recoloured to a single ink on the way out, so any fills in the file are ignored. Upload the plain logotype, not a lockup with a strapline.",
      options: { accept: "image/svg+xml,.svg" },
      validation: (rule) =>
        rule.custom((value) => {
          const asset = (value as { asset?: { _ref?: string } } | undefined)?.asset?._ref;
          if (!asset) return true;
          return asset.endsWith("-svg") || "The logotype has to be an SVG so it can be recoloured.";
        }),
    }),
    defineField({
      name: "logotypeScale",
      title: "Logotype scale",
      type: "number",
      group: "identity",
      description:
        "Optional nudge, 0.5 to 1.5, for a mark that reads too big or too small against the others. 1 is the default size.",
      validation: (rule) => rule.min(0.5).max(1.5),
    }),
    defineField({
      name: "context",
      title: "Context",
      type: "projectPortableText",
      group: "projectInfo",
      hidden: featuredOnly,
      validation: (rule) => rule.custom(requiredWhenFeatured("Context")),
    }),
    defineField({
      name: "roles",
      title: "Role",
      type: "array",
      group: "projectInfo",
      of: [{ type: "string" }],
      options: { list: list(PROJECT_ROLES), layout: "grid" },
      hidden: featuredOnly,
      validation: (rule) => rule.custom(requiredWhenFeatured("Role")),
    }),
    defineField({
      name: "workingContext",
      title: "Working Context",
      type: "string",
      group: "projectInfo",
      description: "Optional provenance. Distinct from With. Not a required Independent default.",
      hidden: featuredOnly,
    }),
    defineField({
      name: "collaborators",
      title: "With",
      type: "array",
      group: "projectInfo",
      of: [{ type: "collaborator" }],
      hidden: featuredOnly,
    }),
    defineField({
      name: "idea",
      title: "Idea",
      type: "caseStudyBlock",
      group: "projectInfo",
      description: "Heading and body are both required.",
      hidden: featuredOnly,
      validation: (rule) => rule.custom(onlyWhenFeatured(requiredSectionBody("Idea", true))),
    }),
    defineField({
      name: "shift",
      title: "Shift",
      type: "caseStudyBlock",
      group: "projectInfo",
      hidden: featuredOnly,
      validation: (rule) => rule.custom(onlyWhenFeatured(requiredSectionBody("Shift"))),
    }),
    defineField({
      name: "system",
      title: "System",
      type: "caseStudyBlock",
      group: "projectInfo",
      hidden: featuredOnly,
      validation: (rule) => rule.custom(onlyWhenFeatured(requiredSectionBody("System"))),
    }),
    defineField({
      name: "outcome",
      title: "Outcome",
      type: "caseStudyBlock",
      group: "projectInfo",
      description: "Optional. Leave empty when the case study has no outcome.",
      hidden: featuredOnly,
    }),
    defineField({
      name: "testimonials",
      title: "Testimonials",
      type: "array",
      group: "projectInfo",
      of: [{ type: "testimonial" }],
      description: "Optional. Approved client testimonials for possible future use. Not shown on the site.",
      hidden: featuredOnly,
    }),
    defineField({
      name: "movements",
      title: "Movements",
      type: "array",
      group: "sequence",
      of: [{ type: "movement" }],
      description:
        "Gallery order is this list order. Each row should read like 03 — STILL — MAJOR — PAUSE. Drag to reorder with the built-in control.",
      hidden: featuredOnly,
      validation: (rule) => [
        rule.custom(requiredWhenFeatured("A movement sequence")),
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
      hidden: featuredOnly,
    }),
    defineField({
      name: "portfolioOrder",
      title: "Portfolio order",
      type: "number",
      group: "presentation",
      description:
        "Manual editorial order for the work line. Not derived from year. Index entries are ordered by year instead.",
      hidden: featuredOnly,
      validation: (rule) => rule.integer().min(1).custom(requiredWhenFeatured("Portfolio order")),
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
      title: "Year, newest first",
      name: "yearDesc",
      by: [{ field: "year", direction: "desc" }],
    },
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
      listing: "listing",
      logotype: "logotype.asset._ref",
    },
    prepare({ title, year, slug, media, movements, listing, logotype }) {
      const indexOnly = listing === LISTING_INDEX;
      const count = Array.isArray(movements) ? movements.length : 0;
      const parts = indexOnly
        ? [year, logotype ? "logotype" : "no logotype"]
        : [year, slug, count ? `${count} movements` : null];
      return {
        title: title || "Untitled project",
        subtitle: [indexOnly ? "Index" : "Featured", ...parts].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
