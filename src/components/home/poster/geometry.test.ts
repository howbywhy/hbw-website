import assert from "node:assert/strict";
import { test } from "node:test";
import {
  HANDLE_SLOP_MOUSE,
  cornerCursor,
  handleAnchor,
  marqueeHits,
  nearHandleBox,
  nearSideHandle,
  objectBox,
  reflowTextBox,
  scaleBox,
  scaleObject,
  scaleObjects,
  unionBox,
  viewText,
} from "./geometry";
import type { BoxShapeObject, ImageObject, LineShapeObject, StrokeObject, TextObject } from "./types";

const FIELD = { w: 1000, h: 800 };

function text(id = "t"): TextObject {
  return {
    id,
    kind: "text",
    nx: 0.2,
    ny: 0.2,
    nw: 0.2,
    ratio: 2,
    sizeRatio: 0.8,
    text: "WHY?",
    color: "#e23b2e",
    font: "Visual",
    align: "left",
  };
}

function shape(id = "s"): BoxShapeObject {
  return {
    id,
    kind: "shape",
    shape: "rect",
    nx: 0.1,
    ny: 0.5,
    nw: 0.12,
    ratio: 1.5,
    color: "#e23b2e",
    fill: true,
    outline: false,
    weight: 1.5,
  };
}

function image(id = "i"): ImageObject {
  return {
    id,
    kind: "image",
    nx: 0.55,
    ny: 0.3,
    nw: 0.2,
    ratio: 1.25,
    cx: 50,
    cy: 40,
    src: "data:image/jpeg;base64,xx",
    mime: "image/jpeg",
  };
}

function line(id = "l"): LineShapeObject {
  return {
    id,
    kind: "shape",
    shape: "line",
    nx1: 0.1,
    ny1: 0.1,
    nx2: 0.3,
    ny2: 0.2,
    color: "#333333",
    weight: 2,
  };
}

function stroke(id = "d"): StrokeObject {
  return {
    id,
    kind: "stroke",
    points: [
      { nx: 0.7, ny: 0.1 },
      { nx: 0.8, ny: 0.2 },
      { nx: 0.9, ny: 0.12 },
    ],
    color: "#e23b2e",
    width: 1.8,
  };
}

test("each corner keeps the opposite corner as the scale anchor", () => {
  const box = { x: 100, y: 80, w: 200, h: 100 };
  const ratio = 2;
  for (const handle of ["nw", "ne", "sw", "se"] as const) {
    const anchor = handleAnchor(box, handle);
    const pointer =
      handle === "se"
        ? { x: 400, y: 220 }
        : handle === "nw"
          ? { x: 40, y: 20 }
          : handle === "ne"
            ? { x: 360, y: 20 }
            : { x: 40, y: 220 };
    const scaled = scaleBox(box, handle, pointer, 28, ratio);
    const nextAnchor = handleAnchor(scaled, handle);
    assert.ok(Math.abs(nextAnchor.x - anchor.x) < 0.01, handle);
    assert.ok(Math.abs(nextAnchor.y - anchor.y) < 0.01, handle);
    assert.ok(Math.abs(scaled.w / scaled.h - ratio) < 1e-6, handle);
    assert.ok(scaled.w >= 28);
  }
});

test("scale refuses to collapse an object below a sensible size", () => {
  const box = { x: 100, y: 80, w: 200, h: 100 };
  const scaled = scaleBox(box, "se", { x: 102, y: 81 }, 48, 2);
  assert.ok(scaled.w >= 48);
  assert.ok(scaled.h >= 24);
});

test("image and shape scale preserve aspect; type size follows the box", () => {
  const img = scaleObject(image(), "nw", { x: 400, y: 100 }, FIELD);
  const shp = scaleObject(shape(), "ne", { x: 400, y: 200 }, FIELD);
  const before = viewText(text(), FIELD);
  const typed = scaleObject(text(), "sw", { x: 50, y: 500 }, FIELD);
  assert.equal(img.kind, "image");
  assert.equal(shp.kind, "shape");
  if (img.kind === "image") assert.ok(Math.abs(img.ratio - 1.25) < 1e-6);
  if (shp.kind === "shape" && shp.shape === "rect") assert.ok(Math.abs(shp.ratio - 1.5) < 1e-6);
  const after = viewText(typed as TextObject, FIELD);
  assert.ok(Math.abs(after.size / after.h - before.size / before.h) < 1e-6);
});

