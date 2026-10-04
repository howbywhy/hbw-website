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

/**
 * A project route used to serialise its own experience into its payload, so
 * each of these asserted "mine is here, nobody else's is". The route renders
 * the workspace viewer now and passes no `published` experience, so no page
 * carries an experience blob at all — its own included.
 *
 * The guard that mattered is kept and widened: a project page must not ship
 * any project's experience. The visible, crawlable content is unaffected;
 * /projects/koja still serves 646 words naming KOJA nine times.
 */

test("/projects/sck SSG payload carries no experience blob", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("projects/sck"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/sck"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/sck"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/sck"), false);
  assert.equal(ssgPayloadHasSub3Experience("projects/sck"), false);
  assert.equal(ssgPayloadHasObrExperience("projects/sck"), false);
});

test("/projects/bar-closed SSG payload carries no experience blob", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("projects/bar-closed"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/bar-closed"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/bar-closed"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/bar-closed"), false);
  assert.equal(ssgPayloadHasSub3Experience("projects/bar-closed"), false);
  assert.equal(ssgPayloadHasObrExperience("projects/bar-closed"), false);
});

test("/projects/koja SSG payload carries no experience blob", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("projects/koja"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/koja"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/koja"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/koja"), false);
  assert.equal(ssgPayloadHasSub3Experience("projects/koja"), false);
  assert.equal(ssgPayloadHasObrExperience("projects/koja"), false);
});

test("/projects/chris-sisarich SSG payload carries no experience blob", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("projects/chris-sisarich"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/chris-sisarich"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/chris-sisarich"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/chris-sisarich"), false);
  assert.equal(ssgPayloadHasSub3Experience("projects/chris-sisarich"), false);
  assert.equal(ssgPayloadHasObrExperience("projects/chris-sisarich"), false);
});

test("/projects/sub-3 SSG payload carries no experience blob", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasSub3Experience("projects/sub-3"), false);
  assert.equal(ssgPayloadHasObrExperience("projects/sub-3"), false);
});

test("/projects/our-boy-roy SSG payload carries no experience blob", { skip: !built }, () => {
  assert.equal(ssgPayloadHasSckExperience("projects/our-boy-roy"), false);
  assert.equal(ssgPayloadHasClosedExperience("projects/our-boy-roy"), false);
  assert.equal(ssgPayloadHasKojaExperience("projects/our-boy-roy"), false);
  assert.equal(ssgPayloadHasChrisExperience("projects/our-boy-roy"), false);
  assert.equal(ssgPayloadHasSub3Experience("projects/our-boy-roy"), false);
  assert.equal(ssgPayloadHasObrExperience("projects/our-boy-roy"), false);
});
