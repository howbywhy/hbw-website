import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { ssgAppDir, ssgPayloadHasClosedExperience, ssgPayloadHasSckExperience } from "./ssg-payload";

const built = existsSync(ssgAppDir());

test("unrelated SSG pages do not serialize SCK or CLOSED experiences", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("index"), false);
  assert.equal(ssgPayloadHasClosedExperience("index"), false);
  assert.equal(ssgPayloadHasSckExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasSckExperience("manifesto"), false);
  assert.equal(ssgPayloadHasClosedExperience("manifesto"), false);
});

test("/projects/sck SSG payload includes SCK only", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("projects/sck"), true);
  assert.equal(ssgPayloadHasClosedExperience("projects/sck"), false);
});

test("/projects/bar-closed SSG payload includes CLOSED only", { skip: !built }, () => {
  assert.equal(ssgPayloadHasClosedExperience("projects/bar-closed"), true);
  assert.equal(ssgPayloadHasSckExperience("projects/bar-closed"), false);
});
