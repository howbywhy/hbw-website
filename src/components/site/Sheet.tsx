"use client";

/**
 * A sheet over the site, with the site blurred behind it.
 *
 * The shape the studio and a project's information both take: nothing here
 * knows what is inside it. Escape closes, the ground closes, focus goes in and
 * comes back, and the page underneath does not scroll while it is up.
 */
import { useHeld } from "@/components/site/held";
import { useCallback, useEffect, useRef, type ReactNode } from "react";

export function Sheet({
  label,
  children,
  onClose,
  panel: panelClass,
  bare = false,
}: {
  label: string;
  children: ReactNode;
  onClose: () => void;
  /**
   * An extra class for the panel. A body that scrolls its own parts — the
   * studio's two columns — uses it to stop the panel scrolling underneath
   * them, which would otherwise give the same content two scrollbars.
   */
  panel?: string;
  /**
   * No row of its own for the label and the way out.
   *
   * The sheet's top row held one word — Close — on a line to itself directly
   * under a bar that was already there, so the page opened on two rows of
   * chrome saying almost nothing. Where the bar can carry the way out, it
   * does, and the sheet starts at its content.
   */
  bare?: boolean;
}) {
  const panel = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  // The keyboard stays in here while this is up, as aria-modal promises.
  useHeld(panel);

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
    <div className="hbw-studio-sheet hbw-over" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" className="hbw-studio-sheet__scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <article
        className={panelClass ? `hbw-studio-sheet__panel ${panelClass}` : "hbw-studio-sheet__panel"}
        ref={panel}
        tabIndex={-1}
      >
        {bare ? null : (
          <div className="hbw-studio-sheet__top">
            <p>{label}</p>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>
        )}
        <div className="hbw-studio-sheet__body">{children}</div>
      </article>
    </div>
  );
}
