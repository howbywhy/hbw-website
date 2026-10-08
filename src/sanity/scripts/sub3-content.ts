/** SUB:3 seed/verify copy. Public /projects/sub-3 may resolve Sanity via HBW_SUB3_SOURCE. */

export const SUB3_DOCUMENT_ID = "project-sub3";

export const SUB3_IDENTITY = {
  title: "SUB:3",
  slug: "sub-3",
  proposition: "Bending Time & Space",
  year: "2025",
  sectors: ["Sports Nutrition", "FMCG"],
  disciplines: ["Visual Identity", "Packaging"],
  portfolioOrder: 2,
  editorialPurpose: "Concept / Expression",
  contributionNotes:
    "New brand. The name SUB:3 already existed; Mark wrote Bending Time & Space as the organising idea. Mark created identity, packaging, and motion, and directed that identity work. He did not do Brand DNA, naming, or photography; photography is by Matt Cherubino and Teel Studios. Nick provided direction/review and handled the client relationship; the identity became convincing once Mark demonstrated how it flexed rather than as a static mark. That development history is not public copy. Studio context: Developed while working with The Colour Club. No Outcome evidenced.",
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
  narrow?: true;
};

export const SUB3_MOVEMENTS: Sub3SeedMovement[] = [
  {
    key: "s301",
    mediaType: "still",
    still: "public/projects/sub-3/1.jpg",
    alt: "A runner in a black SUB:3 tee on a worn road, checking the watch on their wrist.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s302",
    mediaType: "film",
    video: "public/projects/sub-3/web/2.mp4",
    poster: "public/projects/sub-3/web/2.jpg",
    alt: "SUB:3 ® RUNNING resolving in white type on black.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s303",
    mediaType: "still",
    still: "public/projects/sub-3/3.jpg",
    alt: "A PRE-RUN pouch reading 00:00:00 SUB:3, lit against a pink and white gradient.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s304",
    mediaType: "film",
    video: "public/projects/sub-3/web/4.mp4",
    poster: "public/projects/sub-3/web/4.jpg",
    alt: "A timecode counting across the frame at 01:33:14, over SUB:3 ® RUN TECH.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s305",
    mediaType: "still",
    still: "public/projects/sub-3/5.jpg",
    alt: "A POST-RUN pouch reading 02:59:59 SUB:3, lit against a pink and white gradient.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s306",
    mediaType: "still",
    still: "public/projects/sub-3/6.jpg",
    alt: "A runner crossing a causeway at dusk, water and sky washed magenta.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s307",
    mediaType: "film",
    video: "public/projects/sub-3/web/7.mp4",
    poster: "public/projects/sub-3/web/7.jpg",
    alt: "The typeface stepping through its alphabet in white on black.",
    scale: "detail",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s308",
    mediaType: "still",
    still: "public/projects/sub-3/8.jpg",
    alt: "A hand holding the POST-RUN pouch up against a pink and violet sky.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s309",
    mediaType: "still",
    still: "public/projects/sub-3/9.jpg",
    alt: "High-contrast black and white: a hand gripping the pouch against a flaring sun.",
    scale: "detail",
    pace: "tight",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s310",
    mediaType: "still",
    still: "public/projects/sub-3/10.jpg",
    alt: "Two specification cards — PRE-RUN. RITUAL. SIMPLIFIED. and POST-RUN. RECOVER. REPEAT. — listing sodium, caffeine, whey isolate and electrolytes.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s311",
    mediaType: "film",
    video: "public/projects/sub-3/web/11.mp4",
    poster: "public/projects/sub-3/web/11.jpg",
    alt: "NIGHT RUN — a runner alone on a floodlit track after dark.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
    narrow: true,
  },
  {
    key: "s312",
    mediaType: "still",
    still: "public/projects/sub-3/12.jpg",
    alt: "RUN set four times across a cream field, the word stretching and reversing.",
    scale: "detail",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s313",
    mediaType: "still",
    still: "public/projects/sub-3/13.png",
    alt: "A dense grid of SUB:3 lock-ups repeating across the frame.",
    scale: "detail",
    pace: "tight",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s314",
    mediaType: "still",
    still: "public/projects/sub-3/14.jpg",
    alt: "Two hands passing a glowing pouch between them under blue and violet light.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s315",
    mediaType: "film",
    video: "public/projects/sub-3/web/15.mp4",
    poster: "public/projects/sub-3/web/15.jpg",
    alt: "BENDING TIME & repeating down the frame, the type tearing and reforming.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
    narrow: true,
  },
  {
    key: "s316",
    mediaType: "still",
    still: "public/projects/sub-3/16.jpg",
    alt: "A runner's legs mid-stride on an open road, the landscape cool and blue behind.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s317",
    mediaType: "still",
    still: "public/projects/sub-3/17.jpg",
    alt: "A PRE-RUN pouch suspended in darkness, catching a hard flare of light.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s318",
    mediaType: "still",
    still: "public/projects/sub-3/18.jpg",
    alt: "(SRC) : SYDNEY, CHICAGO, NEW YORK, LONDON ranged beside a small monochrome horizon.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s319",
    mediaType: "still",
    still: "public/projects/sub-3/19.png",
    alt: "Heavy black-and-white grain over a figure, with SUB:3 ® RUNNING across the frame.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
];
