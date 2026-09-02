import assert from "node:assert/strict";
import { test } from "node:test";
import { getExperience, SCK_EXPERIENCE } from "../components/home/projects/experiences";
import type { ProjectExperience } from "../components/home/projects/types";
import { resolveProjectExperience, sckSourceFlag } from "./project-source";

const cmsSck: ProjectExperience = {
  ...SCK_EXPERIENCE,
  context: "CMS context for tests.",
  authorship: { roles: ["Brand DNA", "Creative Direction", "Visual Identity"] },
};

test("missing env defaults SCK source to local", () => {
  assert.equal(sckSourceFlag({}), "local");
  assert.equal(sckSourceFlag({ HBW_SCK_SOURCE: "nope" }), "local");
  assert.equal(sckSourceFlag({ HBW_SCK_SOURCE: "sanity" }), "sanity");
});

test("non-SCK slugs stay on local experiences", async () => {
  let loaded = false;
  const resolved = await resolveProjectExperience("sub-3", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      loaded = true;
      return cmsSck;
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, getExperience("sub-3"));
  assert.equal(loaded, false);
});

test("SCK + local flag uses shipped experience and does not fetch", async () => {
  let loaded = false;
  const resolved = await resolveProjectExperience("sck", {
    sourceFlag: "local",
    loadPublishedExperience: async () => {
      loaded = true;
      return cmsSck;
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, SCK_EXPERIENCE);
  assert.equal(resolved.experience?.movements.length, 21);
  assert.equal(loaded, false);
});

test("SCK + sanity flag + healthy CMS uses published experience", async () => {
  const resolved = await resolveProjectExperience("sck", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => cmsSck,
  });
  assert.equal(resolved.source, "sanity");
  assert.equal(resolved.experience, cmsSck);
  assert.equal(resolved.experience?.movements.length, 21);
  assert.ok(resolved.experience?.context);
  assert.deepEqual(resolved.experience?.authorship?.roles, [
    "Brand DNA",
    "Creative Direction",
    "Visual Identity",
  ]);
});

test("SCK + sanity flag + missing document falls back to local", async () => {
  const resolved = await resolveProjectExperience("sck", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error('Published project "sck" was not found');
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, SCK_EXPERIENCE);
  assert.equal(resolved.experience?.movements.length, 21);
});

test("SCK + sanity flag + fetch exception falls back to local", async () => {
  const resolved = await resolveProjectExperience("sck", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, SCK_EXPERIENCE);
});

test("SCK + sanity flag + adapter failure falls back to local", async () => {
  const resolved = await resolveProjectExperience("sck", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error("MISSING_FIELD: Idea is required");
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, SCK_EXPERIENCE);
});

test("other project behavior is unchanged when SCK is CMS-backed", async () => {
  const koja = await resolveProjectExperience("koja", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => cmsSck,
  });
  assert.equal(koja.source, "local");
  assert.equal(koja.experience, getExperience("koja"));
  assert.notEqual(koja.experience?.slug, "sck");
});
