import {
  infoSectionPlainCopy,
  stringToRichText,
  type ExperienceAuthorship,
  type InfoSection,
  type Movement,
  type ProjectExperience,
  type ProjectMedia,
} from "@/components/home/projects/types";
import { srcSetFor } from "@/components/home/catalog";
import { CHRIS_COPY } from "@/sanity/scripts/chris-content";
import { CLOSED_COPY } from "@/sanity/scripts/closed-content";
import { KOJA_COPY } from "@/sanity/scripts/koja-content";
import { OBR_COPY } from "@/sanity/scripts/obr-content";
import { SCK_COPY } from "@/sanity/scripts/sck-content";
import { SUB3_COPY } from "@/sanity/scripts/sub3-content";

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
    type: "image",
    src,
    srcSet: widths.length === 0 ? undefined : srcSetFor(src, widths, width),
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

function png(src: string, width: number, height: number): ProjectMedia {
  return {
    type: "image",
    src,
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
  extra?: Partial<Omit<Movement, "media">> & { alt?: string }
): Movement {
  const { alt, ...rest } = extra ?? {};
  return { id, kind, media: alt ? { ...media, alt } : media, infoHint, ...rest };
}

type CaseStudyCopy = {
  context: string;
  roles: readonly string[];
  workingContext?: string;
  collaborators?: ExperienceAuthorship["collaborators"];
  idea: { heading: string; body: string };
  shift: { heading: string; body: string };
  system: { heading: string; body: string };
};

function section(id: InfoSection["id"], block: { heading: string; body: string }): InfoSection {
  return {
    id,
    heading: block.heading,
    copy: block.body,
    body: stringToRichText(block.body),
  };
}

function infoFromCopy(copy: CaseStudyCopy): InfoSection[] {
  return [section("idea", copy.idea), section("shift", copy.shift), section("system", copy.system)];
}

function authorshipFromCopy(copy: CaseStudyCopy): ExperienceAuthorship {
  return {
    roles: [...copy.roles],
    ...(copy.workingContext ? { workingContext: copy.workingContext } : {}),
    ...(copy.collaborators?.length ? { collaborators: copy.collaborators } : {}),
  };
}

const NIDO_INFO: InfoSection[] = [
  {
    id: "idea",
    heading: "The idea",
    copy: "Bistro Nido is built on a simple, honest premise: cuisine du marché — cooking from the market. A 40-seat modern bistro at 501 George Street, Sydney, it draws from French bistro tradition while weaving in Japanese technique and ingredients throughout. The concept is called Twice Cooked — a culinary approach to everything, including the design. Two cultures, two influences, one place worth returning to.",
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
  infoSections: infoFromCopy(SUB3_COPY),
  context: SUB3_COPY.context,
  authorship: authorshipFromCopy(SUB3_COPY),
  movements: [
    mv("s301", "portrait", jpg("/projects/sub-3/68db9133176e7f02015d4f37_TCCWEB-SUB326.jpg", 1200, 1500), "idea", {
      scale: "standard",
      alt: "Runner in a black SUB:3 shirt checking a watch on a weathered concrete path.",
    }),
    mv(
      "s302",
      "film",
      film(
        "/projects/sub-3/web/SUB3-Type-Stretch-Texture.mp4",
        1440,
        874,
        "/projects/sub-3/web/SUB3-Type-Stretch-Texture.jpg",
        "contain",
        "/projects/sub-3/web/SUB3-Type-Stretch-Texture.webm"
      ),
      "idea",
      { scale: "detail", alt: "Angular SUB:3 lettering stretching and compressing on black." }
    ),
    mv("s303", "portrait", jpg("/projects/sub-3/68db91322535abe236944c80_TCCWEB-SUB320.jpg", 1200, 1500), "idea", {
      scale: "major",
      pace: "pause",
      alt: "Glowing POST-RUN pouch held against a grainy magenta field.",
    }),
    mv("s304", "landscape", jpg("/projects/sub-3/68db91587ee646ac94cfb67c_TCCWEBR2-SUB34.jpg", 2472, 1500), "shift", {
      scale: "detail",
      pace: "normal",
      relation: "pair",
      alt: "RUN lettering stretched and compressed in dark grey on white, some inverted.",
    }),
    mv("s307", "portrait", jpg("/projects/sub-3/68db91580180acf841f7384e_TCCWEBR2-SUB36.jpg", 1200, 1500), "shift", {
      scale: "detail",
      alt: "02:59:99 SUB:3 (RUNNERS CLUB) lockup with a JOIN THE SRC button, stacked twice.",
    }),
    mv("s305", "landscape", jpg("/projects/sub-3/68db9158900d1a9e6ac94934_TCCWEBR2-SUB33.jpg", 2472, 1500), "system", {
      scale: "standard",
      pace: "pause",
      alt: "City list from Sydney to London beside a sunset runner card.",
    }),
    mv("s306", "portrait", jpg("/projects/sub-3/68db91351d50093ee5b0a02f_TCCWEB-SUB330.jpg", 1200, 1500), "system", {
      scale: "standard",
      pace: "normal",
      relation: "pair",
      alt: "PRE-RUN pouch on asphalt among a tattooed leg, gloved hand, and running shoe.",
    }),
    mv("s309", "portrait", jpg("/projects/sub-3/68db91315cea177d71b89b3a_TCCWEB-SUB315.jpg", 1200, 1500), "system", {
      scale: "standard",
      alt: "PRE-RUN pouch smeared by vertical motion on white.",
    }),
    mv("s308", "landscape", jpg("/projects/sub-3/68db912f0180acf841f72984_TCCWEB-SUB35.jpg", 2472, 1500), "system", {
      scale: "major",
      pace: "pause",
      alt: "Person standing still while motion-blurred runners streak past, crossed by a red type line.",
    }),
    mv(
      "s310",
      "film",
      film(
        "/projects/sub-3/web/SUB3-SKUBAR-Type-Count.mp4",
        1152,
        1440,
        "/projects/sub-3/web/SUB3-SKUBAR-Type-Count.jpg",
        "contain",
        "/projects/sub-3/web/SUB3-SKUBAR-Type-Count.webm"
      ),
      "outcome",
      { scale: "detail", pace: "normal", relation: "pair", alt: "Geometric elapsed-time numerals counting on a pale field." }
    ),
    mv(
      "s311",
      "film",
      film(
        "/projects/sub-3/web/SUB3-PackGIF.mp4",
        1440,
        874,
        "/projects/sub-3/web/SUB3-PackGIF.jpg",
        "contain",
        "/projects/sub-3/web/SUB3-PackGIF.webm"
      ),
      "outcome",
      { scale: "detail", alt: "POST-RUN pouch dieline turning through front, back, and gusset panels." }
    ),
    mv("s312", "portrait", jpg("/projects/sub-3/69d625ecd5d798ae10301e45_SUB3-BG-1080x1350px.jpg", 1080, 1350), "outcome", {
      scale: "standard",
      pace: "pause",
      alt: "Grainy dark radial spiral from a central void.",
    }),
  ],
};

export const KOJA_EXPERIENCE: ProjectExperience = {
  slug: "koja",
  infoSections: infoFromCopy(KOJA_COPY),
  context: KOJA_COPY.context,
  authorship: authorshipFromCopy(KOJA_COPY),
  movements: [
    mv("k01", "portrait", jpg("/projects/koja/670666ebdd4b35e158f69532_HBWxKOJA-Portfolio4.jpg", 1080, 1350), "idea", {
      scale: "standard",
      alt: "Bright green KOJA tape sealing stacked cardboard boxes.",
    }),
    mv(
      "k02",
      "film",
      film(
        "/projects/koja/web/KOJA-Peanut-Fudge.mp4",
        1080,
        1080,
        "/projects/koja/web/KOJA-Peanut-Fudge.jpg",
        "contain",
        "/projects/koja/web/KOJA-Peanut-Fudge.webm"
      ),
      "idea",
      { scale: "detail", alt: "Peanut Fudge plant-protein bar on a cork coaster beside palo santo." }
    ),
    mv("k03", "film", film("/projects/koja/web/KOJA-Logo.mp4", 1920, 1080, "/projects/koja/web/KOJA-Logo.jpg"), "idea", {
      scale: "major",
      pace: "pause",
      alt: "Off-white K letter moving on a green field.",
    }),
    mv("k04", "portrait", webp("/projects/koja/68fb10b7f3a747a3e36c24a0_KOJA_May2023_60.webp", 1344, 2016), "shift", {
      scale: "standard",
      alt: "Person carrying a KOJA carton across a brick patio.",
    }),
    mv("k05", "film", film("/projects/koja/web/KOJA-BickieBites.mp4", 810, 1440, "/projects/koja/web/KOJA-BickieBites.jpg"), "system", {
      scale: "standard",
      alt: "Choc Brownie Bickie Bites pouch against a grainy brownie-textured ground.",
    }),
    mv("k06", "film", film("/projects/koja/web/KOJA-Oat-Bites.mp4", 1440, 810, "/projects/koja/web/KOJA-Oat-Bites.jpg"), "system", {
      scale: "standard",
      alt: "Orange Oat Bites carton at an angle on a black-and-white textured ground.",
    }),
    mv(
      "k07",
      "film",
      film(
        "/projects/koja/web/KOJA-Oat-Bites-Dielines.mp4",
        1440,
        810,
        "/projects/koja/web/KOJA-Oat-Bites-Dielines.jpg",
        "contain",
        "/projects/koja/web/KOJA-Oat-Bites-Dielines.webm"
      ),
      "system",
      { scale: "detail", alt: "Raspberry Choc Chip Oat Bites carton unfolding through dieline panels." }
    ),
    mv("k08", "portrait", jpg("/projects/koja/692697b8f9541bb2a997169b_HBWKOJA1125-Portfolio8.jpg", 4500, 5625), "outcome", {
      scale: "standard",
      pace: "pause",
      alt: "Gluten Free, Australian Made, and Plant Based marks on green.",
    }),
  ],
};

export const CLOSED_EXPERIENCE: ProjectExperience = {
  slug: "bar-closed",
  infoSections: infoFromCopy(CLOSED_COPY),
  context: CLOSED_COPY.context,
  authorship: authorshipFromCopy(CLOSED_COPY),
  movements: [
    mv(
      "c01",
      "film",
      film(
        "/projects/bar-closed/web/HBWxCLOSED-Portfolio-01.mp4",
        1920,
        1080,
        "/projects/bar-closed/HBWxCLOSED-Portfolio-01.jpg",
        "contain",
        "/projects/bar-closed/web/HBWxCLOSED-Portfolio-01.webm"
      ),
      "idea",
      { scale: "standard", alt: "Torn-paper collage of happy-hour type, bottle silhouettes, a bar photo, and plated food." }
    ),
    mv("c02", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-02.jpg", 1920, 1080, "contain", []), "idea", {
      scale: "standard",
      alt: "CLOSED wordmark in black geometric sans-serif on white.",
    }),
    mv("c03", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-03.jpg", 1920, 1080, "contain", []), "idea", {
      scale: "major",
      pace: "pause",
      alt: "Dining table with CLOSED ware, steak, and seafood against a green booth.",
    }),
    mv("c04", "portrait", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-04.jpg", 864, 1080, "contain", []), "idea", {
      scale: "standard",
      relation: "pair",
      alt: "Orange type on brown reading CLOSED UNTIL WE'RE NOT.",
    }),
    mv("c05", "portrait", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-05.jpg", 864, 1080, "contain", []), "idea", {
      scale: "standard",
      alt: "Black jagged vertical forms on textured white with numbered CLOSED.BAR lettering.",
    }),
    mv("c06", "portrait", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-06.jpg", 864, 1080, "contain", []), "idea", {
      scale: "standard",
      alt: "CLOSED business cards on a plate of roasted potatoes.",
    }),
    mv("c07", "portrait", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-07.jpg", 864, 1080, "contain", []), "idea", {
      scale: "standard",
      alt: "Tomato print card in a clear pouch with an orange zip, reading CURATED FOOD MADE IN NEWCASTLE.",
    }),
    mv("c08", "portrait", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-08.jpg", 864, 1080, "contain", []), "shift", {
      scale: "detail",
      alt: "Hand holding a CLOSED wine glass over a scalloped CLOSED coaster.",
    }),
    mv("c09", "portrait", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-09.jpg", 864, 1080, "contain", []), "shift", {
      scale: "standard",
      alt: "Orange CLOSED alphabet specimen on brown with a 17 Beaumont Street stamp.",
    }),
    mv("c10", "portrait", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-010.jpg", 864, 1080, "contain", []), "shift", {
      scale: "standard",
      alt: "CLOSED menu card over a scallop shell on river stones.",
    }),
    mv("c11", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-011.jpg", 1920, 1080, "contain", []), "shift", {
      scale: "standard",
      alt: "Two plates of tomato toast, one under jagged black stripes and one under a faint CLOSED sheet.",
    }),
    mv("c12", "portrait", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-012.jpg", 864, 1080, "contain", []), "shift", {
      scale: "standard",
      alt: "Orange CLOSED lockup over a grainy vegetable still, reading Local, Friendly, & Consistent.",
    }),
    mv("c13", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-013.jpg", 1920, 1080, "contain", []), "system", {
      scale: "standard",
      alt: "Orange-and-brown halftone of tomatoes on the vine.",
    }),
    mv("c14", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-014.jpg", 1920, 1080, "contain", []), "system", {
      scale: "standard",
      alt: "Technical drawing of a wall-mounted TOILETS sign with dimensions.",
    }),
    mv("c15", "portrait", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-015.jpg", 864, 1080, "contain", []), "system", {
      scale: "standard",
      alt: "Dim dining alcove with spherical sconces and a TOILETS sign over the doorway.",
    }),
    mv("c16", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-017.jpg", 1920, 1080, "contain", []), "system", {
      scale: "standard",
      alt: "Four people in plum CLOSED T-shirts against a red wall.",
    }),
    mv("c17", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-018.jpg", 1920, 1080, "contain", []), "system", {
      scale: "standard",
      alt: "Two guests toasting at a small table in front of a red-and-black mural.",
    }),
    mv("c18", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-019.jpg", 1920, 1080, "contain", []), "outcome", {
      scale: "standard",
      alt: "Street billboard under a railway bridge with torn CLOSED panels of flowers, address, food, and tomatoes.",
    }),
    mv("c19", "portrait", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-020.jpg", 864, 1080, "contain", []), "outcome", {
      scale: "standard",
      alt: "Dining table with CLOSED ware and wine against a green booth and patterned wallpaper.",
    }),
    mv(
      "c20",
      "film",
      film(
        "/projects/bar-closed/web/HBWxCLOSED-Portfolio-021.mp4",
        1920,
        1080,
        "/projects/bar-closed/HBWxCLOSED-Portfolio-021.jpg",
        "contain",
        "/projects/bar-closed/web/HBWxCLOSED-Portfolio-021.webm"
      ),
      "outcome",
      {
        scale: "standard",
        pace: "normal",
        alt: "Three CLOSED_BAR Instagram stories: a branded wine glass, white eyes, and a cocktail collage.",
      }
    ),
    mv("c21", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-022.jpg", 1920, 1080, "contain", []), "outcome", {
      scale: "standard",
      alt: "Guest smiling over CLOSED plates and wine in a green booth.",
    }),
    mv("c22", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-023.jpg", 1920, 1080, "contain", []), "outcome", {
      scale: "standard",
      pace: "pause",
      alt: "Wheat-pasted Saturday posters and a central eyes sheet on a plywood hoarding.",
    }),
  ],
};

