import { migrationSafe, normalizeLegacyObject } from "@/components/home/poster/geometry";
import {
  FIELD_COLOR,
  LEGACY_FIELD_COLOR,
  type Field,
  type LegacyPixelObj,
  type PosterFont,
  type PosterObj,
  type PosterState,
  type PosterToolId,
  type ShapeKind,
  type TextAlign,
} from "@/components/home/poster/types";

type LegacyPt = { x: number; y: number };

type RawLegacy =
  | { id: string; kind: "stroke"; points: LegacyPt[]; originalPoints?: LegacyPt[]; color: string; width: number }
  | { id: string; kind: "line"; a: LegacyPt; b: LegacyPt; color: string }
  | { id: string; kind: "rect"; a: LegacyPt; b: LegacyPt; color: string; fill: boolean }
  | { id: string; kind: "ellipse"; a: LegacyPt; b: LegacyPt; color: string }
  | { id: string; kind: "arrow"; a: LegacyPt; b: LegacyPt; color: string }
  | { id: string; kind: "text"; p: LegacyPt; text: string; color: string }
  | LegacyPixelObj
  | PosterObj;

const TOOLS: PosterToolId[] = ["text", "pencil", "shape", "upload"];
const FONTS: PosterFont[] = ["Visual", "Geist", "Neuebit"];
const ALIGNS: TextAlign[] = ["left", "center", "right"];
const SHAPES: ShapeKind[] = ["rect", "ellipse", "triangle", "star", "blob", "line", "arrow"];

function isObj(value: unknown): value is RawLegacy {
  return Boolean(value && typeof value === "object" && "kind" in value && "id" in value);
}

function isSchema3Object(raw: unknown): raw is PosterObj {
  if (!isObj(raw)) return false;
  if (raw.kind === "text") return "nx" in raw && "sizeRatio" in raw;
  if (raw.kind === "image") return "nx" in raw && "src" in raw;
  if (raw.kind === "stroke") {
    return Array.isArray(raw.points) && raw.points[0] != null && "nx" in raw.points[0];
  }
  if (raw.kind === "shape") {
    if (!("shape" in raw)) return false;
    if (raw.shape === "line" || raw.shape === "arrow") return "nx1" in raw;
    return "nx" in raw;
  }
  return false;
}

export function migrateObject(raw: unknown): LegacyPixelObj | PosterObj | null {
  if (!isObj(raw)) return null;
  if (isSchema3Object(raw)) return raw;
  if (raw.kind === "stroke" && Array.isArray(raw.points) && raw.points[0] && !("nx" in raw.points[0])) {
    return {
      id: raw.id,
      kind: "stroke",
      points: raw.points,
      originalPoints: "originalPoints" in raw ? raw.originalPoints : undefined,
      color: raw.color,
      width: raw.width,
    };
  }
  if (raw.kind === "shape" && "shape" in raw && "a" in raw && "b" in raw) {
    return {
      id: raw.id,
      kind: "shape",
      shape: raw.shape,
      a: raw.a,
      b: raw.b,
      color: raw.color,
      fill: "fill" in raw ? Boolean(raw.fill) : false,
    };
  }
  if (raw.kind === "image" && "src" in raw && "x" in raw) {
    return raw as LegacyPixelObj;
  }
  if (raw.kind === "text" && "x" in raw && "text" in raw && !("nx" in raw)) {
    return raw as LegacyPixelObj;
  }
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
    schema: 3,
    objects: [],
    legacyPixelObjects: null,
    decision: "",
    color: "#e23b2e",
    frozen: false,
    tool: "text",
    font: "Visual",
    textSize: 28,
    align: "left",
    shape: "rect",
    shapeFill: false,
    background: FIELD_COLOR,
  };
}

function readMeta(data: Partial<PosterState>, base: PosterState): Omit<PosterState, "schema" | "objects" | "legacyPixelObjects"> {
  const rawTool = data.tool as string | undefined;
  const tool = rawTool === "select" || rawTool === "marker" ? "text" : data.tool;
  return {
    decision: typeof data.decision === "string" ? data.decision : "",
    color: typeof data.color === "string" ? data.color : base.color,
    frozen: data.frozen === true,
    tool: TOOLS.includes(tool as PosterToolId) ? (tool as PosterToolId) : "text",
    font: FONTS.includes(data.font as PosterFont) ? (data.font as PosterFont) : "Visual",
    textSize: typeof data.textSize === "number" ? data.textSize : 28,
    align: ALIGNS.includes(data.align as TextAlign) ? (data.align as TextAlign) : "left",
    shape: SHAPES.includes(data.shape as ShapeKind) ? (data.shape as ShapeKind) : "rect",
    shapeFill: Boolean(data.shapeFill),
    background:
      typeof data.background === "string" && data.background && data.background.toUpperCase() !== LEGACY_FIELD_COLOR
        ? data.background
        : base.background,
  };
}

export function migratePoster(raw: unknown): PosterState {
  const base = emptyPoster();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Partial<PosterState> & { objects?: unknown; schema?: unknown };
  const meta = readMeta(data, base);
  const schema = data.schema === 3 ? 3 : data.schema === 2 ? 2 : undefined;
  const rawObjects = Array.isArray(data.objects) ? data.objects : [];

  if (schema === 3 && rawObjects.every(isSchema3Object)) {
    return {
      ...base,
      ...meta,
      schema: 3,
      objects: rawObjects.filter(isSchema3Object),
      legacyPixelObjects: null,
    };
  }

  const legacy = rawObjects.map(migrateObject).filter((obj): obj is LegacyPixelObj => {
    return Boolean(obj && !isSchema3Object(obj));
  });
  const already3 = rawObjects.filter(isSchema3Object);

  if (schema === 3 && !legacy.length) {
    return { ...base, ...meta, schema: 3, objects: already3, legacyPixelObjects: null };
  }

  if (legacy.length || schema === 2 || schema == null) {
    return {
      ...base,
      ...meta,
      schema: 2,
      objects: already3,
      legacyPixelObjects: legacy.length ? legacy : null,
    };
  }

  return { ...base, ...meta };
}

export function promoteLegacyPoster(state: PosterState, field: Field): PosterState | null {
  if (state.schema === 3 && !state.legacyPixelObjects?.length) return state;
  if (!field.w || !field.h) return null;
  const converted = (state.legacyPixelObjects || [])
    .map((obj) => normalizeLegacyObject(obj, field))
    .filter((obj): obj is PosterObj => Boolean(obj));
  const objects = state.objects.concat(converted);
  if (!migrationSafe(objects, field)) return null;
  return {
    ...state,
    schema: 3,
    objects,
    legacyPixelObjects: null,
  };
}
