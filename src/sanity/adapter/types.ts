import type {
  BrowseLayout,
  CollaboratorId,
  Discipline,
  ProjectRecord,
  Sector,
} from "../../components/home/catalog";
import type {
  ExperienceAuthorship,
  ExperienceCollaborator,
  InfoSectionId,
  MovementPace,
  MovementRelation,
  MovementScale,
  ProjectExperience,
} from "../../components/home/projects/types";

export type PortableTextSpan = {
  _type: "span";
  text?: string;
  marks?: string[];
};

export type PortableTextMarkDef = {
  _type: string;
  _key: string;
  href?: string;
};

export type PortableTextBlock = {
  _type: "block";
  _key?: string;
  style?: string;
  markDefs?: PortableTextMarkDef[];
  children?: PortableTextSpan[];
};

export type SanityPortableText = PortableTextBlock[];

export type SanityAssetDimensions = {
  width: number;
  height: number;
  aspectRatio?: number;
};

export type SanityImageAsset = {
  _id: string;
  url?: string;
  mimeType?: string;
  originalFilename?: string;
  metadata?: { dimensions?: SanityAssetDimensions };
};

export type SanityFileAsset = {
  _id: string;
  url?: string;
  mimeType?: string;
  originalFilename?: string;
  metadata?: { dimensions?: SanityAssetDimensions };
};

export type SanityImageValue = {
  asset?: SanityImageAsset | { _ref: string };
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
};

export type SanityFileValue = {
  asset?: SanityFileAsset | { _ref: string };
};

export type SanityCollaborator = {
  _key?: string;
  name: string;
  contribution: string;
  url?: string;
};

export type SanityCaseStudyBlock = {
  heading?: string;
  body?: SanityPortableText;
};

export type SanityPresentationOverride = {
  frameWidth?: "default" | "narrow";
  mediaFit?: "default" | "cover";
  mediaType?: "default" | "graphic";
};

export type SanityMovement = {
  _key: string;
  mediaType: "still" | "film";
  still?: SanityImageValue;
  video?: SanityFileValue;
  poster?: SanityImageValue;
  webm?: SanityFileValue;
  alt: string;
  scale: MovementScale;
  pace: MovementPace;
  relation: MovementRelation;
  infoHint?: InfoSectionId;
  presentationOverride?: SanityPresentationOverride;
};

/** Sanity project document as the adapter expects it after a future query expands assets. */
export type SanityProject = {
  _id?: string;
  title: string;
  slug: { current: string };
  proposition: string;
  year: string;
  location?: string;
  sectors?: string[];
  disciplines?: string[];
  preview?: SanityImageValue;
  portfolioOrder: number;
  context: SanityPortableText;
  roles: string[];
  workingContext?: string;
  collaborators?: SanityCollaborator[];
  idea: SanityCaseStudyBlock;
  shift: SanityCaseStudyBlock;
  system: SanityCaseStudyBlock;
  outcome?: SanityCaseStudyBlock;
  movements: SanityMovement[];
  contributionNotes?: string;
  editorialPurpose?: string;
  replacementPriority?: number;
};

/** Catalog-owned browse chrome. Sanity does not invent these. */
export type CatalogPresentation = {
  crop: string;
  layout: BrowseLayout;
  visualSpan?: ProjectRecord["visualSpan"];
  visualStart?: ProjectRecord["visualStart"];
  visualBefore?: ProjectRecord["visualBefore"];
  homeSelected?: boolean;
  credits?: string[];
  features?: { name: string; url?: string }[];
  status?: ProjectRecord["status"];
  external?: string;
  collaborators?: CollaboratorId[];
};

export type AdapterMediaConfig = {
  projectId: string;
  dataset: string;
};

export type FrontendAuthorship = ExperienceAuthorship & {
  context: string;
  collaborators?: ExperienceCollaborator[];
};

export type FrontendInternal = {
  contributionNotes?: string;
  editorialPurpose?: string;
  replacementPriority?: number;
};

export type FrontendProject = {
  record: ProjectRecord;
  experience: ProjectExperience;
  authorship: FrontendAuthorship;
  portfolioOrder: number;
  internal: FrontendInternal;
  sanityOwned: {
    title: true;
    slug: true;
    proposition: true;
    year: true;
    location: true;
    sectors: true;
    disciplines: true;
    preview: true;
    portfolioOrder: true;
    context: true;
    roles: true;
    workingContext: true;
    collaborators: true;
    caseStudy: true;
    movements: true;
  };
  catalogOwned: {
    crop: true;
    layout: true;
    visualSpan: true;
    visualStart: true;
    visualBefore: true;
    homeSelected: true;
    credits: true;
    features: true;
    status: true;
  };
};

export type AdapterCode =
  | "INVALID_OUTCOME_HINT"
  | "TERMINAL_PAIR"
  | "MISSING_FIELD"
  | "MISSING_MEDIA"
  | "INVALID_SLUG";

export class AdapterError extends Error {
  readonly code: AdapterCode;

  constructor(code: AdapterCode, message: string) {
    super(message);
    this.name = "AdapterError";
    this.code = code;
  }
}

export const SECTORS: readonly Sector[] = [
  "Sports Nutrition",
  "FMCG",
  "Food",
  "Hospitality",
  "Photography",
  "Architecture",
  "Interior Design",
];

export const DISCIPLINES: readonly Discipline[] = [
  "Brand DNA",
  "Brand Identity",
  "Naming",
  "Visual Identity",
  "Packaging",
  "Signage/Wayfinding",
  "Website",
  "Print & Digital Design",
  "Motion",
  "Digital Design",
];