export const OBR_EXPERIENCE: ProjectExperience = {
  slug: "our-boy-roy",
  infoSections: infoFromCopy(OBR_COPY),
  context: OBR_COPY.context,
  authorship: authorshipFromCopy(OBR_COPY),
  movements: [
    mv("o01", "portrait", jpg("/projects/our-boy-roy/666173bcb7178cfee98b71c0_HBWxOBR-Portfolio5.jpg", 1080, 1350), "idea", {
      scale: "standard",
      alt: "OUR BOY ROY lettering on a lavender espresso machine, shadowed onto timber panelling.",
    }),
    mv("o02", "landscape", jpg("/global/681c2b687b9d95dbdf305106_HBWxOBR.jpg", 1920, 1080, "contain", []), "idea", {
      scale: "major",
      pace: "pause",
      alt: "White brick shopfront with lilac doors, pink diamond tiling, and window lettering.",
    }),
    mv("o03", "portrait", jpg("/projects/our-boy-roy/66626aa420e92cdf8d975c8b_HBWxOBR-Portfolio3.jpg", 1080, 1350), "shift", {
      scale: "standard",
      alt: "Cube lightbox with stacked OUR BOY ROY type hanging under a verandah.",
    }),
    mv("o04", "film", film("/projects/our-boy-roy/web/OBR-Colour-Change.mp4", 1440, 810, "/projects/our-boy-roy/web/OBR-Colour-Change.jpg"), "shift", {
      scale: "standard",
      alt: "Line-drawn figure in checkered pants holding a bottle as the ground colour shifts.",
    }),
    mv("o05", "portrait", jpg("/projects/our-boy-roy/666173bcbf2a7a2babaeb1aa_HBWxOBR-Portfolio8.jpg", 1080, 1350), "system", {
      scale: "standard",
      alt: "Back of a white shirt with stacked light-blue OUR BOY ROY lettering.",
    }),
    mv("o06", "portrait", jpg("/projects/our-boy-roy/666175d7d04fcd0592a30a48_OBR-Instagram-Posts19.jpg", 1080, 1350), "outcome", {
      scale: "detail",
      alt: "Line-drawn chef behind a pan reading Chef Needed on pink.",
    }),
    mv("o07", "film", film("/projects/our-boy-roy/web/OBR-Mortadella.mp4", 1080, 1350, "/projects/our-boy-roy/web/OBR-Mortadella.jpg"), "outcome", {
      scale: "standard",
      pace: "pause",
      alt: "Mortadella slice with cartoon hands on lavender, framed by MORTADELLA MADNESS type.",
    }),
  ],
};

