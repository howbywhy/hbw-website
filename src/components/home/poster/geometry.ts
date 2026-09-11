import {
  isBoxShape,
  isLineShape,
  type BoxShapeObject,
  type Field,
  type ImageObject,
  type LegacyPixelObj,
  type LineShapeObject,
  type PosterObj,
  type RelPt,
  type StrokeObject,
  type TextObject,
} from "@/components/home/poster/types";

export type ViewedBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ViewedText = ViewedBox & { size: number };
export type ViewedLine = { x1: number; y1: number; x2: number; y2: number };
export type ViewedStroke = { points: { x: number; y: number }[] };

export function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}

export function boxFromNorm(nx: number, ny: number, nw: number, ratio: number, field: Field): ViewedBox {
  const w = nw * field.w;
  const h = ratio > 0 ? w / ratio : w;
  return { x: nx * field.w, y: ny * field.h, w, h };
}

export function viewText(obj: TextObject, field: Field): ViewedText {
  const box = boxFromNorm(obj.nx, obj.ny, obj.nw, obj.ratio, field);
  return { ...box, size: Math.max(8, box.h * obj.sizeRatio) };
}

export function viewBoxShape(obj: BoxShapeObject, field: Field): ViewedBox {
  return boxFromNorm(obj.nx, obj.ny, obj.nw, obj.ratio, field);
}

export function viewImage(obj: ImageObject, field: Field): ViewedBox {
  return boxFromNorm(obj.nx, obj.ny, obj.nw, obj.ratio, field);
}

export function viewLine(obj: LineShapeObject, field: Field): ViewedLine {
  return {
    x1: obj.nx1 * field.w,
    y1: obj.ny1 * field.h,
    x2: obj.nx2 * field.w,
    y2: obj.ny2 * field.h,
  };
}

export function viewStroke(obj: StrokeObject, field: Field): ViewedStroke {
  return {
    points: obj.points.map((p) => ({ x: p.nx * field.w, y: p.ny * field.h })),
  };
}

export function objectBox(obj: PosterObj, field: Field): ViewedBox {
  if (obj.kind === "text") return viewText(obj, field);
  if (obj.kind === "image") return viewImage(obj, field);
  if (obj.kind === "stroke") {
    const pts = viewStroke(obj, field).points;
    if (!pts.length) return { x: 0, y: 0, w: 8, h: 8 };
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, w: Math.max(8, Math.max(...xs) - x), h: Math.max(8, Math.max(...ys) - y) };
  }
  if (isLineShape(obj)) {
    const line = viewLine(obj, field);
    const x = Math.min(line.x1, line.x2);
    const y = Math.min(line.y1, line.y2);
    return { x, y, w: Math.max(8, Math.abs(line.x2 - line.x1)), h: Math.max(8, Math.abs(line.y2 - line.y1)) };
  }
  return viewBoxShape(obj, field);
}

export function writeBox(
  obj: TextObject | ImageObject | BoxShapeObject,
  px: ViewedBox,
  field: Field,
  size?: number
) {
  const w = Math.max(8, px.w);
  const h = Math.max(8, px.h);
  obj.nx = px.x / field.w;
  obj.ny = px.y / field.h;
  obj.nw = w / field.w;
  obj.ratio = w / h;
  if (obj.kind === "text" && size != null) obj.sizeRatio = size / h;
}

export function writeLine(obj: LineShapeObject, px: ViewedLine, field: Field) {
  obj.nx1 = px.x1 / field.w;
  obj.ny1 = px.y1 / field.h;
  obj.nx2 = px.x2 / field.w;
  obj.ny2 = px.y2 / field.h;
}

export function writeStroke(obj: StrokeObject, points: { x: number; y: number }[], field: Field) {
  obj.points = points.map((p) => ({ nx: p.x / field.w, ny: p.y / field.h }));
}

export function moveObject(obj: PosterObj, dx: number, dy: number, field: Field): PosterObj {
  const next = structuredClone(obj);
  if (next.kind === "text" || next.kind === "image" || isBoxShape(next)) {
    const box = objectBox(next, field);
    writeBox(next, { x: box.x + dx, y: box.y + dy, w: box.w, h: box.h }, field, next.kind === "text" ? viewText(next, field).size : undefined);
    return next;
  }
  if (isLineShape(next)) {
    const line = viewLine(next, field);
    writeLine(next, { x1: line.x1 + dx, y1: line.y1 + dy, x2: line.x2 + dx, y2: line.y2 + dy }, field);
    return next;
  }
  const pts = viewStroke(next, field).points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
  writeStroke(next, pts, field);
  if (next.originalPoints) {
    next.originalPoints = next.originalPoints.map((p) => ({
      nx: p.nx + dx / field.w,
      ny: p.ny + dy / field.h,
    }));
  }
  return next;
}

