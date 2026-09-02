/** CLOSED seed/verify copy. Public /projects/bar-closed stays on local experiences.ts. */

export const CLOSED_DOCUMENT_ID = "project-closed";

export const CLOSED_IDENTITY = {
  title: "CLOSED",
  slug: "closed",
  proposition: "A Smuggler’s House",
  year: "2024",
  location: "Newcastle",
  sectors: ["Hospitality"],
  disciplines: [
    "Brand DNA",
    "Naming",
    "Visual Identity",
    "Signage/Wayfinding",
    "Website",
    "Print & Digital Design",
  ],
  portfolioOrder: 4,
  editorialPurpose: "Idea / Experience",
  contributionNotes:
    "Brand DNA, naming contribution, creative direction, visual identity, photography shot list and direction, exterior and interior signage, menus, print, and some digital including the website. Architects were already engaged. HBW did not design the interior.",
  replacementPriority: 7,
};

export const CLOSED_COPY = {
  context:
    "A new Newcastle bar. The founders had a venue and architects already engaged, but no name, no concept, and no plan beyond a request for a logo and brand.",
  roles: [
    "Brand DNA",
    "Naming",
    "Creative Direction",
    "Visual Identity",
    "Signage & Wayfinding",
    "Photography Direction",
    "Print",
    "Website",
  ],
  workingContext: "Architectural design was already underway when HBW joined the project.",
  collaborators: [
    { name: "Jordan Lucky / Playstate", contribution: "Mural" },
    { name: "Stanley House Studio", contribution: "Photography" },
  ],
  idea: {
    heading: "The idea",
    body: "A Smuggler’s House. The idea drew Newcastle’s steel and dockside history into an elusive gathering place — found objects, in-the-know belonging, and a room that felt closed until you were inside it.",
  },
  shift: {
    heading: "The shift",
    body: "The request was for a logo and brand. What the venue needed first was a central idea capable of organising both identity and experience. The name CLOSED appeared during that strategic work, not as a commissioned naming brief.",
  },
  system: {
    heading: "The system",
    body: "The idea set the language: punk cut-out menus — Raw, Rotten, Loud — torn-edge print, exterior and interior signage, photography direction, and digital. Brand expression moved into the venue through those touchpoints; it did not design the interior.",
  },
};

export type ClosedSeedMovement = {
  key: string;
  mediaType: "still" | "film";
  still?: string;
  video?: string;
  poster?: string;
  alt: string;
  scale: "major" | "standard" | "detail";
  pace: "tight" | "normal" | "pause";
  relation: "single" | "pair";
  infoHint?: "idea" | "shift" | "system";
  cover?: true;
};

export const CLOSED_MOVEMENTS: ClosedSeedMovement[] = [
  {
    key: "c01",
    mediaType: "still",
    still: "public/projects/bar-closed/670ca0219bf6bccf429b9e5b_HBWxCLOSED-Portfolio25.jpg",
    alt: "Dining table with a CLOSED branded plate among plated dishes and wine.",
    scale: "standard",
    pace: "normal",
    relation: "pair",
    infoHint: "idea",
  },
  {
    key: "c02",
    mediaType: "still",
    still: "public/projects/bar-closed/670ca02120d4b38fdbb6bf49_HBWxCLOSED-Portfolio26.jpg",
    alt: "High-contrast halftone of a crane boom and pulley on black.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c03",
    mediaType: "still",
    still: "public/projects/bar-closed/670ca02123deffa7009a157f_HBWxCLOSED-Portfolio33.jpg",
    alt: "CLOSED dining table beside a torn-edge industrial smoke graphic.",
    scale: "major",
    pace: "pause",
    relation: "single",
  },
  {
    key: "c04",
    mediaType: "film",
    video: "public/projects/bar-closed/web/CLOSED-Eyes.mp4",
    poster: "public/projects/bar-closed/web/CLOSED-Eyes.jpg",
    alt: "Two white eyes in a rough black bar on white.",
    scale: "detail",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
    cover: true,
  },
  {
    key: "c05",
    mediaType: "still",
    still: "public/projects/bar-closed/670ca0217374160efd5b3ba4_HBWxCLOSED-Portfolio17.jpg",
    alt: "Person in a green apron harvesting herbs into a steel bowl.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c06",
    mediaType: "still",
    still: "public/projects/bar-closed/670ca0214458519e4d903743_HBWxCLOSED-Portfolio31.jpg",
    alt: "Dining table with CLOSED ware, steak, and seafood against a green booth.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "c07",
    mediaType: "still",
    still: "public/projects/bar-closed/670ca0219b68e610dbf64663_HBWxCLOSED-Portfolio19.jpg",
    alt: "Ironheart Shiraz bottle beside a CLOSED glass of red wine.",
    scale: "detail",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c08",
    mediaType: "film",
    video: "public/projects/bar-closed/web/CLOSED-Collage.mp4",
    poster: "public/projects/bar-closed/web/CLOSED-Collage.jpg",
    alt: "Torn-paper collage of cocktail card, potatoes, bar photo, and CLOSED coaster.",
    scale: "standard",
    pace: "pause",
    relation: "single",
  },
  {
    key: "c09",
    mediaType: "still",
    still: "public/projects/bar-closed/670ca0214e0b67cd2aeafe2e_HBWxCLOSED-Portfolio35.jpg",
    alt: "Grainy flower still life overlaid with orange blocks reading THE REBELLIOUS SPIRIT OF PUNK CULTURE.",
    scale: "standard",
    pace: "pause",
    relation: "single",
  },
];
