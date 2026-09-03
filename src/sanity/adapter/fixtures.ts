import type { Movement } from "../../components/home/projects/types";
import type {
  AdapterMediaConfig,
  CatalogPresentation,
  SanityImageValue,
  SanityMovement,
  SanityPortableText,
  SanityProject,
} from "./types";

export const TEST_MEDIA: AdapterMediaConfig = { projectId: "aagd1kcy", dataset: "production" };

export const EMPTY_CATALOG: CatalogPresentation = {
  crop: "center",
  layout: "portrait",
};

export function blocks(...paragraphs: string[]): SanityPortableText {
  return paragraphs.map((text, index) => ({
    _type: "block",
    _key: `b${index}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", text, marks: [] }],
  }));
}

export function markedBlock(text: string, marks: string[], markDefs: SanityPortableText[number]["markDefs"] = []) {
  return {
    _type: "block" as const,
    _key: "marked",
    style: "normal",
    markDefs,
    children: [{ _type: "span" as const, text, marks }],
  };
}

export function localImage(src: string, width: number, height: number): SanityImageValue {
  return {
    asset: {
      _id: `image-local-${width}x${height}-jpg`,
      url: src,
      metadata: { dimensions: { width, height } },
    },
  };
}

export function localFile(src: string, width: number, height: number, ext = "mp4") {
  return {
    asset: {
      _id: `file-local-${ext}`,
      url: src,
      metadata: { dimensions: { width, height } },
    },
  };
}

export function stillMovement(
  key: string,
  src: string,
  width: number,
  height: number,
  extra: Partial<SanityMovement> = {}
): SanityMovement {
  return {
    _key: key,
    mediaType: "still",
    still: localImage(src, width, height),
    alt: extra.alt ?? key,
    scale: extra.scale ?? "standard",
    pace: extra.pace ?? "normal",
    relation: extra.relation ?? "single",
    infoHint: extra.infoHint,
    presentationOverride: extra.presentationOverride,
  };
}

export function filmMovement(
  key: string,
  src: string,
  poster: string,
  width: number,
  height: number,
  extra: Partial<SanityMovement> = {}
): SanityMovement {
  return {
    _key: key,
    mediaType: "film",
    video: localFile(src, width, height),
    poster: localImage(poster, width, height),
    webm: extra.webm,
    alt: extra.alt ?? key,
    scale: extra.scale ?? "standard",
    pace: extra.pace ?? "normal",
    relation: extra.relation ?? "single",
    infoHint: extra.infoHint,
    presentationOverride: extra.presentationOverride,
  };
}

export function baseProject(overrides: Partial<SanityProject> = {}): SanityProject {
  return {
    title: "CMS Schema Test",
    slug: { current: "cms-schema-test" },
    proposition: "Disposable fixture",
    year: "2026",
    preview: localImage("/tmp/preview.jpg", 800, 1000),
    portfolioOrder: 99,
    context: blocks("Context paragraph."),
    roles: ["Brand Strategy"],
    idea: { heading: "The idea", body: blocks("Idea body.") },
    shift: { heading: "The shift", body: blocks("Shift body.") },
    system: { heading: "The system", body: blocks("System body.") },
    movements: [stillMovement("m1", "/tmp/still.jpg", 1080, 1350)],
    ...overrides,
  };
}

export function movementFromShipped(movement: Movement): SanityMovement {
  const media = movement.media;
  const mapped: SanityMovement = {
    _key: movement.id,
    mediaType: media.type === "video" ? "film" : "still",
    alt: media.alt ?? movement.id,
    scale: movement.scale ?? "standard",
    pace: movement.pace ?? "normal",
    relation: movement.relation ?? "single",
    infoHint: movement.infoHint,
  };
  if (media.type === "video") {
    mapped.video = localFile(media.mp4 || media.src, media.width, media.height);
    mapped.poster = localImage(media.poster || media.src, media.width, media.height);
    if (media.webm) mapped.webm = localFile(media.webm, media.width, media.height, "webm");
  } else {
    mapped.still = localImage(media.src, media.width, media.height);
  }
  const override = {
    ...(movement.span === "narrow" ? { frameWidth: "narrow" as const } : {}),
    ...(movement.kind === "graphic" ? { mediaType: "graphic" as const } : {}),
    ...(media.fit === "cover" ? { mediaFit: "cover" as const } : {}),
  };
  if (override.frameWidth || override.mediaType || override.mediaFit) {
    mapped.presentationOverride = override;
  }
  return mapped;
}
