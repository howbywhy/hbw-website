"use client";

/**
 * The Poster, opened from Contact.
 *
 * It is the one thing here nobody else has, so it stays — but it is a tool
 * someone chooses, not furniture the site wears. It loads only when asked:
 * seventeen hundred lines of editor has no business in the bundle of a page
 * that is mostly an email address.
 *
 * A widget inside the studio, not a layer over the site.
 *
 * It painted white over the whole screen once, which is indistinguishable
 * from having navigated somewhere, and then sat in a window of its own with
 * its own scrim — still a second layer, still somewhere you had gone. It
 * opens inside the sheet it was asked for now: the studio stays open behind
 * it, the nav stays where it was, and shutting it puts you back in Contact
 * rather than returning you from somewhere.
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const PosterTool = dynamic(
  () => import("@/components/home/PosterTool").then((m) => m.PosterTool),
  { ssr: false }
);

/** Everything in the window a Tab can land on, in the order Tab visits it. */
function reachable(root: HTMLElement) {
  const sel =
    'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
  return [...root.querySelectorAll<HTMLElement>(sel)].filter(
    (el) => el.offsetParent !== null && el.getAttribute("aria-hidden") !== "true"
  );
}

export function PosterLink() {
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  /**
   * Whether the window had to make its own layer.
   *
   * The sheet is the right home for it — see the note on the portal below —
   * but /contact is a page as well as a part of the studio sheet, and on the
   * page there is no sheet to open inside. There, the window gets a layer of
   * its own rather than a button that does nothing.
   */
  const [onOwnLayer, setOnOwnLayer] = useState(false);
  const win = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  const shut = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const panel = document.querySelector<HTMLElement>(".hbw-studio-sheet__panel");
    if (panel) {
      setOnOwnLayer(false);
      setHost(panel);
      return;
    }
    const layer = document.createElement("div");
    layer.className = "hbw-win-layer";
    /*
     * Inside the page's own main, not on the body.
     *
     * Paper, rule, ink and the rest are declared on `.hbw-site`, not on the
     * root — so a layer appended to the body inherits none of them, and the
     * window came up with `background: var(--paper)` resolving to nothing:
     * transparent, outline gone, the page's own words showing through it. It
     * reads the same either way on a white page, which is exactly why it had
     * to be measured rather than looked at.
     */
    (opener.current?.closest<HTMLElement>(".hbw-site") ?? document.body).append(layer);
    const had = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setOnOwnLayer(true);
    setHost(layer);
    return () => {
      document.body.style.overflow = had;
      layer.remove();
      setHost(null);
    };
  }, [open]);

  /**
   * Escape shuts it, as it shuts every other thing that opens over the site.
   *
   * Taken in the capture phase, before the sheet under it hears the key, and
   * stopped there so the sheet does not close along with the tool.
   */
  useEffect(() => {
    if (!open) return;
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      /*
       * Typing is the one thing that owns Escape for itself.
       *
       * The tool's text editor closes on Escape — that is how a block of
       * type is finished. Taking the key here first threw the whole window
       * away mid-sentence and lost the words with it, because a capture
       * listener on the window runs before the textarea it was aimed at.
       * The textarea stops the key itself, so the sheet is still safe.
       */
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(".hbw-poster-edit")) return;
      // It is the thing on top, so it takes the key before the sheet under it.
      event.stopPropagation();
      /*
       * One layer at a time.
       *
       * The ink palette opens inside the tool, so Escape shuts that and the
       * window stays up — which is what Escape does everywhere else here.
       * The key is still stopped above, because the studio sheet under the
       * window must not close on it either; the palette is asked to shut by
       * an event instead, since a capture listener on the window runs before
       * anything inside the tool could hear the key at all.
       */
      if (document.querySelector(".hbw-poster-palette")) {
        document.dispatchEvent(new CustomEvent("hbw:shut-palette"));
        return;
      }
      setOpen(false);
    };
    window.addEventListener("keydown", key, true);
    document.addEventListener("hbw:shut-poster", shut);
    return () => {
      window.removeEventListener("keydown", key, true);
      document.removeEventListener("hbw:shut-poster", shut);
    };
  }, [open, shut]);

  /**
   * Focus goes in, stays in, and comes back.
   *
   * It says aria-modal, and a modal that does not hold focus is a claim the
   * page does not honour: Tab off the last control walked straight out into
   * the studio's own links behind it, with the window still up and a reader
   * being read the page it was told was unavailable.
   */
  useEffect(() => {
    if (!open || !host) return;
    const node = win.current;
    if (!node) return;
    const first = reachable(node)[0];
    (first ?? node).focus({ preventScroll: true });
    const tab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const stops = reachable(node);
      if (!stops.length) return;
      const edge = event.shiftKey ? stops[0] : stops[stops.length - 1];
      const active = document.activeElement;
      // Focus outside the window at all — clicked the page, or arrived by a
      // route nothing here saw — is pulled back to the near end.
      if (!node.contains(active) || active === edge) {
        event.preventDefault();
        (event.shiftKey ? stops[stops.length - 1] : stops[0]).focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", tab, true);
    return () => {
      window.removeEventListener("keydown", tab, true);
      opener.current?.focus?.({ preventScroll: true });
    };
  }, [open, host]);

  return (
    <>
      <p>
        <button
          ref={opener}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>Make a poster</span>
        </button>
      </p>
      {/*
        Rendered into the sheet, not where this button sits.

        Two reasons. The studio's columns carry a blur filter for the smear,
        and an element with any filter becomes the containing block for
        everything fixed inside it — left here, the widget was positioned
        against a scrolled column and landed eleven hundred pixels above the
        screen. And the column it is asked from is twenty-three rems wide,
        which is no place for a drawing tool. It fills the sheet instead.
      */}
      {open && host
        ? createPortal(
            <div
              ref={win}
              className="hbw-win"
              role="dialog"
              aria-modal="true"
              aria-label="Poster"
              tabIndex={-1}
              data-layer={onOwnLayer ? "own" : undefined}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="hbw-win__top">
                <p className="hbw-m">Poster</p>
                <button type="button" onClick={() => setOpen(false)}>
                  Close
                </button>
              </div>
              <div className="hbw-win__body">
                <PosterTool />
              </div>
            </div>,
            host
          )
        : null}
    </>
  );
}
