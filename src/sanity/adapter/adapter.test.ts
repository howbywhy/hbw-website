import assert from "node:assert/strict";
import { test } from "node:test";
import { AdapterError, sanityProjectToFrontendProject } from "./index";
import {
  EMPTY_CATALOG,
  TEST_MEDIA,
  baseProject,
  blocks,
  filmMovement,
  localFile,
  markedBlock,
  stillMovement,
} from "./fixtures";
import { hasPortableTextMarks, portableTextToPlainCopy, portableTextToRichText } from "./portableText";

test("simple still project: no outcome, inherited idea chapter", () => {
  const project = baseProject({
    outcome: undefined,
    movements: [
      stillMovement("a", "/tmp/a.jpg", 1080, 1350, { scale: "major" }),
      stillMovement("b", "/tmp/b.jpg", 1080, 1350, { scale: "standard" }),
    ],
  });
  const result = sanityProjectToFrontendProject(project, EMPTY_CATALOG, TEST_MEDIA);
  assert.equal(result.experience.infoSections.some((section) => section.id === "outcome"), false);
  assert.deepEqual(
    result.experience.movements.map((movement) => movement.infoHint),
    ["idea", "idea"]
  );
  assert.equal(result.experience.movements[0].kind, "portrait");
  assert.equal(result.record.id, "cms-schema-test");
  assert.equal(result.record.href, "/projects/cms-schema-test");
  assert.equal(result.record.crop, "center");
  assert.equal(result.authorship.roles[0], "Brand Strategy");
});

test("full case study maps sections, authorship, and explicit chapters", () => {
  const project = baseProject({
    workingContext: "Developed while testing the adapter",
    roles: ["Brand Strategy", "Creative Direction"],
    collaborators: [{ name: "Test Studio", contribution: "Strategy", url: "https://example.com" }],
    outcome: { heading: "The outcome", body: blocks("Outcome body.") },
    movements: [
      stillMovement("a", "/tmp/a.jpg", 1080, 1350, { infoHint: "idea" }),
      stillMovement("b", "/tmp/b.jpg", 1920, 1080, { infoHint: "shift", scale: "detail" }),
      stillMovement("c", "/tmp/c.jpg", 1080, 1350, { infoHint: "system", scale: "major" }),
      stillMovement("d", "/tmp/d.jpg", 1080, 1350, { infoHint: "outcome" }),
    ],
  });
  const result = sanityProjectToFrontendProject(project, EMPTY_CATALOG, TEST_MEDIA);
  assert.deepEqual(
    result.experience.infoSections.map((section) => section.id),
    ["idea", "shift", "system", "outcome"]
  );
  assert.deepEqual(
    result.experience.movements.map((movement) => movement.infoHint),
    ["idea", "shift", "system", "outcome"]
  );
  assert.equal(result.experience.movements[1].kind, "landscape");
  assert.equal(result.authorship.workingContext, "Developed while testing the adapter");
  assert.equal(result.authorship.collaborators?.[0].url, "https://example.com");
});

test("pair is an adjacent flag, not a grouped object", () => {
  const project = baseProject({
    movements: [
      stillMovement("a", "/tmp/a.jpg", 1080, 1350, { relation: "pair" }),
      stillMovement("b", "/tmp/b.jpg", 1080, 1350, { relation: "single" }),
    ],
  });
  const result = sanityProjectToFrontendProject(project, EMPTY_CATALOG, TEST_MEDIA);
  assert.equal(result.experience.movements[0].relation, "pair");
  assert.equal(result.experience.movements[1].relation, "single");
  assert.equal(result.experience.movements.length, 2);
});

test("film maps mp4, poster, and optional webm", () => {
  const project = baseProject({
    movements: [
      filmMovement("f1", "/tmp/clip.mp4", "/tmp/poster.jpg", 1920, 1080, {
        webm: localFile("/tmp/clip.webm", 1920, 1080, "webm"),
      }),
    ],
  });
  const media = sanityProjectToFrontendProject(project, EMPTY_CATALOG, TEST_MEDIA).experience.movements[0].media;
  assert.equal(media.type, "video");
  assert.equal(media.mp4, "/tmp/clip.mp4");
  assert.equal(media.poster, "/tmp/poster.jpg");
  assert.equal(media.webm, "/tmp/clip.webm");
  assert.equal(media.autoplay, true);
});

