export type Pt = { x: number; y: number };

export type PosterFont = "Visual" | "Geist" | "Neuebit";

export type TextAlign = "left" | "center" | "right";

export type ShapeKind = "rect" | "ellipse" | "line" | "arrow";

export type PosterToolId = "text" | "pencil" | "marker" | "shape" | "upload";

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

export const POSTER_FONTS: { id: PosterFont; label: string }[] = [
  { id: "Visual", label: "Visual" },
  { id: "Geist", label: "Geist" },
  { id: "Neuebit", label: "Neuebit" },
];

export const FIELD_COLOR = "#F4F5F3";

export const PALETTE = ["#333333", "#1d1d1d", "#e23b2e", "#fcfa9b", "#f2ecde", "#ffffff"] as const;
