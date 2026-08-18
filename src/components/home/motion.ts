/** Shared HBW motion tokens. Keep in sync with `hbw-home-prototype.css`. */
export const HBW_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export const HBW_T = {
  /** Hover, focus, labels, context chrome. */
  micro: 140,
  /** Filters, lenses, metadata, toolbar state. */
  ui: 240,
  /** Layers and sheets: Projects, Studio, Manifesto, Info, Visual↔Index. */
  spatial: 380,
  /** Ownership transfers: project entry, project→project, return to origin. */
  continuity: 520,
  /** Composed first-visit hold. Not a fifth grammar token. */
  intro: 2280,
  /** Preload budget. Not visual. */
  prepareCap: 1400,
} as const;

/** occupy spatial + read (continuity+ui+ui) + yield ui + expand continuity + settle micro. */
export const HBW_INTRO_MS =
  HBW_T.spatial + HBW_T.continuity + HBW_T.ui + HBW_T.ui + HBW_T.ui + HBW_T.continuity + HBW_T.micro;

export type SwapPhase = "idle" | "preparing" | "exiting" | "entering";

export function reduceMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}
