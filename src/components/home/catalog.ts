import { catalogIdForSlug } from "@/lib/cms-source";

export { catalogIdForSlug };

export type BrowseLayout = "portrait" | "contained" | "landscape" | "wide";

export const DISCIPLINES = [
  "Brand DNA",
  "Brand Identity",
  "Naming",
  "Visual Identity",
  "Packaging",
  "Signage/Wayfinding",
  "Website",
  "Print & Digital Design",
  "Motion",
  "Digital Design",
] as const;

export const SECTORS = ["Sports Nutrition", "FMCG", "Food", "Hospitality", "Photography", "Architecture", "Interior Design"] as const;

export const COLLABORATORS = [
  { id: "the-colour-club", name: "The Colour Club", kind: "studio" },
] as const satisfies readonly { id: string; name: string; kind: "studio" | "person" }[];

export type Discipline = (typeof DISCIPLINES)[number];
export type Sector = (typeof SECTORS)[number];
export type Collaborator = (typeof COLLABORATORS)[number];
export type CollaboratorId = Collaborator["id"];

/** Credits prose for each discipline. Adding a discipline without a form is a build error. */
export const DISCIPLINE_CREDIT = {
  "Brand DNA": "brand DNA",
  "Brand Identity": "brand identity",
  "Naming": "naming",
  "Visual Identity": "visual identity",
  Packaging: "packaging design",
  "Signage/Wayfinding": "signage and wayfinding",
  Website: "website design",
  "Print & Digital Design": "print and digital",
  Motion: "motion",
  "Digital Design": "digital design",
} as const satisfies Record<Discipline, string>;

/** Sector prose. Acronyms stay capped. Adding a sector without a form is a build error. */
export const SECTOR_CREDIT = {
  "Sports Nutrition": "sports nutrition",
  "FMCG": "FMCG",
  Food: "food",
  Hospitality: "hospitality",
  Photography: "photography",
  Architecture: "architecture",
  "Interior Design": "interior design",
} as const satisfies Record<Sector, string>;

export type ProjectRecord = {
  id: string;
  href: string;
  name: string;
  idea: string;
  year: string;
  src: string;
  srcSet: string;
  width: number;
  height: number;
  crop: string;
  layout: BrowseLayout;
  /** 12-column Visual span from the Projects axis. Index ignores this. */
  visualSpan?: 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /** 1-based column start. Index ignores this. */
  visualStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /** Extra space above a Visual cell, in existing space steps. */
  visualBefore?: 3 | 4 | 5;
  /** Homepage selected-work register. Order among flagged records is catalog order. Max 5 used. */
  homeSelected?: boolean;
  sectors?: Sector[];
  disciplines?: Discipline[];
  collaborators?: CollaboratorId[];
  location?: string;
  /** Press and awards. Display only — not a lens. URL optional. */
  features?: { name: string; url?: string }[];
  /** People who made the work. Display only — not a lens. */
  credits?: string[];
  /**
   * Intentionally unreached. Retained for a future Coming Soon record.
   * Verified by the Stage 2 KOJA probe and the Amendment B build — do not delete.
   * Absent means live.
   */
  status?: "live" | "coming";
  /**
   * Absolute URL; only read when status is "coming".
   * Intentionally unreached. Retained for a future Coming Soon record.
   * Verified by the Stage 2 KOJA probe and the Amendment B build — do not delete.
   */
  external?: string;
};

export function srcSetFor(src: string, widths: number[], intrinsic: number) {
  const ext = src.endsWith(".webp") ? "webp" : src.endsWith(".png") ? "png" : "jpg";
  if (ext !== "jpg" && ext !== "webp") return undefined;
  const base = src.replace(/\.(jpg|webp)$/, "");
  return widths.map((w) => `${base}-p-${w}.${ext} ${w}w`).concat(`${src} ${intrinsic}w`).join(", ");
}

