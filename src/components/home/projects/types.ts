export type MovementKind = "portrait" | "landscape" | "film" | "full" | "field" | "graphic";

export type MovementSpan = "narrow" | "contained" | "wide" | "full";

export type MediaFit = "contain" | "cover";

export type InfoSectionId = "idea" | "shift" | "system" | "outcome";

export function spanForKind(kind: MovementKind): MovementSpan {
  if (kind === "full" || kind === "field") return "full";
  if (kind === "portrait" || kind === "graphic") return "narrow";
  return "wide";
}

export type ProjectMedia = {
  type: "image" | "video" | "gif";
  src: string;
  srcSet?: string;
  webm?: string;
  width: number;
  height: number;
  poster?: string;
  fit: MediaFit;
};

export type Movement = {
  id: string;
  kind: MovementKind;
  span?: MovementSpan;
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
  name: string;
  idea: string;
  year: string;
  credit: string;
  movements: Movement[];
  infoSections: InfoSection[];
};

export function movementSpan(movement: Movement): MovementSpan {
  return movement.span || spanForKind(movement.kind);
}

export function srcSetFor(src: string, widths: number[], intrinsic: number) {
  const ext = src.endsWith(".webp") ? "webp" : src.endsWith(".png") ? "png" : "jpg";
  if (ext !== "jpg" && ext !== "webp") return undefined;
  const base = src.replace(/\.(jpg|webp)$/, "");
  return widths.map((w) => `${base}-p-${w}.${ext} ${w}w`).concat(`${src} ${intrinsic}w`).join(", ");
}

export function infoHintForIndex(experience: ProjectExperience, index: number): InfoSectionId {
  const movement = experience.movements[Math.min(Math.max(0, index), experience.movements.length - 1)];
  if (movement) return movement.infoHint;
  const last = experience.infoSections[experience.infoSections.length - 1];
  return last?.id ?? "idea";
}
