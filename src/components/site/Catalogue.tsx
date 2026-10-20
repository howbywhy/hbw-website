"use client";

/**
 * A contact sheet per project.
 *
 * Square cells, one hairline apart, as small as still reads. A portfolio that
 * shows nine big pictures per job asks for nine decisions; a sheet asks for
 * one — is this worth opening — which is the only decision this page is for.
 *
 * Film is in the cell but costs nothing until a pointer arrives: preload none,
 * the still showing until it runs. Whole sheets of autoplaying loops are what
 * made the old site pull twenty-six megabytes.
 */
import { useRef, type CSSProperties } from "react";
import type { GalleryProject } from "@/sanity/load-gallery";

/**
 * How much of the strip the page should treat as already in front of someone.
 *
 * Eighty-eight cells fit above the fold at 1440x900, so this covers that with
 * a little headroom. It is a number about a screen, not about a project, and
 * it is only the difference between fetching now and fetching when scrolled
 * to — each cell is about thirty kilobytes.
 */
const ON_FIRST_SCREEN = 96;

/**
 * And the handful worth jumping the queue for. `fetchPriority="high"` is a
 * way of saying "before the others"; saying it about ninety-six things says
 * nothing at all.
 */
const LEAD = 12;

function Cell({
  project,
  frame,
  i,
  onOpen,
  onNear,
  echo,
  films,
  eager,
  first,
  warm,
  behind,
}: {
  project: GalleryProject;
  frame: GalleryProject["frames"][number];
  i: number;
  onOpen: (slug: string, at: number) => void;
  /** A pointer has reached this cell: worth fetching what it opens. */
  onNear?: (slug: string) => void;
  /** On the loop's second turn: scenery, so nothing in here takes focus. */
  echo?: boolean;
  /**
   * The frames a visitor is actually looking at when the page lands.
   *
   * Everything in the catalogue is lazy, which is right for a page nine
   * thousand pixels tall — but the strip the page opens on is not below the
   * fold, it IS the fold, and left lazy it queued behind the rest. On a cold
   * connection that is a screen of empty cells for several seconds before
   * the work appears. These are asked for first.
   */
  eager?: boolean;
  /**
   * Whether this copy of the catalogue carries the films.
   *
   * The loop prints the work three times so it can wrap without a seam, and
   * every copy was carrying its own <video> — fourteen files fetched three
   * times over, 42 elements, most of a megabyte on the front page and a
   * third of fifteen on a project. The reader is held on the middle turn, so
   * that is the copy that gets them; the other two show the still, which is
   * what they were showing anyway behind the blur.
   */
  films?: boolean;
  /** Among the few at the very top: fetch it before the rest. */
  first?: boolean;
  /** The one film that can actually play on landing. */
  warm?: boolean;
  /** Whether a gallery is covering this cell, so it is not worth fetching. */
  behind?: boolean;
}) {
  const film = useRef<HTMLVideoElement>(null);
  /*
   * A cell that has shown its picture once keeps it.
   *
   * Otherwise opening a project would throw away the whole strip a visitor
   * had just been looking at, and closing it would fetch the lot again.
   * `behind` is about not starting work, never about undoing it.
   */
  const shown = useRef(false);
  if (!behind) shown.current = true;
  const carry = shown.current || !behind;
  return (
    <a
      className="hbw-cell"
      // Still a real address: the gallery opens here, but the project has a
      // page of its own for a crawler, a shared link and a middle click.
      href={`/projects/${project.slug}?f=${i + 1}`}
      aria-label={`${project.name} — ${project.idea}`}
      onPointerEnter={onNear ? () => onNear(project.slug) : undefined}
      onFocus={onNear ? () => onNear(project.slug) : undefined}
      tabIndex={echo ? -1 : undefined}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        onOpen(project.slug, i);
      }}
      /*
       * Hover no longer runs the film.
       *
       * Film plays because its project is the one you are in, and a pointer
       * passing over a cell was pausing it on the way out — so a film that
       * had started correctly stopped the moment the cursor left it and
       * nothing ever started it again. Whether a project is live is the
       * page's business, not the mouse's.
       */
    >
      <img
        /*
         * No source while a gallery covers the window.
         *
         * A project page is the gallery, which is the full window, and this
         * strip is behind it. Marking it lazy was not enough: lazy defers
         * what is far down the page, and these sit at the height of the
         * window — so about seventy of them came down anyway, two to three
         * megabytes of pictures nobody could see, competing with the ones
         * the visitor was waiting for. A cell with no source asks for
         * nothing. The square is laid out either way, so nothing moves.
         */
        src={carry ? frame.src : undefined}
        srcSet={carry ? frame.srcset : undefined}
        /* A cell is about a ninth of the screen on a sheet, a quarter on a
           phone. The browser picks the width it will actually draw. */
        sizes="(max-width: 760px) 25vw, 11vw"
        alt={frame.alt ?? ""}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={first ? "high" : undefined}
        decoding="async"
      />
      {frame.video && films && carry ? (
        <video
          ref={film}
          /*
           * Metadata for the one film that can run, nothing for the rest.
           *
           * Asked to play with no data at all, a film has to fetch before it
           * can start, so the one a visitor lands in front of still fetches
           * ahead. That used to mean every film of the first project — and
           * Work only ever runs the first film of the project being read, so
           * the other three were fetched and never played. On a launch made
           * mostly of film that was seven and a half megabytes of video on
           * every page of the site, against a quarter of a megabyte of the
           * pictures the visitor could actually see.
           */
          preload={warm ? "metadata" : "none"}
          poster={frame.src}
          muted
          loop
          playsInline
        >
          {frame.webm ? <source src={frame.webm} type="video/webm" /> : null}
          <source src={frame.video} type="video/mp4" />
        </video>
      ) : null}
    </a>
  );
}

