/**
 * The pool the grid draws from: stills from across the whole line.
 *
 * Server only. The home page no longer loads case studies — one project page
 * carries its own sequence and nothing else does — so the grid cannot reach
 * the frames from the client. This resolves them at build time and hands down
 * only what a tile needs: a slug to open, a URL, and the shape to crop from.
 *
 * Films are skipped. A tile is a still window onto the work, and a two-second
 * loop playing in eighty squares is a different page than the one intended.
 */
import { liveProjects } from "@/components/home/catalog";
import { resolveProjectExperience } from "@/lib/project-source";

export type GridTile = {
  /** The project this opens. */
  slug: string;
  name: string;
  /** Tile-sized, so eighty squares do not pull eighty full frames. */
  src: string;
  width: number;
  height: number;
};

/**
 * A tile is a few hundred pixels at most. Sanity's image CDN will cut one to
 * size on request, so ask for that; a path the repo ships has no such service
 * and is returned as it is.
 */
function tileSrc(url: string) {
  if (!/^https?:\/\//.test(url)) return url;
  // The adapter has already asked the CDN for a page-sized image, so this must
  // replace that query rather than add a second one — appending gave every
  // tile two "?" and the CDN would not serve it.
  return `${url.split("?")[0]}?w=600&q=70&auto=format`;
}

/** Enough for every tile on a dense grid to differ, without shipping the lot. */
const PER_PROJECT = 6;

export async function loadGrid(): Promise<GridTile[]> {
  const projects = liveProjects();
  const picked = await Promise.all(
    projects.map(async (project) => {
      const { experience } = await resolveProjectExperience(project.id);
      const stills = (experience?.movements ?? []).filter(
        (movement) => movement.media.type === "image" && movement.media.src
      );
      if (!stills.length) return [];
      // Spread the picks across the sequence rather than taking the first six,
      // so a project is represented by its whole range and not just its open.
      const step = Math.max(1, Math.floor(stills.length / PER_PROJECT));
      const out: GridTile[] = [];
      for (let i = 0; i < stills.length && out.length < PER_PROJECT; i += step) {
        const media = stills[i].media;
        out.push({
          slug: project.id,
          name: project.name,
          src: tileSrc(media.src),
          width: media.width,
          height: media.height,
        });
      }
      return out;
    })
  );
  return picked.flat();
}
