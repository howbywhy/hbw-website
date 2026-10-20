/**
 * The site's own title and description, in one place.
 *
 * Both the root layout and the home page declare these, and they have to say
 * the same thing: the root is the fallback for every route, the home page is
 * what a search result for hbw.works actually shows.
 *
 * The description is kept under about 155 characters because that is where
 * Google truncates. The previous one ran to 202 and lost its last sentence,
 * so the disciplines it named were never read by anyone.
 */
/**
 * Where the studio is, said the same way everywhere.
 *
 * The audit's first finding was that not one of the nine page titles said
 * what HBW does or where it is: they read "SCK — How by Why", which only
 * helps somebody who already knows the name. A title is the line a search
 * result is won on, so it now carries the trade and the place, and the
 * positioning stays where it was always doing the work — the heading on the
 * page, and the description under the link.
 */
export const STUDIO_WHERE = "Blue Mountains";

/** The studio, the trade and the place, for the end of a title. */
export const STUDIO_SIGNATURE = `HBW, ${STUDIO_WHERE}`;

/** The same, as a sentence, for the end of a description. */
export const STUDIO_CLAUSE = `HBW, ${STUDIO_WHERE}.`;

export const SITE_TITLE = "HBW — Brand and design practice, Blue Mountains";

/** The positioning on its own, for the places that set it as a heading. */
export const SITE_TAGLINE = "Clarity for brands at a turning point.";

/* 155 exactly: one character over and Google drops the last clause, which is
   the one naming the places people search from. */
export const SITE_DESCRIPTION =
  "HBW (How by Why) is an independent brand and design practice led by Mark Blackler in the Blue Mountains, working with founders across Sydney and Australia.";

export const PRACTICE_TITLE = "Practice — HBW, brand and design, Blue Mountains";

export const PRACTICE_DESCRIPTION =
  "How by Why is an independent brand and design practice in the Blue Mountains, led by Mark Blackler, working with founders at moments of change.";

/**
 * The two details every link preview was going out without.
 *
 * og:title, description, image and url were all set and all correct; what
 * nothing said was whose site this is and what language it is in. Next does
 * not merge openGraph — a page that declares its own replaces the layout's
 * entirely — so saying it once in the root layout reached exactly none of the
 * nine pages, every one of which declares its own. Said here, spread there.
 */
export const OG_SITE = { siteName: "How by Why", locale: "en_AU" } as const;
