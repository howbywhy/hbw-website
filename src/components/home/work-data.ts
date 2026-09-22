import {
  liveProjects,
  projectCollaborators,
  projectDisciplines,
  projectSectors,
  type ProjectRecord,
} from "@/components/home/catalog";
import { getExperience } from "@/components/home/projects/experiences";
import {
  infoSectionHasCopy,
  isVideoMedia,
  stringToRichText,
  type Movement,
  type RichText,
} from "@/components/home/projects/types";

export const WORK = liveProjects();

export type Art = {
  type: "image" | "video";
  src: string;
  srcSet?: string;
  video?: string;
  webm?: string;
  width: number;
  height: number;
  crop: string;
};

function artFrom(movement: Movement, crop: string): Art {
  const media = movement.media;
  if (isVideoMedia(media)) {
    return {
      type: "video",
      src: media.poster || media.src,
      video: media.mp4 || media.videoSrc || media.src,
      webm: media.webm,
      width: media.width,
      height: media.height,
      crop,
    };
  }
  return { type: "image", src: media.src, srcSet: media.srcSet, width: media.width, height: media.height, crop };
}

/**
 * Key art for a card: the project's first landscape frame, so a 16:9 card is
 * never a portrait squeezed into a letterbox. Falls back to the catalog cover.
 */
export function keyArt(project: ProjectRecord): Art {
  const movements = getExperience(project.id)?.movements ?? [];
  const wide = movements.find((m) => m.media.width >= m.media.height * 1.2) ?? movements[0];
  if (wide) return artFrom(wide, wide === movements[0] ? project.crop : "center center");
  return {
    type: "image",
    src: project.src,
    srcSet: project.srcSet,
    width: project.width,
    height: project.height,
    crop: project.crop,
  };
}

export type Frame = {
  index: number;
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  video: boolean;
  videoSrc?: string;
  webm?: string;
  alt?: string;
};

export function frames(project: ProjectRecord): Frame[] {
  return (getExperience(project.id)?.movements ?? []).map((m, index) => ({
    index,
    src: isVideoMedia(m.media) ? m.media.poster || m.media.src : m.media.src,
    srcSet: isVideoMedia(m.media) ? undefined : m.media.srcSet,
    width: m.media.width,
    height: m.media.height,
    video: isVideoMedia(m.media),
    videoSrc: isVideoMedia(m.media) ? m.media.mp4 || m.media.videoSrc || m.media.src : undefined,
    webm: isVideoMedia(m.media) ? m.media.webm : undefined,
    alt: m.media.alt,
  }));
}

export type Detail = {
  project: ProjectRecord;
  art: Art;
  context: RichText;
  chapters: { id: string; heading: string; body: RichText }[];
  roles: string[];
  sectors: string[];
  disciplines: string[];
  collaborators: string[];
  credits: string[];
  features: { name: string; url?: string }[];
  frames: Frame[];
};

const HEADING: Record<string, string> = { idea: "Idea", shift: "Shift", system: "System", outcome: "Outcome" };

export function detail(project: ProjectRecord): Detail {
  const experience = getExperience(project.id);
  const context = experience?.context;
  return {
    project,
    art: keyArt(project),
    context: !context ? [] : typeof context === "string" ? stringToRichText(context) : context,
    chapters: (experience?.infoSections ?? []).filter(infoSectionHasCopy).map((section) => ({
      id: section.id,
      heading: HEADING[section.id] ?? section.heading,
      body: section.body?.length ? section.body : stringToRichText(section.copy),
    })),
    roles: experience?.authorship?.roles ?? [],
    sectors: projectSectors(project),
    disciplines: projectDisciplines(project),
    collaborators: projectCollaborators(project).map((c) => c.name),
    credits: project.credits ?? [],
    features: project.features ?? [],
    frames: frames(project),
  };
}
