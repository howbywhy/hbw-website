/** Chris Sisarich seed/verify copy. Public /projects/chris-sisarich may resolve Sanity via HBW_CHRIS_SOURCE. */

export const CHRIS_DOCUMENT_ID = "project-chris-sisarich";

export const CHRIS_IDENTITY = {
  title: "Chris Sisarich",
  slug: "chris-sisarich",
  proposition: "Beauty Amongst The Mundane",
  year: "2024",
  sectors: ["Photography"],
  disciplines: ["Brand Strategy", "Visual Identity", "Website"],
  portfolioOrder: 5,
  editorialPurpose: "Restraint",
  contributionNotes:
    "Brand strategy, creative direction, visual identity and digital design, including the website and portfolio/presentation system. An earlier smaller identity for Bas & Chris preceded this commission; that history is not public case-study copy. During development Chris asked for something more visual; the useful decision was to keep the identity from competing with the photographs. No collaborators. No Working Context required. No Outcome.",
  replacementPriority: 5,
};

export const CHRIS_COPY = {
  context:
    "Photographer Chris Sisarich needed an identity that could give his practice a distinctive presence without competing with the thing people were there to see: the photography.\n\nThe challenge was therefore not how much identity could be added, but how little was needed to make the work feel recognisably his.",
  roles: ["Brand Strategy", "Creative Direction", "Visual Identity", "Digital Design"],
  idea: {
    heading: "The idea",
    body: "Beauty Amongst The Mundane.\n\nChris’s work finds something compelling in moments, places and subjects that might otherwise be overlooked.\n\nThe identity takes the same position: finding character through restraint rather than spectacle.",
  },
  shift: {
    heading: "The shift",
    body: "Instead of building a conventional photographer identity around a prominent logo or repeated graphic device, the system deliberately recedes.\n\nThat restraint allows the photography to remain the main attraction while the identity creates enough intrigue, personality and consistency to frame it.",
  },
  system: {
    heading: "The system",
    body: "A navigation-led identity uses typography, structure and subtle interruption to create recognition without overwhelming the work.\n\nThe approach extends through the website, portfolio case and presentation material, giving Chris a consistent framework while allowing different bodies of photography to retain their own character.",
  },
};

export type ChrisSeedMovement = {
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
  graphic?: true;
};

export const CHRIS_MOVEMENTS: ChrisSeedMovement[] = [
  {
    key: "s01",
    mediaType: "still",
    still: "public/projects/chris-sisarich/web/01-full-tall.jpg",
    alt: "Rubble and two blocks of orange-striped stone under a pale sky, a handwritten note pinned above them and a fine blue arc drawn across.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s02",
    mediaType: "film",
    video: "public/projects/chris-sisarich/web/02-two-pair.mp4",
    webm: "public/projects/chris-sisarich/web/02-two-pair.webm",
    poster: "public/projects/chris-sisarich/web/02-two-pair.jpg",
    alt: "A black-and-white portrait beside a page carrying the name over a blurred braid, credits ranged along the foot.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s03",
    mediaType: "film",
    video: "public/projects/chris-sisarich/web/03-browser-wide.mp4",
    webm: "public/projects/chris-sisarich/web/03-browser-wide.webm",
    poster: "public/projects/chris-sisarich/web/03-browser-wide.jpg",
    alt: "The site in a browser window, photography scattered across the grid over the ghosted name.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s04",
    mediaType: "film",
    video: "public/projects/chris-sisarich/web/04-full-tall.mp4",
    webm: "public/projects/chris-sisarich/web/04-full-tall.webm",
    poster: "public/projects/chris-sisarich/web/04-full-tall.jpg",
    alt: "A column of navigation dots, the active one stretching into a pill that reads Sports.",
    scale: "detail",
    pace: "pause",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "s05",
    mediaType: "film",
    video: "public/projects/chris-sisarich/web/05-full-square.mp4",
    webm: "public/projects/chris-sisarich/web/05-full-square.webm",
    poster: "public/projects/chris-sisarich/web/05-full-square.jpg",
    alt: "A photograph of two people running through long grass enlarging over the ghosted name.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s06",
    mediaType: "film",
    video: "public/projects/chris-sisarich/web/06-full-square.mp4",
    webm: "public/projects/chris-sisarich/web/06-full-square.webm",
    poster: "public/projects/chris-sisarich/web/06-full-square.jpg",
    alt: "A dense block of photography thumbnails settling over the ghosted name.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s07",
    mediaType: "film",
    video: "public/projects/chris-sisarich/web/07-iphone-tall.mp4",
    webm: "public/projects/chris-sisarich/web/07-iphone-tall.webm",
    poster: "public/projects/chris-sisarich/web/07-iphone-tall.jpg",
    alt: "The site on a phone, Directing and Index pills either side of the photographs over the name.",
    scale: "detail",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s08",
    mediaType: "still",
    still: "public/projects/chris-sisarich/web/08-full-tall.jpg",
    alt: "A coach alone on a desert road beneath red cliffs, the name set white across the sky.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s09",
    mediaType: "still",
    still: "public/projects/chris-sisarich/web/09-full-wide.jpg",
    alt: "A red car parked on gravel against a rammed-earth wall.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s10",
    mediaType: "film",
    video: "public/projects/chris-sisarich/web/10-full-square.mp4",
    webm: "public/projects/chris-sisarich/web/10-full-square.webm",
    poster: "public/projects/chris-sisarich/web/10-full-square.jpg",
    alt: "A woman in green beside a red car held over the ghosted name, with an invitation to send a postcard beneath.",
    scale: "standard",
    pace: "pause",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s11",
    mediaType: "still",
    still: "public/projects/chris-sisarich/web/11-two-pair.jpg",
    alt: "A grid of small photographs under the name, beside a blurred orange bloom over a page of handwriting.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "s12",
    mediaType: "still",
    still: "public/projects/chris-sisarich/web/12-full-tall.jpg",
    alt: "Two stacked spreads: a car on a mountain road above a desert horizon, the name across each.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s13",
    mediaType: "still",
    still: "public/projects/chris-sisarich/web/13-full-square.jpg",
    alt: "A white information sheet on black with the name ghosted at its head.",
    scale: "detail",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s14",
    mediaType: "still",
    still: "public/projects/chris-sisarich/web/14-full-tall.jpg",
    alt: "Two business cards on black, one blank and one carrying phone, email, website and Instagram.",
    scale: "detail",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s15",
    mediaType: "still",
    still: "public/projects/chris-sisarich/web/15-two-pair.jpg",
    alt: "A red and white striped tower beside a pinned page of figures, arrows and the name.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s16",
    mediaType: "still",
    still: "public/projects/chris-sisarich/web/16-full-tall.jpg",
    alt: "An email issue running the full column: the name over a coast road shot from above, two projects set out beneath it, and the name again at the foot.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s17",
    mediaType: "still",
    still: "public/projects/chris-sisarich/web/17-full-tall.jpg",
    alt: "A framed poster on a concrete wall, the name over a small landscape still.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s18",
    mediaType: "still",
    still: "public/projects/chris-sisarich/web/18-full-wide.jpg",
    alt: "A lit poster on a concrete street wall under bunting, the name along its foot.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "s19",
    mediaType: "film",
    video: "public/projects/chris-sisarich/web/19-full-wide.mp4",
    webm: "public/projects/chris-sisarich/web/19-full-wide.webm",
    poster: "public/projects/chris-sisarich/web/19-full-wide.jpg",
    alt: "The archive spread edge to edge as a loose grid of small photographs on white.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
];
