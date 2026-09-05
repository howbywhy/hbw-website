/**
 * Real Sanity CLOSED → adapter → shipped local presentation.
 * Networked validation only. Not part of npm test.
 *
 * Protects:
 * - document id `project-closed`, CMS slug `closed`, 22 movements
 * - movement order, ids, kind, scale, relation, resolved pace, span
 * - media role identity (basename vs Sanity originalFilename), not local path vs CDN URL
 * - Sanity CDN host for published media
 * - films c01 / c20 (CLOSED 01 and 021) plus posters
 * - c03 major + pause
 * - c04 pair + tight (04→05)
 * - idea/shift/system Info sections, no Outcome
 * - critical Project Info fields: name, proposition, year, sectors, disciplines
 *
 * Surfaces separately (does not fail):
 * - catalog thumb filename/size vs Sanity preview asset (Browse chrome stays catalog.ts)
 * - editorial copy drift vs CLOSED_COPY / local experience
 */
import assert from "node:assert/strict";
import { projectById } from "../../components/home/catalog";
import { CLOSED_EXPERIENCE } from "../../components/home/projects/experiences";
import { movementPace, type Movement } from "../../components/home/projects/types";
import { sanityProjectToFrontendProject } from "../adapter/map";
import { portableTextToPlainCopy } from "../adapter/portableText";
import { CLOSED_COPY, CLOSED_DOCUMENT_ID } from "./closed-content";
import {
  assetName,
  compareMovementParity,
  previewChromeDrift,
  type SanityMovementAssets,
  type VerifyMismatch,
} from "./cms-verify-lib";
import { fetchPublishedProjectBySlug, sckMediaConfig } from "./fetch-sck";

const EXPECTED_HINTS = [
  "idea",
  "idea",
  "idea",
  "idea",
  "idea",
  "idea",
  "idea",
  "shift",
  "shift",
  "shift",
  "shift",
  "shift",
  "system",
  "system",
  "system",
  "system",
  "system",
  "system",
  "system",
  "system",
  "system",
  "system",
] as const;

function expectedMovements(): Movement[] {
  return CLOSED_EXPERIENCE.movements.map((movement, index) => {
    return { ...movement, infoHint: EXPECTED_HINTS[index] };
  });
}

async function main() {
  const project = await fetchPublishedProjectBySlug("closed");
  const shipped = projectById("bar-closed");
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

  const byId = Object.fromEntries(experience.movements.map((movement) => [movement.id, movement]));
  const raw = project.movements as SanityMovementAssets[];
  const film01 = assetName(raw[0]?.video);
  const film021 = assetName(raw[19]?.video);
  const grammarGaps: VerifyMismatch[] = [];
  if (byId.c03?.scale !== "major") {
    grammarGaps.push({ id: "c03", field: "scale", expected: "major", actual: byId.c03?.scale });
  }
  if (movementPace(byId.c03) !== "pause") {
    grammarGaps.push({ id: "c03", field: "pace", expected: "pause", actual: movementPace(byId.c03) });
  }
  if (byId.c04?.relation !== "pair") {
    grammarGaps.push({ id: "c04", field: "relation", expected: "pair", actual: byId.c04?.relation });
  }
  if (movementPace(byId.c04) !== "tight") {
    grammarGaps.push({ id: "c04", field: "pace", expected: "tight", actual: movementPace(byId.c04) });
  }
  if (byId.c01?.media.type !== "video") {
    grammarGaps.push({ id: "c01", field: "media.type", expected: "video", actual: byId.c01?.media.type });
  }
  if (byId.c20?.media.type !== "video") {
    grammarGaps.push({ id: "c20", field: "media.type", expected: "video", actual: byId.c20?.media.type });
  }
  if (!byId.c01?.media.poster) {
    grammarGaps.push({ id: "c01", field: "media.poster", expected: "present", actual: byId.c01?.media.poster });
  }
  if (!byId.c20?.media.poster) {
    grammarGaps.push({ id: "c20", field: "media.poster", expected: "present", actual: byId.c20?.media.poster });
  }
  if (!/Portfolio-01/.test(film01)) {
    grammarGaps.push({ id: "c01", field: "media.identity", expected: "HBWxCLOSED-Portfolio-01", actual: film01 });
  }
  if (!/Portfolio-021/.test(film021)) {
    grammarGaps.push({ id: "c20", field: "media.identity", expected: "HBWxCLOSED-Portfolio-021", actual: film021 });
  }

  const presentationFail = [...recordGaps, ...movementGaps, ...headingGaps, ...grammarGaps];
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
        grammarGaps,
        editorialDrift,
        editorialApproved: {
          context: editorial.context === CLOSED_COPY.context,
          roles: editorial.roles.join("|") === CLOSED_COPY.roles.join("|"),
          workingContext: editorial.workingContext === CLOSED_COPY.workingContext,
          collaborators:
            editorial.collaborators.map((item) => `${item.name}|${item.contribution}`).join("||") ===
            CLOSED_COPY.collaborators.map((item) => `${item.name}|${item.contribution}`).join("||"),
          ideaMatchesApproved: editorial.idea === CLOSED_COPY.idea.body,
          shiftMatchesApproved: editorial.shift === CLOSED_COPY.shift.body,
          systemMatchesApproved: editorial.system === CLOSED_COPY.system.body,
          outcomeOmitted: editorial.outcome == null,
          ideaDiffersFromShipped: editorial.idea !== CLOSED_EXPERIENCE.infoSections[0].copy,
          shiftDiffersFromShipped: editorial.shift !== CLOSED_EXPERIENCE.infoSections[1].copy,
          systemDiffersFromShipped: editorial.system !== CLOSED_EXPERIENCE.infoSections[2].copy,
        },
        localMetadataCorrections: [],
        presentationParity: presentationFail.length === 0,
      },
      null,
      2
    )
  );

  assert.equal(project._id, CLOSED_DOCUMENT_ID);
  assert.equal(result.record.id, "closed");
  assert.equal(experience.slug, "closed");
  assert.equal(experience.movements.length, 22);
  assert.equal(project.outcome == null, true);
  assert.deepEqual(sectionIds, ["idea", "shift", "system"]);
  assert.deepEqual(presentationFail, [], `Presentation mismatches:\n${JSON.stringify(presentationFail, null, 2)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
