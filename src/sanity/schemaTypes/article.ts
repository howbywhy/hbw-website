import { defineField, defineType } from "sanity";

/**
 * A piece of writing on Talk.
 *
 * Separate from `project`, and separate again from the interviews that will
 * sit on /conversations: this is the studio writing in its own voice rather
 * than describing a job or answering someone else's questions.
 *
 * Draft and publish are Sanity's own. Nothing here marks an article live —
 * the site reads published documents, so an article appears when it is
 * published and not before.
 */
export const article = defineType({
  name: "article",
  title: "Article",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "The address this reads at, under /talk.",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "published",
      title: "Published",
      type: "date",
      description: "The date shown with the piece, and what the list is ordered by.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "standfirst",
      title: "Standfirst",
      type: "text",
      rows: 3,
      description:
        "One or two sentences, shown under the title in the list and at the head of the piece. Not a summary of the whole thing — the reason to read it.",
      validation: (rule) => rule.required().max(280),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "articleBody",
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "publishedDesc",
      by: [{ field: "published", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "published" },
  },
});
