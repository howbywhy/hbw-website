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
    "KOJA was already established, with products in market and an existing identity.\n\nThe question was what the brand needed to become next.\n\nWhat began as a brand refresh became an opportunity to clarify KOJA’s position, consolidate what made the products different and create a stronger foundation for future packaging, communication and growth.",
  roles: [
    "Brand Strategy",
    "Creative Direction",
    "Visual Identity",
    "Packaging",
    "Brand Guidelines",
  ],
  idea: {
    heading: "The idea",
    body: "Unapologetically Good.\n\nKOJA did not need to behave like another worthy health-food brand.\n\nIts strength was the combination of genuinely better ingredients with products people actually wanted to eat.\n\nThe brand could be healthy without becoming clinical, restrained or apologetic about pleasure.",
  },
  shift: {
    heading: "The shift",
    body: "The work moved KOJA from a collection of good products and messages toward a clearer proposition that could guide decisions across the brand.\n\nRather than treating the refresh as a cosmetic update, positioning, messaging and identity were brought together so future products could feel like extensions of the same idea.",
  },
  system: {
    heading: "The system",
    body: "The resulting Brand Bible brings story, purpose, positioning, messaging and visual identity into one framework.\n\nThat thinking extends through packaging, typography, colour, imagery and communication, creating a system KOJA can continue using as the product range and business evolve.",
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
