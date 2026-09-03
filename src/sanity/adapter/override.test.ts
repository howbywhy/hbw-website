import assert from "node:assert/strict";
import { test } from "node:test";
import { movementSpan } from "../../components/home/projects/types";
import { sanityProjectToFrontendProject } from "./index";
import { EMPTY_CATALOG, TEST_MEDIA, baseProject, filmMovement, stillMovement } from "./fixtures";

function mapped(extra: Parameters<typeof stillMovement>[4] = {}, width = 1920, height = 1080) {
  const project = baseProject({
    movements: [stillMovement("m1", "/tmp/still.jpg", width, height, extra)],
  });
  return sanityProjectToFrontendProject(project, EMPTY_CATALOG, TEST_MEDIA).experience.movements[0];
}

test("presentation override absent keeps G3 derived behavior", () => {
  const landscape = mapped();
  assert.equal(landscape.kind, "landscape");
  assert.equal(landscape.span, undefined);
  assert.equal(landscape.media.fit, "contain");
  assert.equal(movementSpan(landscape), "wide");

  const portrait = mapped({}, 1080, 1350);
  assert.equal(portrait.kind, "portrait");
  assert.equal(portrait.span, undefined);
  assert.equal(movementSpan(portrait), "narrow");

  const film = sanityProjectToFrontendProject(
    baseProject({
      movements: [filmMovement("f1", "/tmp/clip.mp4", "/tmp/poster.jpg", 1920, 1080)],
    }),
    EMPTY_CATALOG,
    TEST_MEDIA
  ).experience.movements[0];
  assert.equal(film.kind, "film");
  assert.equal(film.span, undefined);
  assert.equal(film.media.fit, "contain");
  assert.equal(movementSpan(film), "wide");
});

test("default override values do not change derived behavior", () => {
  const movement = mapped({
    presentationOverride: { frameWidth: "default", mediaFit: "default", mediaType: "default" },
  });
  assert.equal(movement.kind, "landscape");
  assert.equal(movement.span, undefined);
  assert.equal(movement.media.fit, "contain");
});

test("narrow only changes span", () => {
  const baseline = mapped();
  const movement = mapped({ presentationOverride: { frameWidth: "narrow" } });
  assert.equal(movement.span, "narrow");
  assert.equal(movementSpan(movement), "narrow");
  assert.equal(movement.kind, baseline.kind);
  assert.equal(movement.media.fit, baseline.media.fit);
  assert.equal(movement.scale, baseline.scale);
  assert.equal(movement.pace, baseline.pace);
  assert.equal(movement.relation, baseline.relation);
  assert.equal(movement.infoHint, baseline.infoHint);
});

test("graphic only changes kind", () => {
  const baseline = mapped({}, 595, 842);
  const movement = mapped({ presentationOverride: { mediaType: "graphic" } }, 595, 842);
  assert.equal(movement.kind, "graphic");
  assert.equal(movement.span, baseline.span);
  assert.equal(movement.media.fit, baseline.media.fit);
  assert.equal(movement.scale, baseline.scale);
  assert.equal(movement.media.src, baseline.media.src);
});

test("cover only changes fit", () => {
  const baseline = mapped();
  const movement = mapped({ presentationOverride: { mediaFit: "cover" } });
  assert.equal(movement.media.fit, "cover");
  assert.equal(movement.kind, baseline.kind);
  assert.equal(movement.span, baseline.span);
  assert.equal(movement.scale, baseline.scale);
});

test("override combinations do not mutate unrelated fields", () => {
  const baseline = mapped({ scale: "standard", pace: "normal", relation: "single" });
  const movement = mapped({
    scale: "standard",
    pace: "normal",
    relation: "single",
    presentationOverride: { frameWidth: "narrow", mediaFit: "cover", mediaType: "graphic" },
  });
  assert.equal(movement.span, "narrow");
  assert.equal(movement.media.fit, "cover");
  assert.equal(movement.kind, "graphic");
  assert.equal(movement.scale, baseline.scale);
  assert.equal(movement.pace, baseline.pace);
  assert.equal(movement.relation, baseline.relation);
  assert.equal(movement.infoHint, baseline.infoHint);
  assert.equal(movement.media.src, baseline.media.src);
  assert.equal(movement.media.width, baseline.media.width);
});

test("graphic cannot be derived without an override", () => {
  const movement = mapped({}, 595, 842);
  assert.equal(movement.kind, "portrait");
  assert.notEqual(movement.kind, "graphic");
});
