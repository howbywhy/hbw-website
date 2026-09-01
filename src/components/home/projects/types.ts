export type MovementKind = "portrait" | "landscape" | "film" | "full" | "field" | "graphic";

export type MovementSpan = "narrow" | "contained" | "wide" | "full";

export type MovementScale = "major" | "standard" | "detail";

export type MovementPace = "tight" | "normal" | "pause";

export type MovementRelation = "single" | "pair";

export type MediaFit = "contain" | "cover";

export type InfoSectionId = "idea" | "shift" | "system" | "outcome";

export function spanForKind(kind: MovementKind): MovementSpan {
  if (kind === "full" || kind === "field") return "full";
  if (kind === "portrait" || kind === "graphic") return "narrow";
  return "wide";
}

export type ProjectMedia = {
  type: "image" | "video";
  src: string;
  srcSet?: string;
  mp4?: string;
  webm?: string;
  videoSrc?: string;
  width: number;
  height: number;
  poster?: string;
  /** Editorial text alternative for gallery stills and film posters. Not used on contact-sheet thumbs. */
  alt?: string;
  fit: MediaFit;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
};

/** Shared archive/peek slot. `src` is always a raster (image or video poster). */
export type ArchiveMedia = {
  type: "image" | "video";
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  crop: string;
  poster?: string;
  videoSrc?: string;
  mp4?: string;
  webm?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
};

export function isVideoMedia(media: { type?: string }) {
  return media.type === "video";
}

export type Movement = {
  id: string;
  kind: MovementKind;
  span?: MovementSpan;
  scale?: MovementScale;
  pace?: MovementPace;
  relation?: MovementRelation;
  surface?: string;
  align?: "start" | "center" | "end";
  media: ProjectMedia;
  infoHint: InfoSectionId;
};

export type InfoSection = {
  id: InfoSectionId;
  heading: string;
  copy: string;
};

export type ProjectExperience = {
  slug: string;
  movements: Movement[];
  infoSections: InfoSection[];
};

export function movementSpan(movement: Movement): MovementSpan {
  if (movement.span) return movement.span;
  if (movement.scale === "major") return movement.kind === "portrait" || movement.kind === "graphic" ? "wide" : "full";
  if (movement.scale === "detail") return "contained";
  return spanForKind(movement.kind);
}

export function movementPace(movement: Movement): MovementPace {
  if (movement.pace) return movement.pace;
  if (movement.relation === "pair") return "tight";
  return "normal";
}

export function infoHintForIndex(experience: ProjectExperience, index: number): InfoSectionId {
  const movement = experience.movements[Math.min(Math.max(0, index), experience.movements.length - 1)];
  if (movement) return movement.infoHint;
  const last = experience.infoSections[experience.infoSections.length - 1];
  return last?.id ?? "idea";
}
