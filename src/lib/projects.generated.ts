/**
 * Written by src/sanity/scripts/sync-projects.ts. Do not edit by hand.
 *
 * Every project published in the CMS, in the order the CMS gives them. The
 * site reads this rather than a list kept by hand, so adding a project is
 * publishing one.
 *
 * It is committed on purpose: a build with no CMS credentials still has a
 * site, and a diff here is a readable record of what changed and when.
 */
export type RegisteredProject = {
  slug: string;
  documentId: string;
  name: string;
  idea: string;
  year: string;
  sectors: string[];
  disciplines: string[];
  order: number;
  /** The CMS preview, for a project that has not been given a card by hand. */
  card: { src: string; width: number; height: number } | null;
};

export const REGISTERED_PROJECTS: readonly RegisteredProject[] = [
  {
    slug: "made-by-madelen",
    documentId: "project-made-by-madelen",
    name: "Made by Madelen",
    idea: "From Making to Moment",
    year: "2026",
    sectors: ["Fashion"],
    disciplines: ["Launch Strategy","Content Planning","Social Content","Motion","Messaging"],
    order: 1,
    card: {"src":"https://cdn.sanity.io/images/aagd1kcy/production/b9d1faba549713420d7e0efbb3f149595fe385bb-1080x1920.jpg","width":1080,"height":1920},
  },
  {
    slug: "sck",
    documentId: "project-sck",
    name: "SCK",
    idea: "Intersecting Realities",
    year: "2025",
    sectors: ["Architecture","Interior Design"],
    disciplines: ["Brand Strategy","Visual Identity","Motion"],
    order: 1,
    card: {"src":"https://cdn.sanity.io/images/aagd1kcy/production/e2992aab0955660aa5af285ed335d91ca05c34e6-1296x1620.jpg","width":1296,"height":1620},
  },
  {
    slug: "sub-3",
    documentId: "project-sub3",
    name: "SUB:3",
    idea: "Bending Time & Space",
    year: "2025",
    sectors: ["Sports Nutrition","FMCG"],
    disciplines: ["Visual Identity","Packaging"],
    order: 2,
    card: {"src":"https://cdn.sanity.io/images/aagd1kcy/production/cddcc30b27ab336cc6df446a212e10726121978f-1600x2000.jpg","width":1600,"height":2000},
  },
  {
    slug: "closed",
    documentId: "project-closed",
    name: "CLOSED",
    idea: "A Smuggler’s House",
    year: "2024",
    sectors: ["Hospitality"],
    disciplines: ["Brand Strategy","Naming","Visual Identity","Signage & Wayfinding","Website","Print"],
    order: 3,
    card: {"src":"https://cdn.sanity.io/images/aagd1kcy/production/704d8a5aa8ac05af2d8345c20dcb905a5b91c543-1080x1350.jpg","width":1080,"height":1350},
  },
  {
    slug: "koja",
    documentId: "project-koja",
    name: "KOJA",
    idea: "Unapologetically Good",
    year: "2024",
    sectors: ["Food","FMCG"],
    disciplines: ["Brand Strategy","Visual Identity","Packaging","Print","Digital Design"],
    order: 4,
    card: {"src":"https://cdn.sanity.io/images/aagd1kcy/production/7ee19f9211acc2a47e842e551172b85b1d819643-1350x1688.jpg","width":1350,"height":1688},
  },
  {
    slug: "chris-sisarich",
    documentId: "project-chris-sisarich",
    name: "Chris Sisarich",
    idea: "Beauty Amongst The Mundane",
    year: "2024",
    sectors: ["Photography"],
    disciplines: ["Brand Strategy","Visual Identity","Website"],
    order: 5,
    card: {"src":"https://cdn.sanity.io/images/aagd1kcy/production/cd5cead2f553375bf5f01251641f5c417aee3b8f-1350x1688.jpg","width":1350,"height":1688},
  },
  {
    slug: "our-boy-roy",
    documentId: "project-our-boy-roy",
    name: "Our Boy Roy",
    idea: "The Friendly Neighbour",
    year: "2022",
    sectors: ["Hospitality"],
    disciplines: ["Visual Identity","Signage & Wayfinding","Print"],
    order: 6,
    card: {"src":"https://cdn.sanity.io/images/aagd1kcy/production/663a5101616f4ce1cc084b6dab55f9474acd7a15-1334x2000.jpg","width":1334,"height":2000},
  },
];
