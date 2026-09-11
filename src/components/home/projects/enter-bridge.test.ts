import assert from "node:assert/strict";
import { test } from "node:test";
import { PROJECTS } from "@/components/home/catalog";
import { getExperience } from "@/components/home/projects/experiences";
import { isVideoMedia } from "@/components/home/projects/types";
import {
  bridgeInnerLayouts,
  catalogStill,
  destinationStill,
  fitMedia,
  flipInvert,
  flipTransform,
  invertFitted,
  parseObjectPosition,
  sameVisualSrc,
  visibleImageCrop,
  visualPath,
} from "@/components/home/projects/enter-bridge";

test("flip invert is identity when rects match", () => {
  const rect = { left: 40, top: 80, width: 200, height: 250 };
  assert.deepEqual(flipInvert(rect, rect), { x: 0, y: 0, sx: 1, sy: 1 });
  assert.equal(flipTransform({ x: 0, y: 0, sx: 1, sy: 1 }), "translate(0px, 0px) scale(1, 1)");
});

test("flip invert maps browse rect onto destination with one transform", () => {
  const from = { left: 800, top: 563, width: 408, height: 510 };
  const to = { left: 12, top: 174, width: 1061, height: 597 };
  const invert = flipInvert(from, to);
  assert.equal(Math.round(invert.x), 788);
  assert.equal(Math.round(invert.y), 389);
  assert.ok(Math.abs(invert.sx - 408 / 1061) < 1e-6);
  assert.ok(Math.abs(invert.sy - 510 / 597) < 1e-6);
  assert.match(flipTransform(invert), /^translate\(.+px, .+px\) scale\(.+, .+\)$/);
});

test("visual paths ignore host and query so browse and movement stills can match", () => {
  assert.equal(visualPath("http://127.0.0.1:3066/projects/sck/1.jpg?v=2"), "/projects/sck/1.jpg");
  assert.equal(sameVisualSrc("/projects/sck/1.jpg", "http://localhost/projects/sck/1.jpg"), true);
  assert.equal(sameVisualSrc("/projects/sck/1.jpg", "/projects/sck/2.jpg"), false);
});

test("object-position parses keywords and crop percentages", () => {
  assert.deepEqual(parseObjectPosition("center center"), { x: 0.5, y: 0.5 });
  assert.deepEqual(parseObjectPosition("center 42%"), { x: 0.5, y: 0.42 });
  assert.deepEqual(parseObjectPosition("center 32%"), { x: 0.5, y: 0.32 });
  assert.deepEqual(parseObjectPosition("top"), { x: 0.5, y: 0 });
});

test("CLOSED cover 4:5 of a 16:9 still crops the sides; contain destination shows the full frame", () => {
  const srcBox = { width: 408, height: 510 };
  const destBox = { width: 1061, height: 597 };
  const iw = 1920;
  const ih = 1080;
  const center = { x: 0.5, y: 0.5 };
  const cover = visibleImageCrop(srcBox, iw, ih, "cover", center);
  const contain = visibleImageCrop(destBox, iw, ih, "contain", center);
  assert.ok(cover.w < iw - 1, "browse cover must crop horizontal overflow");
  assert.ok(Math.abs(cover.h - ih) < 1, "browse cover keeps the full image height");
  assert.ok(Math.abs(contain.w - iw) < 1, "destination contain shows the full width");
  assert.ok(Math.abs(contain.h - ih) < 1, "destination contain shows the full height");
  const drawn = fitMedia(srcBox, iw, ih, "cover", center);
  assert.ok(drawn.w > srcBox.width, "cover drawing is wider than the 4:5 cell");
});

test("bridge inner layouts interpolate CLOSED crop without stretching the image aspect", () => {
  const source = {
    slug: "bar-closed",
    src: "/projects/bar-closed/HBWxCLOSED-Portfolio-01.jpg",
    rect: { left: 800, top: 563, width: 408, height: 510 },
    objectFit: "cover",
    objectPosition: "center center",
    width: 1920,
    height: 1080,
  };
  const dest = {
    rect: { left: 12, top: 174, width: 1061, height: 597 },
    objectFit: "contain",
    objectPosition: "center center",
    width: 1920,
    height: 1080,
  };
  const { from, to } = bridgeInnerLayouts(source, dest);
  const outer = flipInvert(source.rect, dest.rect);
  const screenW = from.w * outer.sx;
  const screenH = from.h * outer.sy;
  assert.ok(from.w > to.w, "start inner is zoomed into the browse crop");
  assert.ok(Math.abs(to.w / to.h - 1920 / 1080) < 0.01, "end inner keeps the 16:9 image");
  assert.ok(Math.abs(screenW / screenH - 1920 / 1080) < 0.01, "start crop is 16:9 on screen after the outer invert");
});

test("invertFitted maps an inner crop onto the destination drawing", () => {
  const from = { x: -200, y: 0, w: 1600, h: 900 };
  const to = { x: 0, y: 0, w: 800, h: 450 };
  const invert = invertFitted(from, to);
  assert.equal(invert.x, -200);
  assert.equal(invert.y, 0);
  assert.equal(invert.sx, 2);
  assert.equal(invert.sy, 2);
});

test("same-ratio cover and contain share one visible crop", () => {
  const box = { width: 400, height: 500 };
  const crop = visibleImageCrop(box, 1080, 1350, "cover", { x: 0.5, y: 0.32 });
  const dest = visibleImageCrop({ width: 480, height: 600 }, 1080, 1350, "contain", { x: 0.5, y: 0.5 });
  assert.ok(Math.abs(crop.w - 1080) < 1);
  assert.ok(Math.abs(dest.w - 1080) < 1);
  assert.ok(Math.abs(crop.h - 1350) < 1);
  assert.ok(Math.abs(dest.h - 1350) < 1);
});

test("displayed browse still matches the first movement still for every live project", () => {
  const rows = PROJECTS.map((project) => {
    const first = getExperience(project.id)?.movements[0]?.media;
    const dest = destinationStill(project.id);
    const catalog = catalogStill(project.id);
    const firstStill = first
      ? isVideoMedia(first)
        ? first.poster || first.src
        : first.src
      : undefined;
    return {
      id: project.id,
      dest,
      catalog,
      firstStill,
      destMatchesFirst: sameVisualSrc(dest, firstStill),
      catalogMatchesDest: sameVisualSrc(catalog, dest),
    };
  });

  for (const row of rows) {
    assert.equal(row.destMatchesFirst, true, `${row.id} destination still should be the first movement`);
  }

  const catalogMismatches = rows.filter((row) => !row.catalogMatchesDest).map((row) => row.id);
  assert.deepEqual(catalogMismatches, ["bar-closed", "chris-sisarich", "our-boy-roy"]);
});
