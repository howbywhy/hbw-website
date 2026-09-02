/**
 * Real Sanity Our Boy Roy → adapter → shipped local presentation.
 * Networked validation only. Not part of npm test.
 * Editorial copy is allowed to differ. Outcome is intentionally omitted.
 */
import assert from "node:assert/strict";
import { projectById } from "../../components/home/catalog";
import { OBR_EXPERIENCE } from "../../components/home/projects/experiences";
import { movementSpan, type Movement } from "../../components/home/projects/types";
import { sanityProjectToFrontendProject } from "../adapter/map";
import { portableTextToPlainCopy } from "../adapter/portableText";
import { fetchPublishedProjectBySlug, sckMediaConfig } from "./fetch-sck";
import { OBR_COPY, OBR_DOCUMENT_ID } from "./obr-content";

type Mismatch = { id: string; field: string; expected: unknown; actual: unknown };

function basename(path: string | undefined) {
  return path?.split("/").pop() ?? "";
}

function assetName(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const asset = "asset" in value ? (value as { asset?: { originalFilename?: string } }).asset : undefined;
  return asset && "originalFilename" in asset ? (asset.originalFilename ?? "") : "";
}

const EXPECTED_HINTS = ["idea", "idea", "shift", "shift", "system", "system", "system"] as const;

function expectedMovements(): Movement[] {
  return OBR_EXPERIENCE.movements.map((movement, index) => ({
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
