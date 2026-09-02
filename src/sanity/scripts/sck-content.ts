/** Shipped SCK sequence + approved G5 editorial. Seed/verify only. */

export const SCK_DOCUMENT_ID = "project-sck";

export const SCK_IDENTITY = {
  title: "SCK",
  slug: "sck",
  proposition: "Intersecting Realities",
  year: "2026",
  sectors: ["Architecture", "Interior Design"],
  disciplines: ["Brand DNA", "Visual Identity", "Motion", "Digital Design"],
  portfolioOrder: 1,
  editorialPurpose: "Definition / Future",
  contributionNotes:
    "Brand DNA, creative direction and visual identity. The SCK website was developed independently of HBW’s identity work.",
  replacementPriority: 8,
};

export const SCK_COPY = {
  context:
    "Existing architecture and interiors practice with a basic identity and no clear positioning, looking to grow and broaden perception while leaving room for ambitions beyond architecture into objects, furniture and product.",
  roles: ["Brand DNA", "Creative Direction", "Visual Identity"],
  idea: {
    heading: "The idea",
    body: "The practice sits at the intersection of people, disciplines, perspectives and outputs. Architecture and interiors connect with objects, furniture, art, culture and the wider creative process.",
  },
  shift: {
    heading: "The shift",
    body: "The project began as an identity brief, but the more important task was to define a brand broad enough for the practice SCK was becoming. The strategic shift was to stop defining the practice only by discipline and instead articulate the value created when different creative realities meet.",
  },
  system: {
    heading: "The system",
    body: "The underscore acts as a connective device — a simple visual grammar for joining names, ideas, disciplines and outputs. Typography, imagery, spacing and motion extend that principle into a flexible identity that can hold architecture, interiors and future areas of practice without constraining them.",
  },
  outcome: {
    heading: "The outcome",
    body: "The identity gives SCK a framework for presenting its evolving practice. It balances architectural rigour with warmth and individuality, while allowing each project to retain its own character.",
  },
};

export type SckSeedMovement = {
  key: string;
  mediaType: "still" | "film";
  still?: string;
  video?: string;
  poster?: string;
  alt: string;
  scale: "major" | "standard" | "detail";
  pace: "tight" | "normal" | "pause";
  relation: "single" | "pair";
  infoHint?: "idea" | "shift" | "system" | "outcome";
  narrow?: true;
};