export type Handle = "nw" | "ne" | "sw" | "se";
export type SideHandle = "e" | "w";
export type LineEnd = "a" | "b";
export type DragHandle = Handle | SideHandle | LineEnd;

type PtLike = { x: number; y: number };

export const HANDLE_SLOP_MOUSE = 28;
export const HANDLE_SLOP_TOUCH = 36;

export function handleAnchor(box: ViewedBox, handle: Handle): PtLike {
  return {
    x: handle.includes("w") ? box.x + box.w : box.x,
    y: handle.includes("n") ? box.y + box.h : box.y,
  };
}

export function scaleBox(box: ViewedBox, handle: Handle, pointer: PtLike, min: number, ratio: number): ViewedBox {
  const safeRatio = ratio > 0.05 ? ratio : 1;
  const anchor = handleAnchor(box, handle);
  const rawW = Math.abs(pointer.x - anchor.x);
  const rawH = Math.abs(pointer.y - anchor.y);
  const scaleW = rawW / Math.max(1, box.w);
  const scaleH = rawH / Math.max(1, box.h);
  let scale = Math.max(scaleW, scaleH);
  if (!Number.isFinite(scale) || scale <= 0) scale = 1;
  let w = Math.max(min, box.w * scale);
  let h = w / safeRatio;
  const minH = min / safeRatio;
  if (h < minH) {
    h = minH;
    w = h * safeRatio;
  }
  const x = handle.includes("w") ? anchor.x - w : anchor.x;
  const y = handle.includes("n") ? anchor.y - h : anchor.y;
  return { x, y, w, h };
}

function mapPoint(p: PtLike, from: ViewedBox, to: ViewedBox): PtLike {
  const sx = to.w / Math.max(1, from.w);
  const sy = to.h / Math.max(1, from.h);
  return {
    x: to.x + (p.x - from.x) * sx,
    y: to.y + (p.y - from.y) * sy,
  };
}

