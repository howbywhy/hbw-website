import { FIELD_COLOR, type PosterObj } from "@/components/home/poster/types";

const SEND_EDGE = 1400;
const SEND_QUALITY = 0.88;

const MAX_EDGE = 1400;
const MAX_BYTES = 380_000;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

export async function fileToImageObjectSource(file: File): Promise<{ src: string; mime: string; w: number; h: number }> {
  const mime = file.type || "image/jpeg";
  if (mime === "image/svg+xml") {
    const text = await file.text();
    if (/<script/i.test(text) || /on\w+=/i.test(text)) {
      throw new Error("svg");
    }
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
    const img = await loadImage(src);
    return { src, mime, w: img.naturalWidth || 800, h: img.naturalHeight || 800 };
  }
  if (!/^image\/(png|jpeg|jpg|webp)$/i.test(mime)) {
    throw new Error("type");
  }
  const raw = URL.createObjectURL(file);
  try {
    const img = await loadImage(raw);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, w, h);
    let quality = 0.72;
    let src = canvas.toDataURL("image/jpeg", quality);
    while (src.length > MAX_BYTES && quality > 0.42) {
      quality -= 0.08;
      src = canvas.toDataURL("image/jpeg", quality);
    }
    return { src, mime: "image/jpeg", w, h };
  } finally {
    URL.revokeObjectURL(raw);
  }
}

/** 1× JPEG, longest edge 1400. Keeps the send body under Vercel’s 4.5 MB ceiling. */
export function canvasToSendDataUrl(canvas: HTMLCanvasElement): string {
  const cssW = canvas.clientWidth || canvas.width;
  const cssH = canvas.clientHeight || canvas.height;
  if (cssW < 1 || cssH < 1) return "";
  const scale = Math.min(1, SEND_EDGE / Math.max(cssW, cssH));
  const w = Math.max(1, Math.round(cssW * scale));
  const h = Math.max(1, Math.round(cssH * scale));
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = FIELD_COLOR;
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(canvas, 0, 0, w, h);
  return out.toDataURL("image/jpeg", SEND_QUALITY);
}

export function persistableObjects(objects: PosterObj[]): PosterObj[] {
  let budget = 1_600_000;
  const out: PosterObj[] = [];
  for (const obj of objects) {
    if (obj.kind === "image") {
      const cost = obj.src.length;
      if (cost > budget) continue;
      budget -= cost;
    }
    out.push(obj);
  }
  return out;
}
