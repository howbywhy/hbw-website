/** Shipped SCK sequence + approved CMS editorial. Seed/verify only. */

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
    "Brand strategy, creative direction and visual identity. The SCK website was developed independently of HBW’s identity work. SCK’s interest in objects and furniture existed before this work; the identity recognised that ambition rather than creating it. No evidenced Outcome.",
  replacementPriority: 8,
};

export const SCK_COPY = {
  context:
    "Studio Carson Kelly was an established architecture and interiors practice looking to grow, but its existing identity offered little sense of who the studio was or where it wanted to go.\n\nThe immediate request was for a new identity. The more fundamental question was how to define the practice in a way that could accommodate its ambitions beyond architecture and interiors.",
  roles: ["Brand Strategy", "Creative Direction", "Visual Identity"],
  idea: {
    heading: "The idea",
    body: "Intersecting Realities.\n\nSCK operates through connection: between architecture and interiors, people and place, objects and art, material and experience.\n\nRather than defining the studio by a single discipline, the brand was built around the intersections between them.",
  },
  shift: {
    heading: "The shift",
    body: "This moved the identity away from representing an architecture practice through the conventions of its category.\n\nInstead, SCK could be understood as a broader creative practice — one capable of moving between disciplines without losing a clear point of view.\n\nThe underscore became a simple expression of that idea: a point of connection capable of joining different people, disciplines and outputs.",
  },
  system: {
    heading: "The system",
    body: "The identity uses that connective principle across language, typography and composition.\n\nThe underscore acts as both punctuation and device, while a restrained visual system gives the studio’s work room to lead.\n\nTogether, these elements create an identity capable of holding architecture and interiors alongside the studio’s wider interests in objects, furniture, lighting, art, materials and culture.",
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

export const PROJECT_BY_SLUG_QUERY = `*[_type == "project" && slug.current == $slug][0]{
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
