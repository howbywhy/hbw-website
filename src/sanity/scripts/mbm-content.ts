/** Made by Madelen seed/verify copy. Public /projects/made-by-madelen may resolve Sanity via HBW_MBM_SOURCE. */

export const MBM_DOCUMENT_ID = "project-made-by-madelen";

export const MBM_IDENTITY = {
  title: "Made by Madelen",
  slug: "made-by-madelen",
  proposition: "From Making to Moment",
  year: "2026",
  sectors: ["Fashion"],
  disciplines: ["Launch Strategy", "Content Planning", "Social Content", "Motion", "Messaging"],
  portfolioOrder: 1,
  editorialPurpose: "Launch / Definition",
  contributionNotes:
    "Mark led creative direction, the launch plan, the content system and the social assets, working directly with Madelen. The work is a four-week launch and the motion system underneath it; the collection, the garments and the photography are the client's. Audience, sales and follower outcomes are not claimed.",
  replacementPriority: 1,
};

export const MBM_COPY = {
  context:
    "Made by Madelen was going to market, and the brief was four weeks of social content.\n\nBefore the runway, there’s the making. That became the starting point: a launch built from the processes that turn fabric into fashion, and a motion language the brand could keep using once the four weeks were over.",
  roles: ["Creative Direction", "Launch Plan", "Content System", "Social Assets"],
  idea: {
    heading: "The idea",
    body: "Before the runway, there’s the making.\n\nDrawing from the processes that turn fabric into fashion, we developed a motion language that moves from making to moment.\n\nColour blooms like dye through fabric. Elements shift and align like layers of print. Typography builds rhythm and anticipation, before the flash of the runway brings everything into focus.\n\nEach behaviour takes something from the making process and gives it a new role in the identity. Together, they create a visual language that moves between experimentation, expression and recognition.\n\nFrom the first mark to the moment all eyes are watching.",
  },
  shift: {
    heading: "The shift",
    body: "The brief asked for four weeks of simple, minimal, high-end editorial social content.\n\nTalking it through with Madelen, we shaped it into a launch: fewer, stronger moments, a gradual reveal, product only when it matters.\n\nThe four weeks became Something is coming, This is Made by Madelen, Made to be worn, and Made by Madelen. Each with a distinct purpose, building from intrigue and anticipation to the collection reveal, shop launch and a lasting brand presence.",
  },
  system: {
    heading: "The system",
    body: "Five repeatable motion behaviours bring the identity to life across image, surface, typography, interruption and identity.\n\nTwelve content moments carry the launch from black-and-white fragments into full colour, from campaign imagery to product and finally into the world of Made by Madelen.\n\nThe system moves between restraint and expression, giving the imagery space to speak while introducing recognisable moments of motion. A held logo over transitioning imagery becomes a recurring signature, bringing consistency to changing colourways, compositions and messages.\n\nWhat began as a four-week launch becomes a visual language Madelen can continue using beyond it.",
  },
};

export type MbmSeedMovement = {
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

/**
 * Eight movements, in the order the launch runs: black and white first, the
 * monogram held over it as the signature, and colour arriving only once there
 * is something to reveal. The last three are the collection, the line and the
 * shop, which is where the four weeks were always going.
 */
export const MBM_MOVEMENTS: MbmSeedMovement[] = [
  {
    key: "m01",
    mediaType: "still",
    still: "public/projects/made-by-madelen/web/01-full-story.jpg",
    alt: "The Made by Madelen monogram held in cream over a black-and-white portrait, a sheet of fabric sweeping across the frame.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "m02",
    mediaType: "film",
    video: "public/projects/made-by-madelen/web/02-instagram-tall.mp4",
    poster: "public/projects/made-by-madelen/web/02-instagram-tall.jpg",
    alt: "A phone playing the first Reel on a near-black ground, captioned Something is coming.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "m03",
    mediaType: "still",
    still: "public/projects/made-by-madelen/web/03-full-tall.jpg",
    alt: "A black-and-white fragment of two figures turned away, the monogram print rising through the lower half of the frame.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "m04",
    mediaType: "film",
    video: "public/projects/made-by-madelen/web/04-row-row.mp4",
    poster: "public/projects/made-by-madelen/web/04-row-row.jpg",
    alt: "Two phones side by side: a TikTok reading MADE IN SEQUENCE, CUT-BY-CUT, STITCH BY STITCH, and the Instagram grid filling in beside it.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "m05",
    mediaType: "still",
    still: "public/projects/made-by-madelen/web/05-full-wide.jpg",
    alt: "A portrait in the monogram-print jacket, colour blooming in from the left edge of the frame.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "m06",
    mediaType: "film",
    video: "public/projects/made-by-madelen/web/06-full-story.mp4",
    poster: "public/projects/made-by-madelen/web/06-full-story.jpg",
    alt: "A close crop of the monogram print in blue across a shoulder and collar, Made the way you are. set in yellow across it.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "m07",
    mediaType: "film",
    video: "public/projects/made-by-madelen/web/07-instagram-tall.mp4",
    poster: "public/projects/made-by-madelen/web/07-instagram-tall.jpg",
    alt: "MADE TO BE WORN running over a Reel and out past the edges of the phone behind it.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "m08",
    mediaType: "still",
    still: "public/projects/made-by-madelen/web/08-full-story.jpg",
    alt: "The full red monogram-print suit on a warm ground, Link in stories set across it.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "system",
  },
];
