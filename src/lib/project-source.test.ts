import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLOSED_EXPERIENCE,
  getExperience,
  KOJA_EXPERIENCE,
  OBR_EXPERIENCE,
  SCK_EXPERIENCE,
  SISARICH_EXPERIENCE,
  SUB3_EXPERIENCE,
} from "../components/home/projects/experiences";
import type { ProjectExperience } from "../components/home/projects/types";
import { CHRIS_COPY } from "../sanity/scripts/chris-content";
import { KOJA_COPY } from "../sanity/scripts/koja-content";
import { OBR_COPY } from "../sanity/scripts/obr-content";
import { SUB3_COPY } from "../sanity/scripts/sub3-content";
import { cmsBackedProject, sourceFlagFromEnv } from "./cms-source";
import { resolveProjectExperience } from "./project-source";

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

const cmsChris: ProjectExperience = {
  ...SISARICH_EXPERIENCE,
  slug: "chris-sisarich",
  context: CHRIS_COPY.context,
  authorship: { roles: [...CHRIS_COPY.roles] },
  infoSections: [
    { id: "idea", heading: CHRIS_COPY.idea.heading, copy: CHRIS_COPY.idea.body },
    { id: "shift", heading: CHRIS_COPY.shift.heading, copy: CHRIS_COPY.shift.body },
    { id: "system", heading: CHRIS_COPY.system.heading, copy: CHRIS_COPY.system.body },
  ],
  movements: SISARICH_EXPERIENCE.movements.map((movement) =>
    movement.id === "s08" ? { ...movement, infoHint: "system" } : movement
  ),
};

const cmsSub3: ProjectExperience = {
  ...SUB3_EXPERIENCE,
  slug: "sub-3",
  context: SUB3_COPY.context,
  authorship: { roles: [...SUB3_COPY.roles], workingContext: SUB3_COPY.workingContext },
  infoSections: [
    { id: "idea", heading: SUB3_COPY.idea.heading, copy: SUB3_COPY.idea.body },
    { id: "shift", heading: SUB3_COPY.shift.heading, copy: SUB3_COPY.shift.body },
    { id: "system", heading: SUB3_COPY.system.heading, copy: SUB3_COPY.system.body },
  ],
  movements: SUB3_EXPERIENCE.movements.map((movement) =>
    movement.id === "s310" || movement.id === "s311" || movement.id === "s312"
      ? { ...movement, infoHint: "system" }
      : movement
  ),
};

const cmsObr: ProjectExperience = {
  ...OBR_EXPERIENCE,
  slug: "our-boy-roy",
  context: OBR_COPY.context,
  authorship: { roles: [...OBR_COPY.roles], workingContext: OBR_COPY.workingContext },
  infoSections: [
    { id: "idea", heading: OBR_COPY.idea.heading, copy: OBR_COPY.idea.body },
    { id: "shift", heading: OBR_COPY.shift.heading, copy: OBR_COPY.shift.body },
    { id: "system", heading: OBR_COPY.system.heading, copy: OBR_COPY.system.body },
  ],
  movements: OBR_EXPERIENCE.movements.map((movement) => {
    if (movement.id === "o04") return { ...movement, infoHint: "shift" as const };
    if (movement.id === "o06" || movement.id === "o07") return { ...movement, infoHint: "system" as const };
    return movement;
  }),
};

test("missing env defaults every CMS source flag to local", () => {
  assert.equal(sourceFlagFromEnv("HBW_SCK_SOURCE", {}), "local");
  assert.equal(sourceFlagFromEnv("HBW_SCK_SOURCE", { HBW_SCK_SOURCE: "nope" }), "local");
  assert.equal(sourceFlagFromEnv("HBW_SCK_SOURCE", { HBW_SCK_SOURCE: "sanity" }), "sanity");
  assert.equal(sourceFlagFromEnv("HBW_CLOSED_SOURCE", {}), "local");
  assert.equal(sourceFlagFromEnv("HBW_KOJA_SOURCE", {}), "local");
  assert.equal(sourceFlagFromEnv("HBW_CHRIS_SOURCE", {}), "local");
  assert.equal(sourceFlagFromEnv("HBW_SUB3_SOURCE", {}), "local");
  assert.equal(sourceFlagFromEnv("HBW_OBR_SOURCE", {}), "local");
});

