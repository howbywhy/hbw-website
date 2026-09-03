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
    "Brand strategy, creative direction, visual identity, signage, print and digital design. CLOSED emerged from the concept process and was subsequently adopted — it was not a naming commission. Patternshop (Rebecca Whan + Afifa Intanjudin) did the interior and architecture. Stanley House Studio photographed. Jordan Lucky / Playstate painted the mural. Developed while working with The Colour Club. HBW did not design the interior or architecture. No Outcome.",
  replacementPriority: 7,
};

export const CLOSED_COPY = {
  context:
    "CLOSED began as a new bar in Newcastle.\n\nThe venue and architects were already in place, but there was no name, concept or broader idea connecting what the place could become.\n\nThe initial conversation was about creating a brand. The work revealed that the venue first needed something more fundamental: an idea people could build around.",
  roles: [
    "Brand Strategy",
    "Creative Direction",
    "Visual Identity",
    "Signage & Wayfinding",
    "Print",
    "Digital Design",
  ],
  workingContext: "Developed while working with The Colour Club.",
  collaborators: [
    { name: "Jordan Lucky / Playstate", contribution: "Mural" },
    { name: "Rebecca Whan + Afifa Intanjudin / Patternshop", contribution: "Interior & Architecture" },
    { name: "Stanley House Studio", contribution: "Photography" },
  ],
  idea: {
    heading: "The idea",
    body: "A Smuggler’s House.\n\nNewcastle’s history of steelworks, docks, the sea and old trade routes became the starting point for an imagined house filled with things accumulated from elsewhere.\n\nCLOSED emerged during that process.\n\nWhat began as an example of how the concept might be expressed became the name of the venue itself.",
  },
  shift: {
    heading: "The shift",
    body: "Instead of designing an identity and then applying it to a bar, the central idea gave the venue a world to inhabit.\n\nCLOSED could be elusive, welcoming and slightly illicit at once — a place that felt discovered rather than announced.\n\nThe identity became one part of a larger experience rather than the thing expected to carry all of its meaning.",
  },
  system: {
    heading: "The system",
    body: "The world of A Smuggler’s House extends through the identity, cut-out menus, Raw / Rotten / Loud language, signage, photography direction, print, digital applications and details within the physical venue.\n\nEach expression feels like another object, message or fragment belonging to the same place, allowing the idea to remain coherent without requiring every application to look the same.",
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
