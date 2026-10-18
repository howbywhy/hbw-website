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
import { MBM_COPY } from "@/sanity/scripts/mbm-content";
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
    mv("s301", "portrait", jpg("/projects/sub-3/1.jpg", 1600, 2000, "contain", []), "idea", {
      scale: "major",
      pace: "pause",
      alt: "A runner in a black SUB:3 tee on a worn road, checking the watch on their wrist.",
    }),
    mv("s302", "film", film("/projects/sub-3/web/2.mp4", 1600, 970, "/projects/sub-3/web/2.jpg"), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "SUB:3 ® RUNNING resolving in white type on black.",
    }),
    mv("s303", "portrait", jpg("/projects/sub-3/3.jpg", 1080, 1350, "contain", []), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "A PRE-RUN pouch reading 00:00:00 SUB:3, lit against a pink and white gradient.",
    }),
    mv("s304", "film", film("/projects/sub-3/web/4.mp4", 1200, 1500, "/projects/sub-3/web/4.jpg"), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "A timecode counting across the frame at 01:33:14, over SUB:3 ® RUN TECH.",
    }),
    mv("s305", "portrait", jpg("/projects/sub-3/5.jpg", 1080, 1350, "contain", []), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "A POST-RUN pouch reading 02:59:59 SUB:3, lit against a pink and white gradient.",
    }),
    mv("s306", "landscape", jpg("/projects/sub-3/6.jpg", 1800, 1202, "contain", []), "shift", {
      scale: "major",
      pace: "pause",
      alt: "A runner crossing a causeway at dusk, water and sky washed magenta.",
    }),
    mv("s307", "film", film("/projects/sub-3/web/7.mp4", 1600, 900, "/projects/sub-3/web/7.jpg"), "shift", {
      scale: "detail",
      pace: "normal",
      alt: "The typeface stepping through its alphabet in white on black.",
    }),
    mv("s308", "portrait", jpg("/projects/sub-3/8.jpg", 1202, 1800, "contain", []), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "A hand holding the POST-RUN pouch up against a pink and violet sky.",
    }),
    mv("s309", "portrait", jpg("/projects/sub-3/9.jpg", 1080, 1350, "contain", []), "shift", {
      scale: "detail",
      pace: "tight",
      alt: "High-contrast black and white: a hand gripping the pouch against a flaring sun.",
    }),
    mv("s310", "landscape", jpg("/projects/sub-3/10.jpg", 2000, 1126, "contain", []), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "Two specification cards — PRE-RUN. RITUAL. SIMPLIFIED. and POST-RUN. RECOVER. REPEAT. — listing sodium, caffeine, whey isolate and electrolytes.",
    }),
    mv("s311", "film", film("/projects/sub-3/web/11.mp4", 1080, 1920, "/projects/sub-3/web/11.jpg"), "shift", {
      scale: "standard",
      pace: "normal",
      span: "narrow",
      alt: "NIGHT RUN — a runner alone on a floodlit track after dark.",
    }),
    mv("s312", "landscape", jpg("/projects/sub-3/12.jpg", 1920, 1080, "contain", []), "shift", {
      scale: "detail",
      pace: "normal",
      alt: "RUN set four times across a cream field, the word stretching and reversing.",
    }),
    mv("s313", "portrait", png("/projects/sub-3/13.png", 1080, 1440), "system", {
      scale: "detail",
      pace: "tight",
      alt: "A dense grid of SUB:3 lock-ups repeating across the frame.",
    }),
    mv("s314", "landscape", jpg("/projects/sub-3/14.jpg", 1800, 1202, "contain", []), "system", {
      scale: "standard",
      pace: "normal",
      alt: "Two hands passing a glowing pouch between them under blue and violet light.",
    }),
    mv("s315", "film", film("/projects/sub-3/web/15.mp4", 1080, 1920, "/projects/sub-3/web/15.jpg"), "system", {
      scale: "standard",
      pace: "normal",
      span: "narrow",
      alt: "BENDING TIME & repeating down the frame, the type tearing and reforming.",
    }),
    mv("s316", "landscape", jpg("/projects/sub-3/16.jpg", 1800, 1202, "contain", []), "system", {
      scale: "major",
      pace: "pause",
      alt: "A runner's legs mid-stride on an open road, the landscape cool and blue behind.",
    }),
    mv("s317", "portrait", jpg("/projects/sub-3/17.jpg", 1600, 2000, "contain", []), "system", {
      scale: "standard",
      pace: "normal",
      alt: "A PRE-RUN pouch suspended in darkness, catching a hard flare of light.",
    }),
    mv("s318", "landscape", jpg("/projects/sub-3/18.jpg", 1920, 1080, "contain", []), "system", {
      scale: "standard",
      pace: "normal",
      alt: "(SRC) : SYDNEY, CHICAGO, NEW YORK, LONDON ranged beside a small monochrome horizon.",
    }),
    mv("s319", "portrait", png("/projects/sub-3/19.png", 1080, 1440), "system", {
      scale: "major",
      pace: "pause",
      alt: "Heavy black-and-white grain over a figure, with SUB:3 ® RUNNING across the frame.",
    }),
    /*
     * The social cuts: the system running as motion rather than as layout.
     *
     * Four pieces made for the feed, which is where most of this identity is
     * actually seen — the countdown card, the clock, the instruction and the
     * ritual. They sit in the system because that is what they are evidence
     * of: the same face, the same stretch, the same two statements of a
     * thing, moving.
     */
    mv("s320", "film", film("/projects/sub-3/web/20.mp4", 1080, 1920, "/projects/sub-3/web/20.jpg"), "system", {
      scale: "standard",
      pace: "normal",
      span: "narrow",
      alt: "A countdown card: 23 DAYS TO GO above CITY2SURF and GOAL 01:40:59, the numerals stretching tall and snapping back.",
    }),
    mv("s321", "film", film("/projects/sub-3/web/21.mp4", 1080, 1080, "/projects/sub-3/web/21.jpg"), "system", {
      scale: "standard",
      pace: "normal",
      alt: "OUTPACE REALITY over a clock running up from 00:00:35 to 02:56:46 — a marathon finishing under three hours.",
    }),
    mv("s322", "film", film("/projects/sub-3/web/22.mp4", 1080, 1080, "/projects/sub-3/web/22.jpg"), "system", {
      scale: "standard",
      pace: "normal",
      alt: "2 SCOOPS. 500ML COLD WATER. WITHIN 30 MIN. — the instruction assembling a line at a time, each phrase stretching as it lands.",
    }),
    mv("s323", "film", film("/projects/sub-3/web/23.mp4", 1080, 1350, "/projects/sub-3/web/23.jpg"), "system", {
      scale: "major",
      pace: "pause",
      alt: "A hand tipping a SUB:3 sachet into a flask in hard sunlight, with RITUAL, SIMPLIFIED. set tall across the frame.",
    }),
  ],
};