export const SISARICH_EXPERIENCE: ProjectExperience = {
  slug: "chris-sisarich",
  infoSections: infoFromCopy(CHRIS_COPY),
  context: CHRIS_COPY.context,
  authorship: authorshipFromCopy(CHRIS_COPY),
  movements: [
    mv("s01", "portrait", jpg("/projects/chris-sisarich/665d934ad04dcf11bb8bbc5b_HBWxChrisSisarich-Portfolio13.jpg", 1080, 1350), "idea", {
      scale: "standard",
      alt: "Framed poster on concrete with the name over a small landscape still and a vehicle on rock.",
    }),
    mv(
      "s02",
      "film",
      film(
        "/projects/chris-sisarich/web/HBWCSHOME-Website.mp4",
        1440,
        814,
        "/projects/chris-sisarich/web/HBWCSHOME-Website.jpg",
        "cover"
      ),
      "idea",
      { scale: "standard", alt: "Homepage with the name over scattered photography thumbnails as they rearrange." }
    ),
    mv("s03", "portrait", jpg("/projects/chris-sisarich/6663143cb87a78fa3d4c90be_HBWxChrisSisarich-uPortfolio5.jpg", 1080, 1350), "shift", {
      scale: "major",
      pace: "pause",
      alt: "Two faces stacked in a gap of damask fabric, one in sunglasses, one smiling.",
    }),
    mv("s04", "landscape", jpg("/projects/chris-sisarich/665d934b1652bff63884d5f9_HBWxChrisSisarich-Portfolio18.jpg", 1920, 1080), "shift", {
      scale: "standard",
      alt: "Aerial performers on silks against a striped wall, with small colour car stills inset.",
    }),
    mv("s05", "graphic", jpg("/global/666313d5a9df92c312c71e3f_CS-Layout-DD.12.jpg", 595, 842), "system", {
      scale: "standard",
      pace: "normal",
      relation: "pair",
      alt: "Low-angle of a person in a white tank, arm casting a shadow, under a type header.",
    }),
    mv("s06", "film", film("/projects/chris-sisarich/web/CS-System.mp4", 1080, 1350, "/projects/chris-sisarich/web/CS-System.jpg"), "system", {
      scale: "standard",
      alt: "Name, blurred embrace, and agency columns assembling as a system layout.",
    }),
    mv("s07", "landscape", jpg("/projects/chris-sisarich/665d93483f1d5500f3892332_HBWxChrisSisarich-Portfolio8.jpg", 1920, 1080), "system", {
      scale: "standard",
      alt: "Three-panel sequence of a runner, sharp in the centre and motion-blurred at the sides.",
    }),
    mv(
      "s08",
      "film",
      film(
        "/projects/chris-sisarich/web/HBWCSIMAGES-Website.mp4",
        1440,
        814,
        "/projects/chris-sisarich/web/HBWCSIMAGES-Website.jpg",
        "cover"
      ),
      "outcome",
      { scale: "standard", pace: "pause", alt: "Photography grid of cars and people as the site filters through categories." }
    ),
  ],
};

