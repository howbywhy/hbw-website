import {
  type InfoSection,
  type Movement,
  type ProjectExperience,
  type ProjectMedia,
} from "@/components/home/projects/types";
import { srcSetFor } from "@/components/home/catalog";
import { SUB3_INFO } from "@/components/home/sub3-info";

function variantsFor(width: number) {
  if (width > 1920) return [500, 800, 1080, 1600];
  if (width > 1080) return [500, 800, 1080];
  if (width > 800) return [500, 800];
  return [500];
}

function jpg(
  src: string,
  width: number,
  height: number,
  fit: ProjectMedia["fit"] = "contain",
  variants?: number[]
): ProjectMedia {
  const widths = (variants ?? variantsFor(width)).filter((w) => w < width);
  return {
    type: src.endsWith(".gif") ? "gif" : "image",
    src,
    srcSet: src.endsWith(".gif") || widths.length === 0 ? undefined : srcSetFor(src, widths, width),
    width,
    height,
    fit,
  };
}

function webp(src: string, width: number, height: number): ProjectMedia {
  return {
    type: "image",
    src,
    srcSet: srcSetFor(src, [500, 800, 1080], width),
    width,
    height,
    fit: "contain",
  };
}

function film(
  src: string,
  width: number,
  height: number,
  poster?: string,
  fit: ProjectMedia["fit"] = "contain",
  webm?: string
): ProjectMedia {
  return {
    type: "video",
    src,
    mp4: src,
    videoSrc: src,
    webm,
    width,
    height,
    poster,
    fit,
    autoplay: true,
    loop: true,
    muted: true,
  };
}

function mv(
  id: string,
  kind: Movement["kind"],
  media: ProjectMedia,
  infoHint: Movement["infoHint"],
  extra?: Partial<Movement>
): Movement {
  return { id, kind, media, infoHint, ...extra };
}

const KOJA_INFO: InfoSection[] = [
  {
    id: "idea",
    heading: "The idea",
    copy: "KOJA exists to make healthy simple. Built on real ingredients and straight-talking values, the brand cuts through the noise of the category with clarity and confidence. At its core is Unapologetically Good, a belief that good food doesn’t need dressing up, it just needs to be good.",
  },
  {
    id: "shift",
    heading: "The shift",
    copy: "The health snack category often overcomplicates what should be simple. Long ingredient lists, layered claims, and careful language create distance between the product and the person. The opportunity was to strip it back. To say less, but mean more. The shift came in removing the need to justify. If it’s good, it’s good.",
  },
  {
    id: "system",
    heading: "The system",
    copy: "The identity brings Unapologetically Good to life through clarity and character. A bold, confident logotype leads the system, designed to feel instantly recognisable and full of personality, with a subtle grin. A warm, approachable palette signals health without feeling clinical, while hand-drawn assets and ingredient-led illustrations introduce a human touch. Typography moves between strong and expressive, creating a system that feels direct, energetic, and easy to connect with.",
  },
  {
    id: "outcome",
    heading: "The outcome",
    copy: "KOJA shifts from a functional product to a brand with presence and personality. It stands clearly on shelf, communicates with confidence, and connects through simplicity rather than explanation. By owning what it is, KOJA becomes a brand that feels as good as it tastes, now stocked nationwide.",
  },
];

const CLOSED_INFO: InfoSection[] = [
  {
    id: "idea",
    heading: "The idea",
    copy: "CLOSED is built on the idea of A Smuggler’s House — a space shaped by secrecy, intimacy, and belonging. The name reflects this directly. What appears closed becomes an invitation, revealing a place where privacy meets connection, and hidden moments are shared.",
  },
  {
    id: "shift",
    heading: "The shift",
    copy: "Hospitality often competes on visibility — louder spaces, open façades, constant exposure. The opportunity was to move differently. More considered, more intimate, more intentional. The shift came in reframing the experience. Not a place to be seen, but a place to feel part of something. Secrecy becomes the draw, not the barrier.",
  },
  {
    id: "system",
    heading: "The system",
    copy: "The identity is shaped by the tension between secrecy and elegance. The brand lives within a poetic structure, where “In the shadows of the night where CLOSED doors open” carries both meaning and form. Torn edges, layered compositions, and contrasting materials create a sense of fragmentation and discovery. Typography, imagery, and layout work together to reveal and conceal in equal measure, building a system that feels intimate, expressive, and deliberately unresolved.",
  },
  {
    id: "outcome",
    heading: "The outcome",
    copy: "CLOSED becomes more than a venue. It becomes a place you find, not one that finds you. By embedding meaning into every detail, the brand creates a sense of intrigue, warmth, and belonging — where secrecy meets elegance, and experience feels personal. Featured: The Brand Identity.",
  },
];

