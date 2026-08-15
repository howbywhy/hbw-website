export type BrowseLayout = "portrait" | "contained" | "landscape" | "wide";

export function visualSource(project: ProjectRecord) {
  if ((project.layout === "landscape" || project.layout === "wide") && project.browseSrc) {
    return {
      src: project.browseSrc,
      srcSet: project.browseSrcSet || project.srcSet,
      width: project.browseWidth || project.width,
      height: project.browseHeight || project.height,
      crop: project.browseCrop || project.crop,
    };
  }
  return {
    src: project.src,
    srcSet: project.srcSet,
    width: project.width,
    height: project.height,
    crop: project.crop,
  };
}

export type ProjectRecord = {
  id: string;
  href: string;
  name: string;
  idea: string;
  year: string;
  src: string;
  srcSet: string;
  width: number;
  height: number;
  crop: string;
  layout: BrowseLayout;
  /** 12-column Visual span from the Projects axis. Index ignores this. */
  visualSpan?: 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /** 1-based column start. Index ignores this. */
  visualStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /** Extra space above a Visual cell, in existing space steps. */
  visualBefore?: 3 | 4 | 5;
  sector?: string;
  disciplines?: string[];
  collaborators?: string[];
  credits?: string;
  location?: string;
  browseSrc?: string;
  browseSrcSet?: string;
  browseWidth?: number;
  browseHeight?: number;
  browseCrop?: string;
};

function set(src: string, widths: number[], intrinsic: number) {
  const ext = src.endsWith(".webp") ? "webp" : "jpg";
  const base = src.replace(/\.(jpg|webp)$/, "");
  return widths.map((w) => `${base}-p-${w}.${ext} ${w}w`).concat(`${src} ${intrinsic}w`).join(", ");
}

