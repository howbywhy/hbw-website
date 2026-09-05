/**
 * Real Sanity SCK → adapter → shipped local models.
 * Networked validation only. Not part of npm test.
 *
 * Protects: document id, 21 movements, order/ids/kind/scale/relation/resolved pace,
 * media role identity (not local path vs CDN URL), film/poster presence via identity,
 * idea/shift/system headings, critical Info fields, Sanity CDN host.
 * Surfaces catalog preview filename vs Sanity preview as editorial drift.
 */
import assert from "node:assert/strict";
import { projectById } from "../../components/home/catalog";
import { SCK_EXPERIENCE } from "../../components/home/projects/experiences";
import { sanityProjectToFrontendProject } from "../adapter/map";
import { portableTextToPlainCopy } from "../adapter/portableText";
import {
  compareMovementParity,
  previewChromeDrift,
  type SanityMovementAssets,
  type VerifyMismatch,
} from "./cms-verify-lib";
import { SCK_COPY } from "./sck-content";
import { fetchPublishedSckProject, sckMediaConfig } from "./fetch-sck";

async function main() {
  const project = await fetchPublishedSckProject();
  const shipped = projectById("sck");
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
    ["id", shipped.id, result.record.id],
    ["href", shipped.href, result.record.href],
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
    SCK_EXPERIENCE.movements,
    experience.movements,
    project.movements as SanityMovementAssets[]
  );
  const sectionIds = experience.infoSections.map((section) => section.id);
  const headingGaps: VerifyMismatch[] = [];
  if (sectionIds.join() !== "idea,shift,system") {
    headingGaps.push({ id: "info", field: "ids", expected: "idea,shift,system", actual: sectionIds.join() });
  }
  experience.infoSections.forEach((section, index) => {
    const shippedSection = SCK_EXPERIENCE.infoSections[index];
    if (shippedSection && section.heading !== shippedSection.heading) {
      headingGaps.push({ id: section.id, field: "heading", expected: shippedSection.heading, actual: section.heading });
    }
  });

  const editorial = {
    context: portableTextToPlainCopy(project.context),
    roles: result.experience.authorship?.roles ?? [],
    workingContext: result.experience.authorship?.workingContext ?? null,
    collaborators: result.experience.authorship?.collaborators ?? [],
    idea: experience.infoSections.find((section) => section.id === "idea")?.copy,
    shift: experience.infoSections.find((section) => section.id === "shift")?.copy,
    system: experience.infoSections.find((section) => section.id === "system")?.copy,
    outcome: experience.infoSections.find((section) => section.id === "outcome")?.copy ?? null,
    shippedIdea: SCK_EXPERIENCE.infoSections[0].copy,
    shippedShift: SCK_EXPERIENCE.infoSections[1].copy,
    shippedSystem: SCK_EXPERIENCE.infoSections[2].copy,
  };

  const presentationFail = [...recordGaps, ...movementGaps, ...headingGaps];
  console.log(
    JSON.stringify(
      {
        documentId: project._id,
        slug: result.record.id,
        movementCount: experience.movements.length,
        infoHints: experience.movements.map((movement) => `${movement.id}:${movement.infoHint}`),
        overrides: project.movements
          .filter((movement) => movement.presentationOverride?.frameWidth === "narrow")
          .map((movement) => movement._key),
        recordGaps,
        movementGaps,
        headingGaps,
        editorialDrift,
        editorialApproved: {
          context: editorial.context === SCK_COPY.context,
          roles: editorial.roles.join("|") === SCK_COPY.roles.join("|"),
          workingContextOmitted: editorial.workingContext == null,
          collaboratorsOmitted: editorial.collaborators.length === 0,
          ideaMatchesApproved: editorial.idea === SCK_COPY.idea.body,
          shiftMatchesApproved: editorial.shift === SCK_COPY.shift.body,
          systemMatchesApproved: editorial.system === SCK_COPY.system.body,
          outcomeOmitted: editorial.outcome == null,
          ideaDiffersFromShipped: editorial.idea !== editorial.shippedIdea,
          shiftDiffersFromShipped: editorial.shift !== editorial.shippedShift,
          systemDiffersFromShipped: editorial.system !== editorial.shippedSystem,
        },
        presentationParity: presentationFail.length === 0,
      },
      null,
      2
    )
  );

  assert.equal(project._id, "project-sck");
  assert.equal(experience.movements.length, 21);
  assert.equal(project.outcome == null, true);
  assert.deepEqual(sectionIds, ["idea", "shift", "system"]);
  assert.deepEqual(presentationFail, [], `Presentation mismatches:\n${JSON.stringify(presentationFail, null, 2)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
