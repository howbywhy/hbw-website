import assert from "node:assert/strict";
import { test } from "node:test";
import { imageMimeFromFile, isPosterImageMime, rasterEncodeMime } from "./image";

test("poster upload accepts png jpeg webp gif and svg, not other files", () => {
  assert.equal(imageMimeFromFile({ type: "image/png" }), "image/png");
  assert.equal(imageMimeFromFile({ type: "image/jpeg" }), "image/jpeg");
  assert.equal(imageMimeFromFile({ type: "image/jpg" }), "image/jpeg");
  assert.equal(imageMimeFromFile({ type: "image/webp" }), "image/webp");
  assert.equal(imageMimeFromFile({ type: "image/gif" }), "image/gif");
  assert.equal(imageMimeFromFile({ type: "image/svg+xml" }), "image/svg+xml");
  assert.equal(imageMimeFromFile({ type: "", name: "mark.png" }), "image/png");
  assert.equal(imageMimeFromFile({ type: "", name: "loop.GIF" }), "image/gif");
  assert.ok(isPosterImageMime("image/png"));
  assert.ok(isPosterImageMime("image/gif"));
  assert.ok(isPosterImageMime("image/svg+xml"));
  assert.equal(isPosterImageMime("application/pdf"), false);
  assert.equal(isPosterImageMime("image/heic"), false);
});

test("png and webp stay in their own format instead of flattening to jpeg", () => {
  assert.equal(rasterEncodeMime("image/png"), "image/png");
  assert.equal(rasterEncodeMime("image/webp"), "image/webp");
  assert.equal(rasterEncodeMime("image/jpeg"), "image/jpeg");
  assert.equal(rasterEncodeMime("image/gif"), null);
  assert.equal(rasterEncodeMime("image/svg+xml"), null);
});
