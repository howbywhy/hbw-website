/**
 * Real Sanity Our Boy Roy → adapter → shipped local presentation.
 * Networked validation only. Not part of npm test.
 *
 * Protects: document id, 7 movements, order/ids/kind/scale/relation/resolved pace,
 * media role identity, contain films, no pairs, working context, idea/shift/system,
 * no Outcome, no Brand DNA/Strategy/Naming, critical Info fields, Sanity CDN host.
 * Surfaces catalog preview filename vs Sanity preview as editorial drift.
 */
import assert from "node:assert/strict";
import { projectById } from "../../components/home/catalog";
import { OBR_EXPERIENCE } from "../../components/home/projects/experiences";
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
import { OBR_COPY, OBR_DOCUMENT_ID } from "./obr-content";

const EXPECTED_HINTS = ["idea", "idea", "shift", "shift", "system", "system", "system"] as const;

function expectedMovements(): Movement[] {
  return OBR_EXPERIENCE.movements.map((movement, index) => ({
    ...movement,
    infoHint: EXPECTED_HINTS[index],
  }));
}


async function main() {
  const project = await fetchPublishedProjectBySlug("our-boy-roy");
  const shipped = projectById("our-boy-roy");
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
      collaborators: shipped.collaborators,
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
          context: editorial.context === OBR_COPY.context,
          roles: editorial.roles.join("|") === OBR_COPY.roles.join("|"),
          noBrandDna: !editorial.roles.includes("Brand DNA"),
          noStrategy: !editorial.roles.includes("Brand Strategy"),
          noNaming: !editorial.roles.includes("Naming"),
          noPhotography: editorial.roles.every((role) => !/photo/i.test(role)),
          workingContext: editorial.workingContext === OBR_COPY.workingContext,
          collaboratorsOmitted: editorial.collaborators.length === 0,
          ideaMatchesApproved: editorial.idea === OBR_COPY.idea.body,
          shiftMatchesApproved: editorial.shift === OBR_COPY.shift.body,
          systemMatchesApproved: editorial.system === OBR_COPY.system.body,
          outcomeOmitted: editorial.outcome == null,
          ideaDiffersFromShipped: editorial.idea !== OBR_EXPERIENCE.infoSections[0].copy,
          shiftDiffersFromShipped: editorial.shift !== OBR_EXPERIENCE.infoSections[1].copy,
          systemDiffersFromShipped: editorial.system !== OBR_EXPERIENCE.infoSections[2].copy,
        },
        presentationParity: presentationFail.length === 0,
      },
      null,
      2
    )
  );

  assert.equal(project._id, OBR_DOCUMENT_ID);
  assert.equal(result.record.id, "our-boy-roy");
  assert.equal(experience.slug, "our-boy-roy");
  assert.equal(experience.movements.length, 7);
  assert.equal(project.outcome == null, true);
  assert.deepEqual(sectionIds, ["idea", "shift", "system"]);
  assert.equal(experience.authorship?.workingContext, OBR_COPY.workingContext);
  assert.equal(experience.authorship?.collaborators?.length ?? 0, 0);
  assert.equal(experience.authorship?.roles.includes("Brand DNA"), false);
  assert.equal(experience.authorship?.roles.includes("Brand Strategy"), false);
  assert.equal(experience.authorship?.roles.includes("Naming"), false);
  assert.equal(
    experience.movements.filter((movement) => movement.media.type === "video").every((movement) => movement.media.fit === "contain"),
    true
  );
  assert.deepEqual(
    experience.movements.filter((movement) => movement.relation === "pair").map((movement) => movement.id),
    []
  );
  assert.equal(experience.movements[6]?.infoHint, "system");
  assert.deepEqual(presentationFail, [], `Presentation mismatches:\n${JSON.stringify(presentationFail, null, 2)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
