import assert from "node:assert/strict";
import { test } from "node:test";
import { galleryFieldHeight, remapGalleryX } from "@/components/home/projects/gallery-field";

test("normal field at 1440×900 uses the 0.75 × 16:9 cap", () => {
  assert.equal(galleryFieldHeight(1416, 832, 32, false), 597);
});

test("full-frame field at 1440×900 uses available height up to a 16:9 stage", () => {
  assert.equal(galleryFieldHeight(1416, 832, 32, true), 797);
});

test("full-frame field at 1920×1080 is height-limited so 16:9 stays under stage width", () => {
  assert.equal(galleryFieldHeight(1896, 1012, 32, false), 800);
  assert.equal(galleryFieldHeight(1896, 1012, 32, true), 980);
});

test("remap keeps the current movement's viewport left", () => {
  assert.equal(
    remapGalleryX({
      savedX: 400,
      oldLeft: 500,
      newLeft: 700,
    }),
    600
  );
});

test("remap leaves movement 01 at x=0 when the first cell grows", () => {
  assert.equal(
    remapGalleryX({
      savedX: 0,
      oldLeft: 0,
      newLeft: 0,
    }),
    0
  );
});
