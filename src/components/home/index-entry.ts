/**
 * The shape of an index row, and the one calculation the panel does with it.
 *
 * Browser-safe on purpose. The loader that fills these in reads .env.local
 * through node:fs, and the shell is a client component — importing the loader
 * for its type alone dragged node:fs into the browser bundle and took the
 * build down with it. Same trap as src/sanity/env.ts and the Studio.
 */

export type IndexEntry = {
  /** The route slug, so a row can open the project it belongs to. */
  id: string;
  name: string;
  /** The positioning line, shown grey beside the name. */
  idea: string;
  work: string;
  sector: string;
  year: number;
  /** A single-colour mark, or null when the project has no usable logotype. */
  mark: { body: string; viewBox: string; ratio: number } | null;
  /** Optional size nudge for a mark that reads too large against the others. */
  markScale: number | null;
  /** True when the project has a case study to open. */
  featured: boolean;
  /** Who it was made with, e.g. "The Colour Club". Empty when it was HBW alone. */
  credit: string;
};

/** The span line: how many projects, and the years they cover. */
export function indexSpan(entries: IndexEntry[]) {
  const years = entries.map((entry) => entry.year).filter((year) => Number.isFinite(year));
  return {
    count: entries.length,
    from: years.length ? Math.min(...years) : new Date().getFullYear(),
    to: years.length ? Math.max(...years) : new Date().getFullYear(),
  };
}
