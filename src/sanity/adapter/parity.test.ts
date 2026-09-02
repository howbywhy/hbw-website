import assert from "node:assert/strict";
import { test } from "node:test";
import { SCK_EXPERIENCE, SISARICH_EXPERIENCE } from "../../components/home/projects/experiences";
import { movementSpan, type Movement } from "../../components/home/projects/types";
import { sanityProjectToProjectExperience } from "./map";
import { TEST_MEDIA, baseProject, blocks, movementFromShipped } from "./fixtures";

type FieldMismatch = {
  id: string;
  field: string;
  expected: unknown;
  actual: unknown;
};

function compareMovements(expected: Movement[], actual: Movement[]) {
  const mismatches: FieldMismatch[] = [];
  if (expected.length !== actual.length) {
    mismatches.push({ id: "*", field: "count", expected: expected.length, actual: actual.length });
    return mismatches;
  }
  expected.forEach((left, index) => {
    const right = actual[index];
    const fields: Array<[string, unknown, unknown]> = [
      ["id", left.id, right.id],
      ["order", index, index],
      ["media.type", left.media.type, right.media.type],
      ["media.src", left.media.src, right.media.src],
      ["media.poster", left.media.poster, right.media.poster],
      ["media.webm", left.media.webm, right.media.webm],
      ["media.fit", left.media.fit, right.media.fit],
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
  });
  return mismatches;
}

test("SCK parity against shipped experience", () => {
  const experience = sanityProjectToProjectExperience(
    baseProject({
      title: "SCK",
      slug: { current: "sck" },
      proposition: "Intersecting Realities",
      idea: { heading: "The idea", body: blocks(SCK_EXPERIENCE.infoSections[0].copy) },
      shift: { heading: "The shift", body: blocks(SCK_EXPERIENCE.infoSections[1].copy) },
      system: { heading: "The system", body: blocks(SCK_EXPERIENCE.infoSections[2].copy) },
      outcome: { heading: "The outcome", body: blocks(SCK_EXPERIENCE.infoSections[3].copy) },
      movements: SCK_EXPERIENCE.movements.map(movementFromShipped),
    }),
    TEST_MEDIA
  );
  assert.equal(experience.slug, "sck");
  assert.equal(experience.movements.length, 21);
  assert.deepEqual(
    experience.infoSections.map((section) => section.id),
    ["idea", "shift", "system", "outcome"]
  );
  const mismatches = compareMovements(SCK_EXPERIENCE.movements, experience.movements);
  assert.deepEqual(mismatches, [], `SCK movement mismatches:\n${JSON.stringify(mismatches, null, 2)}`);
});

test("Chris Sisarich parity against shipped experience", () => {
  const experience = sanityProjectToProjectExperience(
    baseProject({
      title: "Chris Sisarich",
      slug: { current: "chris-sisarich" },
      proposition: "Beauty Amongst The Mundane",
      idea: { heading: "The idea", body: blocks(SISARICH_EXPERIENCE.infoSections[0].copy) },
      shift: { heading: "The shift", body: blocks(SISARICH_EXPERIENCE.infoSections[1].copy) },
      system: { heading: "The system", body: blocks(SISARICH_EXPERIENCE.infoSections[2].copy) },
      outcome: { heading: "The outcome", body: blocks(SISARICH_EXPERIENCE.infoSections[3].copy) },
      movements: SISARICH_EXPERIENCE.movements.map(movementFromShipped),
    }),
    TEST_MEDIA
  );
  assert.equal(experience.movements.length, 8);
  const mismatches = compareMovements(SISARICH_EXPERIENCE.movements, experience.movements);
  assert.deepEqual(mismatches, [], `Chris movement mismatches:\n${JSON.stringify(mismatches, null, 2)}`);
});