const OBR_INFO: InfoSection[] = [
  {
    id: "idea",
    heading: "The idea",
    copy: "Some places feel familiar before you’ve even been. Our Boy Roy is built on that feeling. A neighbourhood spot shaped by warmth, personality, and ease. At its core is Our Boy, a character that holds it all together. Not a figure, but a reflection. Of people, of place, of the everyday moments that make somewhere worth returning to.",
  },
  {
    id: "shift",
    heading: "The shift",
    copy: "Cafés often follow culture. Trends, finishes, moments of polish. The result can feel considered, but distant. The opportunity was to move closer. To create something that feels lived in, not designed. The shift came in building a brand that feels human. Familiar, open, and easy to step into.",
  },
  {
    id: "system",
    heading: "The system",
    copy: "Roy becomes both character and structure. A simple figure that adapts, with interchangeable hats and hairstyles reflecting the breadth of the offering. His trousers extend into pattern, forming a visual language that moves across menus, packaging, and space. Typography is bold and friendly, softened with moments of charm. The system is flexible, expressive, and grounded. Designed to feel effortless, but full of intent.",
  },
  {
    id: "outcome",
    heading: "The outcome",
    copy: "Our Boy Roy settles into its surroundings with ease. Not trying to stand out, but impossible to miss. It becomes part of the neighbourhood rhythm. Familiar, welcoming, and full of character. A place you return to without thinking, and remember without trying.",
  },
];

const SISARICH_INFO: InfoSection[] = [
  {
    id: "idea",
    heading: "The idea",
    copy: "What we see is shaped by how we choose to look. Chris Sisarich is built on Beauty Amongst The Mundane, a way of noticing what’s already there. The everyday, often overlooked, observed with intent and sensitivity. It’s not about adding meaning, but revealing it. A shift in perspective that turns quiet moments into something worth holding onto.",
  },
  {
    id: "shift",
    heading: "The shift",
    copy: "Photography portfolios often lead with credentials. Clients, awards, recognition. The work becomes secondary. The opportunity was to reverse that. To remove the noise and let the images carry the weight. The shift came in stepping back, creating space for the viewer to find their own way in.",
  },
  {
    id: "system",
    heading: "The system",
    copy: "The identity is deliberately restrained. A quiet framework that allows the work to lead. Typography is confident but considered. The palette is reduced to hold focus. Layouts guide rather than dictate, creating a sense of movement and discovery. The system behaves more like navigation than structure, directing attention without controlling it.",
  },
  {
    id: "outcome",
    heading: "The outcome",
    copy: "Chris Sisarich is positioned through perspective, not presentation. The work speaks first. The identity supports. What remains is a body of work that invites you in, and stays with you.",
  },
];

const NIDO_INFO: InfoSection[] = [
  {
    id: "idea",
    heading: "The idea",
    copy: "Bistro Nido is built on a simple, honest premise: cuisine du marché — cooking from the market. A 40-seat modern bistro at 501 George Street, Sydney, it draws from French bistro tradition while weaving in Japanese technique and ingredient throughout. The concept is called Twice Cooked — a culinary approach to everything, including the design. Two cultures, two influences, one place worth returning to.",
  },
  {
    id: "shift",
    heading: "The shift",
    copy: "Hospitality branding often reaches for refinement at the expense of warmth, or personality at the expense of legibility. The challenge with Bistro Nido was holding both — a space that feels genuinely considered without feeling distant. The shift came in letting the cultural interplay do the work. Rather than choosing between French and Japanese, the brand leans into the tension, finding something new in the overlap.",
  },
  {
    id: "system",
    heading: "The system",
    copy: "The identity is built around the concept of Twice Cooked — two things brought together to become something better. A bold, confident logotype anchored by hairline accents carries the dual personality of the menu itself. Graphic assets draw from Koi carp patterns and the structural geometry of Japanese grid games, layered against organic French floral forms. The palette moves between warm, earthy tones and a sharp accent that cuts through. Across menus, coasters, uniforms, and glassware, the system is restrained but full of character.",
  },
  {
    id: "outcome",
    heading: "The outcome",
    copy: "Bistro Nido opens with a brand that reflects what it serves — market-fresh, carefully considered, and genuinely itself. The identity holds up across every touchpoint, from leather menu covers to matchbooks marked Pour l’ambiance, giving the restaurant a presence that feels earned rather than applied.",
  },
];

