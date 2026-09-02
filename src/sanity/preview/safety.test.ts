import assert from "node:assert/strict";
import { test } from "node:test";
import { liveProjects } from "../../components/home/catalog";
import { PROJECT_EXPERIENCES, SCK_EXPERIENCE } from "../../components/home/projects/experiences";

const SANITY_HOST = /cdn\.sanity\.io|sanity\.cdn/;

test("shipped SCK sequence stays on local public assets", () => {
  assert.equal(SCK_EXPERIENCE.movements.length, 21);
  for (const movement of SCK_EXPERIENCE.movements) {
    assert.doesNotMatch(movement.media.src, SANITY_HOST);
    if (movement.media.mp4) assert.doesNotMatch(movement.media.mp4, SANITY_HOST);
    if (movement.media.poster) assert.doesNotMatch(movement.media.poster, SANITY_HOST);
  }
});

test("no public experience or browse record points at Sanity assets", () => {
  for (const experience of Object.values(PROJECT_EXPERIENCES)) {
    for (const movement of experience.movements) {
      assert.doesNotMatch(movement.media.src, SANITY_HOST);
    }
  }
  for (const project of liveProjects()) {
    assert.doesNotMatch(project.src, SANITY_HOST);
    assert.ok(!project.href.startsWith("/preview"));
  }
});
