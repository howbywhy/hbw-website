import {
  hit as geomHit,
  nearHandle as geomNearHandle,
  objectBox as geomBox,
  viewBoxShape,
  viewImage,
  viewLine,
  viewStroke,
  viewText,
  type Handle,
} from "@/components/home/poster/geometry";
import { FIELD_COLOR, HBW_FONT, isBoxShape, type Field, type PosterObj, type Pt, type TextObject } from "@/components/home/poster/types";

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function textFont(obj: Pick<TextObject, "font"> & { size: number }) {
  return `400 ${obj.size}px ${obj.font}, ${HBW_FONT}`;
}

function drawArrow(ctx: CanvasRenderingContext2D, a: Pt, b: Pt) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const len = 12;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - len * Math.cos(ang - 0.4), b.y - len * Math.sin(ang - 0.4));
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - len * Math.cos(ang + 0.4), b.y - len * Math.sin(ang + 0.4));
  ctx.stroke();
}

const imageCache = new Map<string, HTMLImageElement>();

function imageEl(src: string, onReady: () => void) {
  const cached = imageCache.get(src);
  if (cached?.complete && cached.naturalWidth) return cached;
  const img = cached ?? new Image();
  if (!cached) {
    img.onload = () => onReady();
    img.src = src;
    imageCache.set(src, img);
  }
  return img.complete && img.naturalWidth ? img : null;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  box: { x: number; y: number; w: number; h: number },
  cx: number,
  cy: number
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih || box.w < 1 || box.h < 1) return;
  const scale = Math.max(box.w / iw, box.h / ih);
  const sw = box.w / scale;
  const sh = box.h / scale;
  const sx = Math.max(0, Math.min(iw - sw, (iw - sw) * (cx / 100)));
  const sy = Math.max(0, Math.min(ih - sh, (ih - sh) * (cy / 100)));
  ctx.drawImage(img, sx, sy, sw, sh, box.x, box.y, box.w, box.h);
}

let measure: CanvasRenderingContext2D | null = null;

function measureCtx() {
  if (!measure) {
    const canvas = document.createElement("canvas");
    measure = canvas.getContext("2d");
  }
  return measure;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para) {
      lines.push("");
      continue;
    }
    const words = para.split(" ");
    let line = words[0] || "";
    for (let i = 1; i < words.length; i++) {
      const next = `${line} ${words[i]}`;
      if (ctx.measureText(next).width <= maxW) line = next;
      else {
        lines.push(line);
        line = words[i];
      }
    }
    lines.push(line);
  }
  return lines;
}

export function measureTextBlock(obj: { size: number; font: TextObject["font"]; w: number; text: string }, text = obj.text) {
  const ctx = measureCtx();
  const lineH = obj.size * 1.25;
  if (!ctx) return { lines: text.split("\n"), h: Math.max(lineH, text.split("\n").length * lineH) };
  ctx.font = textFont(obj);
  const lines = wrapLines(ctx, text, Math.max(24, obj.w));
  return { lines, h: Math.max(lineH, lines.length * lineH) };
}

function pathTriangle(ctx: CanvasRenderingContext2D, b: { x: number; y: number; w: number; h: number }) {
  ctx.beginPath();
  ctx.moveTo(b.x + b.w / 2, b.y);
  ctx.lineTo(b.x + b.w, b.y + b.h);
  ctx.lineTo(b.x, b.y + b.h);
  ctx.closePath();
}

function pathStar(ctx: CanvasRenderingContext2D, b: { x: number; y: number; w: number; h: number }) {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const outer = Math.min(b.w, b.h) / 2;
  const inner = outer * 0.4;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function pathBlob(ctx: CanvasRenderingContext2D, b: { x: number; y: number; w: number; h: number }) {
  const { x, y, w, h } = b;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.55, y + h * 0.1);
  ctx.bezierCurveTo(x + w * 0.98, y + h * 0.02, x + w * 1.04, y + h * 0.48, x + w * 0.86, y + h * 0.74);
  ctx.bezierCurveTo(x + w * 0.74, y + h * 1.04, x + w * 0.26, y + h * 1.02, x + w * 0.12, y + h * 0.66);
  ctx.bezierCurveTo(x - w * 0.04, y + h * 0.36, x + w * 0.14, y + h * 0.04, x + w * 0.55, y + h * 0.1);
  ctx.closePath();
}

function paintBoxShape(
  ctx: CanvasRenderingContext2D,
  obj: { shape: string; color: string; stroke?: string; fill: boolean; outline: boolean; weight: number },
  b: { x: number; y: number; w: number; h: number }
) {
  const stroke = obj.stroke || obj.color;
  ctx.lineWidth = obj.weight;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (obj.shape === "rect") {
    if (obj.fill) {
      ctx.fillStyle = obj.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    if (obj.outline || !obj.fill) {
      ctx.strokeStyle = stroke;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }
    return;
  }
  if (obj.shape === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w / 2, 0.5), Math.max(b.h / 2, 0.5), 0, 0, Math.PI * 2);
  } else if (obj.shape === "triangle") pathTriangle(ctx, b);
  else if (obj.shape === "star") pathStar(ctx, b);
  else pathBlob(ctx, b);
  if (obj.fill) {
    ctx.fillStyle = obj.color;
    ctx.fill();
  }
  if (obj.outline || !obj.fill) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function drawCornerMarks(ctx: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }) {
  const len = 10;
  const pad = 6;
  const x = box.x - pad;
  const y = box.y - pad;
  const r = box.x + box.w + pad;
  const b = box.y + box.h + pad;
  ctx.save();
  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x, y + len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + len, y);
  ctx.moveTo(r - len, y);
  ctx.lineTo(r, y);
  ctx.lineTo(r, y + len);
  ctx.moveTo(x, b - len);
  ctx.lineTo(x, b);
  ctx.lineTo(x + len, b);
  ctx.moveTo(r - len, b);
  ctx.lineTo(r, b);
  ctx.lineTo(r, b - len);
  ctx.stroke();
  ctx.restore();
}

