/**
 * The index: every project the studio has done, not only the six on the line.
 *
 * PROTOTYPE DATA. These rows stand in for the Sanity query while the archive
 * is being judged. Every row here is real and matches catalog.ts. Older work
 * joins the list as it is catalogued, with a name — an empty row states
 * nothing and asks the reader to take the studio's word for it.
 */

export type IndexRow = {
  /** Matches a key in INDEX_MARKS, and a catalog id where the project is live. */
  id: string;
  name: string;
  /** The positioning line, shown grey beside the name. */
  idea: string;
  work: string;
  sector: string;
  year: number;
  /** Featured rows open their case study. Index-only rows are a record. */
  featured: boolean;
};

export const INDEX_ROWS: IndexRow[] = [
  { id: "sck", name: "SCK", idea: "Intersecting Realities", work: "Brand Strategy, Identity", sector: "Architecture · Interior", year: 2026, featured: true },
  { id: "sub-3", name: "SUB:3", idea: "Bending Time & Space", work: "Identity, Packaging", sector: "Sports Nutrition", year: 2025, featured: true },
  { id: "closed", name: "CLOSED", idea: "A Smuggler’s House", work: "Naming, Identity, Signage", sector: "Hospitality", year: 2024, featured: true },
  { id: "koja", name: "KOJA", idea: "Unapologetically Good", work: "Strategy, Identity, Packaging", sector: "FMCG · Food", year: 2024, featured: true },
  { id: "chris-sisarich", name: "Chris Sisarich", idea: "Beauty Amongst The Mundane", work: "Identity, Website", sector: "Photography", year: 2024, featured: true },
  { id: "our-boy-roy", name: "Our Boy Roy", idea: "Dinner, Sorted", work: "Identity, Packaging", sector: "Hospitality", year: 2022, featured: true },
];

export const INDEX_SPAN = (() => {
  const years = INDEX_ROWS.map((row) => row.year);
  return { from: Math.min(...years), to: Math.max(...years), count: years.length };
})();
