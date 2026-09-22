export type Pt = { x: number; y: number };
export type RelPt = { nx: number; ny: number };
export type Field = { w: number; h: number };

/** Matches `--hbw-font`. Canvas cannot read CSS custom properties. */
export const HBW_FONT = "Geist, sans-serif";

export const POSTER_FONTS = [
  { id: "Visual", label: "Visual" },
  { id: "Geist", label: "Geist" },
  { id: "Neuebit", label: "Neuebit" },
] as const;

export type PosterFont = (typeof POSTER_FONTS)[number]["id"];

export type TextAlign = "left" | "center" | "right";

export type BoxShapeKind = "rect" | "ellipse" | "triangle" | "star" | "blob";
export type ShapeKind = BoxShapeKind | "line" | "arrow";
export const BOX_SHAPES: BoxShapeKind[] = ["rect", "ellipse", "triangle", "star", "blob"];

export type PosterToolId = "text" | "pencil" | "shape" | "upload";

export type TextObject = {
  id: string;
  kind: "text";
  nx: number;
  ny: number;
  nw: number;
  ratio: number;
  sizeRatio: number;
  text: string;
  color: string;
  font: PosterFont;
  align: TextAlign;
};

export type StrokeObject = {
  id: string;
  kind: "stroke";
  points: RelPt[];
  originalPoints?: RelPt[];
  color: string;
  width: number;
};

export type BoxShapeObject = {
  id: string;
  kind: "shape";
  shape: BoxShapeKind;
  nx: number;
  ny: number;
  nw: number;
  ratio: number;
  color: string;
  stroke?: string;
  fill: boolean;
  outline: boolean;
  weight: number;
};

export type LineShapeObject = {
  id: string;
  kind: "shape";
  shape: "line" | "arrow";
  nx1: number;
  ny1: number;
  nx2: number;
  ny2: number;
  color: string;
  weight: number;
};

export type ShapeObject = BoxShapeObject | LineShapeObject;

export type ImageObject = {
  id: string;
  kind: "image";
  nx: number;
  ny: number;
  nw: number;
  ratio: number;
  cx: number;
  cy: number;
  src: string;
  mime: string;
};

export type PosterObj = TextObject | StrokeObject | ShapeObject | ImageObject;

export function isBoxShape(obj: PosterObj): obj is BoxShapeObject {
  return obj.kind === "shape" && BOX_SHAPES.includes(obj.shape as BoxShapeKind);
}

export function isLineShape(obj: PosterObj): obj is LineShapeObject {
  return obj.kind === "shape" && (obj.shape === "line" || obj.shape === "arrow");
}

export type LegacyTextObject = {
  id: string;
  kind: "text";
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
  font: PosterFont;
  size: number;
  align: TextAlign;
};

export type LegacyStrokeObject = {
  id: string;
  kind: "stroke";
  points: Pt[];
  originalPoints?: Pt[];
  color: string;
  width: number;
};

export type LegacyShapeObject = {
  id: string;
  kind: "shape";
  shape: ShapeKind;
  a: Pt;
  b: Pt;
  color: string;
  fill: boolean;
};

export type LegacyImageObject = {
  id: string;
  kind: "image";
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
  mime: string;
};

export type LegacyPixelObj = LegacyTextObject | LegacyStrokeObject | LegacyShapeObject | LegacyImageObject;

export type PosterState = {
  schema: 2 | 3;
  objects: PosterObj[];
  legacyPixelObjects: LegacyPixelObj[] | null;
  decision: string;
  color: string;
  frozen: boolean;
  tool: PosterToolId;
  font: PosterFont;
  textSize: number;
  align: TextAlign;
  shape: ShapeKind;
  shapeFill: boolean;
  background: string;
};

export const FIELD_COLOR = "#FFFFFF";
/** The previous default paper. Saved posters that never chose a colour move to the new white. */
export const LEGACY_FIELD_COLOR = "#F4F5F3";

export const PALETTE = [
  "#e23b2e",
  "#1d1d1d",
  "#ffffff",
  "#8a8680",
  "#fcfa9b",
  "#3d6b8a",
  "#4a7c6f",
  "#d4652a",
  "#c45a7a",
  "#7a4a2e",
] as const;
