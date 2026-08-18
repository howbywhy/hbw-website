export type Pt = { x: number; y: number };

/** Matches `--hbw-font`. Canvas cannot read CSS custom properties. */
export const HBW_FONT = "Geist, sans-serif";

export const POSTER_FONTS = [
  { id: "Visual", label: "Visual" },
  { id: "Geist", label: "Geist" },
  { id: "Neuebit", label: "Neuebit" },
] as const;

export type PosterFont = (typeof POSTER_FONTS)[number]["id"];

export type TextAlign = "left" | "center" | "right";

export type ShapeKind = "rect" | "ellipse" | "line" | "arrow";

export type PosterToolId = "select" | "text" | "pencil" | "marker" | "shape" | "upload";

export type TextObject = {
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

export type StrokeObject = {
  id: string;
  kind: "stroke";
  points: Pt[];
  originalPoints?: Pt[];
  color: string;
  width: number;
};

export type ShapeObject = {
  id: string;
  kind: "shape";
  shape: ShapeKind;
  a: Pt;
  b: Pt;
  color: string;
  fill: boolean;
};

export type ImageObject = {
  id: string;
  kind: "image";
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
  mime: string;
};

export type PosterObj = TextObject | StrokeObject | ShapeObject | ImageObject;

export type PosterState = {
  schema: 2;
  objects: PosterObj[];
  decision: string;
  color: string;
  frozen: boolean;
  tool: PosterToolId;
  font: PosterFont;
  textSize: number;
  align: TextAlign;
  shape: ShapeKind;
  shapeFill: boolean;
};

export const FIELD_COLOR = "#F4F5F3";

export const PALETTE = [
  "#1d1d1d",
  "#ffffff",
  "#fcfa9b",
  "#e23b2e",
  "#d4652a",
  "#c4a35a",
  "#3d6b8a",
  "#4a7c6f",
  "#5b6aa8",
  "#333333",
  "#8a8680",
  "#c8c4bb",
  "#f2ecde",
] as const;
