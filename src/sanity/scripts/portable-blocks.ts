/** Portable Text helpers for seed scripts. Split paragraphs so CMS body matches `\n\n` copy. */

export function portableBlock(key: string, text: string) {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
  };
}

export function portableBlocks(prefix: string, text: string) {
  return text
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => portableBlock(`${prefix}${index}`, paragraph));
}
