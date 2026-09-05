/**
 * Real Sanity KOJA → adapter → shipped local presentation.
 * Networked validation only. Not part of npm test.
 *
 * Protects: document id, 8 movements, order/ids/kind/scale/relation/resolved pace,
 * media role identity, k03 1440×810 correction, idea/shift/system, no Outcome,
 * no “make healthy simple”, critical Info fields, Sanity CDN host.
 * Surfaces catalog preview filename vs Sanity preview as editorial drift.
 */
import assert from "node:assert/strict";
import { projectById } from "../../components/home/catalog";
import { KOJA_EXPERIENCE } from "../../components/home/projects/experiences";
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
import { KOJA_COPY, KOJA_DOCUMENT_ID } from "./koja-content";

const EXPECTED_HINTS = ["idea", "idea", "idea", "shift", "system", "system", "system", "system"] as const;

function expectedMovements(): Movement[] {
  return KOJA_EXPERIENCE.movements.map((movement, index) => {
    const next = { ...movement, infoHint: EXPECTED_HINTS[index] };
    // Local experience lists the logo film as 1920×1080; the shipped file and poster are 1440×810.
    if (movement.id === "k03") {
      return { ...next, media: { ...next.media, width: 1440, height: 810 } };
    }
    return next;
  });
}

async function main() {
  const project = await fetchPublishedProjectBySlug("koja");
  const shipped = projectById("koja");
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
        recordGaps,
        movementGaps,
        headingGaps,
        editorialDrift,
        editorialApproved: {
          context: editorial.context === KOJA_COPY.context,
          roles: editorial.roles.join("|") === KOJA_COPY.roles.join("|"),
          workingContextOmitted: editorial.workingContext == null,
          collaboratorsOmitted: editorial.collaborators.length === 0,
          ideaMatchesApproved: editorial.idea === KOJA_COPY.idea.body,
          shiftMatchesApproved: editorial.shift === KOJA_COPY.shift.body,
          systemMatchesApproved: editorial.system === KOJA_COPY.system.body,
          outcomeOmitted: editorial.outcome == null,
          historicLineSeparated: !/make healthy simple/i.test(
            [editorial.context, editorial.idea, editorial.shift, editorial.system].join("\n")
          ),
          ideaDiffersFromShipped: editorial.idea !== KOJA_EXPERIENCE.infoSections[0].copy,
          shiftDiffersFromShipped: editorial.shift !== KOJA_EXPERIENCE.infoSections[1].copy,
          systemDiffersFromShipped: editorial.system !== KOJA_EXPERIENCE.infoSections[2].copy,
        },
        localMetadataCorrections: [
          {
            id: "k03",
            field: "dimensions",
            local: "1920x1080",
            actual: "1440x810",
            reason: "Shipped KOJA-Logo.mp4 and poster are 1440×810. Local experiences.ts overstates the size. Aspect and presentation are unchanged.",
          },
        ],
        presentationParity: presentationFail.length === 0,
      },
      null,
      2
    )
  );

  assert.equal(project._id, KOJA_DOCUMENT_ID);
  assert.equal(result.record.id, "koja");
  assert.equal(experience.slug, "koja");
  assert.equal(experience.movements.length, 8);
  assert.equal(project.outcome == null, true);
  assert.deepEqual(sectionIds, ["idea", "shift", "system"]);
  assert.equal(
    /make healthy simple/i.test(
      [editorial.context, editorial.idea, editorial.shift, editorial.system].join("\n")
    ),
    false
  );
  assert.deepEqual(presentationFail, [], `Presentation mismatches:\n${JSON.stringify(presentationFail, null, 2)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
