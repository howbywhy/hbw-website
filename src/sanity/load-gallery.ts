/**
 * Every project, as frames, for the gallery.
 *
 * Server only, and deliberately not loadWall. The wall needs a shallow pool of
 * squares to hide under paper; the gallery needs each project's own run of
 * frames in its own order, with the shape of each one, because the shape is
 * what makes the grid worth looking at.
 */
import { liveProjects } from "@/components/home/catalog";
import { resolveProjectExperience } from "@/lib/project-source";

export type GalleryFrame = {
  src: string;
  width: number;
  height: number;
  video?: string;
  webm?: string;
  alt?: string;
};

export type GalleryProject = {
  slug: string;
  name: string;
  idea: string;
  year: string;
  disciplines: string[];
  frames: GalleryFrame[];
};

/** Enough to show the range of a job without reprinting the case study. */
const PER_PROJECT = 9;

function sized(url: string, width: number) {
  if (!/^https?:\/\//.test(url)) return url;
  return `${url.split("?")[0]}?w=${width}&q=72&auto=format`;
}

export async function loadGallery(): Promise<GalleryProject[]> {
  const projects = liveProjects();
  const built = await Promise.all(
    projects.map(async (project): Promise<GalleryProject | null> => {
        const { experience } = await resolveProjectExperience(project.id);
        const movements = experience?.movements ?? [];

        const frames: GalleryFrame[] = [];
        for (const movement of movements) {
          if (frames.length >= PER_PROJECT) break;
          const media = movement.media;
          const film = media.type === "video";
          const still = film ? media.poster : media.src;
          if (!still) continue;
          frames.push({
            src: sized(still, 900),
            width: media.width || 1200,
            height: media.height || 900,
            video: film ? media.mp4 ?? media.videoSrc ?? media.src : undefined,
            webm: film ? media.webm : undefined,
            alt: media.alt,
          });
        }
        if (!frames.length) return null;

        return {
          slug: project.id,
          name: project.name,
          idea: project.idea,
          year: project.year,
          disciplines: [...(project.disciplines ?? [])],
          frames,
        };
    })
  );
  return built.filter((entry): entry is GalleryProject => entry !== null);
}

export type Tile = {
  slug: string;
  name: string;
  idea: string;
  kind: string;
  src: string;
  width: number;
  height: number;
  video?: string;
  webm?: string;
  /** Which frame of the project this is, so a click can continue into it. */
  at: number;
};

/**
 * One frame per project, for the front page.
 *
 * Deliberately not loadGallery. The grid draws six pictures and loadGallery
 * carries fifty-four, all of which would be serialised into the page — which
 * is exactly what the repo's own payload guard exists to catch, and did.
 * A page ships what it draws.
 */
export async function loadTiles(): Promise<Tile[]> {
  const gallery = await loadGallery();
  const picked: (Tile | null)[] = gallery.map((project, i) => {
    // The opener for most, something from deeper in for the rest, so six
    // tiles are not six variations on a hero shot.
    const at = i % 3 === 1 ? Math.min(2, project.frames.length - 1) : 0;
    const frame = project.frames[at];
    if (!frame) return null;
    return {
      slug: project.slug,
      name: project.name,
      idea: project.idea,
      kind: project.disciplines[0] ?? "Brand",
      src: frame.src,
      width: frame.width,
      height: frame.height,
      video: frame.video,
      webm: frame.webm,
      at,
    };
  });
  return picked.filter((tile): tile is Tile => tile !== null);
}
