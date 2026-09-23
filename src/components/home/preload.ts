import { getExperience } from "@/components/home/projects/experiences";
import { projectById } from "@/components/home/catalog";
import { isVideoMedia, type ArchiveMedia } from "@/components/home/projects/types";

const decoded = new Map<string, Promise<void>>();
const videos = new Map<string, Promise<void>>();

export function decodeImage(src: string): Promise<void> {
  if (!src || typeof window === "undefined") return Promise.resolve();
  const hit = decoded.get(src);
  if (hit) return hit;
  const pending = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    const done = () => resolve();
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(done).catch(done);
      } else {
        done();
      }
    };
    img.onerror = done;
    img.src = src;
  });
  decoded.set(src, pending);
  return pending;
}

/**
 * True when the URL is served from somewhere we cannot fetch() from.
 *
 * Sanity's file CDN answers 403 "CORS Origin not allowed" to any request
 * carrying our Origin, while serving the same file happily to a <video>
 * element, which sends no Origin. So a fetch() prefetch of a CMS video is not
 * slow or unreliable — it cannot succeed, and it logs a CORS error every time.
 */
function crossOrigin(src: string) {
  if (typeof window === "undefined") return false;
  try {
    return new URL(src, window.location.href).origin !== window.location.origin;
  } catch {
    // A malformed URL is nothing we can prefetch either.
    return true;
  }
}

export function prefetchVideo(src: string): Promise<void> {
  if (!src || typeof window === "undefined") return Promise.resolve();
  const hit = videos.get(src);
  if (hit) return hit;
  // The video element fetches it without an Origin when it is needed.
  if (crossOrigin(src)) {
    const skipped = Promise.resolve();
    videos.set(src, skipped);
    return skipped;
  }
  const pending = fetch(src, { cache: "force-cache", credentials: "same-origin" })
    .then(() => undefined)
    .catch(() => undefined);
  videos.set(src, pending);
  return pending;
}

export function openingVisual(slug: string): ArchiveMedia {
  const movement = getExperience(slug)?.movements[0];
  const project = projectById(slug);
  const crop = project.crop;
  if (!movement) {
    return { type: "image", src: project.src, srcSet: project.srcSet, width: project.width, height: project.height, crop };
  }
  if (isVideoMedia(movement.media)) {
    const poster = movement.media.poster || project.src;
    return {
      type: "video",
      src: poster,
      poster,
      videoSrc: movement.media.mp4 || movement.media.videoSrc || movement.media.src,
      mp4: movement.media.mp4 || movement.media.videoSrc || movement.media.src,
      webm: movement.media.webm,
      width: movement.media.width,
      height: movement.media.height,
      crop,
      autoplay: movement.media.autoplay,
      loop: movement.media.loop,
      muted: movement.media.muted,
    };
  }
  return {
    type: "image",
    src: movement.media.src,
    srcSet: movement.media.srcSet,
    width: movement.media.width,
    height: movement.media.height,
    crop,
  };
}

export function openingSrc(slug: string): string | undefined {
  const movement = getExperience(slug)?.movements[0];
  if (!movement) return projectById(slug)?.src;
  if (isVideoMedia(movement.media)) return movement.media.poster || movement.media.src;
  return movement.media.src;
}

export function followSrc(slug: string): string | undefined {
  const movement = getExperience(slug)?.movements[1];
  if (!movement) return;
  if (isVideoMedia(movement.media)) return movement.media.poster;
  return movement.media.src;
}

export function openingVideo(slug: string): string | undefined {
  const movement = getExperience(slug)?.movements[0];
  if (movement && isVideoMedia(movement.media)) {
    return movement.media.mp4 || movement.media.videoSrc || movement.media.src;
  }
}

export function followVideo(slug: string): string | undefined {
  const movement = getExperience(slug)?.movements[1];
  if (movement && isVideoMedia(movement.media)) {
    return movement.media.mp4 || movement.media.videoSrc || movement.media.src;
  }
}

export function preloadProject(slug: string) {
  const first = openingSrc(slug);
  if (first) void decodeImage(first);
  const next = followSrc(slug);
  if (next) void decodeImage(next);
}

export function preloadOpening(slug: string): Promise<void> {
  preloadProject(slug);
  const src = openingSrc(slug);
  const video = openingVideo(slug);
  if (video) void prefetchVideo(video);
  if (!src) return Promise.resolve();
  return decodeImage(src);
}

export function approachProject(slug: string) {
  preloadProject(slug);
  const poster = openingSrc(slug);
  if (poster) void decodeImage(poster);
}

export function commitProjectMedia(slug: string) {
  const video = openingVideo(slug);
  if (video) void prefetchVideo(video);
  const follow = followVideo(slug);
  if (follow) void prefetchVideo(follow);
}

export function withTimeout(task: Promise<void>, ms: number): Promise<void> {
  return Promise.race([
    task,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    }),
  ]);
}
