"use client";

import { useEffect, useState } from "react";

/**
 * How the work is laid out, and the fact that it is remembered.
 *
 * Two surfaces need this and they never meet: the switch lives in the bar,
 * the band lives in the gallery. Rather than thread it between them, it is
 * kept where the browser keeps everything else about a visitor — and said
 * out loud when it changes, so whoever is listening hears it.
 */
export type View = "band" | "grid";

const KEY = "hbw-view";

export function readView(): View {
  try {
    return window.localStorage.getItem(KEY) === "grid" ? "grid" : "band";
  } catch {
    // Private windows and blocked site data: the band is the default anyway.
    return "band";
  }
}

export function writeView(view: View) {
  try {
    window.localStorage.setItem(KEY, view);
  } catch {
    /* Not remembering is survivable; not switching is not. */
  }
  window.dispatchEvent(new CustomEvent("hbw:view", { detail: view }));
}

export function useView(): [View, (view: View) => void] {
  /*
   * Starts on the band, then catches up.
   *
   * The server has no idea what this visitor prefers, so reading storage
   * during the first render would make the markup disagree with itself.
   */
  const [view, set] = useState<View>("band");

  useEffect(() => {
    set(readView());
    const heard = (event: Event) => set((event as CustomEvent).detail as View);
    window.addEventListener("hbw:view", heard);
    return () => window.removeEventListener("hbw:view", heard);
  }, []);

  return [view, writeView];
}
