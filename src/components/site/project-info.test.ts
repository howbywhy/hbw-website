/**
 * The credits in the facts, and a partner's link surviving the trip.
 *
 * SCK's identity is HBW's and its website is Tayte's, and the site had three
 * fields that could hold that and no right way to say it: `credits` is a line
 * of bare names under With, where a studio reads as a co-author of the whole
 * job; `collaborators` is the registry shown as "with …" on the index row,
 * and the index is no longer part of the site, so anything put there is a
 * credit nobody can see; the CMS's own collaborator objects carry a url that
 * the renderer dropped on the floor.
 *
 * So `partners` is a fourth, and a fourth mechanism is only worth having if
 * it actually reaches the page. These assert the two halves of that: the row
 * is built, and the url is still on it at the end.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { infoOf } from "@/components/site/project-info";
import { projectById } from "@/components/home/catalog";
import type { ProjectRecord } from "@/components/home/catalog";
import type { ProjectExperience } from "@/components/home/projects/types";

const bare = (over: Partial<ProjectRecord> = {}): ProjectRecord =>
  ({
    id: "x",
    href: "/projects/x",
    name: "X",
    idea: "An idea",
    year: "2026",
    src: "/projects/x/1.jpg",
    srcSet: "/projects/x/1.jpg 1080w",
    width: 1000,
    height: 1000,
    ...over,
  }) as ProjectRecord;

test("a partner becomes a fact row labelled with the part they made", () => {
  const { facts } = infoOf(
    bare({ partners: [{ contribution: "Website", name: "Tayte", url: "https://www.tayte.co/" }] }),
    null
  );
  const row = facts.find((f) => f.label === "Website");
  assert.ok(row, "no Website row was built");
  assert.equal(row.value, "Tayte");
  assert.equal(row.href, "https://www.tayte.co/");
});

test("a partner with no url is named without one, not dropped", () => {
  const { facts } = infoOf(bare({ partners: [{ contribution: "Build", name: "Someone" }] }), null);
  const row = facts.find((f) => f.label === "Build");
  assert.ok(row, "a partner with no url was dropped");
  assert.equal(row.value, "Someone");
  assert.equal("href" in row, false, "an absent url should be absent, not undefined");
});

/*
 * After Role, not beside With.
 *
 * With and Role are one statement read together — who made this, and what
 * our hand in it was — so a third party's credit in between breaks the pair.
 * Written down because it is an editorial decision that looks like an
 * accident of array order, and the next person to add a fact will not know.
 */
test("the partner credit comes last, after the account of the work", () => {
  const roled = { authorship: { roles: ["Creative Direction"] } } as ProjectExperience;
  const { facts } = infoOf(
    bare({
      credits: ["Mark Blackler"],
      partners: [{ contribution: "Website", name: "Tayte", url: "https://www.tayte.co/" }],
    }),
    roled
  );
  assert.deepEqual(
    facts.map((f) => f.label),
    ["Year", "With", "Role", "Website"]
  );
});

test("no partners means no extra rows at all", () => {
  const { facts } = infoOf(bare({ credits: ["Mark Blackler"] }), null);
  assert.deepEqual(
    facts.map((f) => f.label),
    ["Year", "With"]
  );
  assert.equal(
    facts.some((f) => f.href),
    false,
    "nothing without a partner should carry a link"
  );
});

/* And the real record, so the credit cannot quietly go missing. */
test("SCK credits Tayte for the website, and links to them", () => {
  const sck = projectById("sck");
  const tayte = (sck.partners ?? []).find((p) => p.name === "Tayte");
  assert.ok(tayte, "SCK no longer credits Tayte");
  assert.equal(tayte.contribution, "Website");
  assert.equal(tayte.url, "https://www.tayte.co/");
  /* And it reaches the page the reader actually sees. */
  const row = infoOf(sck, null).facts.find((f) => f.value === "Tayte");
  assert.ok(row, "the Tayte credit does not reach SCK's facts");
  assert.equal(row.label, "Website");
});
