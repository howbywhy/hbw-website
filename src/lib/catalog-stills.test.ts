/**
 * Every card names a real picture of its own project, at its real size.
 *
 * This replaces a test that lived beside a FLIP transition which no longer
 * runs — the module it tested was reachable only from its own test file.
 * What that test actually asserted was that the transition's destination
 * matched the first movement, which was a thing compared to itself.
 *
 * A stricter version was tried first and thrown away: that a card shows the
 * frame it opens into. KOJA and CLOSED both break it on purpose — a project
 * whose sequence opens on a landscape film is given a portrait card, because
 * a card is a different shape from a screen. An invariant two of seven
 * projects deliberately ignore is not an invariant.
 *
 * What is true of all of them is this, and it has already been wrong: Our Boy
 * Roy's card declared 1350x1688 for a file that is 1334x2000, which the
 * verifier reported on every run for weeks before anyone read it.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { liveProjects, projectById } from "../components/home/catalog";

/** A JPEG's real dimensions, read from the frame header rather than trusted. */
function jpegSize(path: string) {
  const b = readFileSync(path);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i += 1; continue; }
    const marker = b[i + 1];
    // SOF0..SOF15, skipping the four that are not frame headers
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

test("every card names a real picture of its own project, at its real size", () => {
  for (const project of liveProjects()) {
    const record = projectById(project.id);
    assert.ok(record, project.id);
    const src = record.src;

    assert.ok(
      src.startsWith(`/projects/${project.id}/`),
      `${project.id}: its card is ${src}, which belongs to another project`
    );

    const file = `public${src}`;
    assert.ok(existsSync(file), `${project.id}: ${src} is not in the repo`);

    if (!src.endsWith(".jpg")) continue;
    const real = jpegSize(file);
    assert.ok(real, `${project.id}: could not read ${src}`);
    assert.equal(
      `${record.width}x${record.height}`,
      `${real.width}x${real.height}`,
      `${project.id}: its card says ${record.width}x${record.height}, the file is ${real.width}x${real.height}`
    );
  }
});
