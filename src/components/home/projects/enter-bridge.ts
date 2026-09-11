import { projectById } from "@/components/home/catalog";
import { openingSrc } from "@/components/home/preload";

export type BridgeRect = { left: number; top: number; width: number; height: number };

export type BrowseVisual = {
  slug: string;
  src: string;
  srcSet?: string;
  sizes?: string;
  rect: BridgeRect;
  objectFit: string;
  objectPosition: string;
  width: number;
  height: number;
};

export type DestinationVisual = {
  rect: BridgeRect;
  objectFit: string;
  objectPosition: string;
  width: number;
  height: number;
  src?: string;
};

export type Fitted = { x: number; y: number; w: number; h: number };
export type NormPos = { x: number; y: number };

export type FlipInvert = { x: number; y: number; sx: number; sy: number };

export type EnterTiming = {
  click: number;
  routeStart?: number;
  mounted?: number;
  geometryReady?: number;
  transitionStart?: number;
  transitionComplete?: number;
  interactionEnabled?: number;
};

export function readBridgeRect(el: Element): BridgeRect {
  const box = el.getBoundingClientRect();
  return { left: box.left, top: box.top, width: box.width, height: box.height };
}

export function captureBrowseVisual(slug: string): BrowseVisual | null {
  if (typeof document === "undefined") return null;
  const item = document.querySelector(`[data-hbw-project="${slug}"]`);
  if (!(item instanceof HTMLElement)) return null;
  const media = item.querySelector(".hbw-browse__media img, .hbw-browse__media video");
  if (!(media instanceof HTMLImageElement) && !(media instanceof HTMLVideoElement)) return null;
  const rect = readBridgeRect(media);
  if (rect.width < 2 || rect.height < 2) return null;
  const style = getComputedStyle(media);
  const src =
    media instanceof HTMLVideoElement
      ? media.currentSrc || media.poster || media.src
      : media.currentSrc || media.src;
  if (!src) return null;
  const width =
    media instanceof HTMLVideoElement
      ? media.videoWidth || Number(media.getAttribute("width")) || 0
      : media.naturalWidth || Number(media.getAttribute("width")) || 0;
  const height =
    media instanceof HTMLVideoElement
      ? media.videoHeight || Number(media.getAttribute("height")) || 0
      : media.naturalHeight || Number(media.getAttribute("height")) || 0;
  return {
    slug,
    src,
    srcSet: media instanceof HTMLImageElement ? media.srcset || undefined : undefined,
    sizes: media instanceof HTMLImageElement ? media.sizes || undefined : undefined,
    rect: roundRect(rect),
    objectFit: style.objectFit || "cover",
    objectPosition: style.objectPosition || "center center",
    width,
    height,
  };
}

export function readFirstMovementVisual(root?: ParentNode | null): DestinationVisual | null {
  const scope = root ?? (typeof document === "undefined" ? null : document);
  if (!scope) return null;
  const section =
    scope.querySelector<HTMLElement>(":scope > .hbw-mv") ||
    scope.querySelector<HTMLElement>(".hbw-project-view .hbw-mv") ||
    scope.querySelector<HTMLElement>(".hbw-mv");
  if (!section) return null;
  const media =
    section.querySelector<HTMLImageElement>(".hbw-mv__poster") ||
    section.querySelector<HTMLImageElement | HTMLVideoElement>("img, video");
  const rect = roundRect(readBridgeRect(section));
  if (rect.width < 2 || rect.height < 2) return null;
  const node = media instanceof HTMLElement ? media : section;
  const style = getComputedStyle(node);
  const width =
    media instanceof HTMLVideoElement
      ? media.videoWidth || Number(media.getAttribute("width")) || 0
      : media instanceof HTMLImageElement
        ? media.naturalWidth || Number(media.getAttribute("width")) || 0
        : Number.parseFloat(section.style.getPropertyValue("--hbw-mv-ratio")) || 0;
  const height =
    media instanceof HTMLVideoElement
      ? media.videoHeight || Number(media.getAttribute("height")) || 0
      : media instanceof HTMLImageElement
        ? media.naturalHeight || Number(media.getAttribute("height")) || 0
        : 0;
  const src =
    media instanceof HTMLVideoElement
      ? media.poster || media.currentSrc || media.src
      : media instanceof HTMLImageElement
        ? media.currentSrc || media.src
        : undefined;
  return {
    rect,
    objectFit: style.objectFit || "contain",
    objectPosition: style.objectPosition || "center center",
    width,
    height,
    src,
  };
}

export function readFirstMovementRect(root?: ParentNode | null): BridgeRect | null {
  return readFirstMovementVisual(root)?.rect ?? null;
}

export function roundRect(rect: BridgeRect): BridgeRect {
  return {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
  };
}