export const NIDO_EXPERIENCE: ProjectExperience = {
  slug: "bistro-nido",
  infoSections: NIDO_INFO,
  movements: [
    mv("n01", "portrait", jpg("/projects/bistro-nido/68db910da232382c5cf8fa9d_TCCWEB-Portfolio-Bistro-Nido15.jpg", 1200, 1500), "idea", {
      scale: "standard",
      relation: "pair",
      alt: "Hand touching a scallop in its shell on salt in a branded bowl.",
    }),
    mv("n02", "portrait", jpg("/projects/bistro-nido/69279761ce22a0101c5674cb_TCCxBistro-Nido-Post-4.jpg", 1080, 1350), "idea", {
      scale: "standard",
      alt: "Branded plate of chocolate tartlets in front of a roasted bird and cocktail.",
    }),
    mv("n03", "landscape", jpg("/projects/bistro-nido/68db910bfed5a6b2fa5dbf20_TCCWEB-Portfolio-Bistro-Nido2.jpg", 2472, 1500), "shift", {
      scale: "major",
      pace: "pause",
      alt: "BĪSTRO NĪDO lettering on yellow above line drawings of diners and beret-wearing dogs.",
    }),
    mv("n04", "portrait", jpg("/projects/bistro-nido/68db910c9c15c39d7ed77086_TCCWEB-Portfolio-Bistro-Nido13.jpg", 1200, 1500), "system", {
      scale: "standard",
      alt: "Rolled crêpe with glazed orange segments on an ornate oval plate.",
    }),
    mv("n05", "portrait", jpg("/projects/bistro-nido/68db910c73582ae75e5e1e51_TCCWEB-Portfolio-Bistro-Nido11.jpg", 1200, 1500), "system", {
      scale: "standard",
      alt: "BISTRO NIDO on mustard yellow with three figures toasting, including a beret-wearing dog.",
    }),
    mv("n06", "portrait", jpg("/projects/bistro-nido/6927976081c3e83e6be8afb3_TCCxBistro-Nido-Post-8.jpg", 1080, 1350), "outcome", {
      scale: "detail",
      pace: "pause",
      alt: "BĪSTRO NĪDO printed on a folded white napkin against black.",
    }),
  ],
};

