"use client";

/**
 * Two ways in, offered as equals.
 *
 * Write, for someone in a hurry. Draw, for someone who would rather show the
 * problem than describe it — which is the Poster, and the reason it is worth
 * keeping. The sheet closes itself on the way out so the Poster opens onto a
 * clear page.
 */
import { useEffect, useRef } from "react";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_E164 } from "@/lib/contact";

export function ReachSheet({ onClose, onPoster }: { onClose: () => void; onPoster: () => void }) {
  const panel = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    opener.current = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => opener.current?.focus?.();
  }, []);

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);

  return (
    <div className="hbw-sheet" role="dialog" aria-modal="true" aria-label="Contact">
      <button type="button" className="hbw-sheet__scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <section ref={panel} className="hbw-sheet__panel" tabIndex={-1}>
        <button type="button" className="hbw-sheet__shut" onClick={onClose}>
          Close
        </button>
        <h2 className="hbw-sheet__title">Two ways in</h2>
        <div className="hbw-reach">
          <section>
            <h3>Write</h3>
            <p className="hbw-grey">A sentence about what is changing is plenty to start with.</p>
            <p className="hbw-reach__lines">
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <a href={`tel:${CONTACT_PHONE_E164}`}>{CONTACT_PHONE}</a>
            </p>
          </section>
          <section>
            <h3>Draw</h3>
            <p className="hbw-grey">
              Make a poster instead. Spray it, write on it, send it over. It reaches the same inbox
              and it usually says more about the problem than a paragraph does.
            </p>
            <p className="hbw-reach__lines">
              <button type="button" className="hbw-reach__go" onClick={onPoster}>
                Make a poster
              </button>
            </p>
          </section>
        </div>
        <p className="hbw-grey hbw-reach__foot">
          Wentworth Falls, Blue Mountains. Working with founders across Sydney and Australia.
        </p>
      </section>
    </div>
  );
}