export function parseObjectPosition(value: string): NormPos {
  const raw = value.trim().toLowerCase();
  if (!raw) return { x: 0.5, y: 0.5 };
  const parts = raw.split(/\s+/);
  const token = (item: string): number | null => {
    if (item === "center") return 0.5;
    if (item === "left" || item === "top") return 0;
    if (item === "right" || item === "bottom") return 1;
    if (item.endsWith("%")) {
      const n = Number.parseFloat(item);
      return Number.isFinite(n) ? n / 100 : null;
    }
    return null;
  };
  if (parts.length === 1) {
    const n = token(parts[0]);
    if (parts[0] === "top" || parts[0] === "bottom") return { x: 0.5, y: n ?? 0.5 };
    return { x: n ?? 0.5, y: 0.5 };
  }
  const [a, b] = parts;
  if (a === "top" || a === "bottom") return { x: token(b) ?? 0.5, y: token(a) ?? 0.5 };
  return { x: token(a) ?? 0.5, y: token(b) ?? 0.5 };
}

export function fitMedia(
  box: { width: number; height: number },
  iw: number,
  ih: number,
  fit: string,
  pos: NormPos
): Fitted {
  const boxW = Math.max(1, box.width);
  const boxH = Math.max(1, box.height);
  const nw = Math.max(1, iw);
  const nh = Math.max(1, ih);
  const kind = fit === "contain" || fit === "scale-down" ? "contain" : fit === "none" ? "none" : "cover";
  if (kind === "none") {
    return { x: (boxW - nw) * pos.x, y: (boxH - nh) * pos.y, w: nw, h: nh };
  }
  const scale = kind === "contain" ? Math.min(boxW / nw, boxH / nh) : Math.max(boxW / nw, boxH / nh);
  const w = nw * scale;
  const h = nh * scale;
  return { x: (boxW - w) * pos.x, y: (boxH - h) * pos.y, w, h };
}

export function visibleImageCrop(
  box: { width: number; height: number },
  iw: number,
  ih: number,
  fit: string,
  pos: NormPos
): Fitted {
  const drawn = fitMedia(box, iw, ih, fit, pos);
  const scaleX = drawn.w / Math.max(1, iw);
  const scaleY = drawn.h / Math.max(1, ih);
  return {
    x: Math.max(0, -drawn.x) / scaleX,
    y: Math.max(0, -drawn.y) / scaleY,
    w: Math.min(iw, box.width / scaleX),
    h: Math.min(ih, box.height / scaleY),
  };
}

export function innerFromCrop(box: { width: number; height: number }, crop: Fitted, iw: number, ih: number): Fitted {
  const sx = box.width / Math.max(1, crop.w);
  const sy = box.height / Math.max(1, crop.h);
  return { x: -crop.x * sx, y: -crop.y * sy, w: iw * sx, h: ih * sy };
}

export function bridgeInnerLayouts(source: BrowseVisual, dest: DestinationVisual): { from: Fitted; to: Fitted } {
  const iw = dest.width || source.width || 1;
  const ih = dest.height || source.height || 1;
  const fromPos = parseObjectPosition(source.objectPosition);
  const toPos = parseObjectPosition(dest.objectPosition);
  const crop = visibleImageCrop(source.rect, iw, ih, source.objectFit, fromPos);
  return {
    from: innerFromCrop(dest.rect, crop, iw, ih),
    to: fitMedia(dest.rect, iw, ih, dest.objectFit, toPos),
  };
}

export function flipInvert(from: BridgeRect, to: BridgeRect): FlipInvert {
  return {
    x: from.left - to.left,
    y: from.top - to.top,
    sx: from.width / Math.max(1, to.width),
    sy: from.height / Math.max(1, to.height),
  };
}

export function flipTransform(invert: FlipInvert): string {
  return `translate(${invert.x}px, ${invert.y}px) scale(${invert.sx}, ${invert.sy})`;
}

export function invertFitted(from: Fitted, to: Fitted): FlipInvert {
  return {
    x: from.x - to.x,
    y: from.y - to.y,
    sx: from.w / Math.max(1, to.w),
    sy: from.h / Math.max(1, to.h),
  };
}

export function visualPath(src: string): string {
  try {
    return new URL(src, "http://hbw.local").pathname;
  } catch {
    return src.split("?")[0] || src;
  }
}

export function sameVisualSrc(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return visualPath(a) === visualPath(b);
}

export function destinationStill(slug: string): string | undefined {
  return openingSrc(slug);
}

export function catalogStill(slug: string): string | undefined {
  return projectById(slug)?.src;
}

export function markEnterTiming(partial: Partial<EnterTiming> & { click?: number }): EnterTiming {
  const now = typeof performance === "undefined" ? Date.now() : performance.now();
  const current =
    typeof window !== "undefined" && window.__hbwEnterTiming
      ? window.__hbwEnterTiming
      : { click: now };
  const next = { ...current, ...partial };
  if (typeof window !== "undefined") window.__hbwEnterTiming = next;
  return next;
}

declare global {
  interface Window {
    __hbwEnterTiming?: EnterTiming;
  }
}
