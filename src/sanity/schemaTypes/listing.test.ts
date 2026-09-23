import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LISTING_FEATURED,
  LISTING_INDEX,
  featuredOnly,
  isFeatured,
  isIndexOnly,
  listingOf,
  onlyWhenFeatured,
  requiredWhenFeatured,
  requiredWhenIndexed,
} from "./listing";

test("a document with no listing is treated as featured", () => {
  assert.equal(listingOf(undefined), LISTING_FEATURED);
  assert.equal(listingOf(null), LISTING_FEATURED);
  assert.equal(listingOf({}), LISTING_FEATURED);
  assert.equal(listingOf({ listing: "something else" }), LISTING_FEATURED);
  assert.equal(isFeatured({}), true);
  assert.equal(isIndexOnly({}), false);
});

test("an index entry reads as index", () => {
  assert.equal(listingOf({ listing: LISTING_INDEX }), LISTING_INDEX);
  assert.equal(isIndexOnly({ listing: LISTING_INDEX }), true);
  assert.equal(isFeatured({ listing: LISTING_INDEX }), false);
});

test("case-study fields hide on index entries and show on featured ones", () => {
  assert.equal(featuredOnly({ document: { listing: LISTING_INDEX } }), true);
  assert.equal(featuredOnly({ document: { listing: LISTING_FEATURED } }), false);
  assert.equal(featuredOnly({ document: undefined }), false);
});

test("requiredWhenFeatured only bites on a featured project", () => {
  const check = requiredWhenFeatured("Context");
  assert.equal(check(undefined, { document: { listing: LISTING_INDEX } }), true);
  assert.equal(check("", { document: { listing: LISTING_INDEX } }), true);
  assert.equal(check([], { document: { listing: LISTING_INDEX } }), true);
  assert.equal(check("words", { document: { listing: LISTING_FEATURED } }), true);
  assert.equal(check([{}], { document: { listing: LISTING_FEATURED } }), true);
  assert.match(String(check(undefined, { document: { listing: LISTING_FEATURED } })), /required/);
  assert.match(String(check([], { document: { listing: LISTING_FEATURED } })), /required/);
  assert.match(String(check("   ", { document: { listing: LISTING_FEATURED } })), /required/);
});

test("requiredWhenIndexed guards the columns the index prints", () => {
  const check = requiredWhenIndexed("Sectors");
  assert.equal(check(["Hospitality"], { document: { listing: LISTING_INDEX } }), true);
  assert.match(String(check([], { document: { listing: LISTING_INDEX } })), /cannot be empty/);
  assert.equal(check([], { document: { listing: LISTING_FEATURED } }), true);
  assert.equal(check(undefined, { document: undefined }), true);
});

test("onlyWhenFeatured short-circuits an existing case-study check", () => {
  let ran = 0;
  const wrapped = onlyWhenFeatured(() => {
    ran += 1;
    return "always fails";
  });
  assert.equal(wrapped(null, { document: { listing: LISTING_INDEX } }), true);
  assert.equal(ran, 0);
  assert.equal(wrapped(null, { document: { listing: LISTING_FEATURED } }), "always fails");
  assert.equal(ran, 1);
});
