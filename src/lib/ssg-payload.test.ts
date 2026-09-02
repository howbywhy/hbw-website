import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { ssgAppDir, ssgPayloadHasSckExperience } from "./ssg-payload";

const built = existsSync(ssgAppDir());

test("unrelated SSG pages do not serialize the SCK experience", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("index"), false);
  assert.equal(ssgPayloadHasSckExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasSckExperience("manifesto"), false);
});

test("/projects/sck SSG payload includes the selected SCK experience", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("projects/sck"), true);
});