export const SCK_EXPERIENCE: ProjectExperience = {
  slug: "sck",
  infoSections: infoFromCopy(SCK_COPY),
  context: SCK_COPY.context,
  authorship: authorshipFromCopy(SCK_COPY),
  movements: [
    mv("sk01", "portrait", jpg("/projects/sck/1.jpg", 1080, 1350, "contain", []), "idea", {
      scale: "major",
      pace: "normal",
      alt: "Two people in a sunlit studio beside a large figurative painting in a red frame.",
    }),
    mv("sk02", "landscape", jpg("/projects/sck/2.jpg", 1920, 1080, "contain", []), "idea", {
      scale: "detail",
      alt: "S.C.K in charcoal type with inward crosshair lines on a pale ground.",
    }),
    mv("sk03", "portrait", jpg("/projects/sck/3.jpg", 1080, 1350, "contain", []), "idea", {
      scale: "standard",
      alt: "Practice description along the top and STUDIO CARSON KELLY along the bottom on pale green-grey.",
    }),
    mv("sk04", "film", film("/projects/sck/web/4.mp4", 2000, 2500, "/projects/sck/web/4.jpg"), "idea", {
      scale: "standard",
      span: "narrow",
      alt: "Horizontal dash clusters forming shifting blocky letterforms on a cream grid.",
    }),
    mv("sk05", "portrait", jpg("/projects/sck/5.jpg", 1080, 1350, "contain", []), "idea", {
      scale: "standard",
      alt: "S.C.K and a crosshair over an interior looking out to a timber deck and forest.",
    }),
    mv("sk06", "film", film("/projects/sck/web/6.mp4", 1000, 1250, "/projects/sck/web/6.jpg"), "shift", {
      scale: "standard",
      span: "narrow",
      alt: "White corrugated house and timber deck with a lounge chair against dense forest.",
    }),
    mv("sk07", "portrait", jpg("/projects/sck/7.jpg", 1080, 1350, "contain", []), "shift", {
      scale: "detail",
      alt: "Four STUDIO CARSON KELLY lockups with dotted guidelines and beige spacing blocks.",
    }),
    mv("sk08", "portrait", jpg("/projects/sck/8.jpg", 1080, 1350, "contain", []), "shift", {
      scale: "standard",
      alt: "Cast cubic speaker with a deep conical horn on a solid pedestal.",
    }),
    mv("sk09", "film", film("/projects/sck/web/9.mp4", 2000, 2500, "/projects/sck/web/9.jpg"), "shift", {
      scale: "standard",
      span: "narrow",
      alt: "White S.C.K type on charcoal above a cream band, with faint vertical layout guides.",
    }),
    mv("sk10", "portrait", jpg("/projects/sck/10.jpg", 1080, 1350, "contain", []), "shift", {
      scale: "standard",
      alt: "S.C.K and a crosshair over corrugated metal cladding and gum trees.",
    }),
    mv("sk11", "portrait", jpg("/projects/sck/11.jpg", 1080, 1350, "contain", []), "system", {
      scale: "standard",
      alt: "Translucent amber glass coffee table with three curved legs and a notched top.",
    }),
    mv("sk12", "portrait", jpg("/projects/sck/12.jpg", 1080, 1350, "contain", []), "system", {
      scale: "detail",
      alt: "STUDIO, CARSON, and KELLY stacked and repeating in black sans-serif on white.",
    }),
    mv("sk13", "portrait", jpg("/projects/sck/13.jpg", 1080, 1350, "contain", []), "system", {
      scale: "standard",
      pace: "pause",
      alt: "Ribbed spherical pendant on a floor-to-ceiling pole in a beige room with dried grass.",
    }),
    mv("sk14", "portrait", png("/projects/sck/14.png", 1704, 2250), "system", {
      scale: "standard",
      alt: "Nine cells of dashed-line numerals on a pale lime ground.",
    }),
    mv("sk15", "film", film("/projects/sck/web/15.mp4", 2000, 2500, "/projects/sck/web/15.jpg"), "system", {
      scale: "standard",
      span: "narrow",
      alt: "Lit petal-form pendant with dark bead fasteners against a dark wall.",
    }),
    mv("sk16", "film", film("/projects/sck/web/16.mp4", 1000, 1250, "/projects/sck/web/16.jpg"), "outcome", {
      scale: "standard",
      span: "narrow",
      alt: "Horizontal bands of forest, deck, and cladding photographs interleaved with labelled beige slots.",
    }),
    mv("sk18", "film", film("/projects/sck/web/18.mp4", 2000, 2500, "/projects/sck/web/18.jpg"), "outcome", {
      scale: "standard",
      span: "narrow",
      alt: "Faint paneled-wall schematic of staggered rectangles with dimension numbers.",
    }),
    mv("sk19", "film", film("/projects/sck/web/19.mp4", 1000, 1250, "/projects/sck/web/19.jpg"), "outcome", {
      scale: "standard",
      span: "narrow",
      alt: "Timber kitchen looking through glass to a deck and forest, overlaid with dashed diagonal shapes.",
    }),
    mv("sk20", "portrait", png("/projects/sck/20.png", 1704, 2250), "outcome", {
      scale: "standard",
      alt: "Nine-cell grid of dotted abstract forms on a pale beige ground.",
    }),
    mv("sk22", "film", film("/projects/sck/web/22.mp4", 1080, 1440, "/projects/sck/web/22.jpg"), "outcome", {
      scale: "standard",
      span: "narrow",
      alt: "Dark interface assembling horizontal strata of photographs and dashed graphic bands.",
    }),
    mv("sk23", "film", film("/projects/sck/web/23.mp4", 1000, 1250, "/projects/sck/web/23.jpg"), "outcome", {
      scale: "standard",
      span: "narrow",
      pace: "pause",
      alt: "Dog on a timber deck facing forest, with STUDIO CARSON KELLY over a dashed grid.",
    }),
  ],
};

export const PROJECT_EXPERIENCES: Record<string, ProjectExperience> = {
  "sub-3": SUB3_EXPERIENCE,
  koja: KOJA_EXPERIENCE,
  "bar-closed": CLOSED_EXPERIENCE,
  "our-boy-roy": OBR_EXPERIENCE,
  "chris-sisarich": SISARICH_EXPERIENCE,
  "bistro-nido": NIDO_EXPERIENCE,
  sck: SCK_EXPERIENCE,
};

export function getExperience(slug: string) {
  return PROJECT_EXPERIENCES[slug] ?? null;
}

/** Short Idea copy shared by Index accordion and Visual +. */
export function projectIdeaCopy(slug: string) {
  const section = getExperience(slug)?.infoSections.find((item) => item.id === "idea");
  return section ? infoSectionPlainCopy(section) : "";
}
