import { catalogIdForSlug } from "@/lib/cms-source";

export { catalogIdForSlug };

/**
 * The one frame a card shows. Resolved on the server and carried on the record
 * so the rail does not need a whole case study per project just to draw six
 * cards — that put every sequence into every page's payload, including pages
 * that show no work at all.
 */
export type Art = {
  type: "image" | "video";
  src: string;
  srcSet?: string;
  video?: string;
  webm?: string;
  width: number;
  height: number;
  crop: string;
};

export type BrowseLayout = "portrait" | "contained" | "landscape" | "wide";

export const DISCIPLINES = [
  "Brand Strategy",
  "Naming",
  "Visual Identity",
  "Packaging",
  "Signage & Wayfinding",
  "Website",
  "Print",
  "Digital Design",
  "Motion",
  // Added with Made by Madelen, which is a launch rather than an identity.
  "Launch Strategy",
  "Content Planning",
  "Social Content",
  "Messaging",
] as const;

export const SECTORS = ["Sports Nutrition", "FMCG", "Food", "Hospitality", "Photography", "Architecture", "Interior Design", "Fashion"] as const;

export const COLLABORATORS = [
  { id: "the-colour-club", name: "The Colour Club", kind: "studio" },
] as const satisfies readonly { id: string; name: string; kind: "studio" | "person" }[];

export type Discipline = (typeof DISCIPLINES)[number];
export type Sector = (typeof SECTORS)[number];
export type Collaborator = (typeof COLLABORATORS)[number];
export type CollaboratorId = Collaborator["id"];

/** Credits prose for each discipline. Adding a discipline without a form is a build error. */
export const DISCIPLINE_CREDIT = {
  "Brand Strategy": "brand DNA",
  "Naming": "naming",
  "Visual Identity": "visual identity",
  Packaging: "packaging design",
  "Signage & Wayfinding": "signage and wayfinding",
  Website: "website design",
  "Print": "print and digital",
  Motion: "motion",
  "Digital Design": "digital design",
  "Launch Strategy": "launch strategy",
  "Content Planning": "content planning",
  "Social Content": "social content",
  Messaging: "messaging",
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
  Fashion: "fashion",
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
  /** Resolved card art, when the server worked it out. */
  cardArt?: Art;
  /** Movement id to use as the card, when the first landscape frame is not the strongest. */
  keyArtId?: string;
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
   * A distinct part of the work made by another studio, and where to find them.
   *
   * Not `credits`, which is the line of names under With and says nothing about
   * who did what — a studio listed there reads as a co-author of the whole
   * thing. Not `collaborators` either: that is the registry of studios a
   * project was made with, it is shown as "with …" on the index row, and the
   * index is no longer part of the site, so anything added to it is a credit
   * nobody can see.
   *
   * This is for the case the other two get wrong: SCK's identity is HBW's, and
   * its website is Tayte's. One row in the facts, labelled with the part and
   * naming who made it, which is the only place on a project page where a
   * credit is both visible and unambiguous. Display only — not a lens.
   */
  partners?: { contribution: string; name: string; url?: string }[];
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
    id: "made-by-madelen",
    href: "/projects/made-by-madelen",
    name: "Made by Madelen",
    idea: "From Making to Moment",
    year: "2026",
    // The first movement, as everywhere else: the card opens into that frame,
    // so the still it shows and the still it flies to have to be one picture.
    // The catalogue card itself is keyArtId below.
    src: "/projects/made-by-madelen/web/01-full-story.jpg",
    srcSet: srcSetFor("/projects/made-by-madelen/web/01-full-story.jpg", [], 1080)!,
    width: 1080,
    height: 1920,
    crop: "center 38%",
    layout: "portrait",
    keyArtId: "m08",
    visualSpan: 5,
    visualStart: 7,
    sectors: ["Fashion"],
    disciplines: ["Launch Strategy", "Content Planning", "Social Content", "Motion", "Messaging"],
    credits: ["Mark Blackler", "Madelen"],
  },
  {
    id: "sck",
    href: "/projects/sck",
    name: "SCK",
    idea: "Intersecting Realities",
    year: "2025",
    src: "/projects/sck/1.jpg",
    srcSet: srcSetFor("/projects/sck/1.jpg", [], 1080)!,
    width: 1296,
    height: 1620,
    crop: "center 32%",
    layout: "portrait",
    keyArtId: "sk09",
    visualSpan: 5,
    visualStart: 8,
    sectors: ["Architecture", "Interior Design"],
    /*
     * No Digital Design. Tayte did the whole site.
     *
     * It sat here while the row beneath credited the website to somebody
     * else, so the facts read as a claim and a correction one line apart.
     * The discipline stays in the vocabulary — KOJA, CLOSED and Our Boy Roy
     * all earn it — it is only untrue of this project.
     */
    disciplines: ["Brand Strategy", "Visual Identity", "Motion"],
    credits: ["Mark Blackler"],
    partners: [{ contribution: "Website", name: "Tayte", url: "https://www.tayte.co/" }],
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
      "Brand Strategy",
      "Naming",
      "Visual Identity",
      "Signage & Wayfinding",
      "Website",
      "Print",
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
    id: "koja",
    href: "/projects/koja",
    name: "KOJA",
    idea: "Unapologetically Good",
    year: "2024",
    src: "/projects/koja/web/07-full-tall.jpg",
    srcSet: srcSetFor("/projects/koja/web/07-full-tall.jpg", [500, 800, 1080], 1350)!,
    width: 1350,
    height: 1688,
    crop: "center 68%",
    layout: "contained",
    visualSpan: 4,
    visualStart: 9,
    homeSelected: true,
    sectors: ["Food", "FMCG"],
    disciplines: ["Brand Strategy", "Visual Identity", "Packaging", "Print", "Digital Design"],
    credits: ["Mark Blackler"],
  },
  {
    id: "sub-3",
    href: "/projects/sub-3",
    name: "SUB:3",
    idea: "Bending Time & Space",
    year: "2025",
    src: "/projects/sub-3/1.jpg",
    srcSet: srcSetFor("/projects/sub-3/1.jpg", [], 1600)!,
    width: 1600,
    height: 2000,
    crop: "center 18%",
    layout: "portrait",
    visualSpan: 7,
    visualStart: 1,
    homeSelected: true,
    sectors: ["Sports Nutrition", "FMCG"],
    disciplines: ["Visual Identity", "Packaging"],
    collaborators: ["the-colour-club"],
    credits: ["Mark Blackler", "Nick Mitchell", "Matt Cherubino", "Teel Studios"],
  },
  {
    id: "chris-sisarich",
    href: "/projects/chris-sisarich",
    name: "Chris Sisarich",
    idea: "Beauty Amongst The Mundane",
    year: "2024",
    src: "/projects/chris-sisarich/web/08-full-tall.jpg",
    srcSet: srcSetFor("/projects/chris-sisarich/web/08-full-tall.jpg", [500, 800, 1080], 1350)!,
    width: 1350,
    height: 1688,
    crop: "center 48%",
    layout: "portrait",
    visualSpan: 7,
    visualStart: 3,
    visualBefore: 3,
    homeSelected: true,
    sectors: ["Photography"],
    disciplines: ["Brand Strategy", "Visual Identity", "Website"],
    credits: ["Mark Blackler"],
  },
  {
    id: "our-boy-roy",
    href: "/projects/our-boy-roy",
    name: "Our Boy Roy",
    idea: "The Friendly Neighbour",
    year: "2022",
    src: "/projects/our-boy-roy/web/08-full-tall.jpg",
    srcSet: srcSetFor("/projects/our-boy-roy/web/08-full-tall.jpg", [500, 800, 1080], 1350)!,
    width: 1334,
    height: 2000,
    crop: "center 36%",
    layout: "portrait",
    visualSpan: 5,
    visualStart: 8,
    homeSelected: true,
    sectors: ["Hospitality"],
    disciplines: ["Visual Identity", "Signage & Wayfinding", "Print"],
    collaborators: ["the-colour-club"],
    credits: ["Mark Blackler", "Nick Mitchell"],
  },
];