test("mixed aspects and scales derive kind from media, not CMS", () => {
  const project = baseProject({
    movements: [
      stillMovement("portrait", "/tmp/p.jpg", 1080, 1350, { scale: "major" }),
      stillMovement("landscape", "/tmp/l.jpg", 1920, 1080, { scale: "detail" }),
      stillMovement("squareish", "/tmp/s.jpg", 1000, 1000, { scale: "standard" }),
    ],
  });
  const kinds = sanityProjectToFrontendProject(project, EMPTY_CATALOG, TEST_MEDIA).experience.movements.map(
    (movement) => `${movement.kind}:${movement.scale}`
  );
  assert.deepEqual(kinds, ["portrait:major", "landscape:detail", "landscape:standard"]);
});

test("infoHint inheritance: first idea, later inherit, explicit changes", () => {
  const project = baseProject({
    outcome: { body: blocks("Outcome.") },
    movements: [
      stillMovement("a", "/tmp/a.jpg", 1080, 1350),
      stillMovement("b", "/tmp/b.jpg", 1080, 1350),
      stillMovement("c", "/tmp/c.jpg", 1080, 1350, { infoHint: "shift" }),
      stillMovement("d", "/tmp/d.jpg", 1080, 1350),
      stillMovement("e", "/tmp/e.jpg", 1080, 1350, { infoHint: "system" }),
      stillMovement("f", "/tmp/f.jpg", 1080, 1350, { infoHint: "outcome" }),
    ],
  });
  assert.deepEqual(
    sanityProjectToFrontendProject(project, EMPTY_CATALOG, TEST_MEDIA).experience.movements.map(
      (movement) => movement.infoHint
    ),
    ["idea", "idea", "shift", "shift", "system", "outcome"]
  );
});

test("outcome hint without Outcome is kept on the movement", () => {
  const project = baseProject({
    outcome: undefined,
    movements: [
      stillMovement("a", "/tmp/a.jpg", 1080, 1350, { infoHint: "system" }),
      stillMovement("b", "/tmp/b.jpg", 1080, 1350, { infoHint: "outcome" }),
    ],
  });
  const result = sanityProjectToFrontendProject(project, EMPTY_CATALOG, TEST_MEDIA);
  assert.deepEqual(
    result.experience.movements.map((movement) => movement.infoHint),
    ["system", "outcome"]
  );
  assert.deepEqual(
    result.experience.infoSections.map((section) => section.id),
    ["idea", "shift", "system"]
  );
});

test("terminal pair is rejected", () => {
  const project = baseProject({
    movements: [stillMovement("a", "/tmp/a.jpg", 1080, 1350, { relation: "pair" })],
  });
  assert.throws(
    () => sanityProjectToFrontendProject(project, EMPTY_CATALOG, TEST_MEDIA),
    (error: unknown) => error instanceof AdapterError && error.code === "TERMINAL_PAIR"
  );
});

test("plain copy still flattens marks; rich text preserves emphasis, strong, and links", () => {
  const value = [
    ...blocks("First paragraph.", "Second paragraph."),
    markedBlock("Linked emphasis", ["em", "strong", "link1"], [
      { _type: "link", _key: "link1", href: "https://example.com" },
    ]),
  ];
  const marks = hasPortableTextMarks(value);
  assert.equal(marks.emphasis, true);
  assert.equal(marks.strong, true);
  assert.equal(marks.links, true);
  assert.equal(portableTextToPlainCopy(value), "First paragraph.\n\nSecond paragraph.\n\nLinked emphasis");

  const rich = portableTextToRichText(value);
  assert.equal(rich.length, 3);
  assert.deepEqual(rich[0].spans[0], { text: "First paragraph." });
  const marked = rich[2].spans[0];
  assert.equal(marked.text, "Linked emphasis");
  assert.deepEqual(marked.marks, ["em", "strong"]);
  assert.equal(marked.href, "https://example.com");

  const project = baseProject({
    idea: { heading: "The idea", body: value },
  });
  const section = sanityProjectToFrontendProject(project, EMPTY_CATALOG, TEST_MEDIA).experience.infoSections[0];
  assert.equal(section.copy, "First paragraph.\n\nSecond paragraph.\n\nLinked emphasis");
  assert.equal(section.body?.[2].spans[0].href, "https://example.com");
  assert.deepEqual(section.body?.[2].spans[0].marks, ["em", "strong"]);
});

test("graphic cannot be derived from portrait still dimensions", () => {
  const project = baseProject({
    movements: [stillMovement("print", "/global/layout.jpg", 595, 842)],
  });
  const movement = sanityProjectToFrontendProject(project, EMPTY_CATALOG, TEST_MEDIA).experience.movements[0];
  assert.equal(movement.kind, "portrait");
  assert.notEqual(movement.kind, "graphic");
});
