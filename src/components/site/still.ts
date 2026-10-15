"use client";

import { useEffect, useState } from "react";

/**
 * Whether this reader has asked their system for less movement.
 *
 * Read in an effect rather than at render, so the server and the first
 * client pass agree — the answer only exists in the browser.
 *
 * Shared because the stylesheet cannot reach every piece of movement on
 * this site: the hand-over cover is given its transition inline, from the
 * component, where no media query goes. Anything written that way has to
 * ask this question itself.
 */
export function useStillness(): boolean {
  const [still, setStill] = useState(false);
  useEffect(() => {
    const ask = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setStill(ask.matches);
    read();
    ask.addEventListener("change", read);
    return () => ask.removeEventListener("change", read);
  }, []);
  return still;
}