export const KOJA_EXPERIENCE: ProjectExperience = {
  slug: "koja",
  infoSections: infoFromCopy(KOJA_COPY),
  context: KOJA_COPY.context,
  authorship: authorshipFromCopy(KOJA_COPY),
  movements: [
    mv("k01", "film", film("/projects/koja/web/01-full-wide.mp4", 1920, 1080, "/projects/koja/web/01-full-wide.jpg"), "idea", {
      scale: "major",
      pace: "pause",
      alt: "The KOJA logotype assembling letter by letter, the ground changing colour behind it.",
    }),
    mv("k02", "film", film("/projects/koja/web/02-full-wide.mp4", 1920, 1080, "/projects/koja/web/02-full-wide.jpg"), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "KOJA bars turning one after another on a pale grey ground.",
    }),
    mv("k03", "film", film("/projects/koja/web/03-full-story.mp4", 1080, 1920, "/projects/koja/web/03-full-story.jpg"), "idea", {
      scale: "detail",
      pace: "normal",
      alt: "KOJA repeated down the frame in green, Keep it real. written across it.",
    }),
    mv("k04", "film", film("/projects/koja/web/04-full-square.mp4", 1350, 1350, "/projects/koja/web/04-full-square.jpg"), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "Letters of the KOJA alphabet filling the frame, the ground changing colour behind them.",
    }),
    mv("k05", "portrait", jpg("/projects/koja/web/05-Website.jpg", 1350, 2488), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "The shop page in full: Healthy Made Simple above three cartons, photography and the footer beneath.",
    }),
    mv("k06", "film", film("/projects/koja/web/06-full-tall.mp4", 1350, 1688, "/projects/koja/web/06-full-tall.jpg"), "idea", {
      scale: "detail",
      pace: "pause",
      alt: "A Plant Based leaf mark in off-white on green.",
    }),
    mv("k07", "portrait", jpg("/projects/koja/web/07-full-tall.jpg", 1350, 1688), "shift", {
      scale: "major",
      pace: "pause",
      alt: "A person carrying a KOJA carton along a brick path past a timber screen.",
    }),
    mv("k08", "film", film("/projects/koja/web/08-full-tall.mp4", 1350, 1688, "/projects/koja/web/08-full-tall.jpg"), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "MEET YOUR NEW LUNCHBOX HERO on yellow above a Lemon and Coconut Oat Bar.",
    }),
    mv("k09", "film", film("/projects/koja/web/09-full-tall.mp4", 1350, 1688, "/projects/koja/web/09-full-tall.jpg"), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "The back of a KOJA Oat Bar wrapper in Lemon and Coconut, panels and oat marks on pale yellow.",
    }),
    mv("k10", "film", film("/projects/koja/web/10-full-wide.mp4", 1920, 1080, "/projects/koja/web/10-full-wide.jpg"), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "Oat Bites cartons turning over a black-and-white halftone ground.",
    }),
    mv("k11", "film", film("/projects/koja/web/12-full-tall.mp4", 1350, 1688, "/projects/koja/web/12-full-tall.jpg"), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "A KOJA Oat Bites Muesli Slice carton on orange.",
    }),
    mv("k12", "film", film("/projects/koja/web/13-instagram-tall.mp4", 1350, 1688, "/projects/koja/web/13-instagram-tall.jpg"), "shift", {
      scale: "detail",
      pace: "normal",
      alt: "An Instagram story on a phone: MEET YOUR NEW LUNCHBOX HERO over a Muesli Slice Oat Bite on orange.",
    }),
    mv("k13", "portrait", jpg("/projects/koja/web/14-Website.jpg", 1350, 2064), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "The product listing page, six bars in a grid with frequently asked questions beneath.",
    }),
    mv("k14", "film", film("/projects/koja/web/15-full-tall.mp4", 1350, 1688, "/projects/koja/web/15-full-tall.jpg"), "system", {
      scale: "standard",
      pace: "normal",
      alt: "40% LESS SUGAR on deep brown above a Choc Brownie Bickie Bites pouch.",
    }),
    mv("k15", "film", film("/projects/koja/web/16-instagram-tall.mp4", 1350, 1688, "/projects/koja/web/16-instagram-tall.jpg"), "system", {
      scale: "detail",
      pace: "normal",
      alt: "An Instagram post on a phone: KOJA Oat Bites Muesli Slice, with slices scattered across orange and the pack claims beneath.",
    }),
    mv("k16", "film", film("/projects/koja/web/17-full-story.mp4", 1080, 1920, "/projects/koja/web/17-full-story.jpg"), "system", {
      scale: "detail",
      pace: "normal",
      alt: "TAKE YOUR PICK on blue above three Bickie Bites pouches.",
    }),
    mv("k17", "film", film("/projects/koja/web/18-full-story.mp4", 1080, 1920, "/projects/koja/web/18-full-story.jpg"), "system", {
      scale: "detail",
      pace: "pause",
      alt: "A customer talking to camera in a story, holding KOJA packs.",
    }),
    mv("k18", "film", film("/projects/koja/web/19-row-row.mp4", 1920, 1186, "/projects/koja/web/19-row-row.jpg"), "system", {
      scale: "standard",
      pace: "normal",
      alt: "A Bickie Bites pouch on soil beside a dietitian's note recommending KOJA to her clients.",
    }),
    mv("k19", "film", film("/projects/koja/web/20-full-tall.mp4", 1350, 1688, "/projects/koja/web/20-full-tall.jpg"), "system", {
      scale: "standard",
      pace: "normal",
      alt: "STOCK UP set large in off-white on green above PB Bars.",
    }),
    mv("k20", "film", film("/projects/koja/web/21-row-row.mp4", 1920, 1186, "/projects/koja/web/21-row-row.jpg"), "system", {
      scale: "standard",
      pace: "normal",
      alt: "The KOJA feed on a phone beside someone holding four packs over a table of stacked bars, captioned Now Available At Coles.",
    }),
    mv("k21", "film", film("/projects/koja/web/22-full-tall.mp4", 1350, 1688, "/projects/koja/web/22-full-tall.jpg"), "system", {
      scale: "major",
      pace: "pause",
      alt: "A KOJA Oat Bites poster lit in a street-side digital panel.",
    }),
    mv("k22", "film", film("/projects/koja/web/23-full-tall.mp4", 1350, 1688, "/projects/koja/web/23-full-tall.jpg"), "system", {
      scale: "major",
      pace: "pause",
      alt: "THANKS FOR THE SUPPORT on pale yellow, Keep it real. beneath and the addresses at the foot.",
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
    mv("c12", "portrait", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-012.jpg", 864, 1080, "contain", []), "shift", {
      scale: "standard",
      alt: "Orange CLOSED lockup over a grainy vegetable still, reading Local, Friendly, & Consistent.",
    }),
    mv("c13", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-013.jpg", 1920, 1080, "contain", []), "system", {
      scale: "standard",
      alt: "Orange-and-brown halftone of tomatoes on the vine.",
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
    mv("c18", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-019.jpg", 1920, 1080, "contain", []), "system", {
      scale: "standard",
      alt: "Street billboard under a railway bridge with torn CLOSED panels of flowers, address, food, and tomatoes.",
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
      "system",
      {
        scale: "standard",
        pace: "normal",
        alt: "Three CLOSED_BAR Instagram stories: a branded wine glass, white eyes, and a cocktail collage.",
      }
    ),
    mv("c21", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-022.jpg", 1920, 1080, "contain", []), "system", {
      scale: "standard",
      alt: "Guest smiling over CLOSED plates and wine in a green booth.",
    }),
    mv("c22", "landscape", jpg("/projects/bar-closed/HBWxCLOSED-Portfolio-023.jpg", 1920, 1080, "contain", []), "system", {
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
    mv("o01", "landscape", jpg("/projects/our-boy-roy/web/01-full-wide.jpg", 1920, 1080), "idea", {
      scale: "major",
      pace: "pause",
      alt: "A white brick shopfront with lilac doors and window lettering, seen from across the road.",
    }),
    mv("o02", "landscape", jpg("/projects/our-boy-roy/web/02-full-wide.jpg", 1920, 1080), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "A lavender espresso machine on a timber counter, the name shadowed onto the wall behind it.",
    }),
    mv("o03", "film", film("/projects/our-boy-roy/web/03-full-wide.mp4", 1920, 1080, "/projects/our-boy-roy/web/03-full-wide.jpg"), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "A line-drawn figure in checked trousers on pale yellow, the ground colour shifting behind.",
    }),
    mv("o04", "landscape", jpg("/projects/our-boy-roy/web/04-full-wide.jpg", 1920, 1080), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "The fit-out from the door: timber counter, black stools and shelves of produce.",
    }),
    mv("o05", "portrait", jpg("/projects/our-boy-roy/web/05-full-tall.jpg", 1350, 1688), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "Two rolls of branded tape, orange and blue, on lilac checkerboard paper.",
    }),
    mv("o06", "landscape", jpg("/projects/our-boy-roy/web/06-full-wide.jpg", 1920, 1080), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "Three menu cards on black — Schnittty, Viva La Roy and Benny, Roy — each above its sandwich.",
    }),
    mv("o07", "portrait", jpg("/projects/our-boy-roy/web/07-full-tall.jpg", 1334, 2000), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "A crumbed schnitzel roll on lilac-checked paper over a branded plate, a drinks menu and a smoothie beside it on white tile.",
    }),
    mv("o08", "portrait", jpg("/projects/our-boy-roy/web/08-full-tall.jpg", 1334, 2000), "system", {
      scale: "major",
      pace: "pause",
      alt: "The back of an off-white tee with OUR BOY ROY stacked in blue, worn against a painted brick wall.",
    }),
    mv("o09", "landscape", jpg("/projects/our-boy-roy/web/09-full-wide.jpg", 1920, 1080), "system", {
      scale: "standard",
      pace: "normal",
      alt: "The room along the counter, shelves of produce down one wall.",
    }),
    mv("o10", "portrait", jpg("/projects/our-boy-roy/web/10-full-tall.jpg", 1350, 1688), "system", {
      scale: "detail",
      pace: "normal",
      alt: "A paper carry bag and a taped box on white tile.",
    }),
    mv("o11", "landscape", jpg("/projects/our-boy-roy/web/11-full-wide.jpg", 1920, 1280), "system", {
      scale: "standard",
      pace: "pause",
      alt: "Three yellow takeaway cups on a steel counter against lilac, each carrying a letter of ROY held by a little drawn figure.",
    }),
    mv("o12", "portrait", jpg("/projects/our-boy-roy/web/12-full-tall.jpg", 1334, 2000), "system", {
      scale: "standard",
      pace: "normal",
      alt: "The dining room: pink chairs and a houndstooth banquette under striped wall lights, plates set out, a tiled booth through the opening behind.",
    }),
    mv("o13", "landscape", jpg("/projects/our-boy-roy/web/13-full-wide.jpg", 1920, 1080), "system", {
      scale: "standard",
      pace: "normal",
      alt: "Three posters on black: Chef Needed, MORNING repeated in orange, and the opening hours.",
    }),
    mv("o14", "film", film("/projects/our-boy-roy/web/14-tiktok-tall.mp4", 1350, 1688, "/projects/our-boy-roy/web/14-tiktok-tall.jpg"), "system", {
      scale: "detail",
      pace: "pause",
      alt: "MORTADELLA MADNESS on a phone, a mortadella roll above a promise of a new sando each week.",
    }),
    mv("o15", "landscape", jpg("/projects/our-boy-roy/web/15-full-wide.jpg", 1920, 1280), "system", {
      scale: "major",
      pace: "pause",
      alt: "The corner shop under a gum tree, its whole side wall painted with checks, bottles, a daisy and produce shapes.",
    }),
  ],
};

