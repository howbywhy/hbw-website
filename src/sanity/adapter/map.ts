import type {
  ExperienceAuthorship,
  ExperienceCollaborator,
  InfoSection,
  InfoSectionId,
  Movement,
  MovementKind,
} from "../../components/home/projects/types";
import { movementSpan } from "../../components/home/projects/types";
import { filmToProjectMedia, previewToRecordMedia, stillToProjectMedia } from "./media";
import { portableTextToPlainCopy, portableTextToRichText } from "./portableText";
import {
  AdapterError,
  DISCIPLINES,
  SECTORS,
  type AdapterMediaConfig,
  type CatalogPresentation,
  type FrontendProject,
  type SanityCaseStudyBlock,
  type SanityMovement,
  type SanityProject,
} from "./types";

const DEFAULT_HEADINGS: Record<InfoSectionId, string> = {
  idea: "The idea",
  shift: "The shift",
  system: "The system",
  outcome: "The outcome",
};

function requireText(label: string, value: string | undefined) {
  if (!value?.trim()) throw new AdapterError("MISSING_FIELD", `${label} is required`);
  return value.trim();
}

function deriveKind(movement: SanityMovement, width: number, height: number): MovementKind {
  if (movement.mediaType === "film") return "film";
  return height > width ? "portrait" : "landscape";
}

function resolveInfoHints(project: SanityProject): InfoSectionId[] {
  const hasOutcome = Boolean(project.outcome);
  let current: InfoSectionId = "idea";
  return project.movements.map((movement, index) => {
    const explicit = movement.infoHint;
    if (explicit === "outcome" && !hasOutcome) {
      throw new AdapterError(
        "INVALID_OUTCOME_HINT",
        `Movement ${movement._key} starts an Outcome chapter, but this project has no Outcome.`
      );
    }
    if (explicit) {
      current = explicit;
      return current;
    }
    if (index === 0) return "idea";
    return current;
  });
}

function caseStudySection(id: InfoSectionId, block: SanityCaseStudyBlock | undefined): InfoSection | null {
  if (!block) return null;
  const copy = portableTextToPlainCopy(block.body);
  const body = portableTextToRichText(block.body);
  if (!copy && !body.length && !block.heading?.trim()) return null;
  return {
    id,
    heading: block.heading?.trim() || DEFAULT_HEADINGS[id],
    copy,
    ...(body.length ? { body } : {}),
  };
}

function mapCollaborators(project: SanityProject): ExperienceCollaborator[] {
  return (project.collaborators ?? [])
    .filter((item) => item.name?.trim())
    .map((item) => ({
      name: item.name.trim(),
      contribution: item.contribution.trim(),
      ...(item.url?.trim() ? { url: item.url.trim() } : {}),
    }));
}

function mapExperienceAuthorship(project: SanityProject): ExperienceAuthorship | undefined {
  const roles = (project.roles ?? []).map((role) => role.trim()).filter(Boolean);
  const workingContext = project.workingContext?.trim() || undefined;
  const collaborators = mapCollaborators(project);
  if (!roles.length && !workingContext && !collaborators.length) return undefined;
  return {
    roles,
    ...(workingContext ? { workingContext } : {}),
    ...(collaborators.length ? { collaborators } : {}),
  };
}

function applyPresentationOverride(movement: SanityMovement, mapped: Movement): Movement {
  const override = movement.presentationOverride;
  if (!override) return mapped;
  let next = mapped;
  if (override.frameWidth === "narrow") {
    next = { ...next, span: "narrow" };
  }
  if (override.mediaFit === "cover") {
    next = { ...next, media: { ...next.media, fit: "cover" } };
  }
  if (override.mediaType === "graphic") {
    next = { ...next, kind: "graphic" };
  }
  return next;
}

function knownSectors(values: string[] | undefined) {
  return (values ?? []).filter((value): value is (typeof SECTORS)[number] =>
    (SECTORS as readonly string[]).includes(value)
  );
}

function knownDisciplines(values: string[] | undefined) {
  return (values ?? []).filter((value): value is (typeof DISCIPLINES)[number] =>
    (DISCIPLINES as readonly string[]).includes(value)
  );
}

