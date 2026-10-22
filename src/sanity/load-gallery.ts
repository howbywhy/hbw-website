/**
 * Every project, as frames, for the gallery.
 *
 * Server only, and deliberately not loadWall. The wall needs a shallow pool of
 * squares to hide under paper; the gallery needs each project's own run of
 * frames in its own order, with the shape of each one, because the shape is
 * what makes the grid worth looking at.
 */
import { liveProjects, projectSays } from "@/components/home/catalog";
import { resolveProjectExperience } from "@/lib/project-source";
import { rowProfile } from "@/sanity/row-profile";

/*
 * What a cell is actually drawn at: sizes says 25vw on a phone and 11vw on a
 * sheet, which is about 100 CSS pixels on a 390 screen and about 280 on a
 * 2560 one. Three renditions cover every one of those at every pixel ratio
 * worth serving; the three above them were never picked by a cell.
 */
const CELL_WIDTHS = [160, 320, 640];

/** The hand-over panel, which is the height of the window. */
const PEEK_WIDTHS = [720, 1080, 1440];

/** Read for its row profile and nothing else, so: as small as Sanity serves. */
const PROFILE_WIDTH = 64;

export type GalleryFrame = {
  src: string;
  /** The same frame at the sizes a contact-sheet cell actually needs. */
  srcset?: string;
  /**
   * And the sizes the hand-over panel needs, on the one frame that is it.
   *
   * A cell is drawn between about a hundred and three hundred pixels; the
   * first frame of a project is also the peep at the end of the band before
   * it, where it covers a panel the full height of the screen. Those are an
   * order of magnitude apart, and every frame used to carry the ladder for
   * both — six renditions each, on sixty-two frames, printed three times
   * over by the wrap. Two thousand two hundred CDN addresses on the front
   * page, 268KB of a 409KB document, to draw pictures that between them need
   * three widths.
   */
  peekset?: string;
  width: number;
  height: number;
  video?: string;
  webm?: string;
  alt?: string;
  /**
   * The picture's brightness row by row, 0–255, top to bottom.
   *
   * Only ever on the lead frame, because only the lead frame is the one the
   * front page uncovers. Read at build; see row-profile for why it cannot
   * be read in the browser.
   */
  rows?: number[];
};

export type GalleryProject = {
  slug: string;
  name: string;
  idea: string;
  year: string;
  disciplines: string[];
  /** A line about the work, for the sheet. Authored copy, not a lens list. */
  says: string;
  frames: GalleryFrame[];
};

/**
 * The description, without the lead-in the sheet already says.
 *
 * Every one of them opens by naming the project and its idea — which is what
 * the band directly above it is for, so printed whole it said the same thing
 * twice before getting to the point. Only the opening clause is dropped, and
 * only when it is that clause: the writing itself is the authored copy and is
 * not touched.
 */
function trimmed(says: string) {
  const stop = says.indexOf(". ");
  if (stop < 0) return says;
  const lead = says.slice(0, stop);
  return lead.includes("—") ? says.slice(stop + 2) : says;
}

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
        let firstStill: string | undefined;
        for (const movement of movements) {
          if (frames.length >= PER_PROJECT) break;
          const media = movement.media;
          const film = media.type === "video";
          const still = film ? media.poster : media.src;
          if (!still) continue;
          if (!frames.length) firstStill = still;
          frames.push({
            /*
             * Sized for the cell, not for a page that no longer exists.
             *
             * These are the contact sheet's thumbnails. They are drawn at
             * about a hundred and forty pixels and were being fetched at nine
             * hundred — thirty-nine times the pixels, and the front page paid
             * 1.7MB for it on arrival. The gallery's own pictures come from
             * the sequence, not from here, so nothing full-size loses out.
             */
            src: sized(still, 320),
            /*
             * Larger renditions than a cell needs.
             *
             * The same frame is the peep of the next project at the end of a
             * band, where it covers a panel the full height of the screen —
             * so a 320 wide thumbnail was being blown up three times and
             * arrived pixelated. Cells still pick the small ones: sizes says
             * what each place actually draws.
             */
            srcset: CELL_WIDTHS.map((w) => `${sized(still, w)} ${w}w`).join(", "),
            width: media.width || 1200,
            height: media.height || 900,
            video: film ? media.mp4 ?? media.videoSrc ?? media.src : undefined,
            webm: film ? media.webm : undefined,
            alt: media.alt,
          });
        }
        if (!frames.length) return null;
        /* Only the first frame is ever the hand-over, so only the first
           frame pays for the sizes a hand-over needs. Taken from the still
           that actually made frames[0] rather than from movements[0], which
           is not the same thing when a movement has no picture to show. */
        if (firstStill) {
          frames[0].peekset = PEEK_WIDTHS.map((w) => `${sized(firstStill, w)} ${w}w`).join(", ");
          /*
           * And the same frame's row profile, for the seam on the front
           * page. Read from the smallest rendition there is — this is
           * sixty-four averages, not a picture, and asking for a wider one
           * would only be throwing pixels away more slowly.
           */
          frames[0].rows = await rowProfile(sized(firstStill, PROFILE_WIDTH));
        }

        return {
          slug: project.id,
          name: project.name,
          idea: project.idea,
          year: project.year,
          disciplines: [...(project.disciplines ?? [])],
          says: trimmed(projectSays(project)),
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

export type ReelFrame = { src: string; width: number; height: number; video?: string; webm?: string };
export type ReelJob = { slug: string; name: string; idea: string; year: string; frames: ReelFrame[] };

/**
 * Every project as one run of frames, for the reel.
 *
 * No alt text. The case-study alts are exactly what the SSG payload guard
 * watches for — they are the writing, and the front page has no business
 * carrying it. The reel's frames are decorative: each run is labelled by its
 * logotype and every frame links to the project, so nothing is lost.
 */
export async function loadReel(): Promise<ReelJob[]> {
  const gallery = await loadGallery();
  return gallery.map((project) => ({
    slug: project.slug,
    name: project.name,
    idea: project.idea,
    year: project.year,
    frames: project.frames.map((frame) => ({
      src: frame.src,
      width: frame.width,
      height: frame.height,
      video: frame.video,
      webm: frame.webm,
    })),
  }));
}

/**
 * The catalogue, with the writing after all.
 *
 * This stripped every frame's alt on the argument that a cell is a link
 * already labelled with the project and its idea, which makes the thumbnail
 * decorative — and a decorative image correctly takes an empty alt. The
 * reasoning holds and the outcome was still wrong: 63 distinct pictures
 * across the site, five of them described, on a site whose subject is
 * pictures. For a design practice the images are the work, and a label
 * saying which project they belong to is not a description of them.
 *
 * So the description goes on the image and the link takes its name from it,
 * which is the ordinary way a thumbnail that links somewhere is written.
 * Nothing is announced twice, because the aria-label it replaces is gone.
 *
 * It costs what it costs — the alts are the case study's own prose, and
 * this is the page that carries them three times over. Measured before and
 * after rather than argued about.
 */
export async function loadSheets(): Promise<GalleryProject[]> {
  return loadGallery();
}
