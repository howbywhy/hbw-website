import assert from "node:assert/strict";
import { test } from "node:test";
import { CLOSED_EXPERIENCE, getExperience, SCK_EXPERIENCE } from "../components/home/projects/experiences";
import type { ProjectExperience } from "../components/home/projects/types";
import { cmsBackedProject } from "./cms-source";
import { closedSourceFlag, resolveProjectExperience, sckSourceFlag } from "./project-source";

const cmsSck: ProjectExperience = {
  ...SCK_EXPERIENCE,
  context: "CMS context for tests.",
  authorship: { roles: ["Brand DNA", "Creative Direction", "Visual Identity"] },
};

const cmsClosed: ProjectExperience = {
  ...CLOSED_EXPERIENCE,
  slug: "closed",
  context: "CMS closed context.",
  authorship: {
    roles: [
      "Brand DNA",
      "Naming",
      "Creative Direction",
      "Visual Identity",
      "Signage & Wayfinding",
      "Photography Direction",
      "Print",
      "Website",
    ],
    workingContext: "Architectural design was already underway when HBW joined the project.",
    collaborators: [
      { name: "Jordan Lucky / Playstate", contribution: "Mural" },
      { name: "Stanley House Studio", contribution: "Photography" },
    ],
  },
  infoSections: CLOSED_EXPERIENCE.infoSections.filter((section) => section.id !== "outcome"),
};

test("missing env defaults SCK source to local", () => {
  assert.equal(sckSourceFlag({}), "local");
  assert.equal(sckSourceFlag({ HBW_SCK_SOURCE: "nope" }), "local");
  assert.equal(sckSourceFlag({ HBW_SCK_SOURCE: "sanity" }), "sanity");
});

test("missing env defaults CLOSED source to local", () => {
  assert.equal(closedSourceFlag({}), "local");
  assert.equal(closedSourceFlag({ HBW_CLOSED_SOURCE: "nope" }), "local");
  assert.equal(closedSourceFlag({ HBW_CLOSED_SOURCE: "sanity" }), "sanity");
});

test("CMS-backed routes map to the published slug", () => {
  assert.equal(cmsBackedProject("sck")?.cmsSlug, "sck");
  assert.equal(cmsBackedProject("bar-closed")?.cmsSlug, "closed");
  assert.equal(cmsBackedProject("koja"), undefined);
});

test("non-CMS slugs stay on local experiences", async () => {
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
  let requested = "";
  const resolved = await resolveProjectExperience("sck", {
    sourceFlag: "sanity",
    loadPublishedExperience: async (cmsSlug) => {
      requested = cmsSlug;
      return cmsSck;
    },
  });
  assert.equal(requested, "sck");
  assert.equal(resolved.source, "sanity");
  assert.equal(resolved.experience, cmsSck);
  assert.equal(resolved.experience?.slug, "sck");
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

test("CLOSED + local flag uses shipped experience and does not fetch", async () => {
  let loaded = false;
  const resolved = await resolveProjectExperience("bar-closed", {
    sourceFlag: "local",
    loadPublishedExperience: async () => {
      loaded = true;
      return cmsClosed;
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, CLOSED_EXPERIENCE);
  assert.equal(resolved.experience?.slug, "bar-closed");
  assert.equal(resolved.experience?.movements.length, 9);
  assert.equal(loaded, false);
});

test("CLOSED + sanity flag + healthy CMS uses published experience", async () => {
  let requested = "";
  const resolved = await resolveProjectExperience("bar-closed", {
    sourceFlag: "sanity",
    loadPublishedExperience: async (cmsSlug) => {
      requested = cmsSlug;
      return cmsClosed;
    },
  });
  assert.equal(requested, "closed");
  assert.equal(resolved.source, "sanity");
  assert.equal(resolved.experience?.slug, "bar-closed");
  assert.equal(resolved.experience?.movements.length, 9);
  assert.equal(resolved.experience?.context, "CMS closed context.");
  assert.equal(
    resolved.experience?.authorship?.workingContext,
    "Architectural design was already underway when HBW joined the project."
  );
  assert.deepEqual(
    resolved.experience?.authorship?.collaborators?.map((item) => item.name),
    ["Jordan Lucky / Playstate", "Stanley House Studio"]
  );
  assert.equal(
    resolved.experience?.infoSections.some((section) => section.id === "outcome"),
    false
  );
});

test("CLOSED + sanity flag + missing document falls back to local", async () => {
  const resolved = await resolveProjectExperience("bar-closed", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error('Published project "closed" was not found');
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, CLOSED_EXPERIENCE);
  assert.equal(resolved.experience?.movements.length, 9);
  assert.ok(resolved.experience?.infoSections.some((section) => section.id === "outcome"));
});

test("CLOSED + sanity flag + fetch exception falls back to local", async () => {
  const resolved = await resolveProjectExperience("bar-closed", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, CLOSED_EXPERIENCE);
});

test("CLOSED + sanity flag + adapter failure falls back to local", async () => {
  const resolved = await resolveProjectExperience("bar-closed", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error("INVALID_OUTCOME_HINT");
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, CLOSED_EXPERIENCE);
});

test("other project behavior is unchanged when SCK and CLOSED are CMS-backed", async () => {
  const koja = await resolveProjectExperience("koja", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => cmsSck,
  });
  assert.equal(koja.source, "local");
  assert.equal(koja.experience, getExperience("koja"));
  assert.notEqual(koja.experience?.slug, "sck");
  assert.notEqual(koja.experience?.slug, "closed");
});
