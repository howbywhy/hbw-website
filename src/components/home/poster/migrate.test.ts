import assert from "node:assert/strict";
import { test } from "node:test";
import { objectBox, viewText } from "./geometry";
import { emptyPoster, migratePoster, promoteLegacyPoster } from "./migrate";
import type { LegacyPixelObj, PosterObj } from "./types";

const DESKTOP = { w: 1440, h: 820 };
const MOBILE = { w: 390, h: 700 };

function schema2Poster(objects: LegacyPixelObj[], extra: { frozen?: boolean } = {}) {
  return {
    schema: 2 as const,
    objects,
    decision: "",
    color: "#e23b2e",
    frozen: extra.frozen === true,
    tool: "select",
    font: "Visual",
    textSize: 28,
    align: "left",
    shape: "rect",
    shapeFill: false,
  };
}

const TYPE: LegacyPixelObj = {
  id: "t1",
  kind: "text",
  x: 200,
  y: 160,
  w: 360,
  h: 80,
  text: "WHY?",
  color: "#e23b2e",
  font: "Visual",
  size: 64,
  align: "left",
};

const IMAGE: LegacyPixelObj = {
  id: "i1",
  kind: "image",
  x: 80,
  y: 300,
  w: 240,
  h: 160,
  src: "data:image/jpeg;base64,xx",
  mime: "image/jpeg",
};

const SHAPE: LegacyPixelObj = {
  id: "s1",
  kind: "shape",
  shape: "rect",
  a: { x: 40, y: 40 },
  b: { x: 200, y: 120 },
  color: "#1d1d1d",
  fill: true,
};

const LINE: LegacyPixelObj = {
  id: "l1",
  kind: "shape",
  shape: "line",
  a: { x: 100, y: 100 },
  b: { x: 400, y: 180 },
  color: "#e23b2e",
  fill: false,
};

const ARROW: LegacyPixelObj = {
  id: "a1",
  kind: "shape",
  shape: "arrow",
  a: { x: 120, y: 400 },
  b: { x: 320, y: 200 },
  color: "#333333",
  fill: false,
};

const STROKE: LegacyPixelObj = {
  id: "d1",
  kind: "stroke",
  points: [
    { x: 50, y: 50 },
    { x: 80, y: 90 },
    { x: 140, y: 70 },
  ],
  color: "#e23b2e",
  width: 1.6,
};

function promote(objects: LegacyPixelObj[], field = DESKTOP, extra: { frozen?: boolean } = {}) {
  const hydrated = migratePoster(schema2Poster(objects, extra));
  assert.equal(hydrated.schema, 2);
  const promoted = promoteLegacyPoster(hydrated, field);
  assert.ok(promoted);
  assert.equal(promoted.schema, 3);
  assert.equal(promoted.legacyPixelObjects, null);
  return promoted;
}

function sameRelative(a: PosterObj, b: PosterObj) {
  if (a.kind === "text" && b.kind === "text") {
    assert.ok(Math.abs(a.nx - b.nx) < 1e-9);
    assert.ok(Math.abs(a.ny - b.ny) < 1e-9);
    assert.ok(Math.abs(a.nw - b.nw) < 1e-9);
    return;
  }
  if (a.kind === "image" && b.kind === "image") {
    assert.ok(Math.abs(a.nx - b.nx) < 1e-9);
    assert.ok(Math.abs(a.ratio - b.ratio) < 1e-9);
    return;
  }
  if (a.kind === "stroke" && b.kind === "stroke") {
    assert.equal(a.points.length, b.points.length);
    assert.ok(Math.abs(a.points[0].nx - b.points[0].nx) < 1e-9);
    return;
  }
  if (a.kind === "shape" && b.kind === "shape" && (a.shape === "line" || a.shape === "arrow")) {
    if (b.shape === "line" || b.shape === "arrow") {
      assert.ok(Math.abs(a.nx1 - b.nx1) < 1e-9);
      assert.ok(Math.abs(a.ny2 - b.ny2) < 1e-9);
    }
    return;
  }
  if (a.kind === "shape" && b.kind === "shape" && a.shape === "rect" && b.shape === "rect") {
    assert.ok(Math.abs(a.nx - b.nx) < 1e-9);
    assert.ok(Math.abs(a.nw - b.nw) < 1e-9);
  }
}

test("empty poster is schema 3", () => {
  const empty = emptyPoster();
  assert.equal(empty.schema, 3);
  assert.equal(empty.legacyPixelObjects, null);
  assert.deepEqual(empty.objects, []);
  assert.equal(empty.background, "#FFFFFF");
  assert.equal(migratePoster({ schema: 3, objects: [] }).background, "#FFFFFF");
});

