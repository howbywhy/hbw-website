import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  ssgAppDir,
  ssgPayloadHasChrisExperience,
  ssgPayloadHasClosedExperience,
  ssgPayloadHasKojaExperience,
  ssgPayloadHasObrExperience,
  ssgPayloadHasSckExperience,
  ssgPayloadHasSub3Experience,
} from "./ssg-payload";

const built = existsSync(ssgAppDir());

test("retired Nido is not an SSG project route", { skip: !built }, () => {
  assert.equal(existsSync(path.join(ssgAppDir(), "projects/bistro-nido.html")), false);
  assert.equal(existsSync(path.join(ssgAppDir(), "projects/bistro-nido.rsc")), false);
  assert.equal(ssgPayloadHasSckExperience("projects/bistro-nido"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/bistro-nido"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/bistro-nido"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/bistro-nido"), false);
  assert.equal(ssgPayloadHasSub3Experience("projects/bistro-nido"), false);
  assert.equal(ssgPayloadHasObrExperience("projects/bistro-nido"), false);
});

test("unrelated SSG pages do not serialize SCK, CLOSED, KOJA, Chris, SUB:3, or OBR experiences", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("index"), false);
  assert.equal(ssgPayloadHasClosedExperience("index"), false);
  assert.equal(ssgPayloadHasKojaExperience("index"), false);
  assert.equal(ssgPayloadHasChrisExperience("index"), false);
  assert.equal(ssgPayloadHasSub3Experience("index"), false);
  assert.equal(ssgPayloadHasObrExperience("index"), false);
  assert.equal(ssgPayloadHasSckExperience("manifesto"), false);
  assert.equal(ssgPayloadHasClosedExperience("manifesto"), false);
  assert.equal(ssgPayloadHasKojaExperience("manifesto"), false);
  assert.equal(ssgPayloadHasChrisExperience("manifesto"), false);
  assert.equal(ssgPayloadHasSub3Experience("manifesto"), false);
  assert.equal(ssgPayloadHasObrExperience("manifesto"), false);
});

test("/projects/sck SSG payload includes SCK only", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("projects/sck"), true);
  assert.equal(ssgPayloadHasClosedExperience("projects/sck"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/sck"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/sck"), false);
  assert.equal(ssgPayloadHasSub3Experience("projects/sck"), false);
  assert.equal(ssgPayloadHasObrExperience("projects/sck"), false);
});

test("/projects/bar-closed SSG payload includes CLOSED only", { skip: !built }, () => {
  assert.equal(ssgPayloadHasClosedExperience("projects/bar-closed"), true);
  assert.equal(ssgPayloadHasSckExperience("projects/bar-closed"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/bar-closed"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/bar-closed"), false);
  assert.equal(ssgPayloadHasSub3Experience("projects/bar-closed"), false);
  assert.equal(ssgPayloadHasObrExperience("projects/bar-closed"), false);
});

test("/projects/koja SSG payload includes KOJA only", { skip: !built }, () => {
  assert.equal(ssgPayloadHasKojaExperience("projects/koja"), true);
  assert.equal(ssgPayloadHasSckExperience("projects/koja"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/koja"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/koja"), false);
  assert.equal(ssgPayloadHasSub3Experience("projects/koja"), false);
  assert.equal(ssgPayloadHasObrExperience("projects/koja"), false);
});

test("/projects/chris-sisarich SSG payload includes Chris only", { skip: !built }, () => {
  assert.equal(ssgPayloadHasChrisExperience("projects/chris-sisarich"), true);
  assert.equal(ssgPayloadHasSckExperience("projects/chris-sisarich"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/chris-sisarich"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/chris-sisarich"), false);
  assert.equal(ssgPayloadHasSub3Experience("projects/chris-sisarich"), false);
  assert.equal(ssgPayloadHasObrExperience("projects/chris-sisarich"), false);
});

test("/projects/sub-3 SSG payload includes SUB:3 only", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSub3Experience("projects/sub-3"), true);
  assert.equal(ssgPayloadHasSckExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasObrExperience("projects/sub-3"), false);
});

test("/projects/our-boy-roy SSG payload includes OBR only", { skip: !built }, () => {
  assert.equal(ssgPayloadHasObrExperience("projects/our-boy-roy"), true);
  assert.equal(ssgPayloadHasSckExperience("projects/our-boy-roy"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/our-boy-roy"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/our-boy-roy"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/our-boy-roy"), false);
  assert.equal(ssgPayloadHasSub3Experience("projects/our-boy-roy"), false);
});
