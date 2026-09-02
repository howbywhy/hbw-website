import assert from "node:assert/strict";
import { test } from "node:test";
import { CLOSED_EXPERIENCE, getExperience, KOJA_EXPERIENCE, SCK_EXPERIENCE } from "../components/home/projects/experiences";
import type { ProjectExperience } from "../components/home/projects/types";
import { KOJA_COPY } from "../sanity/scripts/koja-content";
import { cmsBackedProject } from "./cms-source";
import { closedSourceFlag, kojaSourceFlag, resolveProjectExperience, sckSourceFlag } from "./project-source";

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

const cmsKoja: ProjectExperience = {
  ...KOJA_EXPERIENCE,
  slug: "koja",
  context: KOJA_COPY.context,
  authorship: { roles: [...KOJA_COPY.roles] },
  infoSections: [
    { id: "idea", heading: KOJA_COPY.idea.heading, copy: KOJA_COPY.idea.body },
    { id: "shift", heading: KOJA_COPY.shift.heading, copy: KOJA_COPY.shift.body },
    { id: "system", heading: KOJA_COPY.system.heading, copy: KOJA_COPY.system.body },
  ],
  movements: KOJA_EXPERIENCE.movements.map((movement) =>
    movement.id === "k08" ? { ...movement, infoHint: "system" } : movement
  ),
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

test("missing env defaults KOJA source to local", () => {
  assert.equal(kojaSourceFlag({}), "local");
  assert.equal(kojaSourceFlag({ HBW_KOJA_SOURCE: "nope" }), "local");
  assert.equal(kojaSourceFlag({ HBW_KOJA_SOURCE: "sanity" }), "sanity");
});

test("CMS-backed routes map to the published slug", () => {
  assert.equal(cmsBackedProject("sck")?.cmsSlug, "sck");
  assert.equal(cmsBackedProject("bar-closed")?.cmsSlug, "closed");
  assert.equal(cmsBackedProject("koja")?.cmsSlug, "koja");
  assert.equal(cmsBackedProject("sub-3"), undefined);
});

test("source flags stay independent across the three CMS projects", () => {
  const mixedA = {
    HBW_SCK_SOURCE: "local",
    HBW_CLOSED_SOURCE: "local",
    HBW_KOJA_SOURCE: "sanity",
  };
  assert.equal(sckSourceFlag(mixedA), "local");
  assert.equal(closedSourceFlag(mixedA), "local");
  assert.equal(kojaSourceFlag(mixedA), "sanity");

  const mixedB = {
    HBW_SCK_SOURCE: "sanity",
    HBW_CLOSED_SOURCE: "sanity",
    HBW_KOJA_SOURCE: "local",
  };
  assert.equal(sckSourceFlag(mixedB), "sanity");
  assert.equal(closedSourceFlag(mixedB), "sanity");
  assert.equal(kojaSourceFlag(mixedB), "local");
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

test("KOJA + missing flag uses shipped experience", async () => {
  const previous = process.env.HBW_KOJA_SOURCE;
  delete process.env.HBW_KOJA_SOURCE;
  let loaded = false;
  try {
    const resolved = await resolveProjectExperience("koja", {
      loadPublishedExperience: async () => {
        loaded = true;
        return cmsKoja;
      },
    });
    assert.equal(kojaSourceFlag({}), "local");
    assert.equal(resolved.source, "local");
    assert.equal(resolved.experience, KOJA_EXPERIENCE);
    assert.equal(resolved.experience?.movements.length, 8);
    assert.equal(loaded, false);
  } finally {
    if (previous === undefined) delete process.env.HBW_KOJA_SOURCE;
    else process.env.HBW_KOJA_SOURCE = previous;
  }
});

test("KOJA + local flag uses shipped experience and does not fetch", async () => {
  let loaded = false;
  const resolved = await resolveProjectExperience("koja", {
    sourceFlag: "local",
    loadPublishedExperience: async () => {
      loaded = true;
      return cmsKoja;
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, KOJA_EXPERIENCE);
  assert.equal(resolved.experience?.slug, "koja");
  assert.equal(resolved.experience?.movements.length, 8);
  assert.ok(resolved.experience?.infoSections.some((section) => section.id === "outcome"));
  assert.equal(loaded, false);
});

test("KOJA + sanity flag + healthy CMS uses published experience", async () => {
  let requested = "";
  const resolved = await resolveProjectExperience("koja", {
    sourceFlag: "sanity",
    loadPublishedExperience: async (cmsSlug) => {
      requested = cmsSlug;
      return cmsKoja;
    },
  });
  assert.equal(requested, "koja");
  assert.equal(resolved.source, "sanity");
  assert.equal(resolved.experience?.slug, "koja");
  assert.equal(resolved.experience?.movements.length, 8);
  assert.equal(resolved.experience?.context, KOJA_COPY.context);
  assert.ok(resolved.experience?.authorship?.roles.includes("Brand Stewardship"));
  assert.equal(
    resolved.experience?.infoSections.some((section) => section.id === "outcome"),
    false
  );
  const publicCopy = [
    resolved.experience?.context,
    ...(resolved.experience?.infoSections.map((section) => section.copy) ?? []),
  ].join("\n");
  assert.match(publicCopy, /Unapologetically Good/);
  assert.equal(/make healthy simple/i.test(publicCopy), false);
});

test("KOJA + sanity flag + missing document falls back to local", async () => {
  const resolved = await resolveProjectExperience("koja", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error('Published project "koja" was not found');
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, KOJA_EXPERIENCE);
  assert.equal(resolved.experience?.movements.length, 8);
  assert.ok(resolved.experience?.infoSections.some((section) => section.id === "outcome"));
});

test("KOJA + sanity flag + fetch exception falls back to local", async () => {
  const resolved = await resolveProjectExperience("koja", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, KOJA_EXPERIENCE);
});

test("KOJA + sanity flag + adapter failure falls back to local", async () => {
  const resolved = await resolveProjectExperience("koja", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error("MISSING_FIELD: Idea is required");
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, KOJA_EXPERIENCE);
});

test("SCK, CLOSED, and KOJA resolve independently", async () => {
  const sck = await resolveProjectExperience("sck", {
    sourceFlag: "local",
    loadPublishedExperience: async () => cmsSck,
  });
  const closed = await resolveProjectExperience("bar-closed", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => cmsClosed,
  });
  const koja = await resolveProjectExperience("koja", {
    sourceFlag: "local",
    loadPublishedExperience: async () => cmsKoja,
  });
  assert.equal(sck.source, "local");
  assert.equal(sck.experience, SCK_EXPERIENCE);
  assert.equal(closed.source, "sanity");
  assert.equal(closed.experience?.slug, "bar-closed");
  assert.equal(koja.source, "local");
  assert.equal(koja.experience, KOJA_EXPERIENCE);

  const invertedSck = await resolveProjectExperience("sck", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => cmsSck,
  });
  const invertedClosed = await resolveProjectExperience("bar-closed", {
    sourceFlag: "local",
    loadPublishedExperience: async () => cmsClosed,
  });
  const invertedKoja = await resolveProjectExperience("koja", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => cmsKoja,
  });
  assert.equal(invertedSck.source, "sanity");
  assert.equal(invertedClosed.source, "local");
  assert.equal(invertedClosed.experience, CLOSED_EXPERIENCE);
  assert.equal(invertedKoja.source, "sanity");
  assert.equal(invertedKoja.experience?.context, KOJA_COPY.context);
});

test("unrelated projects stay local when SCK, CLOSED, and KOJA are CMS-backed", async () => {
  const resolved = await resolveProjectExperience("sub-3", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => cmsKoja,
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, getExperience("sub-3"));
  assert.notEqual(resolved.experience?.slug, "sck");
  assert.notEqual(resolved.experience?.slug, "closed");
  assert.notEqual(resolved.experience?.slug, "koja");
});