export const SISARICH_EXPERIENCE: ProjectExperience = {
  slug: "chris-sisarich",
  infoSections: infoFromCopy(CHRIS_COPY),
  context: CHRIS_COPY.context,
  authorship: authorshipFromCopy(CHRIS_COPY),
  movements: [
    mv("s01", "portrait", jpg("/projects/chris-sisarich/web/01-full-tall.jpg", 1350, 1688), "idea", {
      scale: "major",
      pace: "pause",
      alt: "Rubble and two blocks of orange-striped stone under a pale sky, a handwritten note pinned above them and a fine blue arc drawn across.",
    }),
    mv("s02", "film", film("/projects/chris-sisarich/web/02-two-pair.mp4", 1920, 1194, "/projects/chris-sisarich/web/02-two-pair.jpg"), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "A black-and-white portrait beside a page carrying the name over a blurred braid, credits ranged along the foot.",
    }),
    mv("s03", "film", film("/projects/chris-sisarich/web/03-browser-wide.mp4", 1920, 1080, "/projects/chris-sisarich/web/03-browser-wide.jpg"), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "The site in a browser window, photography scattered across the grid over the ghosted name.",
    }),
    mv("s04", "film", film("/projects/chris-sisarich/web/04-full-tall.mp4", 1350, 1688, "/projects/chris-sisarich/web/04-full-tall.jpg"), "idea", {
      scale: "detail",
      pace: "pause",
      alt: "A column of navigation dots, the active one stretching into a pill that reads Sports.",
    }),
    mv("s05", "film", film("/projects/chris-sisarich/web/05-full-square.mp4", 1350, 1350, "/projects/chris-sisarich/web/05-full-square.jpg"), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "A photograph of two people running through long grass enlarging over the ghosted name.",
    }),
    mv("s06", "film", film("/projects/chris-sisarich/web/06-full-square.mp4", 1350, 1350, "/projects/chris-sisarich/web/06-full-square.jpg"), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "A dense block of photography thumbnails settling over the ghosted name.",
    }),
    mv("s07", "film", film("/projects/chris-sisarich/web/07-iphone-tall.mp4", 1350, 1688, "/projects/chris-sisarich/web/07-iphone-tall.jpg"), "shift", {
      scale: "detail",
      pace: "normal",
      alt: "The site on a phone, Directing and Index pills either side of the photographs over the name.",
    }),
    mv("s08", "portrait", jpg("/projects/chris-sisarich/web/08-full-tall.jpg", 1350, 1688), "shift", {
      scale: "major",
      pace: "pause",
      alt: "A coach alone on a desert road beneath red cliffs, the name set white across the sky.",
    }),
    mv("s09", "landscape", jpg("/projects/chris-sisarich/web/09-full-wide.jpg", 1920, 1080), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "A red car parked on gravel against a rammed-earth wall.",
    }),
    mv("s10", "film", film("/projects/chris-sisarich/web/10-full-square.mp4", 1350, 1350, "/projects/chris-sisarich/web/10-full-square.jpg"), "shift", {
      scale: "standard",
      pace: "pause",
      alt: "A woman in green beside a red car held over the ghosted name, with an invitation to send a postcard beneath.",
    }),
    mv("s11", "landscape", jpg("/projects/chris-sisarich/web/11-two-pair.jpg", 1920, 1194), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "A grid of small photographs under the name, beside a blurred orange bloom over a page of handwriting.",
    }),
    mv("s12", "portrait", jpg("/projects/chris-sisarich/web/12-full-tall.jpg", 1350, 1688), "system", {
      scale: "standard",
      pace: "normal",
      alt: "Two stacked spreads: a car on a mountain road above a desert horizon, the name across each.",
    }),
    mv("s13", "landscape", jpg("/projects/chris-sisarich/web/13-full-square.jpg", 1350, 1350), "system", {
      scale: "detail",
      pace: "normal",
      alt: "A white information sheet on black with the name ghosted at its head.",
    }),
    mv("s14", "portrait", jpg("/projects/chris-sisarich/web/14-full-tall.jpg", 1350, 1688), "system", {
      scale: "detail",
      pace: "pause",
      alt: "Two business cards on black, one blank and one carrying phone, email, website and Instagram.",
    }),
    mv("s15", "landscape", jpg("/projects/chris-sisarich/web/15-two-pair.jpg", 1920, 1194), "system", {
      scale: "standard",
      pace: "normal",
      alt: "A red and white striped tower beside a pinned page of figures, arrows and the name.",
    }),
    mv("s16", "portrait", jpg("/projects/chris-sisarich/web/16-full-tall.jpg", 610, 2000), "system", {
      scale: "standard",
      pace: "normal",
      alt: "An email issue running the full column: the name over a coast road shot from above, two projects set out beneath it, and the name again at the foot.",
    }),
    mv("s17", "portrait", jpg("/projects/chris-sisarich/web/17-full-tall.jpg", 1350, 1688), "system", {
      scale: "standard",
      pace: "normal",
      alt: "A framed poster on a concrete wall, the name over a small landscape still.",
    }),
    mv("s18", "landscape", jpg("/projects/chris-sisarich/web/18-full-wide.jpg", 1920, 1080), "system", {
      scale: "standard",
      pace: "normal",
      alt: "A lit poster on a concrete street wall under bunting, the name along its foot.",
    }),
    mv("s19", "film", film("/projects/chris-sisarich/web/19-full-wide.mp4", 1920, 1080, "/projects/chris-sisarich/web/19-full-wide.jpg"), "system", {
      scale: "major",
      pace: "pause",
      alt: "The archive spread edge to edge as a loose grid of small photographs on white.",
    }),
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
    mv("sk01", "portrait", jpg("/projects/sck/1.jpg", 1296, 1620, "contain", []), "idea", {
      scale: "major",
      pace: "pause",
      alt: "Two people seated on terrazzo steps beside a large framed painting, a glass wall opening to planting behind them, with STUDIO CARSON KELLY set across the frame.",
    }),
    mv("sk02", "portrait", jpg("/projects/sck/2.jpg", 1296, 1620, "contain", []), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "The practice description ranged along the top of a pale sage field, with STUDIO CARSON KELLY set large across the foot.",
    }),
    mv("sk03", "landscape", jpg("/projects/sck/3.jpg", 2880, 1620, "contain", []), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "Two posters side by side: a project sheet listing size, type, location and credits, beside a bedroom photograph captioned S.C.K and Little James.",
    }),
    mv("sk04", "portrait", jpg("/projects/sck/4.jpg", 1296, 1620, "contain", []), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "A corrugated steel roof edge against eucalypts, quartered by fine crosshair rules with S.C.K at the centre.",
    }),
    mv("sk05", "portrait", jpg("/projects/sck/5.jpg", 1296, 1620, "contain", []), "idea", {
      scale: "detail",
      pace: "normal",
      alt: "The logotype in four lockups — one line, two lines, three lines and the S.C.K monogram — set out on spacing guides.",
    }),
    mv("sk06", "portrait", jpg("/projects/sck/6.jpg", 1296, 1620, "contain", []), "shift", {
      scale: "detail",
      pace: "tight",
      alt: "A spherical ribbed pendant above dried grasses, labelled STILL_Pendant, by_SOZOU_Studio, OBJKT_022.",
    }),
    mv("sk07", "landscape", jpg("/projects/sck/7.jpg", 2880, 1620, "contain", []), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "Two posters side by side: a specification sheet for a ninety square metre Bondi Junction residence, beside a bed lit through a glass block wall.",
    }),
    mv("sk08", "portrait", jpg("/projects/sck/8.jpg", 1296, 1620, "contain", []), "shift", {
      scale: "detail",
      pace: "tight",
      alt: "A cast speaker with a conical horn on a plinth, labelled Cast_Speaker, by_Tom_Fereday, OBJKT_149.",
    }),
    mv("sk09", "landscape", jpg("/projects/sck/9.jpg", 2159, 1620, "contain", []), "shift", {
      scale: "major",
      pace: "pause",
      alt: "A living room opening onto a deck and eucalypt bush, the STUDIO CARSON KELLY wordmark and practice details set over it.",
    }),
    mv("sk10", "film", film("/projects/sck/web/10.mp4", 1000, 1250, "/projects/sck/web/10.jpg"), "shift", {
      scale: "standard",
      pace: "normal",
      span: "narrow",
      alt: "The Ulladulla House in white corrugated steel, its deck and a chair open to eucalypt forest, captioned S.C.K and Ulladulla House.",
    }),
    mv("sk11", "portrait", jpg("/projects/sck/11.jpg", 1296, 1620, "contain", []), "system", {
      scale: "detail",
      pace: "tight",
      alt: "A glass and resin coffee table on a pale floor, labelled Coffee_Table, by_Clive_Lonstein, OBJKT_009.",
    }),
    mv("sk12", "film", film("/projects/sck/web/12.mp4", 1600, 960, "/projects/sck/web/12.jpg"), "system", {
      scale: "standard",
      pace: "normal",
      span: "narrow",
      alt: "Three phone screens running a Studio Carson Kelly podcast player and episode list.",
    }),
    mv("sk13", "landscape", jpg("/projects/sck/13.jpg", 2159, 1620, "contain", []), "system", {
      scale: "standard",
      pace: "normal",
      alt: "A travertine brick corner with a pitcher plant, chrome lamp and corduroy sofa, S.C.K and the practice description set alongside.",
    }),
    mv("sk14", "film", film("/projects/sck/web/14.mp4", 1600, 960, "/projects/sck/web/14.jpg"), "outcome", {
      scale: "standard",
      pace: "normal",
      span: "narrow",
      alt: "Three phone screens of Studio Carson Kelly stories — a bedroom, a kitchen and a written note on the Little James house.",
    }),
    mv("sk15", "portrait", jpg("/projects/sck/15.jpg", 1296, 1620, "contain", []), "outcome", {
      scale: "detail",
      pace: "tight",
      alt: "Nine pale sage cards in a grid, each carrying STUDIO CARSON KELLY and a reference number.",
    }),
    mv("sk16", "film", film("/projects/sck/web/16.mp4", 1600, 912, "/projects/sck/web/16.jpg"), "outcome", {
      scale: "major",
      pace: "pause",
      alt: "The Studio Carson Kelly website, street footage running beneath a Work, Studio and Resources menu.",
    }),
  ],
};

