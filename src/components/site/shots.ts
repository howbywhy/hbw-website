/**
 * A project's frames, as the gallery wants them.
 *
 * Its own module because both sides need it: the gallery is a client
 * component, and the project's page builds this list on the server — a
 * function exported from a "use client" file cannot be called there.
 */
import type { Movement } from "@/components/home/projects/types";

/**
 * `id` is the movement's own id. It is the gallery's key — two frames can
 * share a source, and an index key reorders badly — and it is what the
 * repo's payload guard reads to tell a page that serves its own case study
 * from one that has merely borrowed the pictures.
 */
export type Shot = {
  id: string;
  src: string;
  video?: string;
  webm?: string;
  alt?: string;
  /**
   * The frame's own proportions.
   *
   * Without them a band of natural widths cannot be laid out before the
   * pictures arrive, which is why every frame was forced into one column
   * width and cropped to fill it — wide work lost its sides. Carried here,
   * each page can be the shape of its picture from the first paint.
   */
  width?: number;
  height?: number;
};

export function shotsOf(movements: Movement[]): Shot[] {
  const out: Shot[] = [];
  for (const movement of movements) {
    const media = movement.media;
    const film = media.type === "video";
    const src = film ? media.poster ?? media.src : media.src;
    if (!src) continue;
    out.push({
      id: movement.id,
      src,
      video: film ? media.mp4 ?? media.videoSrc ?? media.src : undefined,
      webm: film ? media.webm : undefined,
      alt: media.alt,
      width: media.width,
      height: media.height,
    });
  }
  return out;
}