export const SUB3_EXPERIENCE: ProjectExperience = {
  slug: "sub-3",
  infoSections: SUB3_INFO.sections,
  movements: [
    mv("s301", "portrait", jpg("/projects/sub3/68db9133176e7f02015d4f37_TCCWEB-SUB326.jpg", 1200, 1500), "idea", { align: "start" }),
    mv(
      "s302",
      "film",
      film(
        "/projects/sub3/web/SUB3-Type-Stretch-Texture.mp4",
        1440,
        874,
        "/projects/sub3/web/SUB3-Type-Stretch-Texture.jpg",
        "contain",
        "/projects/sub3/web/SUB3-Type-Stretch-Texture.webm"
      ),
      "idea"
    ),
    mv("s303", "portrait", jpg("/projects/sub3/68db91322535abe236944c80_TCCWEB-SUB320.jpg", 1200, 1500), "idea"),
    mv("s304", "landscape", jpg("/projects/sub3/68db91587ee646ac94cfb67c_TCCWEBR2-SUB34.jpg", 2472, 1500), "shift"),
    mv("s305", "landscape", jpg("/projects/sub3/68db9158900d1a9e6ac94934_TCCWEBR2-SUB33.jpg", 2472, 1500), "shift"),
    mv("s306", "portrait", jpg("/projects/sub3/68db91351d50093ee5b0a02f_TCCWEB-SUB330.jpg", 1200, 1500), "shift", { align: "start" }),
    mv("s307", "portrait", jpg("/projects/sub3/68db91580180acf841f7384e_TCCWEBR2-SUB36.jpg", 1200, 1500), "system"),
    mv("s308", "landscape", jpg("/projects/sub3/68db912f0180acf841f72984_TCCWEB-SUB35.jpg", 2472, 1500), "system"),
    mv("s309", "portrait", jpg("/projects/sub3/68db91315cea177d71b89b3a_TCCWEB-SUB315.jpg", 1200, 1500), "system", { align: "end" }),
    mv(
      "s310",
      "film",
      film(
        "/projects/sub3/web/SUB3-SKUBAR-Type-Count.mp4",
        1152,
        1440,
        "/projects/sub3/web/SUB3-SKUBAR-Type-Count.jpg",
        "contain",
        "/projects/sub3/web/SUB3-SKUBAR-Type-Count.webm"
      ),
      "outcome",
      { span: "narrow" }
    ),
    mv(
      "s311",
      "film",
      film(
        "/projects/sub3/web/SUB3-PackGIF.mp4",
        1440,
        874,
        "/projects/sub3/web/SUB3-PackGIF.jpg",
        "contain",
        "/projects/sub3/web/SUB3-PackGIF.webm"
      ),
      "outcome"
    ),
    mv("s312", "portrait", jpg("/projects/sub3/69d625ecd5d798ae10301e45_SUB3-BG-1080x1350px.jpg", 1080, 1350), "outcome"),
  ],
};

export const KOJA_EXPERIENCE: ProjectExperience = {
  slug: "koja",
  infoSections: KOJA_INFO,
  movements: [
    mv("k01", "portrait", jpg("/projects/koja/670666ebdd4b35e158f69532_HBWxKOJA-Portfolio4.jpg", 1080, 1350), "idea", { align: "start" }),
    mv("k02", "film", film("/projects/koja/web/KOJA-Peanut-Fudge.mp4", 1080, 1080, "/projects/koja/web/KOJA-Peanut-Fudge.jpg", "contain", "/projects/koja/web/KOJA-Peanut-Fudge.webm"), "idea", { span: "contained" }),
    mv("k03", "film", film("/projects/koja/web/KOJA-Logo.mp4", 1920, 1080, "/projects/koja/web/KOJA-Logo.jpg"), "idea"),
    mv("k04", "portrait", webp("/projects/koja/68fb10b7f3a747a3e36c24a0_KOJA_May2023_60.webp", 1344, 2016), "shift", { align: "start" }),
    mv("k05", "film", film("/projects/koja/web/KOJA-BickieBites.mp4", 810, 1440, "/projects/koja/web/KOJA-BickieBites.jpg"), "system", { span: "narrow" }),
    mv("k06", "film", film("/projects/koja/web/KOJA-Oat-Bites.mp4", 1440, 810, "/projects/koja/web/KOJA-Oat-Bites.jpg"), "system"),
    mv("k07", "film", film("/projects/koja/web/KOJA-Oat-Bites-Dielines.mp4", 1440, 810, "/projects/koja/web/KOJA-Oat-Bites-Dielines.jpg", "contain", "/projects/koja/web/KOJA-Oat-Bites-Dielines.webm"), "system"),
    mv("k08", "portrait", jpg("/projects/koja/692697b8f9541bb2a997169b_HBWKOJA1125-Portfolio8.jpg", 4500, 5625), "outcome", { align: "end" }),
  ],
};

