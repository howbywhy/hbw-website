import { defineField, defineType } from "sanity";

/** Rare, optional presentation exceptions. Most movements should omit this object. */
export const presentationOverride = defineType({
  name: "presentationOverride",
  title: "Presentation override",
  type: "object",
  fields: [
    defineField({
      name: "frameWidth",
      title: "Frame width",
      type: "string",
      description:
        "Optional. Use Narrow only when this movement needs a deliberately more contained frame than the default layout.",
      options: {
        list: [
          { title: "Default", value: "default" },
          { title: "Narrow", value: "narrow" },
        ],
      },
    }),
    defineField({
      name: "mediaFit",
      title: "Fit",
      type: "string",
      description:
        "Contain — the default; the whole image stays visible. Cover — fill the frame and crop if needed. Use Cover only as an exception.",
      options: {
        list: [
          { title: "Contain (default)", value: "default" },
          { title: "Cover", value: "cover" },
        ],
      },
    }),
    defineField({
      name: "mediaType",
      title: "Media treatment",
      type: "string",
      description:
        "Optional. Use Graphic when the asset should be treated as a designed graphic rather than photographic imagery.",
      options: {
        list: [
          { title: "Default", value: "default" },
          { title: "Graphic", value: "graphic" },
        ],
      },
    }),
  ],
});
