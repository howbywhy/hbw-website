import { getExperience } from "@/components/home/projects/experiences";
import { projectById } from "@/components/home/catalog";

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

export function prefetchVideo(src: string): Promise<void> {
  if (!src || typeof window === "undefined") return Promise.resolve();
  const hit = videos.get(src);
  if (hit) return hit;
  const pending = fetch(src, { cache: "force-cache", credentials: "same-origin" })
    .then(() => undefined)
    .catch(() => undefined);
  videos.set(src, pending);
  return pending;
}

export function openingVisual(slug: string) {
  const movement = getExperience(slug)?.movements[0];
  const project = projectById(slug);
  const crop = project.crop;
  if (!movement || movement.media.type === "video") {
    return { src: project.src, srcSet: project.srcSet, width: project.width, height: project.height, crop };
  }
  return {
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
  if (movement.media.type === "video") return movement.media.poster || movement.media.src;
  return movement.media.src;
}

export function followSrc(slug: string): string | undefined {
  const movement = getExperience(slug)?.movements[1];
  if (!movement) return;
  if (movement.media.type === "video") return movement.media.poster;
  return movement.media.src;
}

export function openingVideo(slug: string): string | undefined {
  const movement = getExperience(slug)?.movements[0];
  if (movement?.media.type === "video") return movement.media.src;
}

export function followVideo(slug: string): string | undefined {
  const movement = getExperience(slug)?.movements[1];
  if (movement?.media.type === "video") return movement.media.src;
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
  const urls = [src];
  const match = src.match(/^(.*)\.(jpg|webp)$/);
  if (match) {
    urls.push(`${match[1]}-p-800.${match[2]}`, `${match[1]}-p-1080.${match[2]}`);
  }
  return Promise.all(urls.map(decodeImage)).then(() => undefined);
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
