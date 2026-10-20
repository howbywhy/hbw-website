/**
 * How a project is shown, as against what it is.
 *
 * The CMS holds the facts — the name, the year, the sectors, the sequence,
 * the writing. This holds the decisions: which frame makes the card, where
 * it is cropped, how much of the front page it takes, who is credited, who
 * made a part of it. Those are judgements about presentation, they are
 * deliberately not in the CMS, and they are the only reason a project ever
 * needs a line of code.
 *
 * Every field is optional and every project is optional. A project with no
 * entry here uses its own CMS preview as its card and the defaults below,
 * which is what lets a new one appear by being published rather than by
 * being typed out. These seven have entries because they were chosen by
 * hand over months and nothing should change under them.
 *
 * Keyed by the CMS slug. `route` is here because CLOSED is `closed` in the
 * CMS and /projects/bar-closed on the site, which is the one place the two
 * names differ and the only thing that was ever gained by keeping a second
 * list of projects.
 */
import { srcSetFor } from "@/lib/srcset";
import type { ProjectRecord } from "@/components/home/catalog";

export type ProjectLook = Partial<
  Pick<
    ProjectRecord,
    | "src"
    | "srcSet"
    | "width"
    | "height"
    | "crop"
    | "layout"
    | "keyArtId"
    | "visualSpan"
    | "visualStart"
    | "visualBefore"
    | "homeSelected"
    | "collaborators"
    | "credits"
    | "partners"
    | "features"
    | "location"
    | "status"
  >
> & {
  /** Where this project lives on the site, when that is not its CMS slug. */
  route?: string;
};

export const PROJECT_LOOKS: Record<string, ProjectLook> = {
  "made-by-madelen": {
    src: "/projects/made-by-madelen/web/01-full-story.jpg",
    srcSet: srcSetFor("/projects/made-by-madelen/web/01-full-story.jpg", [], 1080)!,
    width: 1080,
    height: 1920,
    crop: "center 38%",
    layout: "portrait",
    keyArtId: "m08",
    visualSpan: 5,
    visualStart: 7,
    credits: ["Mark Blackler", "Madelen"],
  },
  sck: {
    src: "/projects/sck/1.jpg",
    srcSet: srcSetFor("/projects/sck/1.jpg", [], 1080)!,
    width: 1296,
    height: 1620,
    crop: "center 32%",
    layout: "portrait",
    keyArtId: "sk09",
    visualSpan: 5,
    visualStart: 8,
    credits: ["Mark Blackler"],
    partners: [{ contribution: "Website", name: "Tayte", url: "https://www.tayte.co/" }],
  },
  "sub-3": {
    src: "/projects/sub-3/1.jpg",
    srcSet: srcSetFor("/projects/sub-3/1.jpg", [], 1600)!,
    width: 1600,
    height: 2000,
    crop: "center 18%",
    layout: "portrait",
    visualSpan: 7,
    visualStart: 1,
    homeSelected: true,
    collaborators: ["the-colour-club"],
    credits: ["Mark Blackler", "Nick Mitchell", "Matt Cherubino", "Teel Studios"],
  },
  koja: {
    src: "/projects/koja/web/07-full-tall.jpg",
    srcSet: srcSetFor("/projects/koja/web/07-full-tall.jpg", [500, 800, 1080], 1350)!,
    width: 1350,
    height: 1688,
    crop: "center 68%",
    layout: "contained",
    visualSpan: 4,
    visualStart: 9,
    homeSelected: true,
    credits: ["Mark Blackler"],
  },
  closed: {
    route: "bar-closed",
    src: "/projects/bar-closed/670ca0219bf6bccf429b9e5b_HBWxCLOSED-Portfolio25.jpg",
    srcSet: srcSetFor(
      "/projects/bar-closed/670ca0219bf6bccf429b9e5b_HBWxCLOSED-Portfolio25.jpg",
      [500, 800],
      1080
    )!,
    width: 1080,
    height: 1350,
    crop: "center 42%",
    layout: "portrait",
    visualSpan: 6,
    visualStart: 4,
    visualBefore: 4,
    homeSelected: true,
    features: [
      {
        name: "The Brand Identity",
        url: "https://the-brandidentity.com/project/in-crafting-a-rich-evocative-identity-for-closed-bar-how-by-why-serves-a-lesson-in-worldbuilding",
      },
    ],
    credits: ["Mark Blackler", "Sasha Burger"],
  },
  "chris-sisarich": {
    src: "/projects/chris-sisarich/web/08-full-tall.jpg",
    srcSet: srcSetFor("/projects/chris-sisarich/web/08-full-tall.jpg", [500, 800, 1080], 1350)!,
    width: 1350,
    height: 1688,
    crop: "center 48%",
    layout: "portrait",
    visualSpan: 7,
    visualStart: 3,
    visualBefore: 3,
    homeSelected: true,
    credits: ["Mark Blackler"],
  },
  "our-boy-roy": {
    src: "/projects/our-boy-roy/web/08-full-tall.jpg",
    srcSet: srcSetFor("/projects/our-boy-roy/web/08-full-tall.jpg", [500, 800, 1080], 1350)!,
    width: 1334,
    height: 2000,
    crop: "center 36%",
    layout: "portrait",
    visualSpan: 5,
    visualStart: 8,
    homeSelected: true,
    collaborators: ["the-colour-club"],
    credits: ["Mark Blackler", "Nick Mitchell"],
  },
};

/** What a project is shown as when nobody has said otherwise. */
export function lookFor(cmsSlug: string): ProjectLook {
  return PROJECT_LOOKS[cmsSlug] ?? {};
}

/** Where a project lives on the site. Its CMS slug, unless that is overridden. */
export function routeFor(cmsSlug: string): string {
  return PROJECT_LOOKS[cmsSlug]?.route ?? cmsSlug;
}