test("the old default paper migrates to white; chosen colours stay", () => {
  assert.equal(migratePoster({ schema: 3, objects: [], background: "#F4F5F3" }).background, "#FFFFFF");
  assert.equal(migratePoster({ schema: 3, objects: [], background: "#fcfa9b" }).background, "#fcfa9b");
});

test("schema 2 type waits for field then normalizes", () => {
  const promoted = promote([TYPE]);
  const obj = promoted.objects[0];
  assert.equal(obj.kind, "text");
  if (obj.kind !== "text") return;
  const viewed = viewText(obj, DESKTOP);
  assert.ok(Math.abs(viewed.x - TYPE.x) < 0.5);
  assert.ok(Math.abs(viewed.y - TYPE.y) < 0.5);
  assert.ok(Math.abs(viewed.size - TYPE.size) < 1);
  assert.equal(obj.text, "WHY?");
});

test("schema 2 image, shape, line, arrow, and stroke migrate", () => {
  const promoted = promote([IMAGE, SHAPE, LINE, ARROW, STROKE]);
  assert.equal(promoted.objects.length, 5);
  assert.deepEqual(
    promoted.objects.map((o) => o.kind + ("shape" in o ? `:${o.shape}` : "")),
    ["image", "shape:rect", "shape:line", "shape:arrow", "stroke"]
  );
});

test("mixed composition stays finite and in field", () => {
  const promoted = promote([TYPE, IMAGE, SHAPE, LINE, ARROW, STROKE]);
  for (const obj of promoted.objects) {
    const box = objectBox(obj, DESKTOP);
    assert.ok(Number.isFinite(box.x) && Number.isFinite(box.w));
    assert.ok(box.x + box.w > 0 && box.y + box.h > 0);
    assert.ok(box.x < DESKTOP.w && box.y < DESKTOP.h);
  }
});

test("reload of schema 3 does not re-enter schema 2", () => {
  const promoted = promote([TYPE, STROKE]);
  const reloaded = migratePoster(promoted);
  assert.equal(reloaded.schema, 3);
  assert.equal(reloaded.objects.length, 2);
  assert.equal(reloaded.legacyPixelObjects, null);
});

test("desktop → mobile keeps relative composition", () => {
  const promoted = promote([TYPE, IMAGE, LINE], DESKTOP);
  const atMobile = promoted.objects.map((obj) => objectBox(obj, MOBILE));
  const type = promoted.objects.find((o) => o.kind === "text");
  assert.ok(type && type.kind === "text");
  const desk = viewText(type, DESKTOP);
  const mob = viewText(type, MOBILE);
  assert.ok(Math.abs(desk.x / DESKTOP.w - mob.x / MOBILE.w) < 1e-9);
  assert.ok(Math.abs(desk.y / DESKTOP.h - mob.y / MOBILE.h) < 1e-9);
  assert.ok(atMobile.every((box) => box.w > 0 && box.h > 0));
});

test("mobile → desktop keeps relative composition", () => {
  const promoted = promote([TYPE, ARROW, STROKE], MOBILE);
  const again = migratePoster(promoted);
  assert.equal(again.schema, 3);
  sameRelative(promoted.objects[0], again.objects[0]);
  const desk = objectBox(again.objects[0], DESKTOP);
  const mob = objectBox(again.objects[0], MOBILE);
  assert.ok(Math.abs(desk.x / DESKTOP.w - mob.x / MOBILE.w) < 1e-6);
});

test("frozen/sent poster migrates without clearing frozen", () => {
  const promoted = promote([TYPE, IMAGE], DESKTOP, { frozen: true });
  assert.equal(promoted.frozen, true);
  assert.equal(promoted.schema, 3);
  assert.equal(promoted.objects.length, 2);
});

test("promotion refuses a zero field and leaves schema 2", () => {
  const hydrated = migratePoster(schema2Poster([TYPE]));
  assert.equal(hydrated.schema, 2);
  assert.equal(promoteLegacyPoster(hydrated, { w: 0, h: 0 }), null);
  assert.equal(hydrated.schema, 2);
  assert.ok(hydrated.legacyPixelObjects?.length);
});

test("impossible off-field objects do not promote", () => {
  const bad: LegacyPixelObj = { ...TYPE, x: 20000, y: 20000, id: "off" };
  const hydrated = migratePoster(schema2Poster([bad]));
  assert.equal(promoteLegacyPoster(hydrated, DESKTOP), null);
});