/**
 * Made by Madelen, shipped so the project has a sequence of its own.
 *
 * Every case study here is also the CMS project's fallback: it is what the
 * page shows if Sanity is unreachable, and it is what the card reads to work
 * out which frame it is opening into. A project with only a CMS record has
 * neither, so the open has no destination to fly to.
 */
export const MBM_EXPERIENCE: ProjectExperience = {
  slug: "made-by-madelen",
  infoSections: infoFromCopy(MBM_COPY),
  context: MBM_COPY.context,
  authorship: authorshipFromCopy(MBM_COPY),
  movements: [
    mv("m01", "portrait", jpg("/projects/made-by-madelen/web/01-full-story.jpg", 1080, 1920), "idea", {
      scale: "major",
      pace: "pause",
      alt: "The Made by Madelen monogram held in cream over a black-and-white portrait, a sheet of fabric sweeping across the frame.",
    }),
    mv("m02", "film", film("/projects/made-by-madelen/web/02-instagram-tall.mp4", 1350, 1688, "/projects/made-by-madelen/web/02-instagram-tall.jpg"), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "A phone playing the first Reel on a near-black ground, captioned Something is coming.",
    }),
    mv("m03", "portrait", jpg("/projects/made-by-madelen/web/03-full-tall.jpg", 1350, 1688), "idea", {
      scale: "standard",
      pace: "normal",
      alt: "A black-and-white fragment of two figures turned away, the monogram print rising through the lower half of the frame.",
    }),
    mv("m04", "film", film("/projects/made-by-madelen/web/04-row-row.mp4", 1920, 1186, "/projects/made-by-madelen/web/04-row-row.jpg"), "shift", {
      scale: "standard",
      pace: "normal",
      alt: "Two phones side by side: a TikTok reading MADE IN SEQUENCE, CUT-BY-CUT, STITCH BY STITCH, and the Instagram grid filling in beside it.",
    }),
    mv("m05", "landscape", jpg("/projects/made-by-madelen/web/05-full-wide.jpg", 1920, 1080), "idea", {
      scale: "major",
      pace: "pause",
      alt: "A portrait in the monogram-print jacket, colour blooming in from the left edge of the frame.",
    }),
    mv("m06", "film", film("/projects/made-by-madelen/web/06-full-story.mp4", 1080, 1920, "/projects/made-by-madelen/web/06-full-story.jpg"), "system", {
      scale: "major",
      pace: "pause",
      alt: "A close crop of the monogram print in blue across a shoulder and collar, Made the way you are. set in yellow across it.",
    }),
    mv("m07", "film", film("/projects/made-by-madelen/web/07-instagram-tall.mp4", 1350, 1688, "/projects/made-by-madelen/web/07-instagram-tall.jpg"), "system", {
      scale: "standard",
      pace: "normal",
      alt: "MADE TO BE WORN running over a Reel and out past the edges of the phone behind it.",
    }),
    mv("m08", "portrait", jpg("/projects/made-by-madelen/web/08-full-story.jpg", 1080, 1920), "system", {
      scale: "major",
      pace: "pause",
      alt: "The full red monogram-print suit on a warm ground, Link in stories set across it.",
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
  "made-by-madelen": MBM_EXPERIENCE,
};

export function getExperience(slug: string) {
  return PROJECT_EXPERIENCES[slug] ?? null;
}

/** Short Idea copy shared by Index accordion and Visual +. */
export function projectIdeaCopy(slug: string) {
  const section = getExperience(slug)?.infoSections.find((item) => item.id === "idea");
  return section ? infoSectionPlainCopy(section) : "";
}
