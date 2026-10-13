import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * A project's own logotype, as the page's heading.
 *
 * Inlined rather than linked, so it can be set in ink. Each mark carries its
 * own brand colour — Chris Sisarich's is a pale grey that all but vanishes on
 * white — and a heading is not a reproduction of the identity, it is the name
 * of the page. Every fill is dropped and the mark takes currentColor.
 *
 * Server only: it reads the file at build time, so nothing is fetched and the
 * markup carries the mark.
 */
const DIR = path.join(process.cwd(), "src/components/home/logotypes");

/** Strip the colour out and let CSS decide it. */
function inked(svg: string) {
  return svg
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    // Both forms: the attribute, and the <style> blocks Illustrator writes.
    .replace(/fill\s*[:=]\s*"?#[0-9a-fA-F]{3,8}"?/g, (m) =>
      m.includes("=") ? 'fill="currentColor"' : "fill: currentColor"
    )
    .replace(/<svg /, '<svg fill="currentColor" ')
    .trim();
}

/** The same mark as a string, for the route that hands a project onward. */
export function inkedLogotype(slug: string): string | null {
  try {
    return inked(readFileSync(path.join(DIR, `${slug}.svg`), "utf8"));
  } catch {
    return null;
  }
}

export function Logotype({ slug, name }: { slug: string; name: string }) {
  const svg = inkedLogotype(slug);
  if (!svg) {
    // No mark for this project: its name is a perfectly good heading.
    return <span className="hbw-mark__text">{name}</span>;
  }
  return (
    <span
      className="hbw-mark"
      role="img"
      aria-label={name}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
