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
import { useNavSettled } from "@/components/site/navSettled";

export function Bar({
  here,
  says,
}: {
  here?: "work" | "practice" | "talk" | "conversations";
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




  /**
   * Refresh runs the outro first.
   *
   * A reload cannot be held open — beforeunload is not allowed to delay a
   * teardown for an animation, by design, and nothing written here changes
   * that. What can be done is to take the gesture before the browser does:
   * the keystroke is caught, the site is asked to leave, and the reload is
   * called when it has. The page still reloads, a quarter of a second
   * later, and the landing sequence then runs from the top.
   *
   * This covers the keyboard — the way a refresh is almost always asked
   * for — and not the toolbar button or the menu, which the page is never
   * told about until it is already going. Those still reload at once.
   *
   * With movement stood down there is nothing to watch, so the reload is
   * immediate; and if anything here were to throw, the backstop reloads
   * anyway, because a refresh that does not refresh is worse than one
   * without a sequence.
   */
  /**
   * The site leaves, and then does whatever it was leaving for.
   *
   * One piece of code for both ways of asking — the keystroke below and the
   * mark in the chrome — so the two can never run different outros. Returns
   * whether it took the job, because the keystroke only cancels the
   * browser's own reload if the sequence is actually going to happen.
   */
  const outro = useCallback((then: () => void) => {
    const root = document.documentElement;
    if (root.dataset.leaving === "true") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    root.dataset.leaving = "true";
    const raw = Number.parseFloat(getComputedStyle(root).getPropertyValue("--out"));
    const out = Number.isFinite(raw) && raw > 0 ? raw * (raw < 20 ? 1000 : 1) : 240;
    window.setTimeout(then, out + 320);
    return true;
  }, []);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const asked =
        event.key === "F5" ||
        ((event.key === "r" || event.key === "R") && (event.metaKey || event.ctrlKey));
      if (!asked || event.altKey) return;
      if (outro(() => window.location.reload())) event.preventDefault();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [outro]);

  /**
   * Shuts the studio, and will do something afterwards if asked.
   *
   * Home and the mark were plain links: with the studio open they took the
   * whole sheet away in the same frame the page changed, which is the one
   * move this site does not make. They ask for the sheet to leave first and
   * hand over what to do when it has.
   */
  const close = useCallback((then?: () => void) => {
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
      then?.();
    }, ms + 220);
  }, []);




  /**
   * Back to the start, as one sequence.
   *
   * With the studio open the sheet leaves first, the way it does for every
   * other way out of it, and only then does the page change — and a page
   * change is the landing sequence, so the chrome arrives and the work
   * follows it in. Already at home there is nothing to go to: shutting the
   * sheet is the whole of it.
   */
  const home = useCallback(
    (event: { preventDefault: () => void }) => {
      if (studio) {
        event.preventDefault();
        close(() => {
          if (window.location.pathname !== "/") window.location.assign("/");
        });
        return;
      }
      /*
       * Already home: the mark runs the site again.
       *
       * It is the one control in the chrome with nothing to do — a link to
       * the page you are standing on — and it is the site's own name, which
       * makes it the right thing to press to watch the site introduce
       * itself. It still goes where it says it goes; it just takes the
       * site's leaving with it on the way, and the landing sequence then
       * runs from nothing.
       *
       * The toolbar's reload and the menu's cannot be caught — a page is
       * never told about those until it is already going — so this is the
       * way to ask for the whole sequence on purpose.
       */
      if (window.location.pathname !== "/") return;
      if (outro(() => window.location.reload())) event.preventDefault();
    },
    [close, outro, studio]
  );

  /**
   * Back to the work, as one sequence.
   *
   * The same ending wherever it is pressed: whatever is on screen leaves
   * before the page changes, so there is never a swap. A sheet over the
   * work shuts first and the page follows it; away from the front page the
   * site plays its leaving and then goes; standing on the front page there
   * is nowhere to go, so it runs the site again — the whole sequence from
   * nothing, which is the one thing a link to the page you are on can
   * usefully do.
   */
  const toWork = useCallback(
    (event: React.MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      if (studio) {
        event.preventDefault();
        close(() => {
          if (window.location.pathname !== "/") window.location.assign("/");
        });
        return;
      }
      const away = window.location.pathname !== "/";
      const then = () => (away ? window.location.assign("/") : window.location.reload());
      if (outro(then)) event.preventDefault();
    },
    [close, outro, studio]
  );

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
  /**
   * Whether the bar has finished arriving.
   *
   * --enter-type holds the words back while the row they sit in is being
   * built, which is right on a landing and wrong forever after: the span is
   * keyed on what it says, so a name turning over mid-session remounts and
   * plays that four-hundred-millisecond wait again — in a bubble that is
   * already there, with no row being built behind it. Measured, the bar then
   * read as "still moving" for most of a second after every name change, and
   * everything that waits for the nav waited on a word that was not doing
   * anything yet.
   *
   * It is the same question the sheet asks, asked by the bar about itself:
   * once it has stopped, it has landed, and the words stop waiting.
   */
  const landed = useNavSettled();
  const markRef = useRef<HTMLAnchorElement>(null);
  const markWidth = useRef(0);
  /**
   * A sheet is up.
   *
   * The mark and the line belong to the room, not to its contents, so while
   * a sheet is open the bar keeps saying the studio's name and the studio's
   * line — the two things in the nav that are supposed to be the fixed point
   * while everything under them changes. Standing in one project is the only
   * state that names a project.
   */
  const sheet = studio !== null;
  const saying = sheet ? "studio" : (over?.name ?? "home");
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
    /* The quicker beat: this only ever runs because a name changed, which
       is a word turning over in a bubble that stays where it is — not a
       thing arriving. At an --in it was the longest move in the nav, and
       everything that waits for the nav waited for it. */
    el.style.transition = "width var(--out) var(--ease)";
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
      <header className="hbw-bar" data-landed={landed ? "true" : undefined}>
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
          <a href="/" ref={markRef} onClick={home}>
            <span key={saying} className="hbw-bar__said">
              {sheet || !over ? "How by Why" : over.name}
            </span>
          </a>
        </p>
        <nav className="hbw-bar__nav" aria-label="Site">
          {/*
            Work, where Home used to be.

            It says the same thing as the mark in the middle of the same row,
            which is the objection to it — but the mark is the studio's name
            and reads as the studio, and the row needs a word for the thing
            the page is actually showing. So it is named for the work and it
            goes to the work.
          */}
          <a href="/" aria-current={here === "work" ? "page" : undefined} onClick={toWork}>
            Work
          </a>
          <a
            href="/practice"
            aria-current={here === "practice" ? "page" : undefined}
            onClick={(event) => {
              if (studio) {
                event.preventDefault();
                close();
                return;
              }
              openAt(event, "#studio");
            }}
          >
            {/* In the studio already: the same shoulder is the way back out,
                rather than a second word for the same place. */}
            {/*
              About, not Practice.
              
              Practice is now a page of its own — the long version, reached
              from the foot of this sheet — and the nav was using the same
              word for the sheet that opens over the work. One word, two
              places, and the deeper one unreachable by name. The shoulder
              says what it opens: the studio, about it.
            */}
            {studio ? "Close" : "About"}
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
          data-over={!sheet && over ? "true" : undefined}
          data-studio={sheet ? "true" : undefined}
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
              {sheet ? (
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
              {over && !sheet ? (
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
      {/*
        The room, and what is in it.
        
        The sheet is the room and the body is its contents, keyed separately:
        the body arriving is a new element with an arrival of its own rather
        than the old one's contents swapped, and the room itself stays put
        underneath. Keying the room as well meant it went and came back, and
        with the nav sitting above it the whole page read as changing.
      */}
      {studio ? (
        <Sheet
          label="About"
          onClose={close}
          panel="hbw-studio-sheet__panel--split"
          bare
          going={going}
        >
          <StudioBody start={studio.at} />
        </Sheet>
      ) : null}
    </>
  );
}
