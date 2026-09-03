import { defineArrayMember, defineField, defineType } from "sanity";

/** Constrained case-study text. Hierarchy stays in the frontend. */
export const projectPortableText = defineType({
  name: "projectPortableText",
  title: "Text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [{ title: "Normal", value: "normal" }],
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
                  rule.uri({
                    allowRelative: true,
                    scheme: ["http", "https", "mailto"],
                  }),
              }),
            ],
          }),
        ],
      },
    }),
  ],
});
