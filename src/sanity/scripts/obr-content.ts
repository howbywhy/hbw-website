/** OBR seed/verify copy. Public /projects/our-boy-roy may resolve Sanity via HBW_OBR_SOURCE. */

export const OBR_DOCUMENT_ID = "project-our-boy-roy";

export const OBR_IDENTITY = {
  title: "Our Boy Roy",
  slug: "our-boy-roy",
  proposition: "The Friendly Neighbour",
  year: "2022",
  sectors: ["Hospitality"],
  disciplines: ["Visual Identity", "Signage & Wayfinding", "Print"],
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
  webm?: string;
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
    still: "public/projects/our-boy-roy/web/01-full-wide.jpg",
    alt: "A white brick shopfront with lilac doors and window lettering, seen from across the road.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "o02",
    mediaType: "still",
    still: "public/projects/our-boy-roy/web/02-full-wide.jpg",
    alt: "A lavender espresso machine on a timber counter, the name shadowed onto the wall behind it.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "o03",
    mediaType: "film",
    video: "public/projects/our-boy-roy/web/03-full-wide.mp4",
    poster: "public/projects/our-boy-roy/web/03-full-wide.jpg",
    alt: "A line-drawn figure in checked trousers on pale yellow, the ground colour shifting behind.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "o04",
    mediaType: "still",
    still: "public/projects/our-boy-roy/web/04-full-wide.jpg",
    alt: "The fit-out from the door: timber counter, black stools and shelves of produce.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "o05",
    mediaType: "still",
    still: "public/projects/our-boy-roy/web/05-full-tall.jpg",
    alt: "Two rolls of branded tape, orange and blue, on lilac checkerboard paper.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "o06",
    mediaType: "still",
    still: "public/projects/our-boy-roy/web/06-full-wide.jpg",
    alt: "Three menu cards on black — Schnittty, Viva La Roy and Benny, Roy — each above its sandwich.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "o07",
    mediaType: "still",
    still: "public/projects/our-boy-roy/web/07-full-tall.jpg",
    alt: "A crumbed schnitzel roll on lilac-checked paper over a branded plate, a drinks menu and a smoothie beside it on white tile.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "o08",
    mediaType: "still",
    still: "public/projects/our-boy-roy/web/08-full-tall.jpg",
    alt: "The back of an off-white tee with OUR BOY ROY stacked in blue, worn against a painted brick wall.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "o09",
    mediaType: "still",
    still: "public/projects/our-boy-roy/web/09-full-wide.jpg",
    alt: "The room along the counter, shelves of produce down one wall.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "o10",
    mediaType: "still",
    still: "public/projects/our-boy-roy/web/10-full-tall.jpg",
    alt: "A paper carry bag and a taped box on white tile.",
    scale: "detail",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "o11",
    mediaType: "still",
    still: "public/projects/our-boy-roy/web/11-full-wide.jpg",
    alt: "Three yellow takeaway cups on a steel counter against lilac, each carrying a letter of ROY held by a little drawn figure.",
    scale: "standard",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "o12",
    mediaType: "still",
    still: "public/projects/our-boy-roy/web/12-full-tall.jpg",
    alt: "The dining room: pink chairs and a houndstooth banquette under striped wall lights, plates set out, a tiled booth through the opening behind.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "o13",
    mediaType: "still",
    still: "public/projects/our-boy-roy/web/13-full-wide.jpg",
    alt: "Three posters on black: Chef Needed, MORNING repeated in orange, and the opening hours.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "o14",
    mediaType: "film",
    video: "public/projects/our-boy-roy/web/14-tiktok-tall.mp4",
    webm: "public/projects/our-boy-roy/web/14-tiktok-tall.webm",
    poster: "public/projects/our-boy-roy/web/14-tiktok-tall.jpg",
    alt: "MORTADELLA MADNESS on a phone, a mortadella roll above a promise of a new sando each week.",
    scale: "detail",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "o15",
    mediaType: "still",
    still: "public/projects/our-boy-roy/web/15-full-wide.jpg",
    alt: "The corner shop under a gum tree, its whole side wall painted with checks, bottles, a daisy and produce shapes.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
];
