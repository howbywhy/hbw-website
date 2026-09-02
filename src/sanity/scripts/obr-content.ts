/** OBR seed/verify copy. Public /projects/our-boy-roy may resolve Sanity via HBW_OBR_SOURCE. */

export const OBR_DOCUMENT_ID = "project-our-boy-roy";

export const OBR_IDENTITY = {
  title: "Our Boy Roy",
  slug: "our-boy-roy",
  proposition: "The Friendly Neighbour",
  year: "2022",
  sectors: ["Hospitality"],
  disciplines: ["Visual Identity", "Signage/Wayfinding", "Print & Digital Design"],
  portfolioOrder: 6,
  editorialPurpose: "Character / World",
  contributionNotes:
    "New hospitality business. The name OUR BOY ROY already existed; the initial ask was a logo and a brand. Mark created Roy from scratch and directed the identity work: visual identity, illustration, signage, menus, social, print, packaging, and some motion. He did not do Brand DNA, formal brand strategy, or naming. Illustration is authorship, not a schema role token — it sits inside Visual Identity. Digital Design here means social and campaign applications, not a website. Nick provided review/direction and client handling; that is not public With. Studio context: Developed while working with The Colour Club. No named photographer, fabricator, architect, or interior designer is evidenced in-repo. HBW applied identity to the venue; do not claim interior design. Socks and press are Mark's evidence only and are not in the shipped sequence. Outcome omitted: longevity, repeat trade, and 'local institution' are not publishable without overstatement.",
  replacementPriority: 6,
};

export const OBR_COPY = {
  context:
    "Our Boy Roy was a new hospitality business with its name already in place. The initial ask was familiar: a logo and a brand for the new venue.",
  roles: [
    "Creative Direction",
    "Visual Identity",
    "Signage & Wayfinding",
    "Packaging",
    "Print",
    "Digital Design",
    "Motion",
  ],
  workingContext: "Developed while working with The Colour Club.",
  idea: {
    heading: "The idea",
    body: "Roy is a man of many hats. A recurring character whose personality changes through his hair, trousers, patterns and whatever he happens to be carrying. Inspired by the directness and charm of old newspaper advertising, Roy gave the identity someone to build a world around without ever fully revealing who he is.",
  },
  shift: {
    heading: "The shift",
    body: "Rather than treating Roy as a fixed mascot beside the logo, he became the identity’s organising device. Changing his appearance and what he carried allowed the same character to take on different roles while remaining recognisably Roy.",
  },
  system: {
    heading: "The system",
    body: "Roy changes with the application. Hair, patterns, trousers and objects combine to create different versions of the same character, giving the identity a simple way to keep changing without losing recognition. That behaviour extends through illustration, signage, menus, packaging, print, social and motion, and into the venue through physical details and merchandise.",
  },
};

export type ObrSeedMovement = {
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
};

export const OBR_MOVEMENTS: ObrSeedMovement[] = [
  {
    key: "o01",
    mediaType: "still",
    still: "public/projects/our-boy-roy/666173bcb7178cfee98b71c0_HBWxOBR-Portfolio5.jpg",
    alt: "OUR BOY ROY lettering on a lavender espresso machine, shadowed onto timber panelling.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "o02",
    mediaType: "still",
    still: "public/global/681c2b687b9d95dbdf305106_HBWxOBR.jpg",
    alt: "White brick shopfront with lilac doors, pink diamond tiling, and window lettering.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "o03",
    mediaType: "still",
    still: "public/projects/our-boy-roy/66626aa420e92cdf8d975c8b_HBWxOBR-Portfolio3.jpg",
    alt: "Cube lightbox with stacked OUR BOY ROY type hanging under a verandah.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "o04",
    mediaType: "film",
    video: "public/projects/our-boy-roy/web/OBR-Colour-Change.mp4",
    poster: "public/projects/our-boy-roy/web/OBR-Colour-Change.jpg",
    alt: "Line-drawn figure in checkered pants holding a bottle as the ground colour shifts.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "o05",
    mediaType: "still",
    still: "public/projects/our-boy-roy/666173bcbf2a7a2babaeb1aa_HBWxOBR-Portfolio8.jpg",
    alt: "Back of a white shirt with stacked light-blue OUR BOY ROY lettering.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "o06",
    mediaType: "still",
    still: "public/projects/our-boy-roy/666175d7d04fcd0592a30a48_OBR-Instagram-Posts19.jpg",
    alt: "Line-drawn chef behind a pan reading Chef Needed on pink.",
    scale: "detail",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "o07",
    mediaType: "film",
    video: "public/projects/our-boy-roy/web/OBR-Mortadella.mp4",
    poster: "public/projects/our-boy-roy/web/OBR-Mortadella.jpg",
    alt: "Mortadella slice with cartoon hands on lavender, framed by MORTADELLA MADNESS type.",
    scale: "standard",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
];
