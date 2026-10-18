import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * An article's body.
 *
 * The same constraint as a case study's text — paragraphs, emphasis, strong,
 * links — plus a subheading, which long-form writing needs and a case study
 * does not. No lists, no images, no block quotes: everything the site can
 * actually set, and nothing it would have to invent a style for on the day
 * somebody used it.
 */
export const articleBody = defineType({
  name: "articleBody",
  title: "Body",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Subheading", value: "h2" },
      ],
      lists: [],
      marks: {
        decorators: [
          { title: "Emphasis", value: "em" },
          { title: "Strong", value: "strong" },
        ],
        annotations: [
          defineArrayMember({
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              defineField({
                name: "href",
                type: "url",
                title: "URL",
                validation: (rule) =>
                  rule.uri({ allowRelative: true, scheme: ["http", "https", "mailto"] }),
              }),
            ],
          }),
        ],
      },
    }),
  ],
});
