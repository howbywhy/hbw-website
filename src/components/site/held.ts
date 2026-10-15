import { useEffect, type RefObject } from "react";

/**
 * Keep the keyboard inside a surface that claims to be modal.
 *
 * The gallery and the studio sheet both say aria-modal="true", moved focus in
 * on open and gave it back on close — but neither cycled Tab, so from the
 * last control the keyboard walked straight out into the page underneath,
 * which is still there, still tabbable, and visually behind a panel. A
 * reader could be typing into a newsletter field they could not see.
 *
 * Nothing here is novel: the poster window already does exactly this. It is
 * the same behaviour, said once, so both surfaces can share it.
 */
const REACHABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useHeld(panel: RefObject<HTMLElement | null>, on = true) {
  useEffect(() => {
    if (!on) return;
    const hold = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const room = panel.current;
      if (!room) return;
      const ways = Array.from(room.querySelectorAll<HTMLElement>(REACHABLE)).filter((one) => {
        if (one.closest('[aria-hidden="true"]')) return false;
        const box = one.getBoundingClientRect();
        return box.width > 0 && box.height > 0;
      });
      if (!ways.length) {
        // Nothing to land on: hold the panel itself rather than let go.
        event.preventDefault();
        room.focus();
        return;
      }
      const first = ways[0];
      const last = ways[ways.length - 1];
      const here = document.activeElement as HTMLElement | null;
      const inside = here ? room.contains(here) : false;
      if (!inside) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && here === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && here === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", hold, true);
    return () => document.removeEventListener("keydown", hold, true);
  }, [panel, on]);
}
