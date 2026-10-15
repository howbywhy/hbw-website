"use client";

/**
 * A name, grown to the width of the sheet it opens.
 *
 * The same move the work makes: open a project and its mark fills the plate.
 * Open the studio, or a project's information, and its name does.
 *
 * This measures and publishes two sizes — the one that fills the line and the
 * one that matches the chrome's own wordmark — and the stylesheet moves
 * between them as the sheet scrolls. It deliberately sets no size on the
 * element itself: an inline size beats the stylesheet, and while one was
 * there the mark could never shrink no matter what the scroll said.
 *
 * The measurement is taken on a detached copy at a known size. Measuring the
 * live element would have been circular — its size is computed from the very
 * number being measured.
 */
import { useCallback, useEffect, useRef } from "react";

/** The size the copy is measured at. Any value does; this one is round. */
const PROBE = 100;
/** The tracking the stylesheet sets, which has to be matched on the copy. */
const TRACK = "-0.045em";

export function Mast({ children }: { children: string }) {
  const host = useRef<HTMLParagraphElement>(null);

  const fit = useCallback(() => {
    const el = host.current;
    const room = el?.parentElement;
    if (!el || !room || !room.clientWidth) return;

    const now = getComputedStyle(el);
    const probe = document.createElement("span");
    probe.textContent = children;
    probe.style.cssText = [
      "position:absolute",
      "left:-9999px",
      "top:0",
      "visibility:hidden",
      "white-space:nowrap",
      `font-family:${now.fontFamily}`,
      `font-weight:${now.fontWeight}`,
      `font-size:${PROBE}px`,
      `letter-spacing:${TRACK}`,
    ].join(";");
    document.body.append(probe);
    const at = probe.getBoundingClientRect().width;
    probe.remove();
    if (!at) return;

    const full = (room.clientWidth / at) * PROBE;
    const small = (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) * 1.125;
    room.style.setProperty("--mast-full", `${full.toFixed(2)}px`);
    room.style.setProperty("--mast-min", `${small.toFixed(2)}px`);
  }, [children]);

  useEffect(() => {
    fit();
    /*
     * Width only. The room's height is what the scroll is changing, and an
     * observer that fired on height watched its own output and re-measured on
     * every frame — the figures crept a pixel at a time while you scrolled.
     */
    let was = host.current?.parentElement?.clientWidth ?? 0;
    const watch = new ResizeObserver(() => {
      const now = host.current?.parentElement?.clientWidth ?? 0;
      if (now === was) return;
      was = now;
      fit();
    });
    const room = host.current?.parentElement;
    if (room) watch.observe(room);
    return () => watch.disconnect();
  }, [fit]);

  return (
    <p className="hbw-mast" ref={host} aria-hidden="true">
      {children}
    </p>
  );
}
