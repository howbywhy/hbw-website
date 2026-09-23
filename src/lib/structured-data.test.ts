import assert from "node:assert/strict";
import { test } from "node:test";
import { liveProjects } from "../components/home/catalog";
import { CONTACT_PHONE, CONTACT_PHONE_E164, STUDIO_PLACE } from "./contact";
import { STUDIO_COPY } from "../components/home/studio-copy";
import {
  PRESS,
  breadcrumbNode,
  founderNode,
  graph,
  projectNode,
  studioNode,
  websiteNode,
  workListNode,
} from "./structured-data";

test("the graph is serialisable and well formed", () => {
  const g = graph([studioNode(), founderNode(), websiteNode()]);
  const parsed = JSON.parse(JSON.stringify(g));
  assert.equal(parsed["@context"], "https://schema.org");
  assert.ok(Array.isArray(parsed["@graph"]));
  for (const node of parsed["@graph"]) assert.ok(node["@type"], "every node needs a @type");
});

test("the studio is a business, in the place it is actually in", () => {
  const s = studioNode() as Record<string, never>;
  // Not ProfessionalService: schema.org deprecated it. Not LocalBusiness:
  // that would require publishing a street address.
  assert.equal(s["@type"], "Organization");
  const address = s.address as unknown as Record<string, string>;
  assert.equal(address.addressCountry, "AU");
  assert.equal(address.addressLocality, "Wentworth Falls");
  // Only what the page shows may be marked up, so no unseen region code.
  assert.equal(address.addressRegion, undefined);
  // Sydney is served, not inhabited. Claiming otherwise is the mismatch.
  assert.ok(JSON.stringify(s.areaServed).includes("Sydney"));
  assert.ok(!JSON.stringify(s.address).includes("Sydney"));
});

test("every profile and press URL is a real, absolute address", () => {
  const s = studioNode() as Record<string, never>;
  for (const url of (s.sameAs as unknown as string[]) ?? []) {
    assert.match(url, /^https:\/\//, "sameAs claims a profile is ours; it must be a real URL");
  }
  for (const item of PRESS) {
    assert.match(item.url, /^https:\/\/[^ ]+$/);
    assert.ok(item.publisher && item.date, `${item.name} needs a publisher and a date`);
  }
});

test("the studio page shows the country the markup claims", () => {
  // Structured data may only assert what a visitor can read.
  assert.ok(STUDIO_COPY.place.includes("Australia"));
});

test("the founder carries the published work that corroborates him", () => {
  const f = founderNode() as Record<string, never>;
  assert.equal(f.name, "Mark Blackler");
  const subjectOf = f.subjectOf as unknown as Record<string, string>[];
  assert.equal(subjectOf.length, PRESS.length);
  for (const item of subjectOf) {
    assert.match(item.url, /^https:\/\//, "press needs a real URL or it is not corroboration");
    assert.ok(item.name && item.datePublished);
  }
});

test("the studio and the founder point at each other", () => {
  const s = studioNode() as Record<string, never>;
  const f = founderNode() as Record<string, never>;
  assert.equal((s.founder as unknown as Record<string, string>)["@id"], f["@id"]);
  assert.equal((f.worksFor as unknown as Record<string, string>)["@id"], s["@id"]);
});

test("every live project makes a complete work node", () => {
  for (const project of liveProjects()) {
    const node = projectNode(project) as Record<string, never>;
    assert.equal(node["@type"], "CreativeWork");
    assert.match(String(node.url), /^https:\/\/www\.hbw\.works\/projects\//);
    assert.ok(node.name, `${project.id} needs a name`);
    assert.ok(node.dateCreated, `${project.id} needs a year`);
    assert.equal((node.creator as unknown as Record<string, string>)["@id"], studioNode()["@id"]);
    // No empty claims: a key is present only when it has content.
    for (const [key, value] of Object.entries(node)) {
      assert.ok(value !== "" && value !== undefined, `${project.id}.${key} is empty`);
    }
  }
});

test("the index lists every live project once", () => {
  const list = workListNode() as Record<string, never>;
  const items = list.itemListElement as unknown as Record<string, string>[];
  assert.equal(items.length, liveProjects().length);
  assert.equal(list.numberOfItems, liveProjects().length);
  assert.equal(new Set(items.map((i) => i.url)).size, items.length, "no duplicates");
  items.forEach((item, i) => assert.equal(Number(item.position), i + 1));
});

test("breadcrumbs are absolute and in order", () => {
  const crumb = breadcrumbNode([
    { name: "HBW", path: "/" },
    { name: "Index", path: "/index" },
    { name: "KOJA", path: "/projects/koja" },
  ]) as Record<string, never>;
  const items = crumb.itemListElement as unknown as Record<string, string>[];
  assert.equal(items.length, 3);
  assert.equal(items[2].item, "https://www.hbw.works/projects/koja");
  items.forEach((item, i) => assert.equal(Number(item.position), i + 1));
});

test("the phone shown and the phone marked up are the same number", () => {
  const digits = (value: string) => value.replace(/\D/g, "");
  const s = studioNode() as Record<string, never>;
  // Visible "0414 833 791" and E.164 "+61414833791" are the same AU number:
  // drop the leading 0, add 61. If these ever drift, the entity looks like two.
  assert.equal(digits(CONTACT_PHONE).replace(/^0/, "61"), digits(String(s.telephone)));
  assert.equal(String(s.telephone), CONTACT_PHONE_E164);
});

test("the place and the phone are each defined once", () => {
  // Four copies of the location and two of the phone is how an entity ends up
  // looking like two businesses. These guard the single source in lib/contact.
  assert.ok(STUDIO_PLACE.includes("Wentworth Falls"));
  assert.ok(STUDIO_PLACE.includes("Australia"), "the country has to be visible somewhere");
  assert.equal(STUDIO_COPY.place, STUDIO_PLACE, "the Studio page must show the canonical place");
  const s = studioNode() as Record<string, never>;
  const address = s.address as unknown as Record<string, string>;
  assert.ok(
    STUDIO_PLACE.includes(address.addressLocality),
    "structured data may only claim a locality the page actually shows"
  );
});
