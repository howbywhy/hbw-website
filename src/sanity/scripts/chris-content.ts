/** Chris Sisarich seed/verify copy. Public /projects/chris-sisarich may resolve Sanity via HBW_CHRIS_SOURCE. */

export const CHRIS_DOCUMENT_ID = "project-chris-sisarich";

export const CHRIS_IDENTITY = {
  title: "Chris Sisarich",
  slug: "chris-sisarich",
  proposition: "Beauty Amongst The Mundane",
  year: "2024",
  sectors: ["Photography"],
  disciplines: ["Brand DNA", "Visual Identity", "Website"],
  portfolioOrder: 5,
  editorialPurpose: "Restraint",
  contributionNotes:
    "Mark delivered Brand DNA, creative direction, visual identity, website, and the portfolio/presentation system. An earlier smaller identity for Bas & Chris preceded this commission; that history is not public case-study copy. During development Chris asked for something more visual; the useful decision was to keep the identity from competing with the photographs. No collaborators. No Working Context required.",
  replacementPriority: 5,
};

export const CHRIS_COPY = {
  context:
    "Chris already had a distinctive photographic practice. The work had character. The task was to give that practice a recognisable identity without creating another visual subject beside the photographs.",
  roles: ["Brand DNA", "Creative Direction", "Visual Identity", "Website"],
  idea: {
    heading: "The idea",
    body: "Beauty Amongst The Mundane. The photographs find character in ordinary and overlooked moments. The identity had to share that sensitivity: notice what is already there, and not add meaning the work did not already hold.",
  },
  shift: {
    heading: "The shift",
    body: "The temptation was to give the identity more presence. The photography already supplied the expression. The stronger decision was to make the identity a way of looking at the work, rather than another layer over it.",
  },
  system: {
    heading: "The system",
    body: "That decision produced navigation rather than a conventional logo-led identity. Type and hierarchy name and order. Layouts frame. The website lets images rearrange and filter so the photographs stay the subject. A presentation format carries the same behaviour onto the page.",
  },
};

export type ChrisSeedMovement = {
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
  graphic?: true;
};

export const CHRIS_MOVEMENTS: ChrisSeedMovement[] = [
  {
    key: "s01",
    mediaType: "still",
    still: "public/projects/chris-sisarich/665d934ad04dcf11bb8bbc5b_HBWxChrisSisarich-Portfolio13.jpg",
    alt: "Framed poster on concrete with the name over a small landscape still and a vehicle on rock.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s02",
    mediaType: "film",
    video: "public/projects/chris-sisarich/web/HBWCSHOME-Website.mp4",
    poster: "public/projects/chris-sisarich/web/HBWCSHOME-Website.jpg",
    alt: "Homepage with the name over scattered photography thumbnails as they rearrange.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
    cover: true,
  },
  {
    key: "s03",
    mediaType: "still",
    still: "public/projects/chris-sisarich/6663143cb87a78fa3d4c90be_HBWxChrisSisarich-uPortfolio5.jpg",
    alt: "Two faces stacked in a gap of damask fabric, one in sunglasses, one smiling.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s04",
    mediaType: "still",
    still: "public/projects/chris-sisarich/665d934b1652bff63884d5f9_HBWxChrisSisarich-Portfolio18.jpg",
    alt: "Aerial performers on silks against a striped wall, with small colour car stills inset.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s05",
    mediaType: "still",
    still: "public/global/666313d5a9df92c312c71e3f_CS-Layout-DD.12.jpg",
    alt: "Low-angle of a person in a white tank, arm casting a shadow, under a type header.",
    scale: "standard",
    pace: "normal",
    relation: "pair",
    infoHint: "system",
    graphic: true,
  },
  {
    key: "s06",
    mediaType: "film",
    video: "public/projects/chris-sisarich/web/CS-System.mp4",
    poster: "public/projects/chris-sisarich/web/CS-System.jpg",
    alt: "Name, blurred embrace, and agency columns assembling as a system layout.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s07",
    mediaType: "still",
    still: "public/projects/chris-sisarich/665d93483f1d5500f3892332_HBWxChrisSisarich-Portfolio8.jpg",
    alt: "Three-panel sequence of a runner, sharp in the centre and motion-blurred at the sides.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s08",
    mediaType: "film",
    video: "public/projects/chris-sisarich/web/HBWCSIMAGES-Website.mp4",
    poster: "public/projects/chris-sisarich/web/HBWCSIMAGES-Website.jpg",
    alt: "Photography grid of cars and people as the site filters through categories.",
    scale: "standard",
    pace: "pause",
    relation: "single",
    infoHint: "system",
    cover: true,
  },
];
