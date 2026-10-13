"use client";

/**
 * The whole sequence, over the page.
 *
 * A collage shows a project's shape; this shows its contents. Opening one
 * frame opens all of them, starting where you clicked, and the arrows walk the
 * set — so a visitor who wants to see everything does not have to scroll a
 * composition looking for it.
 *
 * The set is laid out as pages on a rail rather than one picture swapped in
 * place. Stepping moves the whole rail, and the work either side stays in
 * view, set back — so the sequence reads as a sequence while you are inside
 * it, and a step reads as a move along it rather than a cut.
 *
 * In colour. The listings are grey so six jobs read as one body of work, but
 * in here there is only one job and the work is the whole subject.
 */
import { useCallback, useEffect, useRef } from "react";
import type { Movement } from "@/components/home/projects/types";
import { countOf, refOf } from "@/components/site/numbering";

export type Shot = { src: string; video?: string; webm?: string; alt?: string };

/** How far either side of the picture is worth loading: the next step, and the one after. */
const NEAR = 2;

export function shotsOf(movements: Movement[]): Shot[] {
  const out: Shot[] = [];
  for (const movement of movements) {
    const media = movement.media;
    const film = media.type === "video";
    const src = film ? media.poster ?? media.src : media.src;
    if (!src) continue;
    out.push({
      src,
      video: film ? media.mp4 ?? media.videoSrc ?? media.src : undefined,
      webm: film ? media.webm : undefined,
      alt: media.alt,
    });
  }
  return out;
}

export function Lightbox({
  shots,
  at,
  onAt,
  onClose,
  name,
}: {
  shots: Shot[];
  at: number;
  onAt: (next: number) => void;
  onClose: () => void;
  name: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const shot = shots[at];

  /**
   * The strip follows the picture. Centring the current thumb means the set
   * always reads as continuing in both directions, rather than the strip
   * sitting still while the picture changes behind it.
   */
  useEffect(() => {
    const here = rail.current?.querySelector<HTMLElement>('[data-here="true"]');
    here?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [at]);

  const step = useCallback(
    (by: number) => onAt((at + by + shots.length) % shots.length),
    [at, shots.length, onAt]
  );

  useEffect(() => {
    opener.current = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const had = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = had;
      opener.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose, step]);

  if (!shot) return null;

  return (
    <div
      className="hbw-lamp hbw-over"
      role="dialog"
      aria-modal="true"
      aria-label={`${name}, image ${at + 1} of ${shots.length}`}
      ref={panel}
      tabIndex={-1}
    >
      <div className="hbw-lamp__bar">
        {/*
          The step, said in words as well as drawn under the pointer. The
          project's name is not repeated here: the bar above already carries
          it, and saying it twice is the double navigation that makes two
          fixed rows read as a fault rather than a hierarchy.
        */}
        <span className="hbw-lamp__walk" aria-hidden="true">
          <button type="button" onClick={() => step(-1)} tabIndex={-1}>
            Prev
          </button>
          <button type="button" onClick={() => step(1)} tabIndex={-1}>
            Next
          </button>
        </span>
        <span className="hbw-lamp__count">
          {refOf(name, at)} · {countOf(at, shots.length)}
        </span>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {/*
        The picture, and nothing under it. The description was the frame's alt
        text printed out: it is written for someone who cannot see the picture,
        and setting it under the picture says it twice to everyone else. It
        stays on the image, where it is read by the people it is for.
      */}
      <div className="hbw-lamp__field">
        {/*
          One rail carrying every frame as a page, moved by whole pages. The
          offset is set here rather than in the stylesheet because only this
          knows where in the set you are; the width of a page and the gap
          between pages are the stylesheet's, so the sum stays one rule.
        */}
        <div className="hbw-lamp__pages" style={{ "--at": at } as React.CSSProperties}>
          {shots.map((one, i) => {
            const near = Math.abs(i - at) <= NEAR;
            return (
              <div className="hbw-lamp__page" key={one.src + i} data-here={i === at} aria-hidden={i === at ? undefined : true}>
                {/* Film plays on the page you are on; elsewhere it is its own still. */}
                {one.video && i === at ? (
                  <video src={one.video} poster={one.src} autoPlay muted loop playsInline />
                ) : near ? (
                  <img
                    src={one.src}
                    alt={i === at ? one.alt ?? "" : ""}
                    loading={i === at ? undefined : "lazy"}
                    decoding="async"
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* The halves of the screen walk the set. The arrows are a hint; the
            whole side is the target, which is what people reach for. */}
        <button type="button" className="hbw-lamp__step is-back" onClick={() => step(-1)} aria-label="Previous image">
          <span aria-hidden="true">←</span>
        </button>
        <button type="button" className="hbw-lamp__step is-on" onClick={() => step(1)} aria-label="Next image">
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {/* The whole set, small, moving with you. */}
      <div className="hbw-lamp__rail" ref={rail}>
        {shots.map((one, i) => (
          <button
            key={one.src + i}
            type="button"
            data-here={i === at}
            className="hbw-lamp__thumb"
            onClick={() => onAt(i)}
            aria-label={`Image ${i + 1}`}
            aria-current={i === at ? "true" : undefined}
          >
            <img src={one.src} alt="" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
    </div>
  );
}
