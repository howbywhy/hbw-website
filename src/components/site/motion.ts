/**
 * The site's motion, in one place.
 *
 * Every duration and curve the site uses lives here and in the matching
 * custom properties at the top of hbw-index.css — the same numbers, declared
 * once each for the two engines that need them. Before this there were eight
 * different durations and three curves scattered through the stylesheet, which
 * is how a site ends up feeling like several sites.
 *
 * Two speeds only:
 *   SETTLE  something changing place — a frame moving to a new arrangement
 *   ANSWER  something answering you — a colour, an opacity, a label arriving
 *
 * One curve, because a single easing is most of what makes motion read as one
 * hand. It leaves quickly and arrives slowly, which is how things move.
 */
export const SETTLE = 620;
export const ANSWER = 160;
export const EASE = "cubic-bezier(0.22, 0.7, 0.2, 1)";

/** How far apart frames start when a whole arrangement moves, and the cap. */
export const STAGGER = 28;
export const STAGGER_CAP = 420;
