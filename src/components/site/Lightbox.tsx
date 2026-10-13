"use client";

/**
 * The whole sequence, over the page.
 *
 * A collage shows a project's shape; this shows its contents. Opening one
 * frame opens all of them, starting where you clicked, and the arrows walk the
 * set — so a visitor who wants to see everything does not have to scroll a
 * composition looking for it.
 *
 * In colour. The listings are grey so six jobs read as one body of work, but
 * in here there is only one job and the work is the whole subject.
 */
import { useCallback, useEffect, useRef } from "react";
import type { Movement } from "@/components/home/projects/types";
import { countOf, refOf } from "@/components/site/numbering";

export type Shot = { src: string; video?: string; webm?: string; alt?: string };

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
   * The rail follows the picture. Centring the current thumb means the set
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
        <span>{name}</span>
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
      <div className="hbw-lamp__field" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {shot.video ? (
          <video key={shot.src} src={shot.video} poster={shot.src} autoPlay muted loop playsInline />
        ) : (
          <img key={shot.src} src={shot.src} alt={shot.alt ?? ""} />
        )}

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
