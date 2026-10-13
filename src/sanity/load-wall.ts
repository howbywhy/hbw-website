/**
 * The pictures behind the blank page.
 *
 * Server only. The front door hides the whole body of work under a white
 * field and lets a visitor uncover it, so it needs a broad pool of frames —
 * more than a rail of six cards ever did — and only what a tile needs: a slug
 * to open, a name to say, and a URL to draw.
 *
 * Films are skipped. What is uncovered is a still; a loop playing under a
 * spray mark is a different page than the one intended.
 */
import { liveProjects } from "@/components/home/catalog";
import { resolveProjectExperience } from "@/lib/project-source";

export type WallTile = {
  slug: string;
  name: string;
  /** The project's own line, said when this tile is uncovered. */
  idea: string;
  year: string;
  src: string;
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
      const stills = (experience?.movements ?? []).filter(
        (movement) => movement.media.type === "image" && movement.media.src
      );
      if (!stills.length) return [];
      // Spread the picks across the sequence rather than taking the first few,
      // so a project is represented by its whole range and not just its open.
      const step = Math.max(1, Math.floor(stills.length / PER_PROJECT));
      const out: WallTile[] = [];
      for (let i = 0; i < stills.length && out.length < PER_PROJECT; i += step) {
        out.push({
          slug: project.id,
          name: project.name,
          idea: project.idea,
          year: project.year,
          src: tileSrc(stills[i].media.src),
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
