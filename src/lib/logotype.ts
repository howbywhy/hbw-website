/**
 * Client logotypes arrive as SVG from whoever drew them: Illustrator exports
 * with a <style> block, files with fills baked onto every path, files with a
 * white background rect. The index needs all of them to read as one mark in
 * one ink, and it needs them to be safe to inline.
 *
 * normaliseLogotype does both jobs:
 *   - strips every colour instruction so the mark inherits `currentColor`
 *   - strips everything that could execute or phone home
 *
 * It is deliberately a whitelist on attributes and an explicit blacklist on
 * elements. An SVG that cannot be made safe returns null — the index then
 * shows the row with no mark behind it, which is a fine outcome.
 *
 * This runs at build time on files from the CMS, which only the studio writes
 * to. That is not a reason to skip the sanitising: an inlined <svg> is live
 * markup in the page, and "we trust the source" has never been a defence.
 */

/** Elements dropped outright, with their subtrees. */
const FORBIDDEN_ELEMENTS = [
  "script",
  "style",
  "foreignObject",
  "iframe",
  "image",
  "use",
  "animate",
  "animateTransform",
  "animateMotion",
  "set",
  "handler",
  "audio",
  "video",
];

/** Attributes carrying colour. Removing them is what makes the mark one ink. */
const COLOUR_ATTRIBUTES = [
  "fill",
  "stroke",
  "color",
  "stop-color",
  "flood-color",
  "lighting-color",
  "class",
  "style",
];

export type Logotype = {
  /** Inner markup, with no <svg> wrapper. Safe to inline. */
  body: string;
  /** The viewBox the body is drawn in, e.g. "0 0 864 191". */
  viewBox: string;
  /** width / height, for sizing a mark without waiting for layout. */
  ratio: number;
};

function stripComments(svg: string) {
  return svg.replace(/<!--[\s\S]*?-->/g, "").replace(/<!DOCTYPE[^>]*>/gi, "").replace(/<\?xml[^>]*\?>/gi, "");
}

function stripForbiddenElements(svg: string) {
  let out = svg;
  for (const tag of FORBIDDEN_ELEMENTS) {
    // Paired form, including nested content.
    out = out.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}\\s*>`, "gi"), "");
    // Self-closing or unpaired form.
    out = out.replace(new RegExp(`<${tag}\\b[^>]*/?>`, "gi"), "");
  }
  return out;
}

/**
 * Drop colour attributes, every `on*` handler, and any attribute whose value
 * points somewhere. `fill="none"` is kept: it is structural, not colour —
 * losing it turns an outlined mark into a solid blob.
 */
function cleanAttributes(svg: string) {
  return svg.replace(/<([a-zA-Z][\w:-]*)((?:\s+[^<>]*?)?)(\/?)>/g, (_whole, tag: string, attrs: string, close: string) => {
    if (!attrs.trim()) return `<${tag}${close}>`;
    const kept: string[] = [];
    const pattern = /([a-zA-Z_:][-\w:.]*)\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+)/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(attrs))) {
      const name = match[1];
      const lower = name.toLowerCase();
      const raw = match[2];
      const value = raw.replace(/^["']|["']$/g, "");
      if (lower.startsWith("on")) continue;
      if (lower === "href" || lower === "xlink:href") continue;
      if (COLOUR_ATTRIBUTES.includes(lower)) {
        if (lower === "fill" && value.trim().toLowerCase() === "none") kept.push(`fill="none"`);
        continue;
      }
      if (/url\s*\(|javascript\s*:|data\s*:/i.test(value)) continue;
      kept.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
    }
    return `<${tag}${kept.length ? " " + kept.join(" ") : ""}${close}>`;
  });
}

function readViewBox(openTag: string): string | null {
  const explicit = /viewBox\s*=\s*["']([^"']+)["']/i.exec(openTag);
  if (explicit) {
    const nums = explicit[1].trim().split(/[\s,]+/).map(Number);
    if (nums.length === 4 && nums.every((n) => Number.isFinite(n)) && nums[2] > 0 && nums[3] > 0) {
      return nums.join(" ");
    }
  }
  // No viewBox: fall back to width/height, which Illustrator always writes.
  const w = /\bwidth\s*=\s*["']?([\d.]+)/i.exec(openTag);
  const h = /\bheight\s*=\s*["']?([\d.]+)/i.exec(openTag);
  if (w && h) {
    const width = Number(w[1]);
    const height = Number(h[1]);
    if (width > 0 && height > 0) return `0 0 ${width} ${height}`;
  }
  return null;
}

/**
 * Returns the inner markup and viewBox of a single-colour, inline-safe mark,
 * or null when the input is not usable as one.
 */
export function normaliseLogotype(source: string | null | undefined): Logotype | null {
  if (typeof source !== "string" || !source.trim()) return null;

  const withoutComments = stripComments(source);
  const open = /<svg\b[^>]*>/i.exec(withoutComments);
  if (!open) return null;

  const viewBox = readViewBox(open[0]);
  if (!viewBox) return null;

  const closeIndex = withoutComments.lastIndexOf("</svg");
  if (closeIndex < 0) return null;
  const inner = withoutComments.slice(open.index + open[0].length, closeIndex);

  const body = cleanAttributes(stripForbiddenElements(inner)).trim();
  // A file whose only content was a <style> block and classed paths survives
  // this with markup but nothing to draw. Treat "no drawable element" as null.
  if (!/<(path|polygon|polyline|rect|circle|ellipse|line|g|text|tspan)\b/i.test(body)) return null;

  const [, , w, h] = viewBox.split(" ").map(Number);
  return { body, viewBox, ratio: w / h };
}