export const SCK_MOVEMENTS: SckSeedMovement[] = [
  {
    key: "sk01",
    mediaType: "still",
    still: "public/projects/sck/1.jpg",
    alt: "Two people in a sunlit studio beside a large figurative painting in a red frame.",
    scale: "major",
    pace: "pause",
    relation: "single",
  },
  {
    key: "sk02",
    mediaType: "still",
    still: "public/projects/sck/2.jpg",
    alt: "S.C.K in charcoal type with inward crosshair lines on a pale ground.",
    scale: "detail",
    pace: "normal",
    relation: "single",
  },
  {
    key: "sk03",
    mediaType: "still",
    still: "public/projects/sck/3.jpg",
    alt: "Practice description along the top and STUDIO CARSON KELLY along the bottom on pale green-grey.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "sk04",
    mediaType: "film",
    video: "public/projects/sck/web/4.mp4",
    poster: "public/projects/sck/web/4.jpg",
    alt: "Horizontal dash clusters forming shifting blocky letterforms on a cream grid.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    narrow: true,
  },
  {
    key: "sk05",
    mediaType: "still",
    still: "public/projects/sck/5.jpg",
    alt: "S.C.K and a crosshair over an interior looking out to a timber deck and forest.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "sk06",
    mediaType: "film",
    video: "public/projects/sck/web/6.mp4",
    poster: "public/projects/sck/web/6.jpg",
    alt: "White corrugated house and timber deck with a lounge chair against dense forest.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
    narrow: true,
  },
  {
    key: "sk07",
    mediaType: "still",
    still: "public/projects/sck/7.jpg",
    alt: "Four STUDIO CARSON KELLY lockups with dotted guidelines and beige spacing blocks.",
    scale: "detail",
    pace: "normal",
    relation: "single",
  },
  {
    key: "sk08",
    mediaType: "still",
    still: "public/projects/sck/8.jpg",
    alt: "Cast cubic speaker with a deep conical horn on a solid pedestal.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "sk09",
    mediaType: "film",
    video: "public/projects/sck/web/9.mp4",
    poster: "public/projects/sck/web/9.jpg",
    alt: "White S.C.K type on charcoal above a cream band, with faint vertical layout guides.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    narrow: true,
  },
  {
    key: "sk10",
    mediaType: "still",
    still: "public/projects/sck/10.jpg",
    alt: "S.C.K and a crosshair over corrugated metal cladding and gum trees.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "sk11",
    mediaType: "still",
    still: "public/projects/sck/11.jpg",
    alt: "Translucent amber glass coffee table with three curved legs and a notched top.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "sk12",
    mediaType: "still",
    still: "public/projects/sck/12.jpg",
    alt: "STUDIO, CARSON, and KELLY stacked and repeating in black sans-serif on white.",
    scale: "detail",
    pace: "normal",
    relation: "single",
  },
  {
    key: "sk13",
    mediaType: "still",
    still: "public/projects/sck/13.jpg",
    alt: "Ribbed spherical pendant on a floor-to-ceiling pole in a beige room with dried grass.",
    scale: "standard",
    pace: "pause",
    relation: "single",
  },
  {
    key: "sk14",
    mediaType: "still",
    still: "public/projects/sck/14.png",
    alt: "Nine cells of dashed-line numerals on a pale lime ground.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "sk15",
    mediaType: "film",
    video: "public/projects/sck/web/15.mp4",
    poster: "public/projects/sck/web/15.jpg",
    alt: "Lit petal-form pendant with dark bead fasteners against a dark wall.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    narrow: true,
  },
  {
    key: "sk16",
    mediaType: "film",
    video: "public/projects/sck/web/16.mp4",
    poster: "public/projects/sck/web/16.jpg",
    alt: "Horizontal bands of forest, deck, and cladding photographs interleaved with labelled beige slots.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "outcome",
    narrow: true,
  },
  {
    key: "sk18",
    mediaType: "film",
    video: "public/projects/sck/web/18.mp4",
    poster: "public/projects/sck/web/18.jpg",
    alt: "Faint paneled-wall schematic of staggered rectangles with dimension numbers.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    narrow: true,
  },
  {
    key: "sk19",
    mediaType: "film",
    video: "public/projects/sck/web/19.mp4",
    poster: "public/projects/sck/web/19.jpg",
    alt: "Timber kitchen looking through glass to a deck and forest, overlaid with dashed diagonal shapes.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    narrow: true,
  },
  {
    key: "sk20",
    mediaType: "still",
    still: "public/projects/sck/20.png",
    alt: "Nine-cell grid of dotted abstract forms on a pale beige ground.",
    scale: "standard",
    pace: "normal",
    relation: "single",
  },
  {
    key: "sk22",
    mediaType: "film",
    video: "public/projects/sck/web/22.mp4",
    poster: "public/projects/sck/web/22.jpg",
    alt: "Dark interface assembling horizontal strata of photographs and dashed graphic bands.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    narrow: true,
  },
  {
    key: "sk23",
    mediaType: "film",
    video: "public/projects/sck/web/23.mp4",
    poster: "public/projects/sck/web/23.jpg",
    alt: "Dog on a timber deck facing forest, with STUDIO CARSON KELLY over a dashed grid.",
    scale: "standard",
    pace: "pause",
    relation: "single",
    narrow: true,
  },
];

export const SCK_PROJECT_QUERY = `*[_type == "project" && slug.current == "sck"][0]{
  _id,
  title,
  slug,
  proposition,
  year,
  location,
  sectors,
  disciplines,
  portfolioOrder,
  context,
  roles,
  workingContext,
  collaborators,
  idea,
  shift,
  system,
  outcome,
  contributionNotes,
  editorialPurpose,
  replacementPriority,
  preview{
    ...,
    asset->{
      _id,
      url,
      originalFilename,
      mimeType,
      metadata
    }
  },
  movements[]{
    _key,
    mediaType,
    alt,
    scale,
    pace,
    relation,
    infoHint,
    presentationOverride,
    still{
      ...,
      asset->{
        _id,
        url,
        originalFilename,
        mimeType,
        metadata
      }
    },
    poster{
      ...,
      asset->{
        _id,
        url,
        originalFilename,
        mimeType,
        metadata
      }
    },
    video{
      asset->{
        _id,
        url,
        originalFilename,
        mimeType,
        metadata
      }
    },
    webm{
      asset->{
        _id,
        url,
        originalFilename,
        mimeType,
        metadata
      }
    }
  }
}`;
