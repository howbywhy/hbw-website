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
  webm?: string;
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
    mediaType: "film",
    video: "public/projects/bar-closed/web/HBWxCLOSED-Portfolio-01.mp4",
    poster: "public/projects/bar-closed/HBWxCLOSED-Portfolio-01.jpg",
    webm: "public/projects/bar-closed/web/HBWxCLOSED-Portfolio-01.webm",
    alt: "Torn-paper collage of happy-hour type, bottle silhouettes, a bar photo, and plated food.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "c02",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-02.jpg",
    alt: "CLOSED wordmark in black geometric sans-serif on white.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c03",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-03.jpg",
    alt: "Dining table with CLOSED ware, steak, and seafood against a green booth.",
    scale: "major",
    pace: "pause",
    relation: "single",
  },
  {
    key: "c04",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-04.jpg",
    alt: "Orange type on brown reading CLOSED UNTIL WE'RE NOT.",
    scale: "standard",
    pace: "tight",
    relation: "pair",
  },
  {
    key: "c05",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-05.jpg",
    alt: "Black jagged vertical forms on textured white with numbered CLOSED.BAR lettering.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c06",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-06.jpg",
    alt: "CLOSED business cards on a plate of roasted potatoes.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c07",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-07.jpg",
    alt: "Tomato print card in a clear pouch with an orange zip, reading CURATED FOOD MADE IN NEWCASTLE.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c08",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-08.jpg",
    alt: "Hand holding a CLOSED wine glass over a scalloped CLOSED coaster.",
    scale: "detail",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "c09",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-09.jpg",
    alt: "Orange CLOSED alphabet specimen on brown with a 17 Beaumont Street stamp.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c10",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-010.jpg",
    alt: "CLOSED menu card over a scallop shell on river stones.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c11",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-011.jpg",
    alt: "Two plates of tomato toast, one under jagged black stripes and one under a faint CLOSED sheet.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c12",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-012.jpg",
    alt: "Orange CLOSED lockup over a grainy vegetable still, reading Local, Friendly, & Consistent.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c13",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-013.jpg",
    alt: "Orange-and-brown halftone of tomatoes on the vine.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "c14",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-014.jpg",
    alt: "Technical drawing of a wall-mounted TOILETS sign with dimensions.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c15",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-015.jpg",
    alt: "Dim dining alcove with spherical sconces and a TOILETS sign over the doorway.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c16",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-017.jpg",
    alt: "Four people in plum CLOSED T-shirts against a red wall.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c17",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-018.jpg",
    alt: "Two guests toasting at a small table in front of a red-and-black mural.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c18",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-019.jpg",
    alt: "Street billboard under a railway bridge with torn CLOSED panels of flowers, address, food, and tomatoes.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c19",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-020.jpg",
    alt: "Dining table with CLOSED ware and wine against a green booth and patterned wallpaper.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c20",
    mediaType: "film",
    video: "public/projects/bar-closed/web/HBWxCLOSED-Portfolio-021.mp4",
    poster: "public/projects/bar-closed/HBWxCLOSED-Portfolio-021.jpg",
    webm: "public/projects/bar-closed/web/HBWxCLOSED-Portfolio-021.webm",
    alt: "Three CLOSED_BAR Instagram stories: a branded wine glass, white eyes, and a cocktail collage.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c21",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-022.jpg",
    alt: "Guest smiling over CLOSED plates and wine in a green booth.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "c22",
    mediaType: "still",
    still: "public/projects/bar-closed/HBWxCLOSED-Portfolio-023.jpg",
    alt: "Wheat-pasted Saturday posters and a central eyes sheet on a plywood hoarding.",
    scale: "standard",
    pace: "pause",
    relation: "single",
  },
];
