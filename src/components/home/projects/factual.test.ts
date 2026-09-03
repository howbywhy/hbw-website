import assert from "node:assert/strict";
import { test } from "node:test";
import { factualBlocks } from "./factual";
import {
  infoHintForIndex,
  infoSectionHasCopy,
  infoSectionPlainCopy,
  stringToRichText,
  type InfoSection,
  type ProjectExperience,
} from "./types";

function experience(overrides: Partial<ProjectExperience> = {}): ProjectExperience {
  return {
    slug: "fixture",
    movements: [],
    infoSections: [],
    ...overrides,
  };
}

test("context + roles only", () => {
  const blocks = factualBlocks(
    experience({
      context: "A brand needed a clearer public face.",
      authorship: { roles: ["Brand Strategy", "Creative Direction"] },
    })
  );
  assert.deepEqual(
    blocks.map((block) => block.id),
    ["context", "role"]
  );
  assert.equal(blocks[0].kind === "rich" && blocks[0].body[0].spans[0].text, "A brand needed a clearer public face.");
  assert.deepEqual(blocks[1].kind === "lines" && blocks[1].lines, ["Brand Strategy", "Creative Direction"]);
});

test("context + roles + workingContext", () => {
  const blocks = factualBlocks(
    experience({
      context: "A brand needed a clearer public face.",
      authorship: {
        roles: ["Visual Identity"],
        workingContext: "Developed while working with The Colour Club",
      },
    })
  );
  assert.deepEqual(
    blocks.map((block) => block.id),
    ["context", "role", "workingContext"]
  );
  assert.equal(blocks[2].kind === "copy" && blocks[2].copy, "Developed while working with The Colour Club");
});

test("context + roles + collaborators", () => {
  const blocks = factualBlocks(
    experience({
      context: "A brand needed a clearer public face.",
      authorship: {
        roles: ["Brand Strategy"],
        collaborators: [{ name: "Alex", contribution: "Photography" }],
      },
    })
  );
  assert.deepEqual(
    blocks.map((block) => block.id),
    ["context", "role", "with"]
  );
});

test("all factual fields", () => {
  const blocks = factualBlocks(
    experience({
      context: stringToRichText("A brand needed a clearer public face."),
      authorship: {
        roles: ["Brand Strategy", "Creative Direction", "Visual Identity"],
        workingContext: "Developed while working with The Colour Club",
        collaborators: [
          { name: "Alex", contribution: "Photography", url: "https://example.com" },
          { name: "Sam", contribution: "Motion" },
        ],
      },
    })
  );
  assert.deepEqual(
    blocks.map((block) => block.id),
    ["context", "role", "workingContext", "with"]
  );
  const withBlock = blocks[3];
  assert.equal(withBlock.kind, "collaborators");
  if (withBlock.kind === "collaborators") {
    assert.equal(withBlock.collaborators[0].url, "https://example.com");
    assert.equal(withBlock.collaborators[1].url, undefined);
  }
});

test("no workingContext omits that section", () => {
  const blocks = factualBlocks(
    experience({
      context: "Context copy.",
      authorship: {
        roles: ["Naming"],
        collaborators: [{ name: "Alex", contribution: "Photography" }],
      },
    })
  );
  assert.equal(
    blocks.some((block) => block.id === "workingContext"),
    false
  );
});

test("no collaborators omits With", () => {
  const blocks = factualBlocks(
    experience({
      context: "Context copy.",
      authorship: {
        roles: ["Naming"],
        workingContext: "Independent",
      },
    })
  );
  assert.equal(
    blocks.some((block) => block.id === "with"),
    false
  );
});

test("collaborator URL is optional", () => {
  const blocks = factualBlocks(
    experience({
      authorship: {
        roles: ["Print"],
        collaborators: [{ name: "Alex", contribution: "Photography" }],
      },
    })
  );
  const withBlock = blocks.find((block) => block.id === "with");
  assert.ok(withBlock && withBlock.kind === "collaborators");
  if (withBlock && withBlock.kind === "collaborators") {
    assert.equal("url" in withBlock.collaborators[0], false);
  }
});

test("empty factual fields omit the whole header", () => {
  assert.deepEqual(factualBlocks(experience()), []);
  assert.deepEqual(factualBlocks(experience({ context: "   " })), []);
  assert.deepEqual(factualBlocks(experience({ authorship: { roles: [] } })), []);
  assert.deepEqual(
    factualBlocks(experience({ authorship: { roles: ["  "], collaborators: [{ name: "  ", contribution: "x" }] } })),
    []
  );
});

test("plain string Info copy remains compatible", () => {
  const section: InfoSection = { id: "idea", heading: "The idea", copy: "Existing local copy." };
  assert.equal(infoSectionHasCopy(section), true);
  assert.equal(infoSectionPlainCopy(section), "Existing local copy.");
});

test("structured body preserves emphasis, strong, and links", () => {
  const section: InfoSection = {
    id: "idea",
    heading: "The idea",
    copy: "Linked emphasis",
    body: [
      {
        spans: [{ text: "Linked emphasis", marks: ["em", "strong"], href: "https://example.com" }],
      },
    ],
  };
  assert.equal(infoSectionHasCopy(section), true);
  assert.equal(infoSectionPlainCopy(section), "Linked emphasis");
  assert.deepEqual(section.body?.[0].spans[0].marks, ["em", "strong"]);
  assert.equal(section.body?.[0].spans[0].href, "https://example.com");
});

test("infoHint falls back when the chapter is absent", () => {
  const hinted = experience({
    infoSections: [
      { id: "idea", heading: "The idea", copy: "Idea." },
      { id: "shift", heading: "The shift", copy: "Shift." },
      { id: "system", heading: "The system", copy: "System." },
    ],
    movements: [
      {
        id: "a",
        kind: "landscape",
        infoHint: "system",
        media: { type: "image", src: "/a.jpg", width: 100, height: 80, fit: "contain" },
      },
      {
        id: "b",
        kind: "landscape",
        infoHint: "outcome",
        media: { type: "image", src: "/b.jpg", width: 100, height: 80, fit: "contain" },
      },
    ],
  });
  assert.equal(infoHintForIndex(hinted, 0), "system");
  assert.equal(infoHintForIndex(hinted, 1), "system");
});
