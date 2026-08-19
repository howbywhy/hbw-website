import {
  type PosterFont,
  type PosterObj,
  type PosterState,
  type PosterToolId,
  type ShapeKind,
  type TextAlign,
} from "@/components/home/poster/types";

type LegacyPt = { x: number; y: number };

type LegacyObj =
  | { id: string; kind: "stroke"; points: LegacyPt[]; color: string; width: number }
  | { id: string; kind: "line"; a: LegacyPt; b: LegacyPt; color: string }
  | { id: string; kind: "rect"; a: LegacyPt; b: LegacyPt; color: string; fill: boolean }
  | { id: string; kind: "ellipse"; a: LegacyPt; b: LegacyPt; color: string }
  | { id: string; kind: "arrow"; a: LegacyPt; b: LegacyPt; color: string }
  | { id: string; kind: "text"; p: LegacyPt; text: string; color: string }
  | PosterObj;

const TOOLS: PosterToolId[] = ["select", "text", "pencil", "marker", "shape", "upload"];
const FONTS: PosterFont[] = ["Visual", "Geist", "Neuebit"];
const ALIGNS: TextAlign[] = ["left", "center", "right"];
const SHAPES: ShapeKind[] = ["rect", "ellipse", "line", "arrow"];

function isObj(value: unknown): value is LegacyObj {
  return Boolean(value && typeof value === "object" && "kind" in value && "id" in value);
}

export function migrateObject(raw: unknown): PosterObj | null {
  if (!isObj(raw)) return null;
  if (raw.kind === "stroke" && Array.isArray(raw.points)) {
    return {
      id: raw.id,
      kind: "stroke",
      points: raw.points,
      originalPoints: "originalPoints" in raw ? (raw as PosterObj & { kind: "stroke" }).originalPoints : undefined,
      color: raw.color,
      width: raw.width,
    };
  }
  if (raw.kind === "shape" && "shape" in raw) return raw;
  if (raw.kind === "image" && "src" in raw) return raw;
  if (raw.kind === "text" && "x" in raw && "text" in raw) return raw as PosterObj;
  if (raw.kind === "text" && "p" in raw) {
    return {
      id: raw.id,
      kind: "text",
      x: raw.p.x,
      y: raw.p.y - 28,
      w: 280,
      h: 40,
      text: raw.text,
      color: raw.color,
      font: "Visual",
      size: 28,
      align: "left",
    };
  }
  if (raw.kind === "line") {
    return { id: raw.id, kind: "shape", shape: "line", a: raw.a, b: raw.b, color: raw.color, fill: false };
  }
  if (raw.kind === "rect") {
    return { id: raw.id, kind: "shape", shape: "rect", a: raw.a, b: raw.b, color: raw.color, fill: raw.fill };
  }
  if (raw.kind === "ellipse") {
    return { id: raw.id, kind: "shape", shape: "ellipse", a: raw.a, b: raw.b, color: raw.color, fill: false };
  }
  if (raw.kind === "arrow") {
    return { id: raw.id, kind: "shape", shape: "arrow", a: raw.a, b: raw.b, color: raw.color, fill: false };
  }
  return null;
}

export function emptyPoster(): PosterState {
  return {
    schema: 2,
    objects: [],
    decision: "",
    color: "#e23b2e",
    frozen: false,
    tool: "select",
    font: "Visual",
    textSize: 28,
    align: "left",
    shape: "rect",
    shapeFill: false,
  };
}

export function migratePoster(raw: unknown): PosterState {
  const base = emptyPoster();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Partial<PosterState> & { objects?: unknown };
  const objects = Array.isArray(data.objects)
    ? data.objects.map(migrateObject).filter((obj): obj is PosterObj => Boolean(obj))
    : [];
  return {
    ...base,
    objects,
    decision: typeof data.decision === "string" ? data.decision : "",
    color: typeof data.color === "string" ? data.color : base.color,
    frozen: data.frozen === true,
    tool: TOOLS.includes(data.tool as PosterToolId) ? (data.tool as PosterToolId) : "select",
    font: FONTS.includes(data.font as PosterFont) ? (data.font as PosterFont) : "Visual",
    textSize: typeof data.textSize === "number" ? data.textSize : 28,
    align: ALIGNS.includes(data.align as TextAlign) ? (data.align as TextAlign) : "left",
    shape: SHAPES.includes(data.shape as ShapeKind) ? (data.shape as ShapeKind) : "rect",
    shapeFill: Boolean(data.shapeFill),
  };
}
