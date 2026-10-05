/** Shipped SCK sequence + approved CMS editorial. Seed/verify only. */

export const SCK_DOCUMENT_ID = "project-sck";

export const SCK_IDENTITY = {
  title: "SCK",
  slug: "sck",
  proposition: "Intersecting Realities",
  year: "2026",
  sectors: ["Architecture", "Interior Design"],
  disciplines: ["Brand Strategy", "Visual Identity", "Motion", "Digital Design"],
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
    alt: "Two people seated on terrazzo steps beside a large framed painting, a glass wall opening to planting behind them, with STUDIO CARSON KELLY set across the frame.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "sk02",
    mediaType: "still",
    still: "public/projects/sck/2.jpg",
    alt: "The practice description ranged along the top of a pale sage field, with STUDIO CARSON KELLY set large across the foot.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "sk03",
    mediaType: "still",
    still: "public/projects/sck/3.jpg",
    alt: "Two posters side by side: a project sheet listing size, type, location and credits, beside a bedroom photograph captioned S.C.K and Little James.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "sk04",
    mediaType: "still",
    still: "public/projects/sck/4.jpg",
    alt: "A corrugated steel roof edge against eucalypts, quartered by fine crosshair rules with S.C.K at the centre.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "sk05",
    mediaType: "still",
    still: "public/projects/sck/5.jpg",
    alt: "The logotype in four lockups — one line, two lines, three lines and the S.C.K monogram — set out on spacing guides.",
    scale: "detail",
    pace: "normal",
    relation: "single",
    infoHint: "idea",
  },
  {
    key: "sk06",
    mediaType: "still",
    still: "public/projects/sck/6.jpg",
    alt: "A spherical ribbed pendant above dried grasses, labelled STILL_Pendant, by_SOZOU_Studio, OBJKT_022.",
    scale: "detail",
    pace: "tight",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "sk07",
    mediaType: "still",
    still: "public/projects/sck/7.jpg",
    alt: "Two posters side by side: a specification sheet for a ninety square metre Bondi Junction residence, beside a bed lit through a glass block wall.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "sk08",
    mediaType: "still",
    still: "public/projects/sck/8.jpg",
    alt: "A cast speaker with a conical horn on a plinth, labelled Cast_Speaker, by_Tom_Fereday, OBJKT_149.",
    scale: "detail",
    pace: "tight",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "sk09",
    mediaType: "still",
    still: "public/projects/sck/9.jpg",
    alt: "A living room opening onto a deck and eucalypt bush, the STUDIO CARSON KELLY wordmark and practice details set over it.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "shift",
  },
  {
    key: "sk10",
    mediaType: "film",
    video: "public/projects/sck/web/10.mp4",
    poster: "public/projects/sck/web/10.jpg",
    alt: "The Ulladulla House in white corrugated steel, its deck and a chair open to eucalypt forest, captioned S.C.K and Ulladulla House.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "shift",
    narrow: true,
  },
  {
    key: "sk11",
    mediaType: "still",
    still: "public/projects/sck/11.jpg",
    alt: "A glass and resin coffee table on a pale floor, labelled Coffee_Table, by_Clive_Lonstein, OBJKT_009.",
    scale: "detail",
    pace: "tight",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "sk12",
    mediaType: "film",
    video: "public/projects/sck/web/12.mp4",
    poster: "public/projects/sck/web/12.jpg",
    alt: "Three phone screens running a Studio Carson Kelly podcast player and episode list.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
    narrow: true,
  },
  {
    key: "sk13",
    mediaType: "still",
    still: "public/projects/sck/13.jpg",
    alt: "A travertine brick corner with a pitcher plant, chrome lamp and corduroy sofa, S.C.K and the practice description set alongside.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "system",
  },
  {
    key: "sk14",
    mediaType: "film",
    video: "public/projects/sck/web/14.mp4",
    poster: "public/projects/sck/web/14.jpg",
    alt: "Three phone screens of Studio Carson Kelly stories — a bedroom, a kitchen and a written note on the Little James house.",
    scale: "standard",
    pace: "normal",
    relation: "single",
    infoHint: "outcome",
    narrow: true,
  },
  {
    key: "sk15",
    mediaType: "still",
    still: "public/projects/sck/15.jpg",
    alt: "Nine pale sage cards in a grid, each carrying STUDIO CARSON KELLY and a reference number.",
    scale: "detail",
    pace: "tight",
    relation: "single",
    infoHint: "outcome",
  },
  {
    key: "sk16",
    mediaType: "film",
    video: "public/projects/sck/web/16.mp4",
    poster: "public/projects/sck/web/16.jpg",
    alt: "The Studio Carson Kelly website, street footage running beneath a Work, Studio and Resources menu.",
    scale: "major",
    pace: "pause",
    relation: "single",
    infoHint: "outcome",
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