test("CMS-backed routes map to the published slug", () => {
  assert.equal(cmsBackedProject("sck")?.cmsSlug, "sck");
  assert.equal(cmsBackedProject("bar-closed")?.cmsSlug, "closed");
  assert.equal(cmsBackedProject("koja")?.cmsSlug, "koja");
  assert.equal(cmsBackedProject("chris-sisarich")?.cmsSlug, "chris-sisarich");
  assert.equal(cmsBackedProject("sub-3")?.cmsSlug, "sub-3");
  assert.equal(cmsBackedProject("our-boy-roy")?.cmsSlug, "our-boy-roy");
  assert.equal(cmsBackedProject("bistro-nido"), undefined);
});

test("source flags stay independent across the six CMS projects", () => {
  const mixedA = {
    HBW_SCK_SOURCE: "local",
    HBW_CLOSED_SOURCE: "local",
    HBW_KOJA_SOURCE: "local",
    HBW_CHRIS_SOURCE: "local",
    HBW_SUB3_SOURCE: "local",
    HBW_OBR_SOURCE: "sanity",
  };
  assert.equal(sourceFlagFromEnv("HBW_SCK_SOURCE", mixedA), "local");
  assert.equal(sourceFlagFromEnv("HBW_CLOSED_SOURCE", mixedA), "local");
  assert.equal(sourceFlagFromEnv("HBW_KOJA_SOURCE", mixedA), "local");
  assert.equal(sourceFlagFromEnv("HBW_CHRIS_SOURCE", mixedA), "local");
  assert.equal(sourceFlagFromEnv("HBW_SUB3_SOURCE", mixedA), "local");
  assert.equal(sourceFlagFromEnv("HBW_OBR_SOURCE", mixedA), "sanity");

  const mixedB = {
    HBW_SCK_SOURCE: "sanity",
    HBW_CLOSED_SOURCE: "sanity",
    HBW_KOJA_SOURCE: "sanity",
    HBW_CHRIS_SOURCE: "sanity",
    HBW_SUB3_SOURCE: "sanity",
    HBW_OBR_SOURCE: "local",
  };
  assert.equal(sourceFlagFromEnv("HBW_SCK_SOURCE", mixedB), "sanity");
  assert.equal(sourceFlagFromEnv("HBW_CLOSED_SOURCE", mixedB), "sanity");
  assert.equal(sourceFlagFromEnv("HBW_KOJA_SOURCE", mixedB), "sanity");
  assert.equal(sourceFlagFromEnv("HBW_CHRIS_SOURCE", mixedB), "sanity");
  assert.equal(sourceFlagFromEnv("HBW_SUB3_SOURCE", mixedB), "sanity");
  assert.equal(sourceFlagFromEnv("HBW_OBR_SOURCE", mixedB), "local");
});

