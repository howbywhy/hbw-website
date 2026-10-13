"use client";

/**
 * The studio, over whatever you were looking at.
 *
 * It was a page, and a page is the wrong shape for it: nobody goes to a studio
 * page as a destination, they want it mid-thought — while looking at work —
 * and then they want to carry on where they were. So it is a sheet, reachable
 * from anywhere, and the site stays behind it, blurred rather than replaced.
 *
 * /studio is still a real page underneath this, which is what the Studio link
 * points at. Without JavaScript, and for a crawler, that page is the answer;
 * with it, the link opens the sheet and the address becomes #studio so the
 * state can be linked to and the back button closes it.
 */
import { useCallback, useEffect, useRef } from "react";
import { STUDIO_COPY } from "@/components/home/studio-copy";
import { CONTACT_EMAIL, STUDIO_PLACE } from "@/lib/contact";

export function StudioSheet({ onClose }: { onClose: () => void }) {
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
    <div className="hbw-studio-sheet" role="dialog" aria-modal="true" aria-label="Studio">
      <button type="button" className="hbw-studio-sheet__scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <article className="hbw-studio-sheet__panel" ref={panel} tabIndex={-1}>
        <div className="hbw-studio-sheet__top">
          <p>Studio</p>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="hbw-studio-sheet__body">
          <h2 className="hbw-studio-sheet__lead">{STUDIO_COPY.statement[0]}</h2>
          <p>{STUDIO_COPY.statement[1]}</p>
          <p className="is-mute">{STUDIO_COPY.brief}</p>

          <ol className="hbw-steps">
            {STUDIO_COPY.steps.map((step) => (
              <li key={step.id}>
                <span className="hbw-m">{step.id}</span>
                <span>{step.title}</span>
                <p>{step.copy}</p>
              </li>
            ))}
          </ol>

          <p className="hbw-studio-sheet__foot is-mute">
            {STUDIO_COPY.disciplineList.join(" · ")}
            <br />
            {STUDIO_PLACE}
            <br />
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </div>
      </article>
    </div>
  );
}
