"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HBW_EASE, HBW_T, reduceMotion } from "@/components/home/motion";
import { INDEX_MARKS } from "@/components/home/index-marks";
import type { IndexEntry } from "@/components/home/index-entry";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * Where the reader was. Opening a project unmounts the panel, so the place has
 * to live outside it — otherwise you come back to the index at the top, having
 * lost the row you were reading.
 */
let lastPlace = 0;

/**
 * The mark to show behind a row: the logotype uploaded to the CMS, or the one
 * committed with the site until that project has one. Both arrive already
 * stripped to a single colour.
 */
function markFor(entry: IndexEntry) {
  return entry.mark ?? INDEX_MARKS[entry.id] ?? null;
}

type Props = {
  /** The record, read from the CMS on the server. */
  entries: IndexEntry[];
  span: { count: number; from: number; to: number };
  leaving: boolean;
  /** Coming back from a project opened here: resume, do not arrive. */
  resuming?: boolean;
  onClose: () => void;
  /** Opens a featured project's case study from its row. */
  onOpen: (id: string) => void;
};

/**
 * The index, on the Poster's own page: the whole record, not only the six on
 * the line. It rises from the bottom and is closed from the nav, the same way
 * Studio does, because it is a second full surface rather than a second site.
 *
 * Reading is the point, so the list is quiet: four columns, a hairline a row,
 * newest first. Resting on a row drops the rest of the list away and brings
 * that client's logotype up behind it in the page's own ink — the proof
 * arrives before you have read a word of it. Rows with no mark simply show
 * none. There is no hover on a phone, so the mark follows the row nearest the
 * middle of the screen instead.
 */
