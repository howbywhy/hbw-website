/**
 * What a project says about itself, as data.
 *
 * One shape, built once, used by the project's own page and by the route that
 * hands a project to a page already showing another one. Rendering it to HTML
 * in the route was the obvious shortcut and Next refuses it — react-dom/server
 * has no business in that graph — and this is better regardless: the two
 * places that show it cannot drift, because they render the same structure.
 */
import type { ProjectExperience } from "@/components/home/projects/types";
import { richTextPlainCopy } from "@/components/home/projects/types";
import type { ProjectRecord } from "@/components/home/catalog";

export type InfoData = {
  facts: { label: string; value: string }[];
  parts: { heading: string; paragraphs: string[] }[];
};

export function infoOf(record: ProjectRecord, experience: ProjectExperience | null): InfoData {
  const facts: InfoData["facts"] = [{ label: "Year", value: record.year }];
  if (record.sectors?.length) facts.push({ label: "Sector", value: record.sectors.join(", ") });
  if (record.disciplines?.length) facts.push({ label: "Work", value: record.disciplines.join(", ") });
  if (record.credits?.length) facts.push({ label: "With", value: record.credits.join(", ") });
  const roles = experience?.authorship?.roles;
  if (roles?.length) facts.push({ label: "Role", value: roles.join(", ") });

  const parts = (experience?.infoSections ?? []).map((section) => ({
    heading: section.heading,
    paragraphs: (section.body ? richTextPlainCopy(section.body) : section.copy)
      .split(/\n\n/)
      .filter(Boolean),
  }));

  const made = experience?.authorship?.collaborators;
  if (made?.length) {
    parts.push({
      heading: "Collaborators",
      paragraphs: made.map((who) => `${who.name} — ${who.contribution}`),
    });
  }

  return { facts, parts };
}
