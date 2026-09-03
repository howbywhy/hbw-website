import assert from "node:assert/strict";
import { test } from "node:test";
import { projectById } from "../../components/home/catalog";
import { catalogOwnedObr } from "./load-obr";

test("preview catalog merge keeps shipped OBR chrome out of Sanity", () => {
  const shipped = projectById("our-boy-roy");
  const catalog = catalogOwnedObr();
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