function mapMovement(movement: SanityMovement, infoHint: InfoSectionId, config: AdapterMediaConfig): Movement {
  const media =
    movement.mediaType === "film"
      ? filmToProjectMedia(movement.video, movement.poster, movement.webm, movement.alt, config)
      : stillToProjectMedia(movement.still, movement.alt, config);
  const kind = deriveKind(movement, media.width, media.height);
  const mapped: Movement = {
    id: movement._key,
    kind,
    media,
    infoHint,
    scale: movement.scale,
    pace: movement.pace,
    relation: movement.relation,
  };
  const overridden = applyPresentationOverride(movement, mapped);
  void movementSpan(overridden);
  return overridden;
}

export function sanityProjectToProjectExperience(project: SanityProject, config: AdapterMediaConfig) {
  const slug = requireText("slug", project.slug?.current);
  if (project.movements.at(-1)?.relation === "pair") {
    throw new AdapterError("TERMINAL_PAIR", "The last movement is marked Pair. Pair must include a following movement.");
  }
  const hints = resolveInfoHints(project);
  const infoSections = [
    caseStudySection("idea", project.idea),
    caseStudySection("shift", project.shift),
    caseStudySection("system", project.system),
    caseStudySection("outcome", project.outcome),
  ].filter((section): section is InfoSection => Boolean(section));

  const context = portableTextToRichText(project.context);
  const authorship = mapExperienceAuthorship(project);
  return {
    slug,
    infoSections,
    movements: project.movements.map((movement, index) => mapMovement(movement, hints[index], config)),
    ...(context.length ? { context } : {}),
    ...(authorship ? { authorship } : {}),
  };
}

export function sanityProjectToProjectRecord(
  project: SanityProject,
  catalog: CatalogPresentation,
  config: AdapterMediaConfig
) {
  const slug = requireText("slug", project.slug?.current);
  const preview = previewToRecordMedia(project.preview, config);
  return {
    id: slug,
    href: `/projects/${slug}`,
    name: requireText("title", project.title),
    idea: requireText("proposition", project.proposition),
    year: requireText("year", project.year),
    src: preview.src,
    srcSet: preview.srcSet,
    width: preview.width,
    height: preview.height,
    crop: catalog.crop,
    layout: catalog.layout,
    visualSpan: catalog.visualSpan,
    visualStart: catalog.visualStart,
    visualBefore: catalog.visualBefore,
    homeSelected: catalog.homeSelected,
    sectors: knownSectors(project.sectors),
    disciplines: knownDisciplines(project.disciplines),
    collaborators: catalog.collaborators,
    location: project.location,
    features: catalog.features,
    credits: catalog.credits,
    status: catalog.status,
    external: catalog.external,
  };
}

export function sanityProjectToFrontendProject(
  project: SanityProject,
  catalog: CatalogPresentation,
  config: AdapterMediaConfig
): FrontendProject {
  requireText("context", portableTextToPlainCopy(project.context));
  if (!project.roles?.length) throw new AdapterError("MISSING_FIELD", "At least one role is required");
  if (!project.idea) throw new AdapterError("MISSING_FIELD", "Idea is required");
  if (!project.shift) throw new AdapterError("MISSING_FIELD", "Shift is required");
  if (!project.system) throw new AdapterError("MISSING_FIELD", "System is required");
  if (!project.movements?.length) throw new AdapterError("MISSING_FIELD", "At least one movement is required");

  const collaborators = mapCollaborators(project);
  return {
    record: sanityProjectToProjectRecord(project, catalog, config),
    experience: sanityProjectToProjectExperience(project, config),
    authorship: {
      roles: project.roles,
      ...(project.workingContext?.trim() ? { workingContext: project.workingContext.trim() } : {}),
      ...(collaborators.length ? { collaborators } : {}),
      context: portableTextToPlainCopy(project.context),
    },
    portfolioOrder: project.portfolioOrder,
    internal: {
      contributionNotes: project.contributionNotes,
      editorialPurpose: project.editorialPurpose,
      replacementPriority: project.replacementPriority,
    },
    sanityOwned: {
      title: true,
      slug: true,
      proposition: true,
      year: true,
      location: true,
      sectors: true,
      disciplines: true,
      preview: true,
      portfolioOrder: true,
      context: true,
      roles: true,
      workingContext: true,
      collaborators: true,
      caseStudy: true,
      movements: true,
    },
    catalogOwned: {
      crop: true,
      layout: true,
      visualSpan: true,
      visualStart: true,
      visualBefore: true,
      homeSelected: true,
      credits: true,
      features: true,
      status: true,
    },
  };
}
