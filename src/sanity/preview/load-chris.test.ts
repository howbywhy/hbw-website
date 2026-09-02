import assert from "node:assert/strict";
import { test } from "node:test";
import { projectById } from "../../components/home/catalog";
import { catalogOwnedChris } from "./load-chris";

test("preview catalog merge keeps shipped Chris chrome out of Sanity", () => {
  const shipped = projectById("chris-sisarich");
  const catalog = catalogOwnedChris();
  assert.equal(catalog.crop, shipped.crop);
  assert.equal(catalog.layout, shipped.layout);
  assert.equal(catalog.visualSpan, shipped.visualSpan);
  assert.equal(catalog.visualStart, shipped.visualStart);
  assert.equal(catalog.visualBefore, shipped.visualBefore);
  assert.equal(catalog.homeSelected, shipped.homeSelected);
  assert.deepEqual(catalog.credits, shipped.credits);
  assert.deepEqual(catalog.features, shipped.features);
  assert.equal(catalog.status, shipped.status);
  assert.deepEqual(catalog.collaborators, shipped.collaborators);
});
