import { FIELD_COLOR, HBW_FONT, type PosterObj, type Pt, type ShapeObject, type TextObject } from "@/components/home/poster/types";

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function bounds(a: Pt, b: Pt) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
}

export function shapeBox(obj: ShapeObject) {
  return bounds(obj.a, obj.b);
}

export function textFont(obj: Pick<TextObject, "size" | "font">) {
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

export function measureTextBlock(obj: Pick<TextObject, "size" | "font" | "w" | "text">, text = obj.text) {
  const ctx = measureCtx();
  const lineH = obj.size * 1.25;
  if (!ctx) return { lines: text.split("\n"), h: Math.max(lineH, text.split("\n").length * lineH) };
  ctx.font = textFont(obj);
  const lines = wrapLines(ctx, text, Math.max(24, obj.w));
  return { lines, h: Math.max(lineH, lines.length * lineH) };
}

export function paint(
  ctx: CanvasRenderingContext2D,
  objects: PosterObj[],
  draft: PosterObj | null,
  cssW: number,
  cssH: number,
  opts?: { selectedId?: string | null; chrome?: boolean; caption?: string; skipId?: string | null }
) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, cssW, cssH);
  const all = draft ? objects.concat(draft) : objects;
  for (const obj of all) {
    if (opts?.skipId && obj.id === opts.skipId) continue;
    if (obj.kind === "stroke") {
      ctx.strokeStyle = obj.color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = obj.width;
      if (obj.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(obj.points[0].x, obj.points[0].y);
      for (let i = 1; i < obj.points.length; i++) ctx.lineTo(obj.points[i].x, obj.points[i].y);
      ctx.stroke();
    } else if (obj.kind === "shape") {
      ctx.strokeStyle = obj.color;
      ctx.fillStyle = obj.color;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (obj.shape === "line") {
        ctx.beginPath();
        ctx.moveTo(obj.a.x, obj.a.y);
        ctx.lineTo(obj.b.x, obj.b.y);
        ctx.stroke();
      } else if (obj.shape === "arrow") {
        drawArrow(ctx, obj.a, obj.b);
      } else if (obj.shape === "rect") {
        const b = bounds(obj.a, obj.b);
        if (obj.fill) ctx.fillRect(b.x, b.y, b.w, b.h);
        else ctx.strokeRect(b.x, b.y, b.w, b.h);
      } else {
        const b = bounds(obj.a, obj.b);
        ctx.beginPath();
        ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w / 2, 0.5), Math.max(b.h / 2, 0.5), 0, 0, Math.PI * 2);
        if (obj.fill) ctx.fill();
        else ctx.stroke();
      }
    } else if (obj.kind === "text") {
      ctx.fillStyle = obj.color;
      ctx.font = textFont(obj);
      ctx.textAlign = obj.align;
      ctx.textBaseline = "top";
      const lines = wrapLines(ctx, obj.text, Math.max(24, obj.w));
      const x =
        obj.align === "center" ? obj.x + obj.w / 2 : obj.align === "right" ? obj.x + obj.w : obj.x;
      lines.forEach((line, i) => ctx.fillText(line, x, obj.y + i * obj.size * 1.25));
    } else if (obj.kind === "image") {
      const img = imageEl(obj.src, () => paint(ctx, objects, draft, cssW, cssH, opts));
      if (img) ctx.drawImage(img, obj.x, obj.y, obj.w, obj.h);
    }
  }
  if (opts?.chrome && opts.selectedId && opts.selectedId !== opts.skipId) {
    const selected = all.find((o) => o.id === opts.selectedId);
    if (selected) {
      const box = objectBox(selected);
      ctx.save();
      ctx.strokeStyle = "rgba(51,51,51,0.55)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(box.x - 2, box.y - 2, box.w + 4, box.h + 4);
      ctx.restore();
    }
  }
  if (opts?.caption) {
    ctx.fillStyle = "#333333";
    ctx.font = "400 13px Geist, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(opts.caption, 24, cssH - 22);
  }
}

export function objectBox(obj: PosterObj) {
  if (obj.kind === "text" || obj.kind === "image") {
    return { x: obj.x, y: obj.y, w: obj.w, h: obj.h };
  }
  if (obj.kind === "stroke") {
    const xs = obj.points.map((p) => p.x);
    const ys = obj.points.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, w: Math.max(8, Math.max(...xs) - x), h: Math.max(8, Math.max(...ys) - y) };
  }
  return bounds(obj.a, obj.b);
}

export function hit(obj: PosterObj, p: Pt): boolean {
  if (obj.kind === "stroke") {
    return obj.points.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < Math.max(10, obj.width + 4));
  }
  const box = objectBox(obj);
  return p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
}

export function moveObject(obj: PosterObj, dx: number, dy: number): PosterObj {
  if (obj.kind === "text" || obj.kind === "image") {
    return { ...obj, x: obj.x + dx, y: obj.y + dy };
  }
  if (obj.kind === "stroke") {
    return {
      ...obj,
      points: obj.points.map((q) => ({ x: q.x + dx, y: q.y + dy })),
      originalPoints: obj.originalPoints?.map((q) => ({ x: q.x + dx, y: q.y + dy })),
    };
  }
  return {
    ...obj,
    a: { x: obj.a.x + dx, y: obj.a.y + dy },
    b: { x: obj.b.x + dx, y: obj.b.y + dy },
  };
}

export function scaleObject(obj: PosterObj, handle: Pt, origin: Pt): PosterObj {
  if (obj.kind !== "text" && obj.kind !== "image") return obj;
  const w = Math.max(32, handle.x - origin.x);
  const h = Math.max(24, handle.y - origin.y);
  return { ...obj, w, h };
}

export function nearHandle(obj: PosterObj, p: Pt) {
  if (obj.kind !== "text" && obj.kind !== "image") return false;
  const hx = obj.x + obj.w;
  const hy = obj.y + obj.h;
  return Math.hypot(p.x - hx, p.y - hy) < 14;
}
