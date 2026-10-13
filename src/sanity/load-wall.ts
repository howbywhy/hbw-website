/**
 * The work behind the blank page: stills and film both.
 *
 * Server only. The front door hides the whole body of work under a white
 * field and lets a visitor uncover it, so it needs a broad pool of frames —
 * more than a rail of six cards ever did — and only what a tile needs: a slug
 * to open, a name to say, and a URL to draw.
 *
 * Film is the point of it. Paper coming off a moving image is the difference
 * between a portfolio and a window, and a wall of stills read as flat. Each
 * film carries its own poster frame as well, which is what the wall shows
 * before the video has loaded — and what the Poster is given, since a frame
 * drawn from Sanity's file CDN taints a canvas and a poster has to be
 * readable.
 */
import { liveProjects } from "@/components/home/catalog";
import { resolveProjectExperience } from "@/lib/project-source";

export type WallTile = {
  slug: string;
  name: string;
  /** The project's own line, said when this tile is uncovered. */
  idea: string;
  year: string;
  /** Always a still: the picture, or a film's poster frame. */
  src: string;
  /** Set only on a film. Fetched once its part of the page is uncovered. */
  video?: string;
  webm?: string;
};

/**
 * Tile-sized, and through this origin.
 *
 * Two things at once. The width keeps a wall of forty-odd frames from pulling
 * forty full-size images. The proxy keeps them same-origin, which is what lets
 * the canvas be read back and handed to the Poster — Sanity's CDN would taint
 * it. A path the repo ships is already same-origin and is left alone.
 */
function tileSrc(url: string) {
  if (!/^https?:\/\//.test(url)) return url;
  // The adapter has already put a query on this asking the CDN for a
  // page-sized image, so replace it rather than adding a second "?".
  const sized = `${url.split("?")[0]}?w=760&q=70&auto=format`;
  return `/api/tile?src=${encodeURIComponent(sized)}`;
}

/** Enough that a wall rarely repeats itself, without shipping every sequence. */
const PER_PROJECT = 8;

export async function loadWall(): Promise<WallTile[]> {
  const projects = liveProjects();
  const picked = await Promise.all(
    projects.map(async (project) => {
      const { experience } = await resolveProjectExperience(project.id);
      const frames = (experience?.movements ?? []).filter(
        (movement) => movement.media.src || movement.media.poster
      );
      if (!frames.length) return [];
      // Spread the picks across the sequence rather than taking the first few,
      // so a project is represented by its whole range and not just its open.
      // Film first, then stills to fill. Sampling the sequence evenly put one
      // film on the whole wall out of the twenty-one that exist, because the
      // films are not evenly spaced through a case study. Movement is the
      // reason to uncover anything, so it gets picked first.
      const films = frames.filter((frame) => frame.media.type === "video");
      const stills = frames.filter((frame) => frame.media.type !== "video");
      const spread = (list: typeof frames, want: number) => {
        if (list.length <= want) return list;
        const step = list.length / want;
        return Array.from({ length: want }, (_, i) => list[Math.floor(i * step)]);
      };
      const chosen = [
        ...spread(films, Math.min(films.length, PER_PROJECT)),
        ...spread(stills, Math.max(0, PER_PROJECT - Math.min(films.length, PER_PROJECT))),
      ];

      const out: WallTile[] = [];
      for (const frame of chosen) {
        const media = frame.media;
        const film = media.type === "video";
        // A film's still is its poster frame; a picture is its own still.
        const still = film ? media.poster : media.src;
        if (!still) continue;
        out.push({
          slug: project.id,
          name: project.name,
          idea: project.idea,
          year: project.year,
          src: tileSrc(still),
          // Straight from the file CDN. It is never proxied: a film is several
          // megabytes and this route would pay for every one of them.
          video: film ? media.mp4 ?? media.videoSrc ?? media.src : undefined,
          webm: film ? media.webm : undefined,
        });
      }
      return out;
    })
  );

  // Interleaved, so neighbouring tiles are rarely the same project and an
  // uncovered patch shows the practice rather than one job.
  const lists = picked.filter((list) => list.length);
  const wall: WallTile[] = [];
  for (let i = 0; wall.length < lists.reduce((n, l) => n + l.length, 0); i++) {
    for (const list of lists) if (list[i]) wall.push(list[i]);
  }
  return wall;
}
