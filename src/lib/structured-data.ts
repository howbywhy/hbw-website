/**
 * Structured data: what the site tells a machine about itself.
 *
 * Search engines and AI answer systems resolve entities, not pages. Without
 * this, nothing states that HBW is a business, that Mark Blackler runs it,
 * that it is in Australia, or that KOJA is a project HBW made. Every fact
 * here is one that can be checked against the site or a public source.
 *
 * Nothing is invented. No founding date, no social profiles, no counts, no
 * awards — those go in only when there is a URL to back them.
 */
import { liveProjects, type ProjectRecord } from "@/components/home/catalog";
import { CONTACT_EMAIL, CONTACT_PHONE_E164, STUDIO_COUNTRY, STUDIO_LOCALITY } from "@/lib/contact";

const SITE_ORIGIN = "https://www.hbw.works";
const STUDIO_NAME = "HBW";
const STUDIO_LEGAL_NAME = "How by Why";
const FOUNDER = "Mark Blackler";

/** Ids let one node reference another rather than repeating it. */
const ORG_ID = `${SITE_ORIGIN}/#studio`;
const PERSON_ID = `${SITE_ORIGIN}/#mark-blackler`;
const SITE_ID = `${SITE_ORIGIN}/#website`;

/**
 * Published work about the studio, on sites it does not control. This is the
 * corroboration an AI answer leans on, so each entry needs a real URL.
 */
export const PRESS = [
  {
    name: "In crafting a rich, evocative identity for CLOSED bar, How by Why serves a lesson in worldbuilding",
    url: "https://the-brandidentity.com/project/in-crafting-a-rich-evocative-identity-for-closed-bar-how-by-why-serves-a-lesson-in-worldbuilding",
    publisher: "The Brand Identity",
    date: "2025-02-05",
    kind: "feature" as const,
  },
  {
    name: "The Freelancers: Mark Blackler on settling into Sydney and finding personal satisfaction in his work",
    url: "https://the-brandidentity.com/interview/the-freelancers-mark-blacker-on-settling-into-sydney-and-finding-personal-satisfaction-in-his-work",
    publisher: "The Brand Identity",
    date: "2023-06-09",
    kind: "interview" as const,
  },
  {
    name: "The Tiny Book: Volume One",
    url: "https://the-brandidentity.com/store/product/the-tiny-volume-one-digital-edition",
    publisher: "The Brand Identity",
    date: "2023",
    kind: "book" as const,
  },
];

/**
 * The same studio, elsewhere. `sameAs` is the documented field for tying one
 * entity's scattered profiles together. Only URLs that have been checked go in
 * here — a wrong one claims a profile that is not yours.
 */
export const PROFILES = [
  { name: "Instagram", url: "https://www.instagram.com/howbywhy" },
  { name: "LinkedIn", url: "https://www.linkedin.com/in/markblackler/" },
  { name: "Behance", url: "https://www.behance.net/blacklercreates-co" },
];

type Node = Record<string, unknown>;

/**
 * The studio.
 *
 * Organization, not ProfessionalService: schema.org deprecated that type
 * "due to confusion with Service". Not LocalBusiness either — Google makes a
 * full PostalAddress required there, and this is a home-based practice that
 * does not publish a street address.
 *
 * The locality is the studio's actual place, and it is visible on /studio:
 * Google's structured data policies forbid marking up anything that is not.
 * Sydney is the area served, not where it sits.
 */
export function studioNode(): Node {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: STUDIO_NAME,
    legalName: STUDIO_LEGAL_NAME,
    alternateName: STUDIO_LEGAL_NAME,
    url: SITE_ORIGIN,
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE_E164,
    description:
      "Independent brand and design practice working with founders and leadership teams at moments of change. Brand strategy, identity and design.",
    slogan: "Clarity for brands at a turning point.",
    founder: { "@id": PERSON_ID },
    address: {
      "@type": "PostalAddress",
      addressLocality: STUDIO_LOCALITY,
      addressCountry: STUDIO_COUNTRY,
    },
    sameAs: PROFILES.map((profile) => profile.url),
    areaServed: [
      { "@type": "City", name: "Sydney" },
      { "@type": "Country", name: "Australia" },
    ],
    subjectOf: PRESS.filter((item) => item.kind === "feature").map((item) => ({
      "@type": "Article",
      name: item.name,
      url: item.url,
      datePublished: item.date,
      publisher: { "@type": "Organization", name: item.publisher },
    })),
    knowsAbout: [
      "Brand strategy",
      "Brand identity",
      "Naming",
      "Visual identity",
      "Packaging design",
      "Signage and wayfinding",
      "Website design",
    ],
  };
}

/** The person behind it, with the published work that corroborates him. */
export function founderNode(): Node {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: FOUNDER,
    jobTitle: "Brand consultant and designer",
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE_E164,
    url: `${SITE_ORIGIN}/studio`,
    worksFor: { "@id": ORG_ID },
    sameAs: PROFILES.map((profile) => profile.url),
    subjectOf: PRESS.map((item) => ({
      "@type": item.kind === "book" ? "Book" : "Article",
      name: item.name,
      url: item.url,
      datePublished: item.date,
      publisher: { "@type": "Organization", name: item.publisher },
    })),
  };
}

export function websiteNode(): Node {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    url: SITE_ORIGIN,
    name: STUDIO_NAME,
    publisher: { "@id": ORG_ID },
    inLanguage: "en-AU",
  };
}

/** One project, as a thing HBW made for a named client in a named year. */
export function projectNode(project: ProjectRecord): Node {
  const url = `${SITE_ORIGIN}${project.href}`;
  // Both are optional on a catalog record; an absent one is simply left out
  // rather than emitted as an empty claim.
  const sectors = project.sectors ?? [];
  const disciplines = project.disciplines ?? [];
  return {
    "@type": "CreativeWork",
    "@id": `${url}#work`,
    name: `${project.name} — ${project.idea}`,
    headline: project.idea,
    url,
    dateCreated: project.year,
    creator: { "@id": ORG_ID },
    author: { "@id": ORG_ID },
    ...(sectors.length ? { about: sectors.map((sector) => ({ "@type": "Thing", name: sector })) } : {}),
    ...(disciplines.length || sectors.length
      ? { keywords: [...disciplines, ...sectors].join(", ") }
      : {}),
    ...(project.src ? { image: `${SITE_ORIGIN}${project.src}` } : {}),
  };
}

export function breadcrumbNode(trail: { name: string; path: string }[]): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: `${SITE_ORIGIN}${step.path}`,
    })),
  };
}

/** The index: every project the studio has published, as one list. */
export function workListNode(): Node {
  return {
    "@type": "ItemList",
    "@id": `${SITE_ORIGIN}/projects#list`,
    name: "HBW project index",
    numberOfItems: liveProjects().length,
    itemListElement: liveProjects().map((project, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_ORIGIN}${project.href}`,
      name: project.name,
    })),
  };
}

/** Wraps nodes into the single @graph a page ships. */
export function graph(nodes: Node[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
