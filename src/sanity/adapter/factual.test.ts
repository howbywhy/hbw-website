import assert from "node:assert/strict";
import { test } from "node:test";
import { factualBlocks } from "../../components/home/projects/factual";
import { sanityProjectToFrontendProject, sanityProjectToProjectExperience } from "./index";
import { EMPTY_CATALOG, TEST_MEDIA, baseProject, blocks, markedBlock } from "./fixtures";

test("adapter maps factual context, roles, working context, and collaborators", () => {
  const result = sanityProjectToFrontendProject(
    baseProject({
      context: blocks("A brand needed a clearer public face."),
      roles: ["Brand Strategy", "Creative Direction"],
      workingContext: "Developed while working with The Colour Club",
      collaborators: [
        { name: "Alex", contribution: "Photography", url: "https://example.com" },
        { name: "Sam", contribution: "Motion" },
      ],
    }),
    EMPTY_CATALOG,
    TEST_MEDIA
  );

  const context = result.experience.context;
  assert.ok(Array.isArray(context));
  assert.equal(context[0].spans[0].text, "A brand needed a clearer public face.");
  assert.deepEqual(result.experience.authorship?.roles, ["Brand Strategy", "Creative Direction"]);
  assert.equal(result.experience.authorship?.workingContext, "Developed while working with The Colour Club");
  assert.equal(result.experience.authorship?.collaborators?.[0].url, "https://example.com");
  assert.equal(result.experience.authorship?.collaborators?.[1].url, undefined);
  assert.deepEqual(
    factualBlocks(result.experience).map((block) => block.id),
    ["context", "role", "workingContext", "with"]
  );
});

test("optional factual fields omit cleanly", () => {
  const experience = sanityProjectToProjectExperience(
    baseProject({
      workingContext: undefined,
      collaborators: undefined,
    }),
    TEST_MEDIA
  );
  assert.equal(experience.authorship?.workingContext, undefined);
  assert.equal(experience.authorship?.collaborators, undefined);
  assert.deepEqual(
    factualBlocks(experience).map((block) => block.id),
    ["context", "role"]
  );
});

test("empty collaborator url is omitted", () => {
  const experience = sanityProjectToProjectExperience(
    baseProject({
      collaborators: [{ name: "Alex", contribution: "Photography", url: "  " }],
    }),
    TEST_MEDIA
  );
  assert.deepEqual(experience.authorship?.collaborators, [{ name: "Alex", contribution: "Photography" }]);
});

test("context portable text preserves emphasis on the factual layer", () => {
  const experience = sanityProjectToProjectExperience(
    baseProject({
      context: [
        markedBlock("Urgent context", ["em"], []),
      ],
    }),
    TEST_MEDIA
  );
  assert.deepEqual(experience.context?.[0].spans[0].marks, ["em"]);
});