function drawSideMarks(ctx: CanvasRenderingContext2D, box: { x: number; y: number; w: number; h: number }) {
  const mid = box.y + box.h / 2;
  const pad = 6;
  ctx.save();
  ctx.strokeStyle = "rgba(51,51,51,0.38)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(box.x - pad, mid - 5);
  ctx.lineTo(box.x - pad, mid + 5);
  ctx.moveTo(box.x + box.w + pad, mid - 5);
  ctx.lineTo(box.x + box.w + pad, mid + 5);
  ctx.stroke();
  ctx.restore();
}

export function paint(
  ctx: CanvasRenderingContext2D,
  objects: PosterObj[],
  draft: PosterObj | null,
  cssW: number,
  cssH: number,
  opts?: {
    selectedIds?: string[];
    selectedId?: string | null;
    chrome?: boolean;
    caption?: string;
    skipId?: string | null;
    reposition?: boolean;
    marquee?: { x: number; y: number; w: number; h: number } | null;
    background?: string;
  }
) {
  const field: Field = { w: cssW, h: cssH };
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
  ctx.fillStyle = opts?.background || FIELD_COLOR;
  ctx.fillRect(0, 0, cssW, cssH);
  const all = draft ? objects.concat(draft) : objects;
  for (const obj of all) {
    if (opts?.skipId && obj.id === opts.skipId) continue;
    if (obj.kind === "stroke") {
      const pts = viewStroke(obj, field).points;
      ctx.strokeStyle = obj.color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = obj.width;
      if (pts.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    } else if (obj.kind === "shape" && (obj.shape === "line" || obj.shape === "arrow")) {
      const line = viewLine(obj, field);
      ctx.strokeStyle = obj.color;
      ctx.fillStyle = obj.color;
      ctx.lineWidth = obj.weight;
      ctx.lineCap = "square";
      ctx.lineJoin = "round";
      if (obj.shape === "arrow") drawArrow(ctx, { x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 });
      else {
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      }
    } else if (isBoxShape(obj)) {
      paintBoxShape(ctx, obj, viewBoxShape(obj, field));
    } else if (obj.kind === "text") {
      const t = viewText(obj, field);
      ctx.fillStyle = obj.color;
      ctx.font = textFont({ font: obj.font, size: t.size });
      ctx.textAlign = obj.align;
      ctx.textBaseline = "top";
      const lines = wrapLines(ctx, obj.text, Math.max(24, t.w));
      const x = obj.align === "center" ? t.x + t.w / 2 : obj.align === "right" ? t.x + t.w : t.x;
      lines.forEach((line, i) => ctx.fillText(line, x, t.y + i * t.size * 1.25));
    } else if (obj.kind === "image") {
      const box = viewImage(obj, field);
      const img = imageEl(obj.src, () => paint(ctx, objects, draft, cssW, cssH, opts));
      if (img) drawCover(ctx, img, box, obj.cx, obj.cy);
      if (opts?.reposition && (opts.selectedIds?.includes(obj.id) || opts.selectedId === obj.id)) {
        ctx.save();
        ctx.strokeStyle = "rgba(51,51,51,0.45)";
        ctx.lineWidth = 1;
        ctx.strokeRect(box.x + 0.5, box.y + 0.5, Math.max(0, box.w - 1), Math.max(0, box.h - 1));
        ctx.restore();
      }
    }
  }
  const selectedIds = (opts?.selectedIds?.length ? opts.selectedIds : opts?.selectedId ? [opts.selectedId] : []).filter(
    (id) => id !== opts?.skipId
  );
  if (opts?.chrome && selectedIds.length) {
    const selected = all.filter((o) => selectedIds.includes(o.id));
    if (selected.length === 1) {
      const only = selected[0]!;
      const box = geomBox(only, field);
      drawCornerMarks(ctx, box);
      if (only.kind === "text") drawSideMarks(ctx, box);
    } else if (selected.length > 1) {
      const xs = selected.map((o) => geomBox(o, field));
      const x = Math.min(...xs.map((b) => b.x));
      const y = Math.min(...xs.map((b) => b.y));
      const r = Math.max(...xs.map((b) => b.x + b.w));
      const b = Math.max(...xs.map((b) => b.y + b.h));
      drawCornerMarks(ctx, { x, y, w: r - x, h: b - y });
    }
  }
  if (opts?.marquee && opts.marquee.w > 2 && opts.marquee.h > 2) {
    ctx.save();
    ctx.fillStyle = "rgba(51,51,51,0.035)";
    ctx.strokeStyle = "rgba(51,51,51,0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.fillRect(opts.marquee.x, opts.marquee.y, opts.marquee.w, opts.marquee.h);
    ctx.strokeRect(opts.marquee.x + 0.5, opts.marquee.y + 0.5, opts.marquee.w - 1, opts.marquee.h - 1);
    ctx.restore();
  }
  if (opts?.caption) {
    ctx.fillStyle = "#333333";
    ctx.font = "400 13px Geist, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(opts.caption, 24, cssH - 22);
  }
}

export function objectBox(obj: PosterObj, field: Field) {
  return geomBox(obj, field);
}

export function hit(obj: PosterObj, p: Pt, field: Field) {
  return geomHit(obj, p, field);
}

export function nearHandle(obj: PosterObj, p: Pt, field: Field, slop = 16): Handle | null {
  return geomNearHandle(obj, p, field, slop);
}

export type { Handle };
