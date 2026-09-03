/** SUB:3 seed/verify copy. Public /projects/sub-3 may resolve Sanity via HBW_SUB3_SOURCE. */

export const SUB3_DOCUMENT_ID = "project-sub3";

export const SUB3_IDENTITY = {
  title: "SUB:3",
  slug: "sub-3",
  proposition: "Bending Time & Space",
  year: "2025",
  sectors: ["Sports Nutrition", "FMCG"],
  disciplines: ["Brand Identity", "Packaging"],
  portfolioOrder: 2,
  editorialPurpose: "Concept / Expression",
  contributionNotes:
    "New brand. The name SUB:3 already existed; Mark wrote Bending Time & Space as the organising idea. Mark created identity, packaging, and motion, and directed that identity work. He did not do Brand DNA, naming, or photography. Nick provided direction/review and handled the client relationship; the identity became convincing once Mark demonstrated how it flexed rather than as a static mark. That development history is not public copy. Studio context: Developed while working with The Colour Club. No photographer name is evidenced in-repo. No Outcome evidenced.",
  replacementPriority: 2,
};

export const SUB3_COPY = {
  context:
    "SUB:3 was a new performance nutrition brand with its name already in place. The task was to create the identity and packaging for its launch.",
  roles: ["Creative Direction", "Visual Identity", "Packaging", "Motion"],
  workingContext: "Developed while working with The Colour Club.",
  idea: {
    heading: "The idea",
    body: "Bending Time & Space. SUB:3 takes its name from the pursuit of a sub-three-hour marathon — a goal defined by time. That became the organising idea for the identity: time not simply as information, but as something runners are constantly trying to compress, stretch and overcome.",
  },
  shift: {
    heading: "The shift",
    body: "The identity became stronger when it stopped behaving like a fixed graphic and started behaving like the idea itself. Type stretches, compresses and reforms; time becomes an active part of the brand rather than something simply recorded beside it.",
  },
  system: {
    heading: "The system",
    body: "The idea moves through the system: changing typography, timecode lock-ups, packaging built around moments before and after the run, reflective material and motion that continually forms and reforms. The same principle gives static and moving applications a shared behaviour.",
  },
};

export type Sub3SeedMovement = {
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
};

export const SUB3_MOVEMENTS: Sub3SeedMovement[] = [
  {
    key: "s301",
    mediaType: "still",
    still: "public/projects/sub-3/68db9133176e7f02015d4f37_TCCWEB-SUB326.jpg",
    alt: "Runner in a black SUB:3 shirt checking a watch on a weathered concrete path.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s302",
    mediaType: "film",
    video: "public/projects/sub-3/web/SUB3-Type-Stretch-Texture.mp4",
    poster: "public/projects/sub-3/web/SUB3-Type-Stretch-Texture.jpg",
    webm: "public/projects/sub-3/web/SUB3-Type-Stretch-Texture.webm",
    alt: "Angular SUB:3 lettering stretching and compressing on black.",
    scale: "detail",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s303",
    mediaType: "still",
    still: "public/projects/sub-3/68db91322535abe236944c80_TCCWEB-SUB320.jpg",
    alt: "Glowing POST-RUN pouch held against a grainy magenta field.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s304",
    mediaType: "still",
    still: "public/projects/sub-3/68db91587ee646ac94cfb67c_TCCWEBR2-SUB34.jpg",
    alt: "RUN lettering stretched and compressed in dark grey on white, some inverted.",
    scale: "detail",
    pace: "normal",
    relation: "pair",
    infoHint: "shift",
  },
  {
    key: "s307",
    mediaType: "still",
    still: "public/projects/sub-3/68db91580180acf841f7384e_TCCWEBR2-SUB36.jpg",
    alt: "02:59:99 SUB:3 (RUNNERS CLUB) lockup with a JOIN THE SRC button, stacked twice.",
    scale: "detail",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s305",
    mediaType: "still",
    still: "public/projects/sub-3/68db9158900d1a9e6ac94934_TCCWEBR2-SUB33.jpg",
    alt: "City list from Sydney to London beside a sunset runner card.",
    scale: "standard",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s306",
    mediaType: "still",
    still: "public/projects/sub-3/68db91351d50093ee5b0a02f_TCCWEB-SUB330.jpg",
    alt: "PRE-RUN pouch on asphalt among a tattooed leg, gloved hand, and running shoe.",
    scale: "standard",
    pace: "normal",
    relation: "pair",
    infoHint: "system",
  },
  {
    key: "s309",
    mediaType: "still",
    still: "public/projects/sub-3/68db91315cea177d71b89b3a_TCCWEB-SUB315.jpg",
    alt: "PRE-RUN pouch smeared by vertical motion on white.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s308",
    mediaType: "still",
    still: "public/projects/sub-3/68db912f0180acf841f72984_TCCWEB-SUB35.jpg",
    alt: "Person standing still while motion-blurred runners streak past, crossed by a red type line.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s310",
    mediaType: "film",
    video: "public/projects/sub-3/web/SUB3-SKUBAR-Type-Count.mp4",
    poster: "public/projects/sub-3/web/SUB3-SKUBAR-Type-Count.jpg",
    webm: "public/projects/sub-3/web/SUB3-SKUBAR-Type-Count.webm",
    alt: "Geometric elapsed-time numerals counting on a pale field.",
    scale: "detail",
    pace: "normal",
    relation: "pair",
    infoHint: "system",
  },
  {
    key: "s311",
    mediaType: "film",
    video: "public/projects/sub-3/web/SUB3-PackGIF.mp4",
    poster: "public/projects/sub-3/web/SUB3-PackGIF.jpg",
    webm: "public/projects/sub-3/web/SUB3-PackGIF.webm",
    alt: "POST-RUN pouch dieline turning through front, back, and gusset panels.",
    scale: "detail",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s312",
    mediaType: "still",
    still: "public/projects/sub-3/69d625ecd5d798ae10301e45_SUB3-BG-1080x1350px.jpg",
    alt: "Grainy dark radial spiral from a central void.",
    scale: "standard",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
];
