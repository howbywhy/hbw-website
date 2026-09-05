/**
 * Real Sanity SUB:3 → adapter → shipped local presentation.
 * Networked validation only. Not part of npm test.
 *
 * Protects: document id, 12 movements, order/ids/kind/scale/relation/resolved pace,
 * media role identity, contain films, pairs s304/s306/s310, working context,
 * idea/shift/system, no Outcome, no Brand DNA, critical Info fields, Sanity CDN host.
 * Surfaces catalog preview filename vs Sanity preview as editorial drift.
 */
import assert from "node:assert/strict";
import { projectById } from "../../components/home/catalog";
import { SUB3_EXPERIENCE } from "../../components/home/projects/experiences";
import type { Movement } from "../../components/home/projects/types";
import { sanityProjectToFrontendProject } from "../adapter/map";
import { portableTextToPlainCopy } from "../adapter/portableText";
import {
  compareMovementParity,
  previewChromeDrift,
  type SanityMovementAssets,
  type VerifyMismatch,
} from "./cms-verify-lib";
import { fetchPublishedProjectBySlug, sckMediaConfig } from "./fetch-sck";
import { SUB3_COPY, SUB3_DOCUMENT_ID } from "./sub3-content";

const EXPECTED_HINTS = [
  "idea",
  "idea",
  "idea",
  "shift",
  "shift",
  "system",
  "system",
  "system",
  "system",
  "system",
  "system",
  "system",
] as const;

function expectedMovements(): Movement[] {
  return SUB3_EXPERIENCE.movements.map((movement, index) => ({
    ...movement,
    infoHint: EXPECTED_HINTS[index],
  }));
}


async function main() {
  const project = await fetchPublishedProjectBySlug("sub-3");
  const shipped = projectById("sub-3");
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
        stillCount: experience.movements.filter((movement) => movement.media.type === "image").length,
        filmCount: experience.movements.filter((movement) => movement.media.type === "video").length,
        infoHints: experience.movements.map((movement) => `${movement.id}:${movement.infoHint}`),
        infoSections: sectionIds,
        pairs: experience.movements.filter((movement) => movement.relation === "pair").map((movement) => movement.id),
        containFilms: experience.movements
          .filter((movement) => movement.media.type === "video")
          .map((movement) => `${movement.id}:${movement.media.fit}`),
        recordGaps,
        movementGaps,
        headingGaps,
        editorialDrift,
        editorialApproved: {
          context: editorial.context === SUB3_COPY.context,
          roles: editorial.roles.join("|") === SUB3_COPY.roles.join("|"),
          noBrandDna: !editorial.roles.includes("Brand DNA"),
          noPhotography: editorial.roles.every((role) => !/photo/i.test(role)),
          workingContext: editorial.workingContext === SUB3_COPY.workingContext,
          collaboratorsOmitted: editorial.collaborators.length === 0,
          ideaMatchesApproved: editorial.idea === SUB3_COPY.idea.body,
          shiftMatchesApproved: editorial.shift === SUB3_COPY.shift.body,
          systemMatchesApproved: editorial.system === SUB3_COPY.system.body,
          outcomeOmitted: editorial.outcome == null,
          ideaDiffersFromShipped: editorial.idea !== SUB3_EXPERIENCE.infoSections[0].copy,
          shiftDiffersFromShipped: editorial.shift !== SUB3_EXPERIENCE.infoSections[1].copy,
          systemDiffersFromShipped: editorial.system !== SUB3_EXPERIENCE.infoSections[2].copy,
        },
        presentationParity: presentationFail.length === 0,
      },
      null,
      2
    )
  );

  assert.equal(project._id, SUB3_DOCUMENT_ID);
  assert.equal(result.record.id, "sub-3");
  assert.equal(experience.slug, "sub-3");
  assert.equal(experience.movements.length, 12);
  assert.equal(project.outcome == null, true);
  assert.deepEqual(sectionIds, ["idea", "shift", "system"]);
  assert.equal(experience.authorship?.workingContext, SUB3_COPY.workingContext);
  assert.equal(experience.authorship?.collaborators?.length ?? 0, 0);
  assert.equal(experience.authorship?.roles.includes("Brand DNA"), false);
  assert.equal(
    experience.movements.filter((movement) => movement.media.type === "video").every((movement) => movement.media.fit === "contain"),
    true
  );
  assert.deepEqual(
    experience.movements.filter((movement) => movement.relation === "pair").map((movement) => movement.id),
    ["s304", "s306", "s310"]
  );
  assert.equal(experience.movements[11]?.infoHint, "system");
  assert.deepEqual(presentationFail, [], `Presentation mismatches:\n${JSON.stringify(presentationFail, null, 2)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
