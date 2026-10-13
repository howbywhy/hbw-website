"use client";

/**
 * A sheet over the site, with the site blurred behind it.
 *
 * The shape the studio and a project's information both take: nothing here
 * knows what is inside it. Escape closes, the ground closes, focus goes in and
 * comes back, and the page underneath does not scroll while it is up.
 */
import { useCallback, useEffect, useRef, type ReactNode } from "react";

export function Sheet({
  label,
  children,
  onClose,
}: {
  label: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);

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

  const key = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [key]);

  return (
    <div className="hbw-studio-sheet" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" className="hbw-studio-sheet__scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <article className="hbw-studio-sheet__panel" ref={panel} tabIndex={-1}>
        <div className="hbw-studio-sheet__top">
          <p>{label}</p>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="hbw-studio-sheet__body">{children}</div>
      </article>
    </div>
  );
}
