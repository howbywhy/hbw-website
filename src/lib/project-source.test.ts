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
import { movementPace, type ProjectExperience } from "../components/home/projects/types";
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
  // No KOJA movement hints at an Outcome any more, so nothing needs remapping
  // to a section the CMS can represent.
  movements: KOJA_EXPERIENCE.movements,
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
  // No Chris movement hints at an Outcome any more, so nothing needs remapping
  // to a section the CMS can represent.
  movements: SISARICH_EXPERIENCE.movements,
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
  // Like Chris, no OBR movement hints at an Outcome any more, so nothing
  // needs remapping to a section the CMS can represent.
  movements: OBR_EXPERIENCE.movements,
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
  assert.equal(resolved.experience?.movements.length, 16);
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
  assert.equal(resolved.experience?.movements.length, 16);
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
  assert.equal(resolved.experience?.movements.length, 16);
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
  assert.equal(resolved.experience?.movements.length, 18);
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
  assert.equal(resolved.experience?.movements.length, 18);
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
  assert.equal(resolved.experience?.movements.length, 18);
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

test("KOJA + missing flag reads the CMS", async () => {
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
    // Nothing sets these variables in production, so the project's own default
    // decides, and that default is the CMS.
    assert.equal(resolved.source, "sanity");
    assert.equal(loaded, true);

    // "local" still pins it back to the sequence the site ships with.
    const pinned = await resolveProjectExperience("koja", {
      sourceFlag: "local",
      loadPublishedExperience: async () => cmsKoja,
    });
    assert.equal(pinned.source, "local");
    assert.equal(pinned.experience, KOJA_EXPERIENCE);
    assert.equal(pinned.experience?.movements.length, 22);
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
  assert.equal(resolved.experience?.movements.length, 22);
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
  assert.equal(resolved.experience?.movements.length, 22);
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
  assert.equal(resolved.experience?.movements.length, 22);
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

// The 2026 Chris sequence names its own pace on every movement, so this no
// longer pins one id. The bug it guards is unchanged: a movement whose pace is
// only derived can come back "tight" from relation, overriding what was published.
test("Chris local movements keep their published pace", () => {
  for (const movement of SISARICH_EXPERIENCE.movements) {
    assert.ok(movement.pace, movement.id);
    assert.equal(movementPace(movement), movement.pace, movement.id);
  }
});

// The 2026 sequence publishes no pairs, so this no longer names ids. The bug it
// guards is unchanged: a movement whose pace is only derived can come back
// "tight" from relation, overriding what was published.
test("SUB:3 local movements keep their published pace", () => {
  for (const movement of SUB3_EXPERIENCE.movements) {
    assert.ok(movement.pace, movement.id);
    assert.equal(movementPace(movement), movement.pace, movement.id);
  }
});

test("OBR local o04 keeps published shift infoHint", () => {
  const o04 = OBR_EXPERIENCE.movements.find((movement) => movement.id === "o04");
  assert.equal(o04?.infoHint, "shift");
});

test("Chris + missing flag reads the CMS", async () => {
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
    // Nothing sets these variables in production, so the project's own default
    // decides, and that default is the CMS.
    assert.equal(resolved.source, "sanity");
    assert.equal(loaded, true);

    // "local" still pins it back to the sequence the site ships with.
    const pinned = await resolveProjectExperience("chris-sisarich", {
      sourceFlag: "local",
      loadPublishedExperience: async () => cmsChris,
    });
    assert.equal(pinned.source, "local");
    assert.equal(pinned.experience, SISARICH_EXPERIENCE);
    assert.equal(pinned.experience?.movements.length, 19);
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
  assert.equal(resolved.experience?.movements.length, 19);
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
  assert.equal(resolved.experience?.movements.length, 19);
  assert.equal(resolved.experience?.context, CHRIS_COPY.context);
  assert.deepEqual(resolved.experience?.authorship?.roles, CHRIS_COPY.roles);
  assert.equal(
    resolved.experience?.infoSections.some((section) => section.id === "outcome"),
    false
  );
  // The 2026 sequence is nineteen pieces — eight films among eleven stills —
  // every one of them contained, with no presentation override on any.
  // override.test.ts covers the override mapping itself; this holds the round trip.
  const kinds = resolved.experience?.movements ?? [];
  for (const movement of kinds) {
    assert.equal(movement.media.fit, "contain", movement.id);
    assert.ok(["film", "portrait", "landscape"].includes(movement.kind), movement.id);
  }
  assert.equal(kinds.filter((movement) => movement.media.type === "video").length, 8);
  assert.equal(kinds.filter((movement) => movement.media.type === "image").length, 11);
  assert.deepEqual(
    resolved.experience?.movements.map((movement) => movement.infoHint),
    ["idea", "idea", "idea", "idea", "shift", "shift", "shift", "shift", "shift", "shift", "shift", "system", "system", "system", "system", "system", "system", "system", "system"]
  );
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
  assert.equal(resolved.experience?.movements.length, 19);
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

test("SUB:3 + missing flag reads the CMS", async () => {
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
    // Nothing sets these variables in production, so the project's own default
    // decides, and that default is the CMS.
    assert.equal(resolved.source, "sanity");
    assert.equal(loaded, true);

    // "local" still pins it back to the sequence the site ships with.
    const pinned = await resolveProjectExperience("sub-3", {
      sourceFlag: "local",
      loadPublishedExperience: async () => cmsSub3,
    });
    assert.equal(pinned.source, "local");
    assert.equal(pinned.experience, SUB3_EXPERIENCE);
    assert.equal(pinned.experience?.movements.length, 23);
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
  assert.equal(resolved.experience?.movements.length, 23);
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
  assert.equal(resolved.experience?.movements.length, 23);
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
    []
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
  assert.equal(resolved.experience?.movements.length, 23);
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

test("OBR + missing flag reads the CMS", async () => {
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
    // Nothing sets these variables in production, so the project's own default
    // decides, and that default is the CMS.
    assert.equal(resolved.source, "sanity");
    assert.equal(loaded, true);

    // "local" still pins it back to the sequence the site ships with.
    const pinned = await resolveProjectExperience("our-boy-roy", {
      sourceFlag: "local",
      loadPublishedExperience: async () => cmsObr,
    });
    assert.equal(pinned.source, "local");
    assert.equal(pinned.experience, OBR_EXPERIENCE);
    assert.equal(pinned.experience?.movements.length, 15);
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
  assert.equal(resolved.experience?.movements.length, 15);
  assert.equal(resolved.experience?.infoSections.some((section) => section.id === "outcome"), false);
  // Every still in the sequence is served responsively; it used to carry one
  // borrowed from /global with its variants switched off.
  for (const movement of resolved.experience?.movements ?? []) {
    if (movement.media.type !== "image") continue;
    assert.ok(movement.media.srcSet, movement.id);
    assert.ok(movement.media.src.startsWith("/projects/our-boy-roy/web/"), movement.id);
  }
  /*
   * A WebM, where there is one, is Our Boy Roy's own.
   *
   * This asserted there was none at all, which was true on the day it was
   * written and stopped being true the moment the project got one — it was
   * recording a fact, not protecting a rule. The rule worth keeping is the
   * one the stills above are held to: a film in this sequence serves files
   * from this project's folder, never borrowed from elsewhere.
   */
  for (const movement of resolved.experience?.movements ?? []) {
    if (movement.media.type !== "video" || !movement.media.webm) continue;
    assert.ok(movement.media.webm.startsWith("/projects/our-boy-roy/web/"), movement.id);
  }
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
  assert.equal(resolved.experience?.movements.length, 15);
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
  /*
   * A WebM, where there is one, is Our Boy Roy's own.
   *
   * This asserted there was none at all, which was true on the day it was
   * written and stopped being true the moment the project got one — it was
   * recording a fact, not protecting a rule. The rule worth keeping is the
   * one the stills above are held to: a film in this sequence serves files
   * from this project's folder, never borrowed from elsewhere.
   */
  for (const movement of resolved.experience?.movements ?? []) {
    if (movement.media.type !== "video" || !movement.media.webm) continue;
    assert.ok(movement.media.webm.startsWith("/projects/our-boy-roy/web/"), movement.id);
  }
  assert.deepEqual(
    resolved.experience?.movements.map((movement) => `${movement.id}:${movement.infoHint}`),
    [
      "o01:idea",
      "o02:idea",
      "o03:idea",
      "o04:shift",
      "o05:shift",
      "o06:shift",
      "o07:shift",
      "o08:system",
      "o09:system",
      "o10:system",
      "o11:system",
      "o12:system",
      "o13:system",
      "o14:system",
      "o15:system",
    ]
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
  assert.equal(resolved.experience?.movements.length, 15);
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
