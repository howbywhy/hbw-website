import { SUB3_COPY, SUB3_IDENTITY } from "@/sanity/scripts/sub3-content";
import { stringToRichText } from "@/components/home/projects/types";

export const SUB3_INFO = {
  name: SUB3_IDENTITY.title,
  positioning: SUB3_IDENTITY.proposition,
  year: SUB3_IDENTITY.year,
  sections: [
    {
      id: "idea" as const,
      heading: SUB3_COPY.idea.heading,
      copy: SUB3_COPY.idea.body,
      body: stringToRichText(SUB3_COPY.idea.body),
    },
    {
      id: "shift" as const,
      heading: SUB3_COPY.shift.heading,
      copy: SUB3_COPY.shift.body,
      body: stringToRichText(SUB3_COPY.shift.body),
    },
    {
      id: "system" as const,
      heading: SUB3_COPY.system.heading,
      copy: SUB3_COPY.system.body,
      body: stringToRichText(SUB3_COPY.system.body),
    },
  ],
};

export type Sub3SectionId = (typeof SUB3_INFO.sections)[number]["id"];
