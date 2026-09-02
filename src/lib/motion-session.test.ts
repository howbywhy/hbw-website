import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createMotionStore,
  phaseAfterRouteBoundary,
  type MotionSession,
} from "../components/home/HbwMotionSession";

const rising: MotionSession = {
  kind: "enter",
  phase: "rising",
  swap: { from: "browse", to: "view", phase: "entering" },
  windowMode: "view",
  activeId: "sck",
  viewIndex: 0,
  leaving: null,
  entrance: "archive",
  keepBrowse: true,
  parkedX: null,
  cinematic: true,
  startedAt: 1,
};

test("route transition intent survives the home → project boundary", () => {
  const store = createMotionStore();
  store.write(rising);
  assert.equal(phaseAfterRouteBoundary(store.read(), "/projects/sck"), "rising");
  assert.equal(store.read()?.activeId, "sck");
});

test("direct project load without a session stays active", () => {
  assert.equal(phaseAfterRouteBoundary(null, "/projects/sck"), "active");
  assert.equal(phaseAfterRouteBoundary(null, "/"), "idle");
});

test("project-to-project handoff intent survives the slug remount", () => {
  const store = createMotionStore();
  store.write({
    ...rising,
    kind: "handoff",
    phase: "handoff-in",
    swap: { from: "view", to: "view", phase: "entering" },
    activeId: "sub-3",
    leaving: { id: "sck", index: 20 },
    entrance: "handoff",
    cinematic: false,
  });
  assert.equal(phaseAfterRouteBoundary(store.read(), "/projects/sub-3"), "handoff-in");
  assert.equal(store.read()?.leaving?.id, "sck");
});

test("close/back session keeps exiting across the project → home boundary", () => {
  const store = createMotionStore();
  store.write({
    ...rising,
    kind: "exit",
    phase: "exiting",
    swap: { from: "view", to: "browse", phase: "exiting" },
    cinematic: false,
    entrance: "reduced",
  });
  assert.equal(phaseAfterRouteBoundary(store.read(), "/?layer=projects"), "exiting");
});