/** Verified from recovered /projects and / home records. */
export const PROJECTS: ProjectRecord[] = [
  {
    id: "sck",
    href: "/projects/sck",
    name: "SCK",
    idea: "Intersecting Realities",
    year: "2026",
    src: "/projects/sck/1.jpg",
    srcSet: srcSetFor("/projects/sck/1.jpg", [], 1080)!,
    width: 1080,
    height: 1350,
    crop: "center 32%",
    layout: "portrait",
    visualSpan: 5,
    visualStart: 8,
    sectors: ["Architecture", "Interior Design"],
    disciplines: ["Brand DNA", "Visual Identity", "Motion", "Digital Design"],
    credits: ["Mark Blackler"],
  },
  {
    id: "sub-3",
    href: "/projects/sub-3",
    name: "SUB:3",
    idea: "Bending Time & Space",
    year: "2025",
    src: "/projects/sub-3/68db9133176e7f02015d4f37_TCCWEB-SUB326.jpg",
    srcSet: srcSetFor("/projects/sub-3/68db9133176e7f02015d4f37_TCCWEB-SUB326.jpg", [500, 800, 1080], 1200)!,
    width: 1200,
    height: 1500,
    crop: "center 18%",
    layout: "portrait",
    visualSpan: 7,
    visualStart: 1,
    homeSelected: true,
    sectors: ["Sports Nutrition", "FMCG"],
    disciplines: ["Brand Identity", "Packaging"],
    collaborators: ["the-colour-club"],
    credits: ["Mark Blackler", "Nick Mitchell"],
  },
  {
    id: "koja",
    href: "/projects/koja",
    name: "KOJA",
    idea: "Unapologetically Good",
    year: "2021",
    src: "/projects/koja/670666ebdd4b35e158f69532_HBWxKOJA-Portfolio4.jpg",
    srcSet: srcSetFor("/projects/koja/670666ebdd4b35e158f69532_HBWxKOJA-Portfolio4.jpg", [500, 800], 1080)!,
    width: 1080,
    height: 1350,
    crop: "center 68%",
    layout: "contained",
    visualSpan: 4,
    visualStart: 9,
    homeSelected: true,
    sectors: ["Food", "FMCG"],
    disciplines: ["Brand DNA", "Visual Identity", "Packaging", "Print & Digital Design"],
    credits: ["Mark Blackler"],
  },
  {
    id: "bar-closed",
    href: "/projects/bar-closed",
    name: "CLOSED",
    idea: "A Smuggler’s House",
    year: "2024",
    src: "/projects/bar-closed/670ca0219bf6bccf429b9e5b_HBWxCLOSED-Portfolio25.jpg",
    srcSet: srcSetFor("/projects/bar-closed/670ca0219bf6bccf429b9e5b_HBWxCLOSED-Portfolio25.jpg", [500, 800], 1080)!,
    width: 1080,
    height: 1350,
    crop: "center 42%",
    layout: "portrait",
    visualSpan: 6,
    visualStart: 4,
    visualBefore: 4,
    homeSelected: true,
    sectors: ["Hospitality"],
    disciplines: [
      "Brand DNA",
      "Naming",
      "Visual Identity",
      "Signage/Wayfinding",
      "Website",
      "Print & Digital Design",
    ],
    features: [
      {
        name: "The Brand Identity",
        url: "https://the-brandidentity.com/project/in-crafting-a-rich-evocative-identity-for-closed-bar-how-by-why-serves-a-lesson-in-worldbuilding",
      },
    ],
    credits: ["Mark Blackler", "Sasha Burger"],
  },
  {
    id: "chris-sisarich",
    href: "/projects/chris-sisarich",
    name: "Chris Sisarich",
    idea: "Beauty Amongst The Mundane",
    year: "2024",
    src: "/projects/chris-sisarich/6663143cb87a78fa3d4c90be_HBWxChrisSisarich-uPortfolio5.jpg",
    srcSet: srcSetFor("/projects/chris-sisarich/6663143cb87a78fa3d4c90be_HBWxChrisSisarich-uPortfolio5.jpg", [500, 800], 1080)!,
    width: 1080,
    height: 1350,
    crop: "center 48%",
    layout: "portrait",
    visualSpan: 7,
    visualStart: 3,
    visualBefore: 3,
    homeSelected: true,
    sectors: ["Photography"],
    disciplines: ["Brand DNA", "Visual Identity", "Website"],
    credits: ["Mark Blackler"],
  },
  {
    id: "our-boy-roy",
    href: "/projects/our-boy-roy",
    name: "Our Boy Roy",
    idea: "The Friendly Neighbour",
    year: "2022",
    src: "/projects/our-boy-roy/66626aa420e92cdf8d975c8b_HBWxOBR-Portfolio3.jpg",
    srcSet: srcSetFor("/projects/our-boy-roy/66626aa420e92cdf8d975c8b_HBWxOBR-Portfolio3.jpg", [500, 800], 1080)!,
    width: 1080,
    height: 1350,
    crop: "center 36%",
    layout: "portrait",
    visualSpan: 5,
    visualStart: 8,
    homeSelected: true,
    sectors: ["Hospitality"],
    disciplines: ["Visual Identity", "Signage/Wayfinding", "Print & Digital Design"],
    collaborators: ["the-colour-club"],
    credits: ["Mark Blackler", "Nick Mitchell"],
  },
  {
    id: "bistro-nido",
    href: "/projects/bistro-nido",
    name: "Bistro Nido",
    idea: "Twice Cooked",
    year: "2023",
    src: "/projects/bistro-nido/68db910da232382c5cf8fa9d_TCCWEB-Portfolio-Bistro-Nido15.jpg",
    srcSet: srcSetFor("/projects/bistro-nido/68db910da232382c5cf8fa9d_TCCWEB-Portfolio-Bistro-Nido15.jpg", [500, 800, 1080], 1200)!,
    width: 1200,
    height: 1500,
    crop: "center 38%",
    layout: "portrait",
    visualSpan: 6,
    visualStart: 2,
    visualBefore: 4,
    sectors: ["Hospitality"],
    disciplines: ["Visual Identity", "Print & Digital Design"],
    collaborators: ["the-colour-club"],
    location: "501 George Street, Sydney",
    credits: ["Mark Blackler", "Nick Mitchell"],
  },
];