export function Catalogue({
  projects,
  onOpen,
  onNear,
  pass = 0,
  behind = false,
}: {
  projects: GalleryProject[];
  /** Each project's logotype, rendered on the server. */
  /** Open this project's gallery over the sheet, on this frame. */
  onOpen: (slug: string, at: number) => void;
  /** Told when a pointer reaches a cell, so its project can be fetched. */
  onNear?: (slug: string) => void;
  /**
   * Which turn of the loop this is.
   *
   * The page runs round, so the work is laid out twice: the second turn is
   * what the first one scrolls into, and the scroll is sent back a turn at the
   * seam. Only the first is the page's content — the second is scenery, so it
   * is out of the reading order and out of the tab order, and its headings
   * carry their own ids rather than a second copy of the first's.
   */
  pass?: number;
  /**
   * Whether something is standing in front of the whole strip — a project's
   * gallery, which covers the window. Nothing behind it is being looked at,
   * so nothing behind it is worth fetching ahead.
   */
  behind?: boolean;
}) {
  const echo = pass > 0;
  /*
   * How far down the turn each cell sits, counted across projects.
   *
   * The landing screen used to mean "every cell of the first project", which
   * worked while the first project happened to be a long one. It is now an
   * eight-frame launch, so eight of the eighty-eight cells a visitor can see
   * at 1440x900 were loading eagerly and the other eighty arrived late — the
   * strip filling in under the eye instead of being there.
   *
   * Counted properly it does not matter how long the first project is.
   */
  let seen = 0;
  return (
    <>
      {projects.map((project, row) => {
        const from = seen;
        seen += project.frames.length;
        return (
        <section
          key={`${pass}-${project.slug}`}
          aria-labelledby={echo ? undefined : `p-${project.slug}`}
          aria-hidden={echo || undefined}
          data-project={project.slug}
        >
          {/*
            One line above the pictures: the name, what the job was, and what
            was done. All three set the same — they are one sentence about one
            project, and three different treatments on one line made them look
            like three different kinds of thing. The heading is still a
            heading and still names the section; it just stopped shouting.
          */}
          <div className="hbw-band">
            <h2 id={echo ? undefined : `p-${project.slug}`} className="hbw-chip" style={{ margin: 0 }}>
              <a
                href={`/projects/${project.slug}`}
                /*
                 * The name, then the year, and both of them visible.
                 *
                 * This was the year alone, with the name carried in an
                 * aria-label — so the front page of a design studio named
                 * not one of the seven projects on it in readable text, and
                 * its seven headings each said a number. A reader scrolling
                 * the catalogue could see the work and the writing about it
                 * and had no way to learn what any of it was called.
                 *
                 * The label goes with it: the link says its own name now, so
                 * a second one in an attribute is the same words twice.
                 */
                tabIndex={echo ? -1 : undefined}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                  event.preventDefault();
                  onOpen(project.slug, 0);
                }}
              >
                {project.name} — {project.year}
              </a>
            </h2>
            <p className="hbw-cat__say">{project.says}</p>
          </div>
          {/*
            Its place in the running order, for the stylesheet.

            The rows are held until the first screen has decoded and then
            uncovered one behind the next, so each needs to know how far
            down the order it is. Counted here because this is where the
            order is — a stylesheet can only count siblings, and these are
            siblings of their own section, not of each other.
          */}
          <div className="hbw-sheet" style={{ "--r": row } as CSSProperties}>
            {/*
              No mark at the head of the row.

              Every row opened with the project's logotype reversed out of a
              black box, which is the one thing in the strip that is not the
              work: six black rectangles down the front page, each announcing
              a project that the row beneath it then shows. The name is
              already said twice over — in the chrome as you reach the row,
              and on the line above it — so the row starts at the work.
            */}
            {project.frames.map((frame, i) => (
              <Cell
                key={`${project.slug}-${i}`}
                project={project}
                frame={frame}
                i={i}
                onOpen={onOpen}
                onNear={onNear}
                echo={echo}
                films={pass === 1}
                /* The middle turn is where the page lands. */
                eager={!behind && pass === 1 && from + i < ON_FIRST_SCREEN}
                first={!behind && pass === 1 && from + i < LEAD}
                /*
                 * Only the first film of the first project can ever run on
                 * landing — Work plays one film per project, and only for the
                 * project being read — so it is the only one worth fetching
                 * ahead. Four of them doing it put seven and a half megabytes
                 * of video on every page of the site against a quarter of a
                 * megabyte of the pictures a visitor was actually looking at.
                 */
                warm={!behind && pass === 1 && project.slug === projects[0]?.slug && i === 0}
                behind={behind}
              />
            ))}
          </div>
        </section>
        );
      })}
    </>
  );
}