test("line and stroke scale from their bounds", () => {
  const nextLine = scaleObject(line(), "se", { x: 500, y: 400 }, FIELD);
  const nextStroke = scaleObject(stroke(), "nw", { x: 600, y: 20 }, FIELD);
  assert.equal(nextLine.kind, "shape");
  assert.equal(nextStroke.kind, "stroke");
  if (nextLine.kind === "shape" && nextLine.shape === "line") {
    assert.ok(Number.isFinite(nextLine.nx1) && Number.isFinite(nextLine.nx2));
  }
  if (nextStroke.kind === "stroke") {
    assert.equal(nextStroke.points.length, 3);
    assert.ok(nextStroke.points.every((p) => Number.isFinite(p.nx) && Number.isFinite(p.ny)));
  }
});

test("group scale moves and sizes every selected object together", () => {
  const objects = [text(), shape(), image(), line(), stroke()];
  const ids = objects.map((o) => o.id);
  const before = unionBox(objects, FIELD)!;
  const next = scaleObjects(objects, ids, "se", { x: before.x + before.w + 120, y: before.y + before.h + 80 }, FIELD);
  const after = unionBox(next, FIELD)!;
  assert.ok(after.w > before.w);
  assert.ok(Math.abs(after.x - before.x) < 0.5);
  assert.ok(Math.abs(after.y - before.y) < 0.5);
  const type = next.find((o) => o.kind === "text") as TextObject;
  const img = next.find((o) => o.kind === "image") as ImageObject;
  assert.ok(viewText(type, FIELD).size > viewText(text(), FIELD).size);
  assert.ok(Math.abs(img.ratio - 1.25) < 1e-6);
});

test("type side-resize reflows width without changing type size", () => {
  const before = viewText(text(), FIELD);
  const next = reflowTextBox(text(), "e", { x: before.x + before.w + 160, y: before.y + 10 }, FIELD, (w, size) => {
    return size * 1.25 * Math.max(1, Math.ceil(180 / Math.max(40, w)));
  });
  const after = viewText(next, FIELD);
  assert.ok(after.w > before.w);
  assert.ok(Math.abs(after.size - before.size) < 0.01);
  const left = reflowTextBox(next, "w", { x: after.x + 80, y: after.y + 10 }, FIELD, (w, size) => {
    return size * 1.25 * Math.max(1, Math.ceil(180 / Math.max(40, w)));
  });
  const narrowed = viewText(left, FIELD);
  assert.ok(narrowed.w < after.w);
  assert.ok(Math.abs(narrowed.size - before.size) < 0.01);
});

test("type side handles sit on the mid left and right, not the corners", () => {
  const box = { x: 100, y: 80, w: 200, h: 120 };
  assert.equal(nearSideHandle(box, { x: 100, y: 140 }, 16), "w");
  assert.equal(nearSideHandle(box, { x: 300, y: 140 }, 16), "e");
  assert.equal(nearSideHandle(box, { x: 100, y: 80 }, 16), null);
});

test("circle corner-scale keeps a 1:1 ratio", () => {
  const circle: BoxShapeObject = {
    id: "c",
    kind: "shape",
    shape: "ellipse",
    nx: 0.2,
    ny: 0.2,
    nw: 0.1,
    ratio: 1,
    color: "#e23b2e",
    fill: true,
    outline: false,
    weight: 1.5,
  };
  const next = scaleObject(circle, "se", { x: 500, y: 500 }, FIELD);
  if (next.kind === "shape" && next.shape === "ellipse") {
    assert.ok(Math.abs(next.ratio - 1) < 1e-6);
  }
});

test("corner hover uses nwse/nesw cursors and a hit area larger than the mark", () => {
  const box = { x: 100, y: 80, w: 200, h: 120 };
  assert.equal(cornerCursor("nw"), "nwse-resize");
  assert.equal(cornerCursor("se"), "nwse-resize");
  assert.equal(cornerCursor("ne"), "nesw-resize");
  assert.equal(cornerCursor("sw"), "nesw-resize");
  assert.equal(nearHandleBox(box, { x: 100 + 18, y: 80 + 18 }, HANDLE_SLOP_MOUSE), "nw");
  assert.ok(HANDLE_SLOP_MOUSE > 16);
});

test("marquee selects intersecting objects and ignores misses", () => {
  const objects = [text(), shape(), image()];
  const hits = marqueeHits(objects, { x: 180, y: 140, w: 80, h: 80 }, FIELD);
  assert.equal(hits.length, 1);
  assert.equal(hits[0]?.id, "t");
  assert.equal(marqueeHits(objects, { x: 2, y: 2, w: 2, h: 2 }, FIELD).length, 0);
});
