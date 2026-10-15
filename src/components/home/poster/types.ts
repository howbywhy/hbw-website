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
  /** How the path is laid down. Absent means a solid line, so every stroke
   *  saved before the spray can existed still reads as one. */
  texture?: "line" | "spray";
  /**
   * How hard the can is held down.
   *
   * Absent means `SPRAY_ALPHA`, which was the only density there was — so a
   * stroke saved before this control existed lays down exactly as much paint
   * as it always did, and the thing is a new capability rather than a
   * migration.
   */
  alpha?: number;
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
/**
 * Defaults this paper has had before. A saved poster still sitting on one of
 * them never chose a colour — it just kept whatever the studio shipped — so it
 * moves to the current paper rather than stranding one visitor on old paper.
 *
 * The paper is white again, so the projects below it can be white with no seam
 * across the page. #FAF8F3 joins the list: it was the default and is not in
 * PALETTE, so nobody ever chose it on purpose.
 *
 * #FFFFFF leaves the list, because it is the current paper. It is in PALETTE
 * too, which makes "chose white" and "chose nothing" identical states — they
 * render the same, and picking a colour is one tap either way.
 */
export const LEGACY_FIELD_COLORS = ["#F4F5F3", "#FAF8F3"] as const;

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

/*
 * How wide a mark is, and how much paint it lays down.
 *
 * Stops, not sliders. A slider offers a thousand radii and a reason to fiddle
 * with all of them; four stops are a decision, they can each be a 24px target
 * a finger can hit, they read as a row of modules rather than as a widget, and
 * they can be stepped from the keyboard with [ and ]. The index into these
 * arrays is the whole of the control's state.
 *
 * The middle stop of each is what the tool already did, so a poster made
 * before the controls existed and a poster made after it with nothing touched
 * are the same poster.
 */

/** Spray radius in CSS px. Stop 1 — twelve — is what the can always was. */
export const SPRAY_RADII = [6, 12, 22, 40] as const;

/** Pencil line weight in CSS px. Stop 1 — 1.8 — is what the pencil always was. */
export const PENCIL_WEIGHTS = [1, 1.8, 3.5, 7] as const;

/** Dab opacity for a spray. Stop 1 is `SPRAY_ALPHA`, the only one there was. */
export const SPRAY_DENSITIES = [0.16, 0.34, 0.62] as const;

/** What a spray with no density of its own means. */
export const SPRAY_ALPHA = 0.34;

/**
 * A spray's radius is not its stored `width`.
 *
 * `StrokeObject.width` is a line weight for a pencil and a radius divisor for
 * a can — `sprayPath` has scattered its dabs over `max(5, width * 5)` since it
 * was written, and strokes already saved in sessionStorage are stored in that
 * unit. Rather than migrate them, the unit stays and these two name it, so the
 * controls can speak in pixels and nothing in the store has to change.
 */
export const SPRAY_RADIUS_UNIT = 5;

export function sprayRadius(width: number) {
  return Math.max(SPRAY_RADIUS_UNIT, width * SPRAY_RADIUS_UNIT);
}

export function sprayWidthFor(radius: number) {
  return radius / SPRAY_RADIUS_UNIT;
}

/** The stop a loose value is nearest, for showing a selected mark's own size. */
export function nearestStop(value: number, steps: readonly number[]) {
  let best = 0;
  for (let i = 1; i < steps.length; i++) {
    if (Math.abs(steps[i] - value) < Math.abs(steps[best] - value)) best = i;
  }
  return best;
}

/** Whether a stroke is a can or a pencil. Absent texture means a pencil. */
export function strokeTexture(obj: StrokeObject): "line" | "spray" {
  return obj.texture === "spray" ? "spray" : "line";
}

/**
 * A hex a person typed, or null.
 *
 * Three digits and a missing hash are both things people type, and both are
 * unambiguous, so both are accepted rather than rejected on a technicality.
 */
export function readHex(raw: string) {
  const body = raw.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(body)) return `#${body.toLowerCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(body)) {
    return `#${body
      .split("")
      .map((c) => c + c)
      .join("")
      .toLowerCase()}`;
  }
  return null;
}
