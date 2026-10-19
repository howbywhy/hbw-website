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
  /** A small rendition, for warming a project the reader has not opened yet. */
  thumb?: string;
  /**
   * The same frame at the widths a screen might actually draw it.
   *
   * Without it the gallery asked the CMS for every frame at its native size
   * and the browser drew them at a fraction of it: a 1920-wide still fetched
   * at 314KB to fill a 180 square in the grid, twenty-two of them on one
   * project, four and a half megabytes before a visitor had moved. The CDN
   * resizes on request, so the only thing missing was the asking.
   */
  srcset?: string;
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

/**
 * Local paths are files the repo ships and are returned untouched; anything
 * from the CMS is asked for at a width. The ladder stops at 1920 because
 * nothing here is drawn wider than a window, and starts at 320 because the
 * grid draws these at about a hundred and eighty.
 */
const WIDTHS = [320, 480, 720, 1080, 1440, 1920];

function sized(url: string, width: number) {
  if (!/^https?:\/\//.test(url)) return url;
  return `${url.split("?")[0]}?w=${width}&q=72&auto=format`;
}

function setFor(url: string) {
  if (!/^https?:\/\//.test(url)) return undefined;
  return WIDTHS.map((w) => `${sized(url, w)} ${w}w`).join(", ");
}

export function shotsOf(movements: Movement[]): Shot[] {
  const out: Shot[] = [];
  for (const movement of movements) {
    const media = movement.media;
    const film = media.type === "video";
    const src = film ? media.poster ?? media.src : media.src;
    if (!src) continue;
    out.push({
      id: movement.id,
      /*
       * Modest, because src is the floor and srcset is the ceiling.
       *
       * Everything that fetches a frame without consulting srcset gets this
       * one: the band renders every frame at once — lazy loading defers
       * nothing in a rail that is all at the height of the window — and the
       * preloads ask for src by name. At 1440 that was twenty-two large
       * pictures per project before a visitor had moved. At 640 it is a
       * quarter of that, and anything actually drawn larger still picks the
       * rendition it needs out of srcset below.
       */
      src: sized(src, 640),
      /*
       * A small one, for warming the project next door.
       *
       * The step into the next project is instant because its pictures are
       * fetched while this one is being read — but what it arrives into is
       * the grid, whose cells are about 240 pixels. Warming the 640 was four
       * times the bytes for a picture that is about to be drawn at a third
       * of it, and on CLOSED that warm is most of the page's picture weight.
       */
      thumb: sized(src, 480),
      srcset: setFor(src),
      video: film ? media.mp4 ?? media.videoSrc ?? media.src : undefined,
      webm: film ? media.webm : undefined,
      alt: media.alt,
      width: media.width,
      height: media.height,
    });
  }
  return out;
}
