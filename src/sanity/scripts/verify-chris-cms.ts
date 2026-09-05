/**
 * Real Sanity Chris Sisarich → adapter → shipped local presentation.
 * Networked validation only. Not part of npm test.
 *
 * Protects: document id, 8 movements, order/ids/kind/scale/relation/resolved pace,
 * media role identity, s02/s08 cover fit, s05 graphic, idea/shift/system, no Outcome,
 * critical Info fields, Sanity CDN host.
 * Surfaces catalog preview filename vs Sanity preview as editorial drift.
 */
import assert from "node:assert/strict";
import { projectById } from "../../components/home/catalog";
import { SISARICH_EXPERIENCE } from "../../components/home/projects/experiences";
import type { Movement } from "../../components/home/projects/types";
import { sanityProjectToFrontendProject } from "../adapter/map";
import { portableTextToPlainCopy } from "../adapter/portableText";
import { CHRIS_COPY, CHRIS_DOCUMENT_ID } from "./chris-content";
import {
  compareMovementParity,
  previewChromeDrift,
  type SanityMovementAssets,
  type VerifyMismatch,
} from "./cms-verify-lib";
import { fetchPublishedProjectBySlug, sckMediaConfig } from "./fetch-sck";

const EXPECTED_HINTS = ["idea", "idea", "shift", "shift", "system", "system", "system", "system"] as const;

function expectedMovements(): Movement[] {
  return SISARICH_EXPERIENCE.movements.map((movement, index) => ({
    ...movement,
    infoHint: EXPECTED_HINTS[index],
  }));
}

type ChrisMovement = SanityMovementAssets & {
  presentationOverride?: { mediaFit?: string; mediaType?: string };
};

async function main() {
  const project = await fetchPublishedProjectBySlug("chris-sisarich");
  const shipped = projectById("chris-sisarich");
  const result = sanityProjectToFrontendProject(
    project,
    {
      crop: shipped.crop,
      layout: shipped.layout,
      visualSpan: shipped.visualSpan,
      visualStart: shipped.visualStart,
      visualBefore: shipped.visualBefore,
      homeSelected: shipped.homeSelected,
      credits: shipped.credits,
      features: shipped.features,
      status: shipped.status,
    },
    sckMediaConfig()
  );

  const recordGaps: VerifyMismatch[] = [];
  const recordFields: Array<[string, unknown, unknown]> = [
    ["name", shipped.name, result.record.name],
    ["proposition", shipped.idea, result.record.idea],
    ["year", shipped.year, result.record.year],
    ["sectors", (shipped.sectors ?? []).join("|"), (result.record.sectors ?? []).join("|")],
    ["disciplines", (shipped.disciplines ?? []).join("|"), (result.record.disciplines ?? []).join("|")],
  ];
  for (const [field, exp, act] of recordFields) {
    if (exp !== act) recordGaps.push({ id: "record", field, expected: exp, actual: act });
  }
  const editorialDrift = previewChromeDrift(shipped, result.record, project.preview);

  const experience = result.experience;
  const movementGaps = compareMovementParity(
    expectedMovements(),
    experience.movements,
    project.movements as SanityMovementAssets[]
  );
  const sectionIds = experience.infoSections.map((section) => section.id);
  const headingGaps: VerifyMismatch[] = [];
  if (sectionIds.join() !== "idea,shift,system") {
    headingGaps.push({ id: "info", field: "ids", expected: "idea,shift,system", actual: sectionIds.join() });
  }

  const editorial = {
    context: portableTextToPlainCopy(project.context),
    roles: result.experience.authorship?.roles ?? [],
    workingContext: result.experience.authorship?.workingContext ?? null,
    collaborators: result.experience.authorship?.collaborators ?? [],
    idea: experience.infoSections.find((section) => section.id === "idea")?.copy,
    shift: experience.infoSections.find((section) => section.id === "shift")?.copy,
    system: experience.infoSections.find((section) => section.id === "system")?.copy,
    outcome: experience.infoSections.find((section) => section.id === "outcome")?.copy ?? null,
  };

  const presentationFail = [...recordGaps, ...movementGaps, ...headingGaps];
  console.log(
    JSON.stringify(
      {
        documentId: project._id,
        slug: result.record.id,
        publicSlug: shipped.id,
        movementCount: experience.movements.length,
        infoHints: experience.movements.map((movement) => `${movement.id}:${movement.infoHint}`),
        infoSections: sectionIds,
        editorialDrift,
        overrides: (project.movements as ChrisMovement[])
          .map((movement, index) => ({
            id: experience.movements[index]?.id,
            mediaFit: movement.presentationOverride?.mediaFit ?? null,
            mediaType: movement.presentationOverride?.mediaType ?? null,
          }))
          .filter((item) => item.mediaFit || item.mediaType),
        recordGaps,
        movementGaps,
        headingGaps,
        editorialApproved: {
          context: editorial.context === CHRIS_COPY.context,
          roles: editorial.roles.join("|") === CHRIS_COPY.roles.join("|"),
          workingContextOmitted: editorial.workingContext == null,
          collaboratorsOmitted: editorial.collaborators.length === 0,
          ideaMatchesApproved: editorial.idea === CHRIS_COPY.idea.body,
          shiftMatchesApproved: editorial.shift === CHRIS_COPY.shift.body,
          systemMatchesApproved: editorial.system === CHRIS_COPY.system.body,
          outcomeOmitted: editorial.outcome == null,
          ideaDiffersFromShipped: editorial.idea !== SISARICH_EXPERIENCE.infoSections[0].copy,
          shiftDiffersFromShipped: editorial.shift !== SISARICH_EXPERIENCE.infoSections[1].copy,
          systemDiffersFromShipped: editorial.system !== SISARICH_EXPERIENCE.infoSections[2].copy,
        },
        presentationParity: presentationFail.length === 0,
      },
      null,
      2
    )
  );

  assert.equal(project._id, CHRIS_DOCUMENT_ID);
  assert.equal(result.record.id, "chris-sisarich");
  assert.equal(experience.slug, "chris-sisarich");
  assert.equal(experience.movements.length, 8);
  assert.equal(project.outcome == null, true);
  assert.deepEqual(sectionIds, ["idea", "shift", "system"]);
  assert.equal(experience.movements[4]?.kind, "graphic");
  assert.equal(experience.movements[1]?.media.fit, "cover");
  assert.equal(experience.movements[7]?.media.fit, "cover");
  assert.deepEqual(presentationFail, [], `Presentation mismatches:\n${JSON.stringify(presentationFail, null, 2)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
