import type { RichMark, RichSpan, RichText } from "../../components/home/projects/types";
import type { SanityPortableText } from "./types";

/**
 * Flatten restrained Portable Text into the current Info `copy: string`.
 * Paragraphs survive as blank-line-separated text.
 * Emphasis, strong, and links are dropped here; use portableTextToRichText to keep them.
 */
export function portableTextToPlainCopy(value: SanityPortableText | undefined): string {
  if (!value?.length) return "";
  return value
    .filter((block) => block._type === "block")
    .map((block) => (block.children ?? []).map((child) => child.text ?? "").join(""))
    .join("\n\n")
    .trim();
}

/** Adapter-neutral rich text. Presentation never receives Portable Text blocks. */
export function portableTextToRichText(value: SanityPortableText | undefined): RichText {
  if (!value?.length) return [];
  return value
    .filter((block) => block._type === "block")
    .map((block) => {
      const markDefs = new Map((block.markDefs ?? []).map((def) => [def._key, def]));
      const spans: RichSpan[] = (block.children ?? []).map((child) => {
        const marks: RichMark[] = [];
        let href: string | undefined;
        for (const mark of child.marks ?? []) {
          if (mark === "em" || mark === "strong") marks.push(mark);
          const def = markDefs.get(mark);
          if (def?._type === "link" && def.href) href = def.href;
        }
        const span: RichSpan = { text: child.text ?? "" };
        if (marks.length) span.marks = marks;
        if (href) span.href = href;
        return span;
      });
      return { spans };
    })
    .filter((paragraph) => paragraph.spans.some((span) => span.text));
}

export function hasPortableTextMarks(value: SanityPortableText | undefined) {
  if (!value?.length) return { emphasis: false, strong: false, links: false };
  let emphasis = false;
  let strong = false;
  let links = false;
  for (const block of value) {
    const markDefs = new Map((block.markDefs ?? []).map((def) => [def._key, def]));
    for (const child of block.children ?? []) {
      for (const mark of child.marks ?? []) {
        if (mark === "em") emphasis = true;
        if (mark === "strong") strong = true;
        if (markDefs.get(mark)?._type === "link") links = true;
      }
    }
  }
  return { emphasis, strong, links };
}