/**
 * Drops Coming Soon records from routes and sequence.
 * Intentionally unreached. Retained for a future Coming Soon record.
 * Verified by the Stage 2 KOJA probe and the Amendment B build — do not delete.
 */
export function liveProjects() {
  return PROJECTS.filter((project) => project.status !== "coming");
}

/** Live slugs only. Coming Soon filter is intentionally unreached — see liveProjects. */
export const PROJECT_SLUGS = liveProjects().map((project) => project.id);

export function homePreviewProjects() {
  return liveProjects().slice(0, 5);
}

export function projectById(id: string) {
  return PROJECTS.find((p) => p.id === id) ?? PROJECTS.find((p) => p.id === catalogIdForSlug(id)) ?? PROJECTS[0];
}

function serialAnd(items: string[]) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function sentence(clause: string) {
  return clause.charAt(0).toUpperCase() + clause.slice(1);
}

const COLLABORATORS_BY_ID = Object.fromEntries(COLLABORATORS.map((item) => [item.id, item])) as Record<
  CollaboratorId,
  Collaborator
>;

export function collaboratorById(id: CollaboratorId) {
  return COLLABORATORS_BY_ID[id];
}

export function projectCollaborators(project: ProjectRecord) {
  return (project.collaborators ?? []).map((id) => COLLABORATORS_BY_ID[id]);
}

/** Canonical order from the set. Record order is authoring only. */
export function projectDisciplines(project: ProjectRecord) {
  return DISCIPLINES.filter((item) => project.disciplines?.includes(item));
}

export function projectSectors(project: ProjectRecord) {
  return SECTORS.filter((item) => project.sectors?.includes(item));
}

export function usedDisciplines() {
  return DISCIPLINES.filter((item) => PROJECTS.some((project) => project.disciplines?.includes(item)));
}

export function usedSectors() {
  return SECTORS.filter((item) => PROJECTS.some((project) => project.sectors?.includes(item)));
}

export function usedCollaborators() {
  return COLLABORATORS.filter((item) => PROJECTS.some((project) => project.collaborators?.includes(item.id)));
}

export function isKnownFilter(dim: string, value: string) {
  if (!value || dim === "all") return true;
  if (dim === "year") return PROJECTS.some((project) => project.year === value);
  if (dim === "sector") return (SECTORS as readonly string[]).includes(value);
  if (dim === "discipline") return (DISCIPLINES as readonly string[]).includes(value);
  if (dim === "collaborator") {
    return COLLABORATORS.some((item) => item.name === value || item.id === value);
  }
  return false;
}

/** Derived description for generateMetadata. Uses the discipline and sector maps. */
export function projectDescription(project: ProjectRecord) {
  const idea = project.idea.replace(/\.\s*$/, "");
  const lead = `${project.name} — ${idea}.`;
  const work = serialAnd(projectDisciplines(project).map((item) => DISCIPLINE_CREDIT[item]));
  const sector = serialAnd(projectSectors(project).map((item) => SECTOR_CREDIT[item]));
  if (work && sector) return `${lead} ${sentence(work)} for ${sector}.`;
  if (work) return `${lead} ${sentence(work)}.`;
  if (sector) return `${lead} ${sentence(sector)}.`;
  return lead;
}

export function matchesFilter(project: ProjectRecord, dim: string, value: string) {
  if (!value || dim === "all") return true;
  if (dim === "year") return project.year === value;
  if (dim === "sector") return Boolean(project.sectors?.some((item) => item === value));
  if (dim === "discipline") return Boolean(project.disciplines?.some((item) => item === value));
  if (dim === "collaborator") {
    return projectCollaborators(project).some((item) => item.name === value || item.id === value);
  }
  return true;
}

export function sortProjects(list: ProjectRecord[], sort: string) {
  const next = [...list];
  if (sort === "newest") next.sort((a, b) => b.year.localeCompare(a.year) || a.name.localeCompare(b.name));
  else if (sort === "az") next.sort((a, b) => a.name.localeCompare(b.name));
  return next;
}
