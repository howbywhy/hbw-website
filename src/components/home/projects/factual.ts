import type {
  ExperienceCollaborator,
  ProjectExperience,
  RichText,
} from "@/components/home/projects/types";
import { stringToRichText } from "@/components/home/projects/types";

export type FactualBlock =
  | { id: "context"; heading: "Context"; kind: "rich"; body: RichText }
  | { id: "role"; heading: "Role"; kind: "lines"; lines: string[] }
  | { id: "workingContext"; heading: "Working Context"; kind: "copy"; copy: string }
  | { id: "with"; heading: "With"; kind: "collaborators"; collaborators: ExperienceCollaborator[] };

function contextBody(context: ProjectExperience["context"]): RichText | undefined {
  if (!context) return undefined;
  const body = typeof context === "string" ? stringToRichText(context) : context;
  const hasText = body.some((paragraph) => paragraph.spans.some((span) => span.text.trim()));
  return hasText ? body : undefined;
}

/** Public factual header. Empty optional fields are omitted, not rendered as blank sections. */
export function factualBlocks(experience: ProjectExperience): FactualBlock[] {
  const blocks: FactualBlock[] = [];
  const context = contextBody(experience.context);
  if (context) {
    blocks.push({ id: "context", heading: "Context", kind: "rich", body: context });
  }

  const roles = (experience.authorship?.roles ?? []).map((role) => role.trim()).filter(Boolean);
  if (roles.length) {
    blocks.push({ id: "role", heading: "Role", kind: "lines", lines: roles });
  }

  const workingContext = experience.authorship?.workingContext?.trim();
  if (workingContext) {
    blocks.push({ id: "workingContext", heading: "Working Context", kind: "copy", copy: workingContext });
  }

  const collaborators = (experience.authorship?.collaborators ?? []).filter((item) => item.name.trim());
  if (collaborators.length) {
    blocks.push({ id: "with", heading: "With", kind: "collaborators", collaborators });
  }

  return blocks;
}
