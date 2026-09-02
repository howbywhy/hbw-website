import { defineField, defineType } from "sanity";

export const caseStudyBlock = defineType({
  name: "caseStudyBlock",
  title: "Case study section",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      description: "Optional. The frontend owns section hierarchy.",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "projectPortableText",
    }),
  ],
});
