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
import { useRef } from "react";
import type { GalleryProject } from "@/sanity/load-gallery";

function Cell({
  project,
  frame,
  i,
  onOpen,
  echo,
  films,
  eager,
}: {
  project: GalleryProject;
  frame: GalleryProject["frames"][number];
  i: number;
  onOpen: (slug: string, at: number) => void;
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
}) {
  const film = useRef<HTMLVideoElement>(null);
  return (
    <a
      className="hbw-cell"
      // Still a real address: the gallery opens here, but the project has a
      // page of its own for a crawler, a shared link and a middle click.
      href={`/projects/${project.slug}?f=${i + 1}`}
      aria-label={`${project.name} — ${project.idea}`}
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
        src={frame.src}
        srcSet={frame.srcset}
        /* A cell is about a ninth of the screen on a sheet, a quarter on a
           phone. The browser picks the width it will actually draw. */
        sizes="(max-width: 760px) 25vw, 11vw"
        alt={frame.alt ?? ""}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
      />
      {frame.video && films ? (
        <video
          ref={film}
          /*
           * Metadata for the films on the strip the page opens on, nothing
           * for the rest.
           *
           * Asked to play with no data at all, a film has to fetch before it
           * can start, and the pass that asks it is long over by then — so
           * the ones a visitor lands in front of still fetch their metadata.
           * Every film in the turn doing it meant fourteen video requests
           * competing with the pictures on a cold connection, and the screen
           * stayed empty while the films nobody was looking at loaded first.
           */
          preload={eager ? "metadata" : "none"}
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
  pass = 0,
}: {
  projects: GalleryProject[];
  /** Each project's logotype, rendered on the server. */
  /** Open this project's gallery over the sheet, on this frame. */
  onOpen: (slug: string, at: number) => void;
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
}) {
  const echo = pass > 0;
  return (
    <>
      {projects.map((project) => (
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
                 * The name first, then the year.
                 *
                 * The year is what is set on the page, and the name was a
                 * hidden word after it — so every link on the front page was
                 * announced as "2025 SCK", six of them, each led by a number.
                 * Read aloud it is the project and its year, in that order;
                 * seen, it is still just the year.
                 */
                aria-label={`${project.name} — ${project.year}`}
                tabIndex={echo ? -1 : undefined}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                  event.preventDefault();
                  onOpen(project.slug, 0);
                }}
              >
                {project.year}
              </a>
            </h2>
            <p className="hbw-cat__say">{project.says}</p>
          </div>
          <div className="hbw-sheet">
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
                echo={echo}
                films={pass === 1}
                /* The middle turn's first project is where the page lands. */
                eager={pass === 1 && project.slug === projects[0]?.slug}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
