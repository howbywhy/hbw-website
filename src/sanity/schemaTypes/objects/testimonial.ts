import { defineField, defineType } from "sanity";

function excerpt(value: unknown, max = 80) {
  if (typeof value !== "string") return "Untitled testimonial";
  const text = value.trim();
  if (!text) return "Untitled testimonial";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "object",
  fields: [
    defineField({
      name: "quote",
      title: "Quote",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "attribution",
      title: "Role / Company",
      type: "string",
      description: "Optional. Example: Founder, KOJA.",
    }),
    defineField({
      name: "context",
      title: "Context",
      type: "text",
      rows: 3,
      description: "Optional internal provenance. Not public copy.",
    }),
  ],
  preview: {
    select: {
      quote: "quote",
      name: "name",
      attribution: "attribution",
    },
    prepare({ quote, name, attribution }) {
      const parts = [name, attribution].filter((value) => typeof value === "string" && value.trim());
      return {
        title: excerpt(quote),
        subtitle: parts.join(" · "),
      };
    },
  },
});