test("non-CMS slugs stay on local experiences", async () => {
  let loaded = false;
  const resolved = await resolveProjectExperience("bistro-nido", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      loaded = true;
      return cmsSck;
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, getExperience("bistro-nido"));
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
  assert.equal(resolved.experience?.movements.length, 22);
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
  assert.equal(resolved.experience?.movements.length, 22);
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
  assert.equal(resolved.experience?.movements.length, 22);
  assert.equal(resolved.experience?.infoSections.some((section) => section.id === "outcome"), false);
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
    assert.equal(sourceFlagFromEnv("HBW_KOJA_SOURCE", {}), "local");
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
  assert.equal(resolved.experience?.infoSections.some((section) => section.id === "outcome"), false);
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
  assert.ok(resolved.experience?.authorship?.roles.includes("Brand Guidelines"));
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
  assert.equal(resolved.experience?.infoSections.some((section) => section.id === "outcome"), false);
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

test("Chris + missing flag uses shipped experience", async () => {
  const previous = process.env.HBW_CHRIS_SOURCE;
  delete process.env.HBW_CHRIS_SOURCE;
  let loaded = false;
  try {
    const resolved = await resolveProjectExperience("chris-sisarich", {
      loadPublishedExperience: async () => {
        loaded = true;
        return cmsChris;
      },
    });
    assert.equal(sourceFlagFromEnv("HBW_CHRIS_SOURCE", {}), "local");
    assert.equal(resolved.source, "local");
    assert.equal(resolved.experience, SISARICH_EXPERIENCE);
    assert.equal(resolved.experience?.movements.length, 8);
    assert.equal(loaded, false);
  } finally {
    if (previous === undefined) delete process.env.HBW_CHRIS_SOURCE;
    else process.env.HBW_CHRIS_SOURCE = previous;
  }
});

test("Chris + local flag uses shipped experience and does not fetch", async () => {
  let loaded = false;
  const resolved = await resolveProjectExperience("chris-sisarich", {
    sourceFlag: "local",
    loadPublishedExperience: async () => {
      loaded = true;
      return cmsChris;
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, SISARICH_EXPERIENCE);
  assert.equal(resolved.experience?.slug, "chris-sisarich");
  assert.equal(resolved.experience?.movements.length, 8);
  assert.equal(resolved.experience?.infoSections.some((section) => section.id === "outcome"), false);
  assert.equal(loaded, false);
});

test("Chris + sanity flag + healthy CMS uses published experience", async () => {
  let requested = "";
  const resolved = await resolveProjectExperience("chris-sisarich", {
    sourceFlag: "sanity",
    loadPublishedExperience: async (cmsSlug) => {
      requested = cmsSlug;
      return cmsChris;
    },
  });
  assert.equal(requested, "chris-sisarich");
  assert.equal(resolved.source, "sanity");
  assert.equal(resolved.experience?.slug, "chris-sisarich");
  assert.equal(resolved.experience?.movements.length, 8);
  assert.equal(resolved.experience?.context, CHRIS_COPY.context);
  assert.deepEqual(resolved.experience?.authorship?.roles, CHRIS_COPY.roles);
  assert.equal(
    resolved.experience?.infoSections.some((section) => section.id === "outcome"),
    false
  );
  assert.equal(resolved.experience?.movements.find((movement) => movement.id === "s02")?.media.fit, "cover");
  assert.equal(resolved.experience?.movements.find((movement) => movement.id === "s05")?.kind, "graphic");
  assert.equal(resolved.experience?.movements.find((movement) => movement.id === "s08")?.media.fit, "cover");
  assert.equal(resolved.experience?.movements.find((movement) => movement.id === "s08")?.infoHint, "system");
});

test("Chris + sanity flag + missing document falls back to local", async () => {
  const resolved = await resolveProjectExperience("chris-sisarich", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error('Published project "chris-sisarich" was not found');
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, SISARICH_EXPERIENCE);
  assert.equal(resolved.experience?.movements.length, 8);
  assert.equal(resolved.experience?.infoSections.some((section) => section.id === "outcome"), false);
});

test("Chris + sanity flag + fetch exception falls back to local", async () => {
  const resolved = await resolveProjectExperience("chris-sisarich", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, SISARICH_EXPERIENCE);
});

test("Chris + sanity flag + adapter failure falls back to local", async () => {
  const resolved = await resolveProjectExperience("chris-sisarich", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error("MISSING_FIELD: Idea is required");
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, SISARICH_EXPERIENCE);
});

test("SUB:3 + missing flag uses shipped experience", async () => {
  const previous = process.env.HBW_SUB3_SOURCE;
  delete process.env.HBW_SUB3_SOURCE;
  let loaded = false;
  try {
    const resolved = await resolveProjectExperience("sub-3", {
      loadPublishedExperience: async () => {
        loaded = true;
        return cmsSub3;
      },
    });
    assert.equal(sourceFlagFromEnv("HBW_SUB3_SOURCE", {}), "local");
    assert.equal(resolved.source, "local");
    assert.equal(resolved.experience, SUB3_EXPERIENCE);
    assert.equal(resolved.experience?.movements.length, 12);
    assert.equal(loaded, false);
  } finally {
    if (previous === undefined) delete process.env.HBW_SUB3_SOURCE;
    else process.env.HBW_SUB3_SOURCE = previous;
  }
});

test("SUB:3 + local flag uses shipped experience and does not fetch", async () => {
  let loaded = false;
  const resolved = await resolveProjectExperience("sub-3", {
    sourceFlag: "local",
    loadPublishedExperience: async () => {
      loaded = true;
      return cmsSub3;
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, SUB3_EXPERIENCE);
  assert.equal(resolved.experience?.slug, "sub-3");
  assert.equal(resolved.experience?.movements.length, 12);
  assert.equal(resolved.experience?.infoSections.some((section) => section.id === "outcome"), false);
  assert.equal(loaded, false);
});

test("SUB:3 + sanity flag + healthy CMS uses published experience", async () => {
  let requested = "";
  const resolved = await resolveProjectExperience("sub-3", {
    sourceFlag: "sanity",
    loadPublishedExperience: async (cmsSlug) => {
      requested = cmsSlug;
      return cmsSub3;
    },
  });
  assert.equal(requested, "sub-3");
  assert.equal(resolved.source, "sanity");
  assert.equal(resolved.experience?.slug, "sub-3");
  assert.equal(resolved.experience?.movements.length, 12);
  assert.equal(resolved.experience?.context, SUB3_COPY.context);
  assert.deepEqual(resolved.experience?.authorship?.roles, SUB3_COPY.roles);
  assert.equal(resolved.experience?.authorship?.workingContext, SUB3_COPY.workingContext);
  assert.equal(resolved.experience?.authorship?.collaborators?.length ?? 0, 0);
  assert.equal(
    resolved.experience?.infoSections.some((section) => section.id === "outcome"),
    false
  );
  assert.equal(
    resolved.experience?.movements.filter((movement) => movement.media.type === "video").every((movement) => movement.media.fit === "contain"),
    true
  );
  assert.deepEqual(
    resolved.experience?.movements.filter((movement) => movement.relation === "pair").map((movement) => movement.id),
    ["s304", "s306", "s310"]
  );
});

test("SUB:3 + sanity flag + missing document falls back to local", async () => {
  const resolved = await resolveProjectExperience("sub-3", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error('Published project "sub-3" was not found');
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, SUB3_EXPERIENCE);
  assert.equal(resolved.experience?.movements.length, 12);
  assert.equal(resolved.experience?.infoSections.some((section) => section.id === "outcome"), false);
});

test("SUB:3 + sanity flag + fetch exception falls back to local", async () => {
  const resolved = await resolveProjectExperience("sub-3", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, SUB3_EXPERIENCE);
});

test("SUB:3 + sanity flag + adapter failure falls back to local", async () => {
  const resolved = await resolveProjectExperience("sub-3", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error("MISSING_FIELD: Idea is required");
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, SUB3_EXPERIENCE);
});

test("OBR + missing flag uses shipped experience", async () => {
  const previous = process.env.HBW_OBR_SOURCE;
  delete process.env.HBW_OBR_SOURCE;
  let loaded = false;
  try {
    const resolved = await resolveProjectExperience("our-boy-roy", {
      loadPublishedExperience: async () => {
        loaded = true;
        return cmsObr;
      },
    });
    assert.equal(sourceFlagFromEnv("HBW_OBR_SOURCE", {}), "local");
    assert.equal(resolved.source, "local");
    assert.equal(resolved.experience, OBR_EXPERIENCE);
    assert.equal(resolved.experience?.movements.length, 7);
    assert.equal(loaded, false);
  } finally {
    if (previous === undefined) delete process.env.HBW_OBR_SOURCE;
    else process.env.HBW_OBR_SOURCE = previous;
  }
});

test("OBR + local flag uses shipped experience and does not fetch", async () => {
  let loaded = false;
  const resolved = await resolveProjectExperience("our-boy-roy", {
    sourceFlag: "local",
    loadPublishedExperience: async () => {
      loaded = true;
      return cmsObr;
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, OBR_EXPERIENCE);
  assert.equal(resolved.experience?.slug, "our-boy-roy");
  assert.equal(resolved.experience?.movements.length, 7);
  assert.equal(resolved.experience?.infoSections.some((section) => section.id === "outcome"), false);
  const o02 = resolved.experience?.movements.find((movement) => movement.id === "o02");
  assert.equal(o02?.media.srcSet, undefined);
  assert.equal(
    resolved.experience?.movements.filter((movement) => movement.media.type === "video").every((movement) => !movement.media.webm),
    true
  );
  assert.equal(loaded, false);
});

test("OBR + sanity flag + healthy CMS uses published experience", async () => {
  let requested = "";
  const resolved = await resolveProjectExperience("our-boy-roy", {
    sourceFlag: "sanity",
    loadPublishedExperience: async (cmsSlug) => {
      requested = cmsSlug;
      return cmsObr;
    },
  });
  assert.equal(requested, "our-boy-roy");
  assert.equal(resolved.source, "sanity");
  assert.equal(resolved.experience?.slug, "our-boy-roy");
  assert.equal(resolved.experience?.movements.length, 7);
  assert.equal(resolved.experience?.context, OBR_COPY.context);
  assert.deepEqual(resolved.experience?.authorship?.roles, OBR_COPY.roles);
  assert.equal(resolved.experience?.authorship?.workingContext, OBR_COPY.workingContext);
  assert.equal(resolved.experience?.authorship?.collaborators?.length ?? 0, 0);
  assert.equal(
    resolved.experience?.infoSections.some((section) => section.id === "outcome"),
    false
  );
  assert.equal(
    resolved.experience?.movements.filter((movement) => movement.media.type === "video").every((movement) => movement.media.fit === "contain"),
    true
  );
  assert.deepEqual(
    resolved.experience?.movements.filter((movement) => movement.relation === "pair").map((movement) => movement.id),
    []
  );
  assert.equal(
    resolved.experience?.movements.filter((movement) => movement.media.type === "video").every((movement) => !movement.media.webm),
    true
  );
  assert.deepEqual(
    resolved.experience?.movements.map((movement) => `${movement.id}:${movement.infoHint}`),
    ["o01:idea", "o02:idea", "o03:shift", "o04:shift", "o05:system", "o06:system", "o07:system"]
  );
});

test("OBR + sanity flag + missing document falls back to local", async () => {
  const resolved = await resolveProjectExperience("our-boy-roy", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error('Published project "our-boy-roy" was not found');
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, OBR_EXPERIENCE);
  assert.equal(resolved.experience?.movements.length, 7);
  assert.equal(resolved.experience?.infoSections.some((section) => section.id === "outcome"), false);
});

test("OBR + sanity flag + fetch exception falls back to local", async () => {
  const resolved = await resolveProjectExperience("our-boy-roy", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error("network down");
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, OBR_EXPERIENCE);
});

test("OBR + sanity flag + adapter failure falls back to local", async () => {
  const resolved = await resolveProjectExperience("our-boy-roy", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => {
      throw new Error("MISSING_FIELD: Idea is required");
    },
  });
  assert.equal(resolved.source, "local");
  assert.equal(resolved.experience, OBR_EXPERIENCE);
});

test("SCK, CLOSED, KOJA, Chris, SUB:3, and OBR resolve independently", async () => {
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
  const chris = await resolveProjectExperience("chris-sisarich", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => cmsChris,
  });
  const sub3 = await resolveProjectExperience("sub-3", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => cmsSub3,
  });
  const obr = await resolveProjectExperience("our-boy-roy", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => cmsObr,
  });
  assert.equal(sck.source, "local");
  assert.equal(sck.experience, SCK_EXPERIENCE);
  assert.equal(closed.source, "sanity");
  assert.equal(closed.experience?.slug, "bar-closed");
  assert.equal(koja.source, "local");
  assert.equal(koja.experience, KOJA_EXPERIENCE);
  assert.equal(chris.source, "sanity");
  assert.equal(chris.experience?.context, CHRIS_COPY.context);
  assert.equal(sub3.source, "sanity");
  assert.equal(sub3.experience?.context, SUB3_COPY.context);
  assert.equal(obr.source, "sanity");
  assert.equal(obr.experience?.context, OBR_COPY.context);

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
  const invertedChris = await resolveProjectExperience("chris-sisarich", {
    sourceFlag: "local",
    loadPublishedExperience: async () => cmsChris,
  });
  const invertedSub3 = await resolveProjectExperience("sub-3", {
    sourceFlag: "local",
    loadPublishedExperience: async () => cmsSub3,
  });
  const invertedObr = await resolveProjectExperience("our-boy-roy", {
    sourceFlag: "local",
    loadPublishedExperience: async () => cmsObr,
  });
  assert.equal(invertedSck.source, "sanity");
  assert.equal(invertedClosed.source, "local");
  assert.equal(invertedClosed.experience, CLOSED_EXPERIENCE);
  assert.equal(invertedKoja.source, "sanity");
  assert.equal(invertedKoja.experience?.context, KOJA_COPY.context);
  assert.equal(invertedChris.source, "local");
  assert.equal(invertedChris.experience, SISARICH_EXPERIENCE);
  assert.equal(invertedSub3.source, "local");
  assert.equal(invertedSub3.experience, SUB3_EXPERIENCE);
  assert.equal(invertedObr.source, "local");
  assert.equal(invertedObr.experience, OBR_EXPERIENCE);
});

test("unrelated projects stay local when SCK, CLOSED, KOJA, Chris, SUB:3, and OBR are CMS-backed", async () => {
  const nido = await resolveProjectExperience("bistro-nido", {
    sourceFlag: "sanity",
    loadPublishedExperience: async () => cmsObr,
  });
  assert.equal(nido.source, "local");
  assert.equal(nido.experience, getExperience("bistro-nido"));
});