/** Verified from recovered /projects and / home records. */
export const PROJECTS: ProjectRecord[] = [
  {
    id: "sub-3",
    href: "/projects/sub-3",
    name: "SUB:3",
    idea: "Bending Time & Space",
    year: "2025",
    src: "/projects/sub3/68db9133176e7f02015d4f37_TCCWEB-SUB326.jpg",
    srcSet: set("/projects/sub3/68db9133176e7f02015d4f37_TCCWEB-SUB326.jpg", [500, 800, 1080], 1200),
    width: 1200,
    height: 1500,
    crop: "center 18%",
    layout: "portrait",
    visualSpan: 7,
    visualStart: 1,
    sector: "Performance nutrition",
    disciplines: ["Brand identity", "Packaging", "Art direction"],
    collaborators: ["The Colour Club"],
    credits: "Brand identity, packaging design, and art direction by How by Why (HBW).",
  },
  {
    id: "koja",
    href: "/projects/koja",
    name: "KOJA",
    idea: "Unapologetically Good.",
    year: "2024",
    src: "/projects/koja/670666ebdd4b35e158f69532_HBWxKOJA-Portfolio4.jpg",
    srcSet: set("/projects/koja/670666ebdd4b35e158f69532_HBWxKOJA-Portfolio4.jpg", [500, 800], 1080),
    width: 1080,
    height: 1350,
    crop: "center 68%",
    layout: "contained",
    visualSpan: 4,
    visualStart: 9,
    sector: "Food",
    disciplines: ["Brand identity", "Packaging", "Visual system"],
    credits: "Brand identity, packaging design, and visual system by How by Why (HBW).",
  },
  {
    id: "bar-closed",
    href: "/projects/bar-closed",
    name: "CLOSED",
    idea: "A Smuggler's House",
    year: "2024",
    src: "/projects/closed/670ca0219bf6bccf429b9e5b_HBWxCLOSED-Portfolio25.jpg",
    srcSet: set("/projects/closed/670ca0219bf6bccf429b9e5b_HBWxCLOSED-Portfolio25.jpg", [500, 800], 1080),
    width: 1080,
    height: 1350,
    crop: "center 42%",
    layout: "portrait",
    visualSpan: 6,
    visualStart: 4,
    visualBefore: 4,
    sector: "Hospitality",
    disciplines: ["Brand identity", "Art direction"],
    credits: "Brand identity and art direction by How by Why (HBW).",
  },
  {
    id: "chris-sisarich",
    href: "/projects/chris-sisarich",
    name: "Chris Sisarich",
    idea: "Beauty Amongst The Mundane",
    year: "2024",
    src: "/projects/chris-sisarich/6663143cb87a78fa3d4c90be_HBWxChrisSisarich-uPortfolio5.jpg",
    srcSet: set("/projects/chris-sisarich/6663143cb87a78fa3d4c90be_HBWxChrisSisarich-uPortfolio5.jpg", [500, 800], 1080),
    width: 1080,
    height: 1350,
    crop: "center 48%",
    layout: "portrait",
    visualSpan: 7,
    visualStart: 3,
    visualBefore: 3,
    browseSrc: "/projects/chris-sisarich/665d93483f1d5500f3892332_HBWxChrisSisarich-Portfolio8.jpg",
    browseSrcSet: set(
      "/projects/chris-sisarich/665d93483f1d5500f3892332_HBWxChrisSisarich-Portfolio8.jpg",
      [500, 800, 1080, 1600],
      1920
    ),
    browseWidth: 1920,
    browseHeight: 1080,
    browseCrop: "center 46%",
    sector: "Photography",
    disciplines: ["Brand identity", "Website", "Art direction"],
    credits: "Brand identity, website design, and art direction by How by Why (HBW).",
  },
  {
    id: "our-boy-roy",
    href: "/projects/our-boy-roy",
    name: "Our Boy Roy",
    idea: "The Friendly Neighbour",
    year: "2024",
    src: "/projects/our-boy-roy/66626aa420e92cdf8d975c8b_HBWxOBR-Portfolio3.jpg",
    srcSet: set("/projects/our-boy-roy/66626aa420e92cdf8d975c8b_HBWxOBR-Portfolio3.jpg", [500, 800], 1080),
    width: 1080,
    height: 1350,
    crop: "center 36%",
    layout: "portrait",
    visualSpan: 5,
    visualStart: 8,
    sector: "Hospitality",
    disciplines: ["Brand identity", "Character design", "Visual system"],
    collaborators: ["The Colour Club"],
    credits: "Brand identity, character design, and visual system by How by Why (HBW).",
  },
  {
    id: "bistro-nido",
    href: "/projects/bistro-nido",
    name: "Bistro Nido",
    idea: "Twice Cooked",
    year: "2024",
    src: "/projects/bistro-nido/68db910da232382c5cf8fa9d_TCCWEB-Portfolio-Bistro-Nido15.jpg",
    srcSet: set("/projects/bistro-nido/68db910da232382c5cf8fa9d_TCCWEB-Portfolio-Bistro-Nido15.jpg", [500, 800, 1080], 1200),
    width: 1200,
    height: 1500,
    crop: "center 38%",
    layout: "portrait",
    visualSpan: 6,
    visualStart: 2,
    visualBefore: 4,
    sector: "Hospitality",
    disciplines: ["Brand identity", "Art direction"],
    collaborators: ["The Colour Club"],
    credits: "Brand identity and art direction by How by Why (HBW).",
    location: "501 George Street, Sydney",
  },
];

export function projectById(id: string) {
  return PROJECTS.find((p) => p.id === id) ?? PROJECTS[0];
}

export function projectLabel(project: Pick<ProjectRecord, "name" | "idea">) {
  return `${project.name} — ${project.idea}`;
}

export function disciplineLabel(project: ProjectRecord) {
  return project.disciplines?.join(" · ") ?? "";
}

export function collaboratorLabel(project: ProjectRecord) {
  return project.collaborators?.join(" · ") ?? "";
}

export function matchesFilter(project: ProjectRecord, dim: string, value: string) {
  if (!value || dim === "all") return true;
  if (dim === "year") return project.year === value;
  if (dim === "sector") return project.sector === value;
  if (dim === "discipline") return Boolean(project.disciplines?.includes(value));
  if (dim === "collaborator") return Boolean(project.collaborators?.includes(value));
  return true;
}

export function filterValues(dim: string, list: ProjectRecord[] = PROJECTS) {
  const values = new Set<string>();
  for (const project of list) {
    if (dim === "year" && project.year) values.add(project.year);
    if (dim === "sector" && project.sector) values.add(project.sector);
    if (dim === "discipline") project.disciplines?.forEach((item) => values.add(item));
    if (dim === "collaborator") project.collaborators?.forEach((item) => values.add(item));
  }
  return [...values];
}

export function sortProjects(list: ProjectRecord[], sort: string) {
  const next = [...list];
  if (sort === "newest") next.sort((a, b) => b.year.localeCompare(a.year) || a.name.localeCompare(b.name));
  else if (sort === "az") next.sort((a, b) => a.name.localeCompare(b.name));
  return next;
}
