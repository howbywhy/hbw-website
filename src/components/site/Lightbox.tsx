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
  const shot = shots[at];

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
      className="hbw-lamp"
      role="dialog"
      aria-modal="true"
      aria-label={`${name}, image ${at + 1} of ${shots.length}`}
      ref={panel}
      tabIndex={-1}
    >
      <div className="hbw-lamp__bar">
        <span>{name}</span>
        <span className="hbw-lamp__count">
          {String(at + 1).padStart(2, "0")} / {String(shots.length).padStart(2, "0")}
        </span>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {/* The frame itself. Clicking the ground around it closes, which is what
          everyone tries first. */}
      <div className="hbw-lamp__field" onClick={(e) => e.target === e.currentTarget && onClose()}>
        {shot.video ? (
          <video key={shot.src} src={shot.video} poster={shot.src} autoPlay muted loop playsInline />
        ) : (
          <img key={shot.src} src={shot.src} alt={shot.alt ?? ""} />
        )}
      </div>

      <div className="hbw-lamp__foot">
        <button type="button" onClick={() => step(-1)} aria-label="Previous">
          ← Prev
        </button>
        {shot.alt ? <p className="hbw-lamp__says">{shot.alt}</p> : <span />}
        <button type="button" onClick={() => step(1)} aria-label="Next">
          Next →
        </button>
      </div>
    </div>
  );
}