/**
 * The live sequence: newest year first, and within a year the order this file
 * lists them in. Sorting here rather than relying on the array's own order
 * means a record added in the wrong place still lands in the right year, and
 * the rail, the routes and next/previous all stay in step.
 *
 * Drops Coming Soon records from routes and sequence.
 * Intentionally unreached. Retained for a future Coming Soon record.
 * Verified by the Stage 2 KOJA probe and the Amendment B build — do not delete.
 */
export function liveProjects() {
  return PROJECTS.filter((project) => project.status !== "coming").sort(
    (a, b) => Number(b.year) - Number(a.year)
  );
}

/** Live slugs only. Coming Soon filter is intentionally unreached — see liveProjects. */
export const PROJECT_SLUGS = liveProjects().map((project) => project.id);


export function projectById(id: string) {
  return PROJECTS.find((p) => p.id === id) ?? PROJECTS.find((p) => p.id === catalogIdForSlug(id)) ?? PROJECTS[0];
}

const COLLABORATORS_BY_ID = Object.fromEntries(COLLABORATORS.map((item) => [item.id, item])) as Record<
  CollaboratorId,
  Collaborator
>;



/** Canonical order from the set. Record order is authoring only. */





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

const PROJECT_DESCRIPTIONS: Record<string, string> = {
  "made-by-madelen":
    "Made by Madelen — From Making to Moment. Launch strategy, content planning, motion and social content for a fashion label going to market.",
  sck: "SCK (Studio Carson Kelly) — Intersecting Realities. Brand strategy, creative direction and visual identity for an architecture and interiors studio.",
  "bar-closed":
    "CLOSED, a Newcastle bar — A Smuggler’s House. Concept, identity, signage and print. The name emerged during the work.",
  koja: "KOJA — Unapologetically Good. Brand strategy, visual identity and packaging for an established food brand.",
  "sub-3": "SUB:3 — Bending Time & Space. Identity, packaging and motion for a new performance nutrition brand.",
  "chris-sisarich":
    "Chris Sisarich — Beauty Amongst The Mundane. Identity and website for a photographer, built to stay behind the pictures.",
  "our-boy-roy":
    "Our Boy Roy — a hospitality identity organised around Roy, a changing character. Visual identity, signage, print and social.",
};

/** Public search description. Authored from approved case-study contribution, not lens lists. */
export function projectDescription(project: ProjectRecord) {
  return PROJECT_DESCRIPTIONS[project.id] ?? `${project.name} — HBW.`;
}


