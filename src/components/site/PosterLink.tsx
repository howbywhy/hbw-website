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
import { holdScroll } from "@/components/site/scroll-lock";
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

  /**
   * It leaves the way it came.
   *
   * Shutting it used to take the whole thing away between one frame and the
   * next, which on a site where every other surface opens and closes as a
   * sequence read as a fault rather than a dismissal. The window is marked
   * as going, its three plates stand down in the reverse of the order they
   * arrived, and only then does it come off the sheet. The timing is read
   * from the same token the move itself is drawn with, so the two cannot
   * drift apart.
   */
  const [going, setGoing] = useState(false);
  const leaving = useRef(0);

  const shut = useCallback(() => {
    if (leaving.current) return;
    const out = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--out")
    );
    const ms = Number.isFinite(out) && out > 0 ? out * (out < 20 ? 1000 : 1) : 240;
    setGoing(true);
    leaving.current = window.setTimeout(() => {
      leaving.current = 0;
      setGoing(false);
      setOpen(false);
    }, ms + 120);
  }, []);

  useEffect(() => () => window.clearTimeout(leaving.current), []);

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
    /*
     * Where the nav actually ends, not where the tokens say it does.
     *
     * The window has to start under the nav here, and the obvious way to
     * write that is `--chrome`, the sum of the bar's parts. It overshot by
     * twenty-eight pixels, which put the tool that much further from the
     * chrome than everything else on the site sits from it. The bar is
     * fixed to the top, so its own height is the distance — measured, as
     * every other offset here is, rather than added up.
     */
    const place = () => {
      const bar = document.querySelector<HTMLElement>(".hbw-bar");
      if (bar) layer.style.setProperty("--win-top", `${bar.offsetTop + bar.offsetHeight}px`);
    };
    place();
    // The nav is not the same height at every width, and the tool stays open
    // across a turn of the phone.
    window.addEventListener("resize", place);
    const release = holdScroll();
    setOnOwnLayer(true);
    setHost(layer);
    return () => {
      window.removeEventListener("resize", place);
      release();
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
      shut();
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
    /*
     * The window takes focus, not the first thing in it.
     *
     * Landing on the first control armed the way out the moment the tool
     * opened — a ring round "Close poster" before a mark had been made, and
     * the first key you pressed could shut what you had just asked for. The
     * dialog itself is focusable for exactly this; Tab from here goes to the
     * first control, which is where it was going anyway.
     */
    node.focus({ preventScroll: true });
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
              className="hbw-win hbw-tool"
              role="dialog"
              aria-modal="true"
              aria-label="Poster"
              tabIndex={-1}
              data-layer={onOwnLayer ? "own" : undefined}
              data-going={going ? "true" : undefined}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="hbw-win__top">
                <p className="hbw-m">Poster</p>
                {/* Not a second "Close" two pixels under the nav's own. */}
                <button type="button" onClick={shut}>
                  Close poster
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
