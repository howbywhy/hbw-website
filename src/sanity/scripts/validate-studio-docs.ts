/**
 * Confirm the six published projects stay valid under Studio error rules.
 * Warnings are reported but do not fail. Networked. Not part of npm test.
 */
import assert from "node:assert/strict";
import type { SanityMovement, SanityProject } from "../adapter/types";
import { terminalPairMessage, uniqueMovementKeyMessage } from "../schemaTypes/editorRules";
import { fetchPublishedProjectBySlug } from "./fetch-sck";

const SLUGS = ["sck", "closed", "koja", "chris-sisarich", "sub-3", "our-boy-roy"] as const;

function hasAsset(value: { asset?: unknown } | undefined) {
  return Boolean(value?.asset);
}

function movementErrors(project: SanityProject) {
  const movements = project.movements;
  const errors: string[] = [];
  const pairMessage = terminalPairMessage(movements);
  const uniqueMessage = uniqueMovementKeyMessage(movements);
  if (pairMessage !== true) errors.push(pairMessage);
  if (uniqueMessage !== true) errors.push(uniqueMessage);
  if (!project.title?.trim()) errors.push("title required");
  if (!project.slug?.current?.trim()) errors.push("slug required");
  if (!/^\d{4}$/.test(project.year || "")) errors.push("year required");
  if (!project.proposition?.trim()) errors.push("proposition required");
  if (!project.roles?.length) errors.push("roles required");
  for (const movement of movements) {
    if (!movement.alt?.trim()) errors.push(`${movement._key}: alt required`);
    if (!movement.scale) errors.push(`${movement._key}: scale required`);
    if (!movement.pace) errors.push(`${movement._key}: pace required`);
    if (!movement.relation) errors.push(`${movement._key}: relation required`);
    if (movement.mediaType === "still" && !hasAsset(movement.still)) {
      errors.push(`${movement._key}: still image required`);
    }
    if (movement.mediaType === "film") {
      if (!hasAsset(movement.video)) errors.push(`${movement._key}: film MP4 required`);
      if (!hasAsset(movement.poster)) errors.push(`${movement._key}: film poster required`);
    }
  }
  return errors;
}

function byKey(project: SanityProject, key: string) {
  const movement = project.movements.find((item) => item._key === key);
  assert.ok(movement, `missing movement ${key}`);
  return movement;
}

function assertClosedProofs(project: SanityProject) {
  assert.equal(project._id, "project-closed");
  assert.equal(project.movements.length, 22);
  const c03 = byKey(project, "c03");
  assert.equal(c03.scale, "major");
  assert.equal(c03.pace, "pause");
  const c04 = byKey(project, "c04");
  assert.equal(c04.relation, "pair");
  assert.equal(c04.pace, "tight");
  const film01 = byKey(project, "c01");
  const film021 = byKey(project, "c20");
  assert.equal(film01.mediaType, "film");
  assert.equal(film021.mediaType, "film");
  assert.ok(hasAsset(film01.video) && hasAsset(film01.poster), "CLOSED 01 needs MP4 + poster");
  assert.ok(hasAsset(film021.video) && hasAsset(film021.poster), "CLOSED 021 needs MP4 + poster");
}

async function main() {
  const report: Array<{
    id: string | undefined;
    slug: string;
    movements: number;
    films: number;
    errors: string[];
  }> = [];

  for (const slug of SLUGS) {
    const project = await fetchPublishedProjectBySlug(slug);
    const errors = movementErrors(project);
    if (slug === "closed") assertClosedProofs(project);
    report.push({
      id: project._id,
      slug,
      movements: project.movements.length,
      films: project.movements.filter((movement: SanityMovement) => movement.mediaType === "film").length,
      errors,
    });
    assert.deepEqual(errors, [], `${slug} would be invalid:\n${JSON.stringify(errors, null, 2)}`);
  }

  console.log(JSON.stringify({ compatible: true, projects: report }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