function applyScaledBox(obj: PosterObj, from: ViewedBox, to: ViewedBox, field: Field): PosterObj {
  const next = structuredClone(obj);
  const sx = to.w / Math.max(1, from.w);
  if (next.kind === "stroke") {
    const pts = viewStroke(next, field).points.map((p) => mapPoint(p, from, to));
    writeStroke(next, pts, field);
    next.width = Math.max(1, Math.min(24, next.width * sx));
    if (next.originalPoints) {
      next.originalPoints = next.originalPoints.map((p) => {
        const mapped = mapPoint({ x: p.nx * field.w, y: p.ny * field.h }, from, to);
        return { nx: mapped.x / field.w, ny: mapped.y / field.h };
      });
    }
    return next;
  }
  if (isLineShape(next)) {
    const line = viewLine(next, field);
    const a = mapPoint({ x: line.x1, y: line.y1 }, from, to);
    const b = mapPoint({ x: line.x2, y: line.y2 }, from, to);
    writeLine(next, { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, field);
    next.weight = Math.max(1, Math.min(18, next.weight * sx));
    return next;
  }
  const box = objectBox(next, field);
  const mapped = {
    x: to.x + (box.x - from.x) * (to.w / Math.max(1, from.w)),
    y: to.y + (box.y - from.y) * (to.h / Math.max(1, from.h)),
    w: Math.max(8, box.w * (to.w / Math.max(1, from.w))),
    h: Math.max(8, box.h * (to.h / Math.max(1, from.h))),
  };
  if (next.kind === "text") {
    writeBox(next, mapped, field, Math.max(8, viewText(next, field).size * sx));
  } else if (next.kind === "image" || isBoxShape(next)) {
    writeBox(next, mapped, field);
  }
  return next;
}

export function scaleObject(obj: PosterObj, handle: Handle, pointer: PtLike, field: Field): PosterObj {
  const box = objectBox(obj, field);
  const ratio = box.w / Math.max(1, box.h);
  const min = obj.kind === "text" ? 48 : obj.kind === "stroke" ? 16 : 28;
  const scaled = scaleBox(box, handle, pointer, min, ratio);
  if (!isFiniteNumber(scaled.w) || scaled.w < 4 || scaled.h < 4) return obj;
  return applyScaledBox(obj, box, scaled, field);
}

export function unionBox(objects: PosterObj[], field: Field): ViewedBox | null {
  if (!objects.length) return null;
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const obj of objects) {
    const box = objectBox(obj, field);
    x1 = Math.min(x1, box.x);
    y1 = Math.min(y1, box.y);
    x2 = Math.max(x2, box.x + box.w);
    y2 = Math.max(y2, box.y + box.h);
  }
  if (!isFiniteNumber(x1) || !isFiniteNumber(y1) || x2 <= x1 || y2 <= y1) return null;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

export function scaleObjects(objects: PosterObj[], ids: string[], handle: Handle, pointer: PtLike, field: Field): PosterObj[] {
  const selected = objects.filter((o) => ids.includes(o.id));
  const group = unionBox(selected, field);
  if (!group) return objects;
  const scaled = scaleBox(group, handle, pointer, 36, group.w / Math.max(1, group.h));
  if (!isFiniteNumber(scaled.w) || scaled.w < 8 || scaled.h < 8) return objects;
  return objects.map((obj) => (ids.includes(obj.id) ? applyScaledBox(obj, group, scaled, field) : obj));
}

export function boxesIntersect(a: ViewedBox, b: ViewedBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function rectFromPoints(a: PtLike, b: PtLike): ViewedBox {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
}

export function marqueeHits(objects: PosterObj[], marquee: ViewedBox, field: Field): PosterObj[] {
  if (marquee.w < 4 && marquee.h < 4) return [];
  return objects.filter((obj) => boxesIntersect(objectBox(obj, field), marquee));
}

export function hit(obj: PosterObj, p: PtLike, field: Field): boolean {
  if (obj.kind === "stroke") {
    const pts = viewStroke(obj, field).points;
    return pts.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < Math.max(10, obj.width + 4));
  }
  if (obj.kind === "shape" && (obj.shape === "line" || obj.shape === "arrow")) {
    const line = viewLine(obj, field);
    return distToSegment(p, { x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 }) < 10;
  }
  const box = objectBox(obj, field);
  return p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
}

function distToSegment(p: PtLike, a: PtLike, b: PtLike) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  if (len < 1) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function nearHandleBox(box: ViewedBox, p: PtLike, slop = HANDLE_SLOP_MOUSE): Handle | null {
  const corners: [Handle, number, number][] = [
    ["nw", box.x, box.y],
    ["ne", box.x + box.w, box.y],
    ["sw", box.x, box.y + box.h],
    ["se", box.x + box.w, box.y + box.h],
  ];
  let best: Handle | null = null;
  let bestD = slop;
  for (const [id, x, y] of corners) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) {
      best = id;
      bestD = d;
    }
  }
  return best;
}

export function nearHandle(obj: PosterObj, p: PtLike, field: Field, slop = HANDLE_SLOP_MOUSE): Handle | null {
  return nearHandleBox(objectBox(obj, field), p, slop);
}

export function isCornerHandle(handle: DragHandle | null): handle is Handle {
  return handle === "nw" || handle === "ne" || handle === "sw" || handle === "se";
}

export function nearSideHandle(box: ViewedBox, p: PtLike, slop = HANDLE_SLOP_MOUSE): SideHandle | null {
  const midY = box.y + box.h / 2;
  const band = Math.max(20, box.h * 0.4);
  if (Math.abs(p.y - midY) > band) return null;
  const left = Math.abs(p.x - box.x);
  const right = Math.abs(p.x - (box.x + box.w));
  if (left <= slop && left <= right) return "w";
  if (right <= slop) return "e";
  return null;
}

export function reflowTextBox(
  obj: TextObject,
  side: SideHandle,
  pointer: PtLike,
  field: Field,
  measureH: (width: number, size: number) => number
): TextObject {
  const next = structuredClone(obj);
  const box = viewText(next, field);
  const size = box.size;
  const minW = Math.max(72, size * 1.4);
  const right = box.x + box.w;
  const w = side === "e" ? Math.max(minW, pointer.x - box.x) : Math.max(minW, right - pointer.x);
  const x = side === "e" ? box.x : right - w;
  const h = Math.max(size * 1.25, measureH(w, size));
  writeBox(next, { x, y: box.y, w, h }, field, size);
  return next;
}

