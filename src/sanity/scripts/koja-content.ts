/** KOJA seed/verify copy. Public /projects/koja may resolve Sanity via HBW_KOJA_SOURCE. */

export const KOJA_DOCUMENT_ID = "project-koja";

export const KOJA_IDENTITY = {
  title: "KOJA",
  slug: "koja",
  proposition: "Unapologetically Good",
  year: "2021",
  sectors: ["Food", "FMCG"],
  disciplines: ["Brand DNA", "Visual Identity", "Packaging", "Print & Digital Design"],
  portfolioOrder: 3,
  editorialPurpose: "Definition / Stewardship",
  contributionNotes:
    "Mark led strategy and creative direction. Original documents carried Electric And Analog branding from the studio context at the time; the client later continued working directly with Mark. Historic guideline language included Make Healthy Simple — that is not the same line as Unapologetically Good, and they are not treated as one evolving slogan. Later retail presence (Woolworths, Coles, Ampol) and range expansion are subsequent brand evolution, not claimed as a result of this work. HBW did not invent the business.",
  replacementPriority: 6,
};

export const KOJA_COPY = {
  context:
    "KOJA was already an operating food brand — name, products, packaging, and customers in place. The work was a refresh: the identity needed a clearer definition, and a stronger foundation for what came next.",
  roles: [
    "Brand DNA",
    "Creative Direction",
    "Visual Identity",
    "Packaging",
    "Print",
    "Digital Design",
    "Brand Stewardship",
  ],
  idea: {
    heading: "The idea",
    body: "Unapologetically Good. Good food doesn’t need dressing up. It just needs to be good — a stance the identity and packaging could hold without explanation.",
  },
  shift: {
    heading: "The shift",
    body: "The brand already existed. What it needed was not a new name or a new business, but a clearer proposition and a more coherent system — one that could carry the next stage of the range.",
  },
  system: {
    heading: "The system",
    body: "The idea set a direct visual language: a logotype with a slight grin, warm colour that reads as food rather than clinic, ingredient-led illustration, and packaging that repeats across formats. A Brand Bible held the strategy, mark, system, and guidance so later products could stay in the same voice.",
  },
};

export type KojaSeedMovement = {
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

export const KOJA_MOVEMENTS: KojaSeedMovement[] = [
  {
    key: "k01",
    mediaType: "still",
    still: "public/projects/koja/670666ebdd4b35e158f69532_HBWxKOJA-Portfolio4.jpg",
    alt: "Bright green KOJA tape sealing stacked cardboard boxes.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "k02",
    mediaType: "film",
    video: "public/projects/koja/web/KOJA-Peanut-Fudge.mp4",
    poster: "public/projects/koja/web/KOJA-Peanut-Fudge.jpg",
    webm: "public/projects/koja/web/KOJA-Peanut-Fudge.webm",
    alt: "Peanut Fudge plant-protein bar on a cork coaster beside palo santo.",
    scale: "detail",
    pace: "normal",
    relation: "single",
  },
  {
    key: "k03",
    mediaType: "film",
    video: "public/projects/koja/web/KOJA-Logo.mp4",
    poster: "public/projects/koja/web/KOJA-Logo.jpg",
    alt: "Off-white K letter moving on a green field.",
    scale: "major",
    pace: "pause",
    relation: "single",
  },
  {
    key: "k04",
    mediaType: "still",
    still: "public/projects/koja/68fb10b7f3a747a3e36c24a0_KOJA_May2023_60.webp",
    alt: "Person carrying a KOJA carton across a brick patio.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "k05",
    mediaType: "film",
    video: "public/projects/koja/web/KOJA-BickieBites.mp4",
    poster: "public/projects/koja/web/KOJA-BickieBites.jpg",
    alt: "Choc Brownie Bickie Bites pouch against a grainy brownie-textured ground.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "k06",
    mediaType: "film",
    video: "public/projects/koja/web/KOJA-Oat-Bites.mp4",
    poster: "public/projects/koja/web/KOJA-Oat-Bites.jpg",
    alt: "Orange Oat Bites carton at an angle on a black-and-white textured ground.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "k07",
    mediaType: "film",
    video: "public/projects/koja/web/KOJA-Oat-Bites-Dielines.mp4",
    poster: "public/projects/koja/web/KOJA-Oat-Bites-Dielines.jpg",
    webm: "public/projects/koja/web/KOJA-Oat-Bites-Dielines.webm",
    alt: "Raspberry Choc Chip Oat Bites carton unfolding through dieline panels.",
    scale: "detail",
    pace: "normal",
    relation: "single",
  },
  {
    key: "k08",
    mediaType: "still",
    still: "public/projects/koja/692697b8f9541bb2a997169b_HBWKOJA1125-Portfolio8.jpg",
    alt: "Gluten Free, Australian Made, and Plant Based marks on green.",
    scale: "standard",
    pace: "pause",
    relation: "single",
  },
];
