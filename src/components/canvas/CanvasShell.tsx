"use client";

/**
 * The front door.
 *
 * Deliberately not HbwShell. That file is seventeen hundred lines of faces,
 * panels, swaps and parked positions, and every new idea routed through it
 * arrived wearing the old site's clothes. This holds one page, four states and
 * nothing else, and the case studies underneath are untouched.
 *
 * The page is white paper over the whole body of work. Marking it uncovers the
 * work; what you uncover can be opened, or carried into the Poster and sent.
 * Work and Contact open over the top. Studio is a page of its own and stays
 * one.
 *
 * None of that is load-bearing for reading the site: the links are in the
 * markup, the index opens without a pointer, and anyone who would rather not
 * play has one button that takes all the paper off.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PosterTool } from "@/components/home/PosterTool";
import { uid } from "@/components/home/poster/paint";
import type { ImageObject } from "@/components/home/poster/types";
import { workspace } from "@/components/home/workspace";
import type { ProjectRecord } from "@/components/home/catalog";
import type { WallTile } from "@/sanity/load-wall";
import { RevealField, type RevealHandle } from "@/components/canvas/RevealField";
import { ReachSheet } from "@/components/canvas/ReachSheet";

type Over = { name: string; idea: string; year: string } | null;

export function CanvasShell({ tiles, projects }: { tiles: WallTile[]; projects: ProjectRecord[] }) {
  const router = useRouter();
  const field = useRef<RevealHandle | null>(null);
  const [touched, setTouched] = useState(false);
  /** Something is on the page — by a visitor's hand or the page's own. */
  const [marks, setMarks] = useState(false);
  const [over, setOver] = useState<Over>(null);
  const [sheet, setSheet] = useState<"reach" | null>(null);
  const [poster, setPoster] = useState(false);

  const onTouch = useCallback(() => setTouched(true), []);

  /**
   * Contact is a sheet, not a page, so other pages reach it by hash. Arriving
   * on /#contact opens it; closing it puts the address back so a reload or a
   * back button does not reopen what was just shut.
   */
  useEffect(() => {
    const open = () => {
      if (window.location.hash === "#contact") setSheet("reach");
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);

  const shut = useCallback(() => {
    setSheet(null);
    if (window.location.hash === "#contact") {
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);
  const onMarks = useCallback(() => setMarks(true), []);

  /**
   * The page makes the first mark itself.
   *
   * A blank white page with no affordance is a page people leave. One stroke,
   * drawn unprompted, says what this is and shows a piece of the work while
   * saying it. It never runs if someone has already started, and never on a
   * reduced-motion setting — there the paper simply comes off.
   */
  useEffect(() => {
    if (touched) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      if (field.current?.hasMarks()) return;
      if (reduced) field.current?.revealAll();
      else field.current?.demo();
    }, reduced ? 400 : 1700);
    return () => window.clearTimeout(timer);
  }, [touched]);

  /** Carry what is on the page into the Poster as its starting picture. */
  function intoPoster() {
    const shot = field.current?.snapshot();
    if (shot) {
      const image: ImageObject = {
        id: uid(),
        kind: "image",
        // Full width, a little down from the top. The Poster can move it.
        nx: 0,
        ny: 0.06,
        nw: 1,
        ratio: window.innerWidth / Math.max(1, window.innerHeight),
        cx: 50,
        cy: 40,
        src: shot,
        mime: "image/png",
      };
      // The Poster reads this store when it mounts, so seeding it beforehand
      // hands the picture over without reaching inside a 1700-line component.
      workspace.poster = { ...workspace.poster, objects: [...workspace.poster.objects, image] };
    }
    setPoster(true);
  }

  const line = over ? `${over.name} — ${over.idea}, ${over.year}` : null;

  return (
    <div className="hbw-canvas">
      <RevealField
        tiles={tiles}
        handle={field}
        onTouch={onTouch}
        onMarks={onMarks}
        onOpen={(slug) => router.push(`/projects/${slug}`)}
        onOver={(tile) => setOver(tile && { name: tile.name, idea: tile.idea, year: tile.year })}
      />

      <header className="hbw-canvas__top">
        <p className="hbw-canvas__mark">How by Why</p>
        <nav className="hbw-canvas__nav" aria-label="Site">
          <a href="/work">Work</a>
          <a href="/studio">Studio</a>
          <button type="button" onClick={() => setSheet("reach")} aria-haspopup="dialog">
            Contact
          </button>
        </nav>
      </header>

      {/* The one line on the page, and then the work's own line in its place. */}
      <p className={`hbw-canvas__say${touched ? " is-gone" : ""}`} aria-live="polite">
        Clarity for brands at a turning point.
        <span className="hbw-canvas__grey"> Drag anywhere.</span>
      </p>
      <p className={`hbw-canvas__read${line ? " is-on" : ""}`} aria-live="polite">
        {line ?? " "}
      </p>

      <div className={`hbw-canvas__bar${marks ? " is-on" : ""}`}>
        <button type="button" onClick={() => field.current?.clear()}>
          Clear
        </button>
        <button type="button" onClick={() => field.current?.revealAll()}>
          Show everything
        </button>
        <button type="button" className="hbw-canvas__send" onClick={intoPoster}>
          Make something of it
        </button>
      </div>

      {/*
        The work, in the markup, whether or not anyone ever marks the page.
        A crawler and a keyboard get a plain list; a pointer gets the paper.
      */}
      <nav className="hbw-canvas__plain" aria-label="Projects">
        <h1>How by Why — clarity for brands at a turning point</h1>
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <a href={`/projects/${project.id}`}>
                {project.name} — {project.idea}, {project.year}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {sheet === "reach" ? (
        <ReachSheet
          onClose={shut}
          onPoster={() => {
            shut();
            intoPoster();
          }}
        />
      ) : null}

      {poster ? (
        <div className="hbw-canvas__poster" role="dialog" aria-modal="true" aria-label="Poster">
          <button type="button" className="hbw-canvas__shut" onClick={() => setPoster(false)}>
            Close
          </button>
          <PosterTool />
        </div>
      ) : null}
    </div>
  );
}
