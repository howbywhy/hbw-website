"use client";

/**
 * The bar, and the studio sheet it opens.
 *
 * Three things set as plain type: where you can go, the name, and a right slot
 * that a page can fill with its own heading.
 *
 * Studio is a sheet rather than a page, so the link opens it in place and sets
 * #studio — linkable, and the back button closes it. The href stays /studio so
 * the real page answers without JavaScript and for a crawler.
 */
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Sheet } from "@/components/site/Sheet";
import { StudioBody } from "@/components/site/StudioBody";

export function Bar({
  here,
  says,
}: {
  here?: "work" | "studio" | "contact";
  /**
   * The page's line for the right-hand slot. The gallery borrows the same slot
   * while it is open, to name the project it is showing.
   */
  says?: ReactNode;
}) {
  /**
   * The studio sheet, and which part of it opened.
   *
   * Contact is a part of the studio rather than a place of its own: the link
   * opens the sheet at it. The address still says which, so the back button
   * closes it and a link to #contact lands on it.
   */
  const [studio, setStudio] = useState<null | { at?: string }>(null);

  useEffect(() => {
    const look = () => {
      const hash = window.location.hash;
      if (hash === "#studio") setStudio({});
      else if (hash === "#contact") setStudio({ at: "contact" });
      else setStudio(null);
    };
    look();
    window.addEventListener("hashchange", look);
    return () => window.removeEventListener("hashchange", look);
  }, []);

  /*
   * The studio leaves the way it arrives.
   *
   * Closing simply unmounted it: the whole sheet, its five blocks and the
   * picture beside them vanished between one frame and the next, which is
   * the one move on this site that was still a cut. It is told it is going
   * instead — the stylesheet stands its contents down in order — and only
   * then is it taken away.
   */
  const [going, setGoing] = useState(false);
  const leaving = useRef(0);

  useEffect(() => () => window.clearTimeout(leaving.current), []);

  const close = useCallback(() => {
    if (leaving.current) return;
    const out = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--out"),
    );
    const ms = Number.isFinite(out) && out > 0 ? out * (out < 20 ? 1000 : 1) : 240;
    setGoing(true);
    leaving.current = window.setTimeout(() => {
      leaving.current = 0;
      setGoing(false);
      setStudio(null);
      if (window.location.hash === "#studio" || window.location.hash === "#contact") history.back();
    }, ms + 220);
  }, []);

  /**
   * The project the page is standing in, as the page scrolls.
   *
   * The bar is the one thing always on screen, so it is where the page says
   * where you are: the mark gives its place to the project's name and the line
   * to the project's own, and both come back at the top. The page knows the
   * order of the work and the bar does not, so the page says so and this
   * listens — no wiring between two components that never meet.
   */
  const [over, setOver] = useState<null | { name: string; says: string }>(null);


  /*
   * The name eases between projects instead of snapping.
   *
   * It sits in the bar's middle column, which is sized to it — so going from
   * KOJA to Chris Sisarich the column changed width in one frame and the
   * whole lockup jumped sideways, Home and Studio with it. Measured before
   * and after, it travels the difference, the same way the Contact pill does
   * on the poster.
   */
  const markRef = useRef<HTMLAnchorElement>(null);
  const markWidth = useRef(0);
  const saying = studio ? "studio" : (over?.name ?? "home");
  useLayoutEffect(() => {
    const el = markRef.current;
    if (!el) return;
    const from = markWidth.current;
    el.style.transition = "none";
    el.style.width = "";
    const to = el.offsetWidth;
    markWidth.current = to;
    if (!from || from === to) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.style.width = `${from}px`;
    void el.offsetWidth;
    el.style.transition = "width var(--in) var(--ease)";
    el.style.width = `${to}px`;
    const done = () => {
      el.style.transition = "";
      el.style.width = "";
    };
    el.addEventListener("transitionend", done, { once: true });
    return () => el.removeEventListener("transitionend", done);
  }, [saying]);

  useEffect(() => {
    const told = (event: Event) => setOver((event as CustomEvent).detail ?? null);
    window.addEventListener("hbw:over", told);
    return () => window.removeEventListener("hbw:over", told);
  }, []);

  /** A plain click opens the sheet; a modified one is a request for the page. */
  const openAt = useCallback((event: React.MouseEvent, hash: string, at?: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    history.pushState(null, "", hash);
    setStudio({ at });
  }, []);

  return (
    <>
      <header className="hbw-bar">
        {/* The studio grows its own mark across the sheet; this one steps
            aside rather than saying the name twice, one under the other. */}
        {/*
          The mark stays up while the studio is open.

          It used to step aside on the grounds that the sheet grows a mark of
          its own — which it does on its own page, but not when the sheet is
          opened over a project. Arriving at the studio from inside a project
          you were given the project's name in the middle of the bar, the
          project's line under it and no logo at all: the studio, wearing
          somebody else's name.
        */}
        <p className="hbw-bar__mark">
          {/*
            Keyed, like the line under it, so the name arrives when it comes
            back as well as when it leaves. React was editing the text of the
            element already standing there, which is a change with nothing to
            animate: the project's name swept in on the way down the page and
            the studio's name simply reappeared on the way back up.

            The key is on the words, not on the link, so the field they sit in
            stays where it is and only what it says moves.
          */}
          <a href="/" ref={markRef}>
            <span key={saying} className="hbw-bar__said">
              {studio || !over ? "How by Why" : over.name}
            </span>
          </a>
        </p>
        <nav className="hbw-bar__nav" aria-label="Site">
          <a href="/" aria-current={here === "work" ? "page" : undefined}>
            {/* Home, not Work: it is the same address either way, but from
                inside a project "Work" reads as another section to go to
                rather than the way back out of this one. */}
            Home
          </a>
          <a
            href="/studio"
            aria-current={here === "studio" ? "page" : undefined}
            onClick={(event) => (studio ? (event.preventDefault(), close()) : openAt(event, "#studio"))}
          >
            {/* In the studio already: the same shoulder is the way back out,
                rather than a second word for the same place. */}
            {studio ? "Close" : "Studio"}
          </a>
          {/*
            Contact is not a third way. It is a part of the studio — the sheet
            opens at it — and a nav that lists it as its own place says there
            are three rooms here when there are two. #contact still opens it,
            so every link to it, and the studio's own way through, still work.
          */}
        </nav>
        <div
          className="hbw-bar__what"
          data-over={!studio && over ? "true" : undefined}
          data-studio={studio ? "true" : undefined}
        >
          {/*
            The way out lives here while a sheet is open. It had a row of its
            own underneath this one, holding a single word.
          */}
          {(
            <>
              {/*
                The page's own heading stays where it is — it is the h1, and a
                page keeps its heading whatever the bar happens to be showing.
                While you are standing in a project the project's line is set
                over it and the heading is read but not seen.
              */}
              {/*
                The line under the mark, switching with it.
                
                Off to the right it was a caption riding over the pictures for
                the length of a project. Under the mark it belongs to the mark:
                the studio's positioning while you are nowhere in particular,
                and the project's while you are in one — the same swap the name
                above it makes, at the same moment.
              */}
              {/*
                Keyed on whether a project has the bar, so coming back to the
                studio's own line mounts a new element and it arrives. With a
                constant key the element only ever has its words edited, which
                is why the line left on an animation and returned without one.

                The page's own heading is wrapped in a keyed fragment rather
                than a keyed box: a fragment remounts what is inside it without
                adding a level to the row, and display: contents — the other
                way to add nothing — generates no box, so there would be
                nothing to animate.
              */}
              {/* The studio says its own line, wherever it was opened from. */}
              {studio ? (
                <p key="studio-line" className="hbw-bar__said hbw-bar__studio" style={{ margin: 0 }}>
                  Clarity for brands at a turning point.
                </p>
              ) : null}
              {says ? (
                <Fragment key={over ? "away" : "home"}>{says}</Fragment>
              ) : (
                <p key={over ? "away" : "home"} className="hbw-bar__said" style={{ margin: 0 }}>
                  Clarity for brands at a turning point.
                </p>
              )}
              {/*
                Keyed on the project, so each line is a new element and can
                arrive. Without it React edits the text of the one that is
                already there, which is a swap with nothing to animate.
              */}
              {over && !studio ? (
                <p key={over.name} className="hbw-bar__over">
                  {over.says}
                </p>
              ) : null}
            </>
          )}
        </div>
      </header>

      {/* The same shell as a project's information: one way of opening, one
          way of closing, one set of behaviours. */}
      {studio ? (
        <Sheet label="Studio" onClose={close} panel="hbw-studio-sheet__panel--split" bare going={going}>
          <StudioBody start={studio.at} />
        </Sheet>
      ) : null}
    </>
  );
}
