import { defineField, defineType } from "sanity";
import { movementPreviewTitle, pairPaceWarning } from "../editorRules";

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
      description: "Required MP4 for film movements.",
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
      description: "Required still shown before the film plays.",
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
      title: "WebM",
      type: "file",
      description: "Optional companion file. Leave empty when the film is MP4 only.",
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
      description:
        "Major — large visual emphasis; the strongest gallery scale the layout allows. Standard — the default beat. Detail — a smaller, more contained beat.",
      options: {
        list: [
          { title: "Major", value: "major" },
          { title: "Standard", value: "standard" },
          { title: "Detail", value: "detail" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "pace",
      title: "Pace",
      type: "string",
      initialValue: "normal",
      description:
        "Tight — reduces space after this movement. Normal — the default interval. Pause — adds intentional space after this movement. Pace stays editorial; Pair does not force Tight.",
      options: {
        list: [
          { title: "Tight", value: "tight" },
          { title: "Normal", value: "normal" },
          { title: "Pause", value: "pause" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "relation",
      title: "Relation",
      type: "string",
      initialValue: "single",
      description: "Pair connects this movement to the next as a visual pair. It cannot be the last movement.",
      options: {
        list: [
          { title: "Single — stands alone", value: "single" },
          { title: "Pair — connects to the next movement", value: "pair" },
        ],
        layout: "radio",
      },
      validation: (rule) => [
        rule.required(),
        rule
          .custom((value, context) => {
            const parent = context.parent as { pace?: string } | undefined;
            return pairPaceWarning(typeof value === "string" ? value : undefined, parent?.pace);
          })
          .warning(),
      ],
    }),
    defineField({
      name: "infoHint",
      title: "Info chapter",
      type: "string",
      description:
        "Optional. Mark the movement that begins Idea, Shift, System, or Outcome. Leave empty to continue the previous chapter.",
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
        "Rare. Leave empty unless this movement needs an exceptional frame, fit, or graphic treatment.",
    }),
  ],
  preview: {
    select: {
      key: "_key",
      alt: "alt",
      mediaType: "mediaType",
      scale: "scale",
      pace: "pace",
      relation: "relation",
      still: "still",
      poster: "poster",
      mediaFit: "presentationOverride.mediaFit",
    },
    prepare({ key, alt, mediaType, scale, pace, relation, still, poster, mediaFit }) {
      const fit = mediaFit === "cover" ? "COVER" : "CONTAIN";
      return {
        title: movementPreviewTitle({ mediaType, scale, pace, relation, mediaFit }),
        subtitle: [key, fit, typeof alt === "string" ? alt : ""]
          .filter((value) => typeof value === "string" && value.trim())
          .join(" · "),
        media: still || poster,
      };
    },
  },
});
