"use client";

/**
 * Contact, as a sheet over the work.
 *
 * Contact used to be a nav pill that copied an address to the clipboard and
 * said so. That is a fine shortcut and a poor front door: it gives one way in,
 * silently, and the Poster — the one thing here nobody else has — had been
 * taken off the home page with nowhere to go.
 *
 * So there are two ways in and they are offered as equals. Write, for someone
 * in a hurry. Draw, for someone who would rather show you the problem than
 * describe it. The Poster opens behind this sheet on the way out, which is why
 * the sheet closes itself first.
 */
import { useEffect, useRef } from "react";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_E164 } from "@/components/home/SiteNav";

type Props = {
  leaving?: boolean;
  onClose: () => void;
  /** Close this, then open the Poster underneath. */
  onPoster: () => void;
};

export function ContactDetail({ leaving = false, onClose, onPoster }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  /** Whatever opened it gets focus back, the way the other sheets behave. */
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    opener.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => opener.current?.focus?.();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div
      className={`hbw-detail hbw-detail--contact${leaving ? " is-leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Contact"
    >
      <button
        type="button"
        className="hbw-detail__scrim"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
      />
      <article ref={panelRef} className="hbw-viewer hbw-viewer--contact" tabIndex={-1} aria-label="Contact">
        <button type="button" className="hbw-reach__close" onClick={onClose}>
          Close
        </button>
        <div className="hbw-viewer__body">
          <div className="hbw-reach">
            <p className="hbw-reach__lede">
              Two ways in.{" "}
              <span className="hbw-reach__grey">
                Whichever suits the mood you are in.
              </span>
            </p>

            <div className="hbw-reach__ways">
              <section className="hbw-reach__way">
                <h2>Write</h2>
                <p className="hbw-reach__grey">
                  A sentence about what is changing is plenty to start with.
                </p>
                <p className="hbw-reach__lines">
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                  <a href={`tel:${CONTACT_PHONE_E164}`}>{CONTACT_PHONE}</a>
                </p>
              </section>

              <section className="hbw-reach__way">
                <h2>Draw</h2>
                <p className="hbw-reach__grey">
                  Make a poster instead. Spray it, write on it, and send it
                  over — it reaches the same inbox, and it says more about the
                  problem than a paragraph usually does.
                </p>
                <p className="hbw-reach__lines">
                  <button type="button" className="hbw-reach__go" onClick={onPoster}>
                    Make a poster
                  </button>
                </p>
              </section>
            </div>

            <p className="hbw-reach__foot hbw-reach__grey">
              Wentworth Falls, Blue Mountains. Working with founders across
              Sydney and Australia.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
