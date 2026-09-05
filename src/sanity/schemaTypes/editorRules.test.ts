import assert from "node:assert/strict";
import { test } from "node:test";
import {
  movementPreviewTitle,
  outcomeHintWarning,
  pairPaceWarning,
  terminalPairMessage,
  uniqueMovementKeyMessage,
} from "./editorRules";

test("terminal pair is rejected and a following pair is allowed", () => {
  assert.equal(typeof terminalPairMessage([{ _key: "c04", relation: "pair" }]), "string");
  assert.equal(
    terminalPairMessage([
      { _key: "c04", relation: "pair" },
      { _key: "c05", relation: "single" },
    ]),
    true
  );
});

test("movement keys must be unique", () => {
  assert.equal(uniqueMovementKeyMessage([{ _key: "s05" }, { _key: "s05" }]), "Each movement ID must be unique within the project.");
  assert.equal(uniqueMovementKeyMessage([{ _key: "s05" }, { _key: "s06" }]), true);
});

test("pair plus pause warns; pair plus tight or normal does not", () => {
  assert.equal(typeof pairPaceWarning("pair", "pause"), "string");
  assert.equal(pairPaceWarning("pair", "tight"), true);
  assert.equal(pairPaceWarning("pair", "normal"), true);
  assert.equal(pairPaceWarning("single", "pause"), true);
});

test("outcome hint warns only when Outcome is empty", () => {
  assert.equal(typeof outcomeHintWarning([{ infoHint: "outcome" }], false), "string");
  assert.equal(outcomeHintWarning([{ infoHint: "outcome" }], true), true);
  assert.equal(outcomeHintWarning([{ infoHint: "system" }], false), true);
});

test("movement list title is scannable without opening the item", () => {
  assert.equal(movementPreviewTitle({ mediaType: "still", scale: "major", pace: "pause" }), "STILL — MAJOR — PAUSE");
  assert.equal(
    movementPreviewTitle({ mediaType: "still", scale: "standard", pace: "tight", relation: "pair" }),
    "STILL — STANDARD — TIGHT — PAIR"
  );
  assert.equal(
    movementPreviewTitle({ mediaType: "film", scale: "standard", pace: "normal", mediaFit: "cover" }),
    "FILM — STANDARD — NORMAL — COVER"
  );
});
