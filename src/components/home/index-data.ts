/**
 * The index: every project the studio has done, not only the six on the line.
 *
 * PROTOTYPE DATA. These rows stand in for the Sanity query while the archive
 * is being judged. The six live rows are real and match catalog.ts. The rest
 * are placeholders — they carry a year, a sector and a discipline, and nothing
 * else, because inventing client names or claims for work that isn't catalogued
 * yet would put fiction on the site.
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

/** Rows still to be catalogued. No names, no claims — only what is true. */
export const INDEX_PLACEHOLDERS: Omit<IndexRow, "id" | "name" | "idea" | "featured">[] = [
  { work: "Identity", sector: "Hospitality", year: 2023 },
  { work: "Packaging", sector: "Retail", year: 2023 },
  { work: "Naming, Identity", sector: "Property", year: 2022 },
  { work: "Packaging", sector: "Food & Drink", year: 2021 },
  { work: "Identity, Website", sector: "Professional services", year: 2021 },
  { work: "Print", sector: "Arts & culture", year: 2020 },
  { work: "Identity", sector: "Hospitality", year: 2019 },
  { work: "Brand Strategy", sector: "Retail", year: 2018 },
];

export const INDEX_SPAN = (() => {
  const years = [...INDEX_ROWS.map((r) => r.year), ...INDEX_PLACEHOLDERS.map((r) => r.year)];
  return { from: Math.min(...years), to: Math.max(...years), count: years.length };
})();
