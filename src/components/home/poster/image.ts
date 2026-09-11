import { FIELD_COLOR, type PosterObj } from "@/components/home/poster/types";

const SEND_EDGE = 1400;
const SEND_QUALITY = 0.88;

const MAX_EDGE = 1400;
const MAX_BYTES = 380_000;

const POSTER_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export function imageMimeFromFile(file: { type?: string; name?: string }): string {
  const type = (file.type || "").toLowerCase();
  if (type === "image/jpg") return "image/jpeg";
  if (POSTER_IMAGE_MIMES.has(type)) return type === "image/jpg" ? "image/jpeg" : type;
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".svg")) return "image/svg+xml";
  return type;
}

export function isPosterImageMime(mime: string): boolean {
  const next = mime === "image/jpg" ? "image/jpeg" : mime;
  return POSTER_IMAGE_MIMES.has(next);
}

/** GIF and SVG keep their source bytes. PNG/WEBP must not be flattened to JPEG. */
export function rasterEncodeMime(mime: string): "image/png" | "image/jpeg" | "image/webp" | null {
  if (mime === "image/png") return "image/png";
  if (mime === "image/webp") return "image/webp";
  if (mime === "image/jpeg" || mime === "image/jpg") return "image/jpeg";
  return null;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("file"));
    reader.readAsDataURL(file);
  });
}

function drawFitted(img: HTMLImageElement, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

export async function fileToImageObjectSource(file: File): Promise<{ src: string; mime: string; w: number; h: number }> {
  const mime = imageMimeFromFile(file);
  if (!isPosterImageMime(mime)) throw new Error("type");

  if (mime === "image/svg+xml") {
    const text = await file.text();
    if (/<script/i.test(text) || /on\w+=/i.test(text)) {
      throw new Error("svg");
    }
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
    const img = await loadImage(src);
    return { src, mime, w: img.naturalWidth || 800, h: img.naturalHeight || 800 };
  }

  if (mime === "image/gif") {
    const src = await readDataUrl(file);
    const img = await loadImage(src);
    return { src, mime: "image/gif", w: img.naturalWidth || 400, h: img.naturalHeight || 400 };
  }

  const raw = URL.createObjectURL(file);
  try {
    const img = await loadImage(raw);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const encode = rasterEncodeMime(mime);

    if (encode === "image/png") {
      if (scale === 1 && file.size <= MAX_BYTES) {
        return { src: await readDataUrl(file), mime: "image/png", w, h };
      }
      return { src: drawFitted(img, w, h).toDataURL("image/png"), mime: "image/png", w, h };
    }

    if (encode === "image/webp") {
      const fitted = drawFitted(img, w, h);
      const webp = fitted.toDataURL("image/webp", 0.82);
      if (webp.startsWith("data:image/webp")) return { src: webp, mime: "image/webp", w, h };
      return { src: fitted.toDataURL("image/png"), mime: "image/png", w, h };
    }

    const canvas = drawFitted(img, w, h);
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