export const CLOSED_EXPERIENCE: ProjectExperience = {
  slug: "bar-closed",
  infoSections: CLOSED_INFO,
  movements: [
    mv("c01", "portrait", jpg("/projects/closed/670ca0219bf6bccf429b9e5b_HBWxCLOSED-Portfolio25.jpg", 1080, 1350), "idea", { align: "start" }),
    mv("c02", "portrait", jpg("/projects/closed/670ca02120d4b38fdbb6bf49_HBWxCLOSED-Portfolio26.jpg", 1080, 1350), "idea", { align: "end" }),
    mv("c03", "landscape", jpg("/projects/closed/670ca02123deffa7009a157f_HBWxCLOSED-Portfolio33.jpg", 1920, 1080), "idea"),
    mv("c04", "film", film("/projects/closed/web/CLOSED-Eyes.mp4", 1920, 1080, "/projects/closed/web/CLOSED-Eyes.jpg", "cover"), "shift", { kind: "full" }),
    mv("c05", "portrait", jpg("/projects/closed/670ca0217374160efd5b3ba4_HBWxCLOSED-Portfolio17.jpg", 1080, 1350), "shift", { align: "start" }),
    mv("c06", "landscape", jpg("/projects/closed/670ca0214458519e4d903743_HBWxCLOSED-Portfolio31.jpg", 1920, 1080), "system"),
    mv("c07", "portrait", jpg("/projects/closed/670ca0219b68e610dbf64663_HBWxCLOSED-Portfolio19.jpg", 1080, 1350), "system", { align: "end" }),
    mv("c08", "film", film("/projects/closed/web/CLOSED-Collage.mp4", 1440, 810, "/projects/closed/web/CLOSED-Collage.jpg"), "outcome"),
    mv("c09", "portrait", jpg("/projects/closed/670ca0214e0b67cd2aeafe2e_HBWxCLOSED-Portfolio35.jpg", 1080, 1350), "outcome", { align: "center" }),
  ],
};

export const OBR_EXPERIENCE: ProjectExperience = {
  slug: "our-boy-roy",
  infoSections: OBR_INFO,
  movements: [
    mv("o01", "portrait", jpg("/projects/our-boy-roy/666173bcb7178cfee98b71c0_HBWxOBR-Portfolio5.jpg", 1080, 1350), "idea", { align: "start" }),
    mv("o02", "landscape", jpg("/global/681c2b687b9d95dbdf305106_HBWxOBR.jpg", 1920, 1080, "contain", []), "idea"),
    mv("o03", "portrait", jpg("/projects/our-boy-roy/66626aa420e92cdf8d975c8b_HBWxOBR-Portfolio3.jpg", 1080, 1350), "shift", { align: "end" }),
    mv("o04", "film", film("/projects/our-boy-roy/web/OBR-Colour-Change.mp4", 1440, 810, "/projects/our-boy-roy/web/OBR-Colour-Change.jpg"), "system"),
    mv("o05", "portrait", jpg("/projects/our-boy-roy/666173bcbf2a7a2babaeb1aa_HBWxOBR-Portfolio8.jpg", 1080, 1350), "system", { align: "start" }),
    mv("o06", "portrait", jpg("/projects/our-boy-roy/666175d7d04fcd0592a30a48_OBR-Instagram-Posts19.jpg", 1080, 1350), "outcome"),
    mv("o07", "film", film("/projects/our-boy-roy/web/OBR-Mortadella.mp4", 1080, 1350, "/projects/our-boy-roy/web/OBR-Mortadella.jpg"), "outcome", { align: "end", span: "narrow" }),
  ],
};

