/**
 * One lock on the page's scroll, however many things want it held.
 *
 * Three components used to hold it the obvious way: save `body.style.overflow`,
 * set it to hidden, put the saved value back on the way out. That works for
 * one of them at a time and fails the moment two overlap, which they do — the
 * gallery holds the page still while it is open, and About opens on top of it.
 *
 * The second to arrive saved "hidden", because the first was already holding
 * it. Then the two left in whatever order the route change unmounted them: the
 * gallery cleared the lock, About put "hidden" back after it, and the front
 * page arrived with its scroll held by something that was no longer on screen.
 *
 * So the value is captured once, by whoever locks first, and restored once,
 * when the last holder lets go. Holders are counted, not assumed.
 */

let held = 0;
/** What the page had before anyone locked it. Only meaningful while held > 0. */
let before = "";

export function lockScroll() {
  if (typeof document === "undefined") return;
  if (held === 0) {
    before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  held += 1;
}

export function unlockScroll() {
  if (typeof document === "undefined") return;
  if (held === 0) return;
  held -= 1;
  if (held === 0) document.body.style.overflow = before;
}

/**
 * For an effect: lock on mount, release on unmount, exactly once each even if
 * React runs the effect twice in development.
 */
export function holdScroll() {
  lockScroll();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    unlockScroll();
  };
}

/** Test seam: how many holders there are right now. */
export function scrollHolders() {
  return held;
}
