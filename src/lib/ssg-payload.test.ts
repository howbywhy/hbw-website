import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import {
  ssgAppDir,
  ssgPayloadHasChrisExperience,
  ssgPayloadHasClosedExperience,
  ssgPayloadHasKojaExperience,
  ssgPayloadHasSckExperience,
} from "./ssg-payload";

const built = existsSync(ssgAppDir());

test("unrelated SSG pages do not serialize SCK, CLOSED, KOJA, or Chris experiences", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("index"), false);
  assert.equal(ssgPayloadHasClosedExperience("index"), false);
  assert.equal(ssgPayloadHasKojaExperience("index"), false);
  assert.equal(ssgPayloadHasChrisExperience("index"), false);
  assert.equal(ssgPayloadHasSckExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasSckExperience("manifesto"), false);
  assert.equal(ssgPayloadHasClosedExperience("manifesto"), false);
  assert.equal(ssgPayloadHasKojaExperience("manifesto"), false);
  assert.equal(ssgPayloadHasChrisExperience("manifesto"), false);
});

test("/projects/sck SSG payload includes SCK only", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("projects/sck"), true);
  assert.equal(ssgPayloadHasClosedExperience("projects/sck"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/sck"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/sck"), false);
});

test("/projects/bar-closed SSG payload includes CLOSED only", { skip: !built }, () => {
  assert.equal(ssgPayloadHasClosedExperience("projects/bar-closed"), true);
  assert.equal(ssgPayloadHasSckExperience("projects/bar-closed"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/bar-closed"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/bar-closed"), false);
});

test("/projects/koja SSG payload includes KOJA only", { skip: !built }, () => {
  assert.equal(ssgPayloadHasKojaExperience("projects/koja"), true);
  assert.equal(ssgPayloadHasSckExperience("projects/koja"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/koja"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/koja"), false);
});

test("/projects/chris-sisarich SSG payload includes Chris only", { skip: !built }, () => {
  assert.equal(ssgPayloadHasChrisExperience("projects/chris-sisarich"), true);
  assert.equal(ssgPayloadHasSckExperience("projects/chris-sisarich"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/chris-sisarich"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/chris-sisarich"), false);
});
