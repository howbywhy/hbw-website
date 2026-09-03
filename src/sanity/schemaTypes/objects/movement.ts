import { defineField, defineType } from "sanity";
import { INFO_HINTS, MOVEMENT_PACES, MOVEMENT_SCALES } from "../../constants";

function list(values: readonly string[]) {
  return values.map((value) => ({ title: value, value }));
}

export const movement = defineType({
  name: "movement",
  title: "Movement",
  type: "object",
  fieldsets: [
    {
      name: "advanced",
      title: "Advanced / Presentation override",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "mediaType",
      title: "Media",
      type: "string",
      initialValue: "still",
      options: {
        list: [
          { title: "Still", value: "still" },
          { title: "Film", value: "film" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "still",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.mediaType !== "still",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { mediaType?: string } | undefined;
          if (parent?.mediaType === "still" && !value) return "Still movements need an image";
          return true;
        }),
    }),
    defineField({
      name: "video",
      title: "Video",
      type: "file",
      description: "MP4.",
      options: { accept: "video/mp4" },
      hidden: ({ parent }) => parent?.mediaType !== "film",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { mediaType?: string } | undefined;
          if (parent?.mediaType === "film" && !value) return "Film movements need an MP4";
          return true;
        }),
    }),
    defineField({
      name: "poster",
      title: "Poster",
      type: "image",
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.mediaType !== "film",
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { mediaType?: string } | undefined;
          if (parent?.mediaType === "film" && !value) return "Film movements need a poster";
          return true;
        }),
    }),
    defineField({
      name: "webm",
      title: "WebM (optional)",
      type: "file",
      description: "Optional companion file.",
      options: { accept: "video/webm" },
      hidden: ({ parent }) => parent?.mediaType !== "film",
    }),
    defineField({
      name: "alt",
      title: "Alt",
      type: "string",
      description: "Editorial alternative for gallery stills and film posters. Not for Sequence thumbs.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "scale",
      title: "Scale",
      type: "string",
      initialValue: "standard",
      options: { list: list(MOVEMENT_SCALES), layout: "radio", direction: "horizontal" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "pace",
      title: "Pace",
      type: "string",
      initialValue: "normal",
      options: { list: list(MOVEMENT_PACES), layout: "radio", direction: "horizontal" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "relation",
      title: "Relation",
      type: "string",
      initialValue: "single",
      options: {
        list: [
          { title: "Single — this movement stands alone", value: "single" },
          { title: "Pair — show this together with the next movement", value: "pair" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "infoHint",
      title: "Info chapter",
      type: "string",
      description:
        "Optional. Use this when this movement begins a new Idea, Shift, System or Outcome section. If left empty, the previous chapter continues.",
      options: {
        list: [
          { title: "Idea", value: "idea" },
          { title: "Shift", value: "shift" },
          { title: "System", value: "system" },
          { title: "Outcome", value: "outcome" },
        ],
      },
    }),
    defineField({
      name: "presentationOverride",
      title: "Presentation override",
      type: "presentationOverride",
      fieldset: "advanced",
      description:
        "Rare. Leave empty unless this movement needs an exceptional frame, fit, or graphic treatment that the default editorial grammar cannot express.",
    }),
  ],
  preview: {
    select: {
      alt: "alt",
      mediaType: "mediaType",
      scale: "scale",
      pace: "pace",
      relation: "relation",
      chapter: "infoHint",
      still: "still",
      poster: "poster",
    },
    prepare({ alt, mediaType, scale, pace, relation, chapter, still, poster }) {
      const media = mediaType === "film" ? "Film" : "Still";
      const chapterLabel = typeof chapter === "string" && chapter ? chapter : null;
      return {
        title: alt || media,
        subtitle: [media, scale, pace, relation, chapterLabel].filter(Boolean).join(" · "),
        media: still || poster,
      };
    },
  },
});
