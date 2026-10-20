"use client";

/**
 * Whether the nav has finished moving.
 *
 * The site has one rule about order and this is it: the nav leads, and what
 * follows waits. It used to be kept by hand — a token here holding the work
 * off by the length of a nav assembly, another there holding a row off by
 * the length of a travel — and hand-kept rules drift. The bar's journey is
 * not the same length twice: from the front page it travels four hundred
 * pixels, from a project it is already home, and the name and the line in
 * it change over their own beat on top of that.
 *
 * So nothing guesses. Whatever is about to arrive asks the bar whether it
 * has stopped, and the bar answers with its own animations.
 *
 * Asked a frame late, because the thing that is arriving is usually what
 * sends the bar moving: the style that starts the journey is set in the
 * same commit that mounts the asker, so at mount there is nothing running
 * yet to wait for. Capped, so nothing can be held shut by a nav that never
 * settles.
 */
import { useEffect, useState } from "react";

/**
 * ?lead=overlap — the nav still leads, it just stops having to finish first.
 *
 * Measured on a press of About: the bar moves from 18ms to 239ms, the gate
 * comes off at 281ms, and the sheet first moves at 289ms. So for the better
 * part of a third of a second after the press, nothing about the thing that
 * was asked for moves at all — and the only thing that does move is the bar,
 * through twenty-eight separate changes as its pieces arrive on their own
 * delays. Read together that is a press with no answer followed by a sheet
 * arriving all at once: too long, and jumpy with it.
 *
 * Overlapping, the gate lifts when the bar's pieces are each half way
 * through rather than finished. The order is unchanged — the bar still
 * starts first, and is still the thing the sheet waits on — but the two
 * share the middle of the move instead of running end to end.
 *
 * A flag, because "the chrome settles, then what it frames" is a decision
 * about the work rather than a detail of the code. ?lead=settle turns it
 * off; it holds for the session, since opening a project pushes an address
 * with no query on it.
 */
function overlapping() {
  try {
    const asked = new URLSearchParams(window.location.search).get("lead");
    if (asked === "overlap") {
      window.sessionStorage?.setItem("hbw-lead", "overlap");
      return true;
    }
    if (asked === "settle") {
      window.sessionStorage?.removeItem("hbw-lead");
      return false;
    }
    return window.sessionStorage?.getItem("hbw-lead") === "overlap";
  } catch {
    /* nothing to read: the nav finishes before anything follows it */
    return false;
  }
}

export function useNavSettled() {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const bar = document.querySelector<HTMLElement>(".hbw-bar");
    if (!bar || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSettled(true);
      return;
    }
    let dropped = false;
    const cap = window.setTimeout(() => {
      if (!dropped) setSettled(true);
    }, 1400);
    /*
     * And it looks again when they finish.
     *
     * The bar's pieces do not all start together: the travel begins with
     * the thing that is arriving, and the name and the line change when
     * the page gets round to telling the bar which project it is over —
     * measured on a click from the catalogue, a dozen milliseconds after the
     * gallery was built, which is after a single ask had already been
     * answered. Waiting once let the work out while the name was still
     * turning over. It waits until the bar is quiet, however many goes
     * that takes.
     */
    /*
     * Watched every frame, rather than waited on.
     *
     * Waiting on the bar's animation promises meant a microtask, then a
     * frame, then three more frames of checking — measured on a hand-over,
     * the hold lifted a hundred and sixty-six milliseconds after the nav
     * had actually stopped, and that sat in the middle of the move as dead
     * time. Looked at once a frame, it lifts within two.
     *
     * Two counters, because the question is not "is the bar quiet" but
     * "has the bar finished": at the moment of asking it is usually quiet
     * and about to move, since the thing doing the asking is what sets it
     * going. So a bar that has moved settles two quiet frames after it
     * stops, and a bar that was never going to move settles after four.
     */
    const overlap = overlapping();
    let frame = 0;
    let moved = false;
    let calm = 0;
    const watch = () => {
      if (dropped) return;
      /*
       * Finished, or — overlapping — merely past the half way point.
       *
       * progress is null outside an animation's active phase, which covers
       * both a piece still sitting in its delay and one already done. The
       * first has not started and must still be waited for; the second has
       * nothing left to wait for. Only a running piece has a progress to
       * read, so the delayed case is caught by its own test rather than
       * being quietly counted as finished.
       */
      const half = overlap
        ? bar.getAnimations({ subtree: true }).some((one) => {
            if (one.playState !== "running") return false;
            const timing = one.effect?.getComputedTiming();
            if (!timing) return true;
            /* Still waiting to begin: the bar has not had its turn yet. */
            if (timing.progress == null) return true;
            return timing.progress < 0.5;
          })
        : null;
      const busy =
        half ??
        bar.getAnimations({ subtree: true }).some((one) => one.playState === "running");
      if (busy) {
        moved = true;
        calm = 0;
      } else {
        calm += 1;
      }
      if (calm >= (moved ? 2 : 4)) {
        window.clearTimeout(cap);
        setSettled(true);
        return;
      }
      frame = requestAnimationFrame(watch);
    };
    frame = requestAnimationFrame(watch);

    return () => {
      dropped = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(cap);
    };
  }, []);

  return settled;
}
