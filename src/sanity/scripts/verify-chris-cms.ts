/**
 * Real Sanity Chris Sisarich → adapter → shipped local presentation.
 * Networked validation only. Not part of npm test.
 * Editorial copy is allowed to differ. Outcome is intentionally omitted.
 */
import assert from "node:assert/strict";
import { projectById } from "../../components/home/catalog";
import { SISARICH_EXPERIENCE } from "../../components/home/projects/experiences";
import { movementSpan, type Movement } from "../../components/home/projects/types";
import { sanityProjectToFrontendProject } from "../adapter/map";
import { portableTextToPlainCopy } from "../adapter/portableText";
import { fetchPublishedProjectBySlug, sckMediaConfig } from "./fetch-sck";
import { CHRIS_COPY, CHRIS_DOCUMENT_ID } from "./chris-content";

type Mismatch = { id: string; field: string; expected: unknown; actual: unknown };

function basename(path: string | undefined) {
  return path?.split("/").pop() ?? "";
}

function assetName(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const asset = "asset" in value ? (value as { asset?: { originalFilename?: string } }).asset : undefined;
  return asset && "originalFilename" in asset ? (asset.originalFilename ?? "") : "";
}

const EXPECTED_HINTS = ["idea", "idea", "shift", "shift", "system", "system", "system", "system"] as const;

function expectedMovements(): Movement[] {
  return SISARICH_EXPERIENCE.movements.map((movement, index) => ({
    ...movement,
    infoHint: EXPECTED_HINTS[index],
  }));
}

function compareMovements(expected: Movement[], actual: Movement[], raw: SanityMovements): Mismatch[] {
  const mismatches: Mismatch[] = [];
  if (expected.length !== actual.length) {
    mismatches.push({ id: "*", field: "count", expected: expected.length, actual: actual.length });
    return mismatches;
  }
  expected.forEach((left, index) => {
    const right = actual[index];
    const source = raw[index];
    const fields: Array<[string, unknown, unknown]> = [
      ["id", left.id, right.id],
      ["order", index, index],
      ["media.type", left.media.type, right.media.type],
      [
        "media.identity",
        basename(left.media.type === "video" ? left.media.mp4 || left.media.src : left.media.src),
        assetName(left.media.type === "video" ? source.video : source.still),
      ],
      ["media.posterIdentity", basename(left.media.poster), left.media.type === "video" ? assetName(source.poster) : ""],
      ["media.webmIdentity", basename(left.media.webm), left.media.webm ? assetName(source.webm) : ""],
      ["media.width", left.media.width, right.media.width],
      ["media.height", left.media.height, right.media.height],
      ["media.fit", left.media.fit, right.media.fit],
      ["media.alt", left.media.alt, right.media.alt],
      ["scale", left.scale, right.scale],
      ["pace", left.pace ?? "normal", right.pace],
      ["relation", left.relation ?? "single", right.relation],
      ["infoHint", left.infoHint, right.infoHint],
      ["kind", left.kind, right.kind],
      ["span.stored", left.span, right.span],
      ["span.resolved", movementSpan(left), movementSpan(right)],
    ];
    for (const [field, exp, act] of fields) {
      if (exp !== act) mismatches.push({ id: left.id, field, expected: exp, actual: act });
    }
    if (!right.media.src.includes("cdn.sanity.io")) {
      mismatches.push({ id: left.id, field: "media.src.host", expected: "cdn.sanity.io", actual: right.media.src });
    }
    if (left.media.webm) {
      if (!right.media.webm?.includes("cdn.sanity.io")) {
        mismatches.push({ id: left.id, field: "media.webm.host", expected: "cdn.sanity.io", actual: right.media.webm });
      }
    } else if (right.media.webm) {
      mismatches.push({ id: left.id, field: "media.webm", expected: undefined, actual: right.media.webm });
    }
  });
  return mismatches;
}

type SanityMovements = Array<{
  still?: { asset?: { originalFilename?: string } };
  poster?: { asset?: { originalFilename?: string } };
  video?: { asset?: { originalFilename?: string } };
  webm?: { asset?: { originalFilename?: string } };
  presentationOverride?: { mediaFit?: string; mediaType?: string };
}>;

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

  const recordGaps: Mismatch[] = [];
  const recordFields: Array<[string, unknown, unknown]> = [
    ["name", shipped.name, result.record.name],
    ["proposition", shipped.idea, result.record.idea],
    ["year", shipped.year, result.record.year],
    ["sectors", (shipped.sectors ?? []).join("|"), (result.record.sectors ?? []).join("|")],
    ["disciplines", (shipped.disciplines ?? []).join("|"), (result.record.disciplines ?? []).join("|")],
    ["preview.width", shipped.width, result.record.width],
    ["preview.height", shipped.height, result.record.height],
    ["preview.identity", basename(shipped.src), assetName(project.preview)],
  ];
  for (const [field, exp, act] of recordFields) {
    if (exp !== act) recordGaps.push({ id: "record", field, expected: exp, actual: act });
  }

  const experience = result.experience;
  const movementGaps = compareMovements(
    expectedMovements(),
    experience.movements,
    project.movements as SanityMovements
  );
  const sectionIds = experience.infoSections.map((section) => section.id);
  const headingGaps: Mismatch[] = [];
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
        overrides: (project.movements as SanityMovements)
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
