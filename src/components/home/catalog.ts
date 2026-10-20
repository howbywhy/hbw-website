import { catalogIdForSlug } from "@/lib/cms-source";
import { cdnSrcSet, srcSetFor } from "@/lib/srcset";
import { REGISTERED_PROJECTS } from "@/lib/projects.generated";
import { lookFor, routeFor } from "@/lib/project-look";
import { STUDIO_CLAUSE, STUDIO_SIGNATURE } from "@/lib/site-meta";

export { srcSetFor };

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

/**
 * The same disciplines, short enough for a title.
 *
 * DISCIPLINE_CREDIT above is prose for a sentence — "brand DNA", "signage and
 * wayfinding" — which is right in a credit and too long in a search result.
 * Adding a discipline without a short form is a build error, so a title can
 * never quietly lose the thing the project was.
 */
export const TITLE_WHAT = {
  "Brand Strategy": "brand strategy",
  "Naming": "naming",
  "Visual Identity": "visual identity",
  Packaging: "packaging",
  "Signage & Wayfinding": "signage",
  Website: "website",
  "Print": "print",
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


/**
 * Every project, built from what the CMS has and how we have chosen to show it.
 *
 * This was a list kept by hand — seven records of twenty-odd fields each,
 * restating the name, the year, the sectors and the disciplines that the CMS
 * already held, and drifting from them whenever one was edited and the other
 * was not. It is derived now: the facts come from the registry, which is
 * written straight out of the CMS, and the judgements come from the look,
 * which is the only part that was ever a decision rather than a record.
 *
 * Which means a project no longer has to be typed out to exist. Publish it
 * with a preview and a sequence, let the registry be written, and it is
 * here — carded with its own preview, cropped centrally, laid out in the
 * order the CMS gives. Give it a look when the default is not good enough,
 * which it usually will not be, but not before it is on the site.
 */
export const PROJECTS: ProjectRecord[] = REGISTERED_PROJECTS.map((project) => {
  const look = lookFor(project.slug);
  const id = routeFor(project.slug);
  /*
   * A card by hand, or the project's own preview.
   *
   * The seven that were here first each name a still chosen over months —
   * rarely the first frame, because the frame that opens a sequence and the
   * frame that sells it are different jobs. A project without that choice
   * made for it shows the preview it was published with, which is the one
   * picture it is certain to have.
   */
  const card = look.src
    ? { src: look.src, srcSet: look.srcSet ?? "", width: look.width, height: look.height }
    : project.card
      ? {
          src: project.card.src,
          srcSet: cdnSrcSet(project.card.src, project.card.width),
          width: project.card.width,
          height: project.card.height,
        }
      : null;
  if (!card?.src || !card.width || !card.height) {
    throw new Error(
      `${project.slug} has neither a card in project-look.ts nor a preview in the CMS, so there is nothing to show it with.`
    );
  }
  return {
    id,
    href: `/projects/${id}`,
    name: project.name,
    idea: project.idea,
    year: project.year,
    src: card.src,
    srcSet: card.srcSet,
    width: card.width,
    height: card.height,
    sectors: project.sectors.filter((one): one is Sector =>
      (SECTORS as readonly string[]).includes(one)
    ),
    disciplines: project.disciplines.filter((one): one is Discipline =>
      (DISCIPLINES as readonly string[]).includes(one)
    ),
    /*
     * The crop and the layout always have an answer, because a card cannot
     * be drawn without one. The middle of the picture and a portrait cell
     * are what a frame gets when nobody has looked at it yet — right often
     * enough to put a project on the site, and the first two things worth
     * changing once it is there.
     */
    crop: look.crop ?? "center",
    layout: look.layout ?? "portrait",
    /* The rest are decisions rather than facts, so they only appear where
       somebody has made one. */
    ...(look.keyArtId ? { keyArtId: look.keyArtId } : {}),
    ...(look.visualSpan ? { visualSpan: look.visualSpan } : {}),
    ...(look.visualStart ? { visualStart: look.visualStart } : {}),
    ...(look.visualBefore ? { visualBefore: look.visualBefore } : {}),
    ...(look.homeSelected ? { homeSelected: look.homeSelected } : {}),
    ...(look.collaborators ? { collaborators: look.collaborators } : {}),
    ...(look.credits ? { credits: look.credits } : {}),
    ...(look.partners ? { partners: look.partners } : {}),
    ...(look.features ? { features: look.features } : {}),
    ...(look.location ? { location: look.location } : {}),
    ...(look.status ? { status: look.status } : {}),
  };
});

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

/*
 * Trimmed so the studio and its place still fit.
 *
 * Google shows about 155 characters and every one of these ended before
 * saying where the work was made — so eight of the nine descriptions on the
 * site named a discipline and a sector and never named a city. The clause
 * goes on in projectDescription rather than being typed into each line, so a
 * project added to the registry tomorrow gets it without this file being
 * opened; these lines are shortened to leave room for it.
 */
const PROJECT_DESCRIPTIONS: Record<string, string> = {
  "made-by-madelen":
    "Made by Madelen — From Making to Moment. Launch strategy, content planning, motion and social content for a fashion label.",
  sck: "SCK (Studio Carson Kelly) — Intersecting Realities. Brand strategy, creative direction and visual identity for an architecture studio.",
  "bar-closed":
    "CLOSED, a Newcastle bar — A Smuggler’s House. Concept, identity, signage and print. The name emerged in the work.",
  koja: "KOJA — Unapologetically Good. Brand strategy, visual identity and packaging for an established food brand.",
  "sub-3": "SUB:3 — Bending Time & Space. Identity, packaging and motion for a new performance nutrition brand.",
  "chris-sisarich":
    "Chris Sisarich — Beauty Amongst The Mundane. Identity and website for a photographer, built to stay behind the pictures.",
  "our-boy-roy":
    "Our Boy Roy — a hospitality identity built around Roy, a changing character. Visual identity, signage and print.",
};

/** Public search description. Authored from approved case-study contribution, not lens lists. */
export function projectDescription(project: ProjectRecord) {
  return `${projectSays(project)} ${STUDIO_CLAUSE}`;
}

/**
 * The same line, as it is read on the page.
 *
 * projectDescription ends with the studio and its place, which is there for a
 * search result and is noise in front of somebody already on the site — the
 * catalogue prints this line under every project, and for one build it read
 * "...for a fashion label. HBW, Blue Mountains." to a reader who could see the
 * mark at the top of the page. One sentence, two jobs, two forms.
 */
export function projectSays(project: ProjectRecord) {
  return PROJECT_DESCRIPTIONS[project.id] ?? `${project.name}.`;
}

/**
 * What a project was, in two words, for its title.
 *
 * Built from the disciplines the CMS already holds rather than written out
 * again, so a project added to the registry has a title that says what it is
 * without anybody choosing one. Two disciplines where they fit and one where
 * they do not: a title runs to about 65 characters in a search result, and
 * Chris Sisarich and Made by Madelen are long enough names to spend it.
 */
export function projectWhat(project: ProjectRecord) {
  const said = (project.disciplines ?? []).map((one) => TITLE_WHAT[one]).filter(Boolean);
  if (!said.length) return "";
  const both = said.slice(0, 2).join(" and ");
  const long = `${project.name} — ${both} — ${STUDIO_SIGNATURE}`;
  const phrase = long.length <= 65 ? both : said[0];
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

/** A project's full search title: what it is, what it was, and where it was made. */
export function projectTitle(project: ProjectRecord) {
  const what = projectWhat(project);
  return what
    ? `${project.name} — ${what} — ${STUDIO_SIGNATURE}`
    : `${project.name} — ${STUDIO_SIGNATURE}`;
}