export function nearLineEnd(obj: LineShapeObject, p: PtLike, field: Field, slop = HANDLE_SLOP_MOUSE): LineEnd | null {
  const line = viewLine(obj, field);
  const da = Math.hypot(p.x - line.x1, p.y - line.y1);
  const db = Math.hypot(p.x - line.x2, p.y - line.y2);
  if (da <= slop && da <= db) return "a";
  if (db <= slop) return "b";
  return null;
}

export function cornerCursor(handle: Handle): string {
  return handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize";
}

export function relPoints(points: { x: number; y: number }[], field: Field): RelPt[] {
  return points.map((p) => ({ nx: p.x / field.w, ny: p.y / field.h }));
}

export function normalizeLegacyObject(raw: LegacyPixelObj, field: Field): PosterObj | null {
  if (!field.w || !field.h) return null;
  if (raw.kind === "text") {
    const w = Math.max(8, raw.w);
    const h = Math.max(8, raw.h);
    return {
      id: raw.id,
      kind: "text",
      nx: raw.x / field.w,
      ny: raw.y / field.h,
      nw: w / field.w,
      ratio: w / h,
      sizeRatio: Math.max(0.2, Math.min(1.2, raw.size / h)),
      text: raw.text,
      color: raw.color,
      font: raw.font,
      align: raw.align,
    };
  }
  if (raw.kind === "image") {
    const w = Math.max(8, raw.w);
    const h = Math.max(8, raw.h);
    return {
      id: raw.id,
      kind: "image",
      nx: raw.x / field.w,
      ny: raw.y / field.h,
      nw: w / field.w,
      ratio: w / h,
      cx: 50,
      cy: 40,
      src: raw.src,
      mime: raw.mime,
    };
  }
  if (raw.kind === "stroke") {
    return {
      id: raw.id,
      kind: "stroke",
      points: relPoints(raw.points, field),
      originalPoints: raw.originalPoints ? relPoints(raw.originalPoints, field) : undefined,
      color: raw.color,
      width: raw.width,
    };
  }
  if (raw.shape === "line" || raw.shape === "arrow") {
    return {
      id: raw.id,
      kind: "shape",
      shape: raw.shape,
      nx1: raw.a.x / field.w,
      ny1: raw.a.y / field.h,
      nx2: raw.b.x / field.w,
      ny2: raw.b.y / field.h,
      color: raw.color,
      weight: 1.5,
    };
  }
  const x = Math.min(raw.a.x, raw.b.x);
  const y = Math.min(raw.a.y, raw.b.y);
  const w = Math.max(8, Math.abs(raw.b.x - raw.a.x));
  const h = Math.max(8, Math.abs(raw.b.y - raw.a.y));
  return {
    id: raw.id,
    kind: "shape",
    shape: raw.shape,
    nx: x / field.w,
    ny: y / field.h,
    nw: w / field.w,
    ratio: w / h,
    color: raw.color,
    fill: raw.fill,
    outline: !raw.fill,
    weight: 1.5,
  };
}

export function intersectsField(box: ViewedBox, field: Field, pad = 4) {
  return box.x + box.w > -pad && box.y + box.h > -pad && box.x < field.w + pad && box.y < field.h + pad;
}

export function migrationSafe(objects: PosterObj[], field: Field) {
  if (!field.w || !field.h) return false;
  for (const obj of objects) {
    const box = objectBox(obj, field);
    const nums = [box.x, box.y, box.w, box.h];
    if (obj.kind === "text") nums.push(viewText(obj, field).size);
    if (!nums.every(isFiniteNumber)) return false;
    if (box.w < 1 || box.h < 1) return false;
    if (!intersectsField(box, field, 32)) return false;
    if (obj.kind === "text" || obj.kind === "image" || isBoxShape(obj)) {
      if (!isFiniteNumber(obj.nx) || !isFiniteNumber(obj.ny) || !isFiniteNumber(obj.nw) || !isFiniteNumber(obj.ratio)) {
        return false;
      }
    }
  }
  return true;
}

export function viewAcross(obj: PosterObj, from: Field, to: Field): ViewedBox {
  return objectBox(obj, to);
}

export { type Field };