export const SISARICH_EXPERIENCE: ProjectExperience = {
  slug: "chris-sisarich",
  infoSections: SISARICH_INFO,
  movements: [
    mv("s01", "portrait", jpg("/projects/chris-sisarich/665d934ad04dcf11bb8bbc5b_HBWxChrisSisarich-Portfolio13.jpg", 1080, 1350), "idea", { align: "start" }),
    mv("s02", "film", film("/projects/chris-sisarich/web/HBWCSHOME-Website.mp4", 1440, 814, "/projects/chris-sisarich/web/HBWCSHOME-Website.jpg", "cover"), "idea", { kind: "full" }),
    mv("s03", "portrait", jpg("/projects/chris-sisarich/6663143cb87a78fa3d4c90be_HBWxChrisSisarich-uPortfolio5.jpg", 1080, 1350), "shift"),
    mv("s04", "landscape", jpg("/projects/chris-sisarich/665d934b1652bff63884d5f9_HBWxChrisSisarich-Portfolio18.jpg", 1920, 1080), "shift"),
    mv("s05", "graphic", jpg("/global/666313d5a9df92c312c71e3f_CS-Layout-DD.12.jpg", 595, 842), "system", { span: "contained" }),
    mv("s06", "film", film("/projects/chris-sisarich/web/CS-System.mp4", 1080, 1350, "/projects/chris-sisarich/web/CS-System.jpg"), "system", { align: "end" }),
    mv("s07", "landscape", jpg("/projects/chris-sisarich/665d93483f1d5500f3892332_HBWxChrisSisarich-Portfolio8.jpg", 1920, 1080), "system"),
    mv("s08", "film", film("/projects/chris-sisarich/web/HBWCSIMAGES-Website.mp4", 1440, 814, "/projects/chris-sisarich/web/HBWCSIMAGES-Website.jpg", "cover"), "outcome", { kind: "full" }),
  ],
};

export const NIDO_EXPERIENCE: ProjectExperience = {
  slug: "bistro-nido",
  infoSections: NIDO_INFO,
  movements: [
    mv("n01", "portrait", jpg("/projects/bistro-nido/68db910da232382c5cf8fa9d_TCCWEB-Portfolio-Bistro-Nido15.jpg", 1200, 1500), "idea", { align: "start" }),
    mv("n02", "portrait", jpg("/projects/bistro-nido/69279761ce22a0101c5674cb_TCCxBistro-Nido-Post-4.jpg", 1080, 1350), "idea"),
    mv("n03", "landscape", jpg("/projects/bistro-nido/68db910bfed5a6b2fa5dbf20_TCCWEB-Portfolio-Bistro-Nido2.jpg", 2472, 1500), "shift"),
    mv("n04", "portrait", jpg("/projects/bistro-nido/68db910c9c15c39d7ed77086_TCCWEB-Portfolio-Bistro-Nido13.jpg", 1200, 1500), "system", { align: "end" }),
    mv("n05", "portrait", jpg("/projects/bistro-nido/68db910c73582ae75e5e1e51_TCCWEB-Portfolio-Bistro-Nido11.jpg", 1200, 1500), "system"),
    mv("n06", "portrait", jpg("/projects/bistro-nido/6927976081c3e83e6be8afb3_TCCxBistro-Nido-Post-8.jpg", 1080, 1350), "outcome"),
  ],
};

export const PROJECT_EXPERIENCES: Record<string, ProjectExperience> = {
  "sub-3": SUB3_EXPERIENCE,
  koja: KOJA_EXPERIENCE,
  "bar-closed": CLOSED_EXPERIENCE,
  "our-boy-roy": OBR_EXPERIENCE,
  "chris-sisarich": SISARICH_EXPERIENCE,
  "bistro-nido": NIDO_EXPERIENCE,
};

export function getExperience(slug: string) {
  return PROJECT_EXPERIENCES[slug] ?? null;
}

/** Short Idea copy shared by Index accordion and Visual +. */
export function projectIdeaCopy(slug: string) {
  return getExperience(slug)?.infoSections.find((section) => section.id === "idea")?.copy?.trim() || "";
}