export function IndexDetail({ entries, span, leaving, resuming = false, onClose, onOpen }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);
  const [mark, setMark] = useState<string | null>(null);
  const [touch, setTouch] = useState(false);
  /** The control that opened the index; focus goes back to it on the way out. */
  const opener = useRef<HTMLElement | null>(null);
  /** A row hands focus to the project it opens, so the panel must not claim it back. */
  const handingOver = useRef(false);

  // Arrive: the same rise as Studio, from the bottom edge, whole.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;
    opener.current = document.activeElement as HTMLElement | null;
    root.focus({ preventScroll: true });
    // Come back to the row you were reading, not to the top of the list.
    // Setting it now is clamped to 0: the panel rises from below and the list
    // has no scrollable height until it has been laid out. Re-apply on the
    // next frame, once there is somewhere to scroll to.
    if (lastPlace) {
      const place = lastPlace;
      const put = () => {
        const page = pageRef.current;
        if (page) page.scrollTop = place;
      };
      put();
      requestAnimationFrame(() => {
        put();
        requestAnimationFrame(put);
      });
    }
    if (reduceMotion()) return;
    // Returning from a project is a resumption: the list was already open and
    // behind the viewer, so it settles back rather than rising from the bottom
    // again. Rising a second time reads as a performance, not a machine.
    if (resuming) {
      // A plain ease, not the spatial one: cubic-bezier(0.16, 1, 0.3, 1) is so
      // front-loaded that a fade is 60% done in the first frame and reads as a
      // flash rather than a fade.
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: HBW_T.spatial, easing: HBW_EASE });
      return;
    }
    root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: HBW_T.spatial, easing: EASE });
    panel.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 600, easing: EASE });
    // Mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leave: the shell unmounts after HBW_T.spatial.
  useEffect(() => {
    if (!leaving || reduceMotion()) return;
    rootRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: HBW_T.spatial, easing: EASE, fill: "forwards" });
    panelRef.current?.animate([{ transform: "none" }, { transform: "translateY(100%)" }], {
      duration: HBW_T.spatial,
      easing: EASE,
      fill: "forwards",
    });
  }, [leaving]);

  // The head takes its width from the nav group above it, so the edges agree.
  useLayoutEffect(() => {
    const page = pageRef.current;
    const group = document.querySelector<HTMLElement>(".hbw-pills .hbw-pill-group");
    if (!page || !group) return;
    const measure = () => page.style.setProperty("--index-w", `${Math.round(group.offsetWidth)}px`);
    measure();
    const sizes = new ResizeObserver(measure);
    sizes.observe(group);
    return () => sizes.disconnect();
  }, []);

  useLayoutEffect(() => {
    setTouch(window.matchMedia("(hover: none)").matches);
  }, []);

  /**
   * Record the place as it is read. Reading it at unmount is too late: the
   * panel has already collapsed by then and scrollTop is back at 0.
   */
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const keep = () => {
      lastPlace = page.scrollTop;
    };
    page.addEventListener("scroll", keep, { passive: true });
    return () => page.removeEventListener("scroll", keep);
  }, []);

  // Hand focus back to whatever opened the index, unless a row is taking it.
  useEffect(
    () => () => {
      if (handingOver.current) return;
      const back = opener.current;
      if (back && document.contains(back)) back.focus({ preventScroll: true });
    },
    []
  );

  /** No pointer to rest: the mark follows the row nearest the middle instead. */
  useEffect(() => {
    const page = pageRef.current;
    const rows = rowsRef.current;
    if (!touch || !page || !rows) return;
    let raf = 0;
    const nearest = () => {
      raf = 0;
      const box = page.getBoundingClientRect();
      const middle = box.top + box.height / 2;
      let best: string | null = null;
      let closest = Infinity;
      for (const row of rows.querySelectorAll<HTMLElement>("[data-mark]")) {
        const r = row.getBoundingClientRect();
        if (r.bottom < box.top || r.top > box.bottom) continue;
        const gap = Math.abs(r.top + r.height / 2 - middle);
        if (gap < closest) {
          closest = gap;
          best = row.dataset.mark ?? null;
        }
      }
      setMark(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(nearest);
    };
    nearest();
    page.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      page.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [touch]);

  const rest = (id: string | null) => {
    if (!touch) setMark(id);
  };

  return (
    <div ref={rootRef} className="hbw-detail hbw-detail--index" role="dialog" aria-modal="true" aria-label="Index" tabIndex={-1}>
      <button type="button" className="hbw-detail__scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <article ref={panelRef} className="hbw-viewer hbw-viewer--index" aria-label="Index">
        <div className="hbw-viewer__body">
          <div ref={pageRef} className="hbw-index" tabIndex={-1}>
            {/* The marks sit behind the list, in the page's own ink. */}
            <div className="hbw-index__marks" aria-hidden="true">
              {entries.map((entry) => {
                const m = markFor(entry);
                if (!m) return null;
                return (
                  <svg
                    key={entry.id}
                    className={`hbw-index__mark${mark === entry.id ? " is-on" : ""}`}
                    style={entry.markScale ? { scale: String(entry.markScale) } : undefined}
                    viewBox={m.viewBox}
                    preserveAspectRatio="xMidYMid meet"
                    fill="currentColor"
                    /* Stripped of scripts and colour on the server, never in the browser. */
                    dangerouslySetInnerHTML={{ __html: m.body }}
                  />
                );
              })}
            </div>

            <div className="hbw-index__head">
              <h2 className="hbw-index__title">Index</h2>
              <p className="hbw-index__span">
                {span.count} {span.count === 1 ? "project" : "projects"} · {span.from}–{span.to}
              </p>
            </div>

            <div className="hbw-index__cols hbw-index__grid" aria-hidden="true">
              <span>Project</span>
              <span className="hbw-index__w">Work</span>
              <span className="hbw-index__s">Sector</span>
              <span>Year</span>
            </div>

            <div
              ref={rowsRef}
              className={`hbw-index__rows${mark ? " is-resting" : ""}`}
              onMouseLeave={() => rest(null)}
            >
              {entries.map((row) => {
                const has = Boolean(markFor(row));
                const inside = (
                  <>
                    <span className="hbw-index__name">
                      {row.name}
                      {row.idea ? <span className="hbw-index__idea"> {row.idea}</span> : null}
                      {/* The site already means "this goes somewhere" by an arrow.
                          A row without one is a record, and says so by omission
                          rather than by announcing itself unfinished. */}
                      {row.featured ? (
                        <span className="hbw-index__go" aria-hidden="true">
                          ↗
                        </span>
                      ) : null}
                    </span>
                    <span className="hbw-index__w">{row.work}</span>
                    <span className="hbw-index__s">{row.sector}</span>
                    <span className="hbw-index__y">{row.year}</span>
                  </>
                );
                const shared = {
                  "data-mark": has ? row.id : undefined,
                  className: `hbw-index__row hbw-index__grid${mark === row.id ? " is-on" : ""}`,
                  onMouseEnter: () => rest(has ? row.id : null),
                };
                // An entry with no case study is a record, not a control: it
                // stays out of the tab order rather than offering a dead click.
                return row.featured ? (
                  <button
                    key={row.id}
                    type="button"
                    {...shared}
                    onFocus={() => rest(has ? row.id : null)}
                    onClick={() => {
                      handingOver.current = true;
                      onOpen(row.id);
                    }}
                  >
                    {inside}
                  </button>
                ) : (
                  <div key={row.id} {...shared}>
                    {inside}
                  </div>
                );
              })}
            </div>

            <p className="hbw-index__foot">Older work joins this list as it is catalogued.</p>
          </div>
        </div>
      </article>
    </div>
  );
}
