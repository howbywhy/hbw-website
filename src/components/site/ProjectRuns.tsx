"use client";

/**
 * One project, and the way into the next.
 *
 * It used to run on into the project after it, fetching as you scrolled. That
 * put two marks on one page fighting over which was stuck, made the chrome
 * follow a moving target, and meant a visitor never chose anything — they
 * simply ended up somewhere. A case study is one project now, and the next one
 * is a door at the end of it.
 *
 * That door is the next project's mark on black, carrying the same name the
 * next page carries, so clicking it grows into that project exactly as
 * clicking it from the catalogue does. One motion for entering a project,
 * wherever you enter it from.
 */
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { Movement } from "@/components/home/projects/types";
import { Lightbox, shotsOf, type Shot } from "@/components/site/Lightbox";
import { EASE, SETTLE, STAGGER, STAGGER_CAP } from "@/components/site/motion";
import { Sheet } from "@/components/site/Sheet";
import { InfoBody } from "@/components/site/InfoBody";

const VIEW_KEY = "hbw.project.view";

const RHYTHM = [
  { col: 1, span: 5, pull: 0 },
  { col: 7, span: 6, pull: 90 },
  { col: 4, span: 3, pull: 60 },
  { col: 9, span: 4, pull: 150 },
  { col: 1, span: 6, pull: 70 },
  { col: 8, span: 3, pull: 130 },
  { col: 3, span: 5, pull: 40 },
] as const;

type Frame = {
  id: string;
  src: string;
  video?: string;
  webm?: string;
  width: number;
  height: number;
};

type Run = {
  slug: string;
  name: string;
  idea: string;
  year: string;
  /** The first run's mark is rendered on the server; later ones arrive as SVG. */
  mark: ReactNode;
  info: ReactNode;
  frames: Frame[];
};

/**
 * Let an animation clear itself once it has played.
 *
 * Every one of these ends where the element already belongs, so the fill is
 * only needed while it runs. Left in place it keeps a transform on the element
 * for good, and the next measurement reads that instead of the layout.
 */
function settle(animation: Animation) {
  animation.finished.then(() => animation.cancel()).catch(() => {});
}

function framesOf(movements: Movement[]): Frame[] {
  const out: Frame[] = [];
  for (const movement of movements) {
    const media = movement.media;
    const film = media.type === "video";
    const src = film ? media.poster ?? media.src : media.src;
    if (!src) continue;
    out.push({
      id: movement.id,
      src,
      video: film ? media.mp4 ?? media.videoSrc ?? media.src : undefined,
      webm: film ? media.webm : undefined,
      width: media.width,
      height: media.height,
    });
  }
  return out;
}

/**
 * How a grid row is composed.
 *
 * A row is three portraits, or two portraits and one landscape. A landscape is
 * roughly two portraits wide at the same height, so one of them is all a row
 * can carry without the pictures becoming postage stamps.
 *
 * The sequence's order is kept — a case study is in the order it is in — so
 * this fills rows as the frames come and breaks early when a second landscape
 * would land in the same row. The last row takes whatever is left, which is
 * what "adjust for the amount we have" has to mean when the material does not
 * divide into threes.
 */
function rowsOf(frames: Frame[]): Frame[][] {
  const rows: Frame[][] = [];
  let row: Frame[] = [];
  let wide = 0;
  for (const frame of frames) {
    const landscape = frame.width / Math.max(1, frame.height) >= 1;
    if (row.length === 3 || (landscape && wide >= 1)) {
      rows.push(row);
      row = [];
      wide = 0;
    }
    row.push(frame);
    if (landscape) wide++;
  }
  if (row.length) rows.push(row);
  return rows;
}

function shotsFrom(frames: Frame[]): Shot[] {
  return frames.map((frame) => ({ src: frame.src, video: frame.video, webm: frame.webm }));
}

function Shot({ frame, i, onOpen }: { frame: Frame; i: number; onOpen: (i: number) => void }) {
  const film = useRef<HTMLVideoElement>(null);
  const place = RHYTHM[i % RHYTHM.length];
  const own = frame.width && frame.height ? frame.width / frame.height : 4 / 3;

  return (
    <figure
      className="hbw-col__frame hbw-col__frame--open"
      data-frame={frame.id}
      onClick={() => onOpen(i)}
      style={
        {
          "--col": place.col,
          "--span": place.span,
          "--pull": `${place.pull}px`,
          "--ar": String(own),
          zIndex: i + 2,
        } as React.CSSProperties
      }
      onPointerEnter={() => film.current?.play().catch(() => {})}
      onPointerLeave={() => film.current?.pause()}
    >
      <span className="hbw-col__shot">
        <img src={frame.src} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" />
        {frame.video ? (
          <video ref={film} preload="none" poster={frame.src} muted loop playsInline>
            {frame.webm ? <source src={frame.webm} type="video/webm" /> : null}
            <source src={frame.video} type="video/mp4" />
          </video>
        ) : null}
      </span>
    </figure>
  );
}

export function ProjectRuns({
  slug,
  name,
  idea,
  year,
  mark,
  number,
  info,
  movements,
  next,
}: {
  slug: string;
  name: string;
  idea: string;
  year: string;
  mark: ReactNode;
  /** Its place in the body of work, shown above the mark. */
  number: number;
  info: ReactNode;
  movements: Movement[];
  /** The one that follows, as a door at the end of this one. */
  next: { slug: string; name: string; idea: string; year: string; mark: ReactNode } | null;
}) {
  const [view, setView] = useState<"scatter" | "grid">("scatter");
  const [open, setOpen] = useState<{ run: number; at: number } | null>(null);
  const [from, setFrom] = useState(0);
  const [ready, setReady] = useState(false);

  const first: Run = useMemo(
    () => ({ slug, name, idea, year, mark, info, frames: framesOf(movements) }),
    [slug, name, idea, year, mark, info, movements]
  );

  /** The frame that was clicked leads; read before paint so it is never seen turning. */
  useLayoutEffect(() => {
    const asked = Number(new URLSearchParams(window.location.search).get("f"));
    if (Number.isInteger(asked) && asked > 0 && asked <= first.frames.length) setFrom(asked - 1);
    setReady(true);
  }, [first.frames.length]);

  const run: Run = useMemo(
    () =>
      from
        ? { ...first, frames: first.frames.slice(from).concat(first.frames.slice(0, from)) }
        : first,
    [first, from]
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY);
      if (saved === "grid" || saved === "scatter") setView(saved);
    } catch {
      /* private window: scatter is a fine answer */
    }
  }, []);

  const pick = useCallback((next: "scatter" | "grid") => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* the choice just does not outlive the visit */
    }
  }, []);


  /** The arrangement moves rather than cuts. */
  const stage = useRef<HTMLDivElement>(null);
  const was = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    if (!ready) return;
    const host = stage.current;
    if (!host) return;
    const frames = Array.from(host.querySelectorAll<HTMLElement>("[data-frame]"));

    /*
     * Settle anything still animating before measuring.
     *
     * These animations fill both ways, so a finished one leaves its transform
     * on the element — and getBoundingClientRect reports the transformed box.
     * Measuring that gives a delta from a place the frame is not, and the next
     * pass animates it away from somewhere it never was, which is the jump.
     * Finishing and clearing puts every frame at its real layout position
     * first, so what is measured is the layout and nothing else.
     */
    for (const frame of frames) {
      for (const animation of frame.getAnimations()) {
        animation.finish();
        animation.cancel();
      }
    }

    const now = new Map<string, DOMRect>();
    for (const frame of frames) now.set(frame.dataset.frame!, frame.getBoundingClientRect());

    const firstPass = was.current.size === 0;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const turning = document.documentElement.hasAttribute("data-hbw-turning");

    if (firstPass && turning && !still) {
      document.documentElement.removeAttribute("data-hbw-turning");
      frames.forEach((frame, i) => {
        settle(
          frame.animate(
            [
              { opacity: 0, transform: "translateY(14px) scale(0.985)" },
              { opacity: 1, transform: "none" },
            ],
            { duration: SETTLE, delay: Math.min(i * STAGGER, STAGGER_CAP), easing: EASE, fill: "both" }
          )
        );
      });
      was.current = now;
      return;
    }
    if (firstPass && turning) document.documentElement.removeAttribute("data-hbw-turning");

    if (!firstPass && !still) {
      // Where a run has just been fetched, its frames are new to the page.
      // They have no previous position to move from, so they arrive instead —
      // same duration, same curve, same stagger as everything else.
      let arriving = 0;
      frames.forEach((frame, i) => {
        const before = was.current.get(frame.dataset.frame!);
        const after2 = now.get(frame.dataset.frame!);
        if (!after2 || !after2.width) return;
        if (!before) {
          settle(
            frame.animate(
              [
                { opacity: 0, transform: "translateY(18px) scale(0.985)" },
                { opacity: 1, transform: "none" },
              ],
              {
                duration: SETTLE,
                delay: Math.min(arriving++ * STAGGER, STAGGER_CAP),
                easing: EASE,
                fill: "both",
              }
            )
          );
          return;
        }
        const dx = before.left - after2.left;
        const dy = before.top - after2.top;
        const ds = before.width / after2.width;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(ds - 1) < 0.01) return;
        settle(
          frame.animate(
            [
              { transform: `translate(${dx}px, ${dy}px) scale(${ds})`, opacity: 0.55 },
              { transform: "none", opacity: 1 },
            ],
            { duration: SETTLE, delay: Math.min(i * STAGGER, STAGGER_CAP), easing: EASE, fill: "both" }
          )
        );
      });
    }
    was.current = now;
  }, [run, view, ready]);


  const shown = open !== null ? run : null;

  return (
    <>
      <Chrome
        label={`${run.name} — ${run.idea}, ${run.year}`}
        view={view}
        onPick={pick}
        info={run.info}
      />

      <div ref={stage}>
        <section className="hbw-run is-here" aria-label={run.name}>
          {/* The mark the catalogue grew into, holding the middle of the screen. */}
          <header className="hbw-run__mark" style={{ viewTransitionName: `p-${run.slug}` }}>
            {/* The act number, the way a title page numbers one. */}
            <p className="hbw-run__no" aria-hidden="true">
              ( {number} )
            </p>
            <h1>{run.mark}</h1>
          </header>

          {view === "grid" ? (
            <div className="hbw-col is-grid">
              {rowsOf(run.frames).map((row, r) => (
                <div className="hbw-row" key={`row-${r}`}>
                  {row.map((frame) => (
                    <Shot
                      key={frame.id}
                      frame={frame}
                      i={run.frames.indexOf(frame)}
                      onOpen={(at) => setOpen({ run: 0, at })}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="hbw-col">
              {run.frames.map((frame, i) => (
                <Shot key={frame.id} frame={frame} i={i} onOpen={(at) => setOpen({ run: 0, at })} />
              ))}
            </div>
          )}
        </section>

        {/*
          The way into the next one. The same black box the catalogue opens a
          project with, carrying the same name the next page carries — so it
          grows into that project rather than cutting to it.
        */}
        {next ? (
          <a className="hbw-next" href={`/projects/${next.slug}`} style={{ viewTransitionName: `p-${next.slug}` }}>
            <span className="hbw-next__says hbw-m">Next</span>
            <span className="hbw-next__mark">{next.mark}</span>
            <span className="hbw-next__says hbw-m">
              {next.name} — {next.idea}, {next.year}
            </span>
          </a>
        ) : null}
      </div>

      {open && shown ? (
        <Lightbox
          // This project's sequence only, however many are on the page.
          shots={shotsFrom(shown.frames)}
          at={open.at}
          onAt={(at) => setOpen({ run: open.run, at })}
          onClose={() => setOpen(null)}
          name={shown.name}
        />
      ) : null}
    </>
  );
}

/**
 * Everything the chrome says about where you are.
 *
 * Portalled into the bar and the controls row, because those are fixed and
 * this is the thing that has to keep up with the scroll. The label, the way
 * into the information, and the two views all come from here, so they can
 * never disagree about which project you are in.
 */
function Chrome({
  label,
  view,
  onPick,
  info,
}: {
  label: string;
  view: "scatter" | "grid";
  onPick: (next: "scatter" | "grid") => void;
  info: ReactNode;
}) {
  const [rail, setRail] = useState<HTMLElement | null>(null);
  const [says, setSays] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setRail(document.querySelector<HTMLElement>(".hbw-rail"));
    setSays(document.querySelector<HTMLElement>(".hbw-bar__what"));
  }, []);

  return (
    <>
      {rail
        ? createPortal(
            <>
              <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog">
                Information
              </button>
              <span className="hbw-rail__views">
                {(["scatter", "grid"] as const).map((one) => (
                  <button key={one} type="button" aria-pressed={view === one} onClick={() => onPick(one)}>
                    {one === "scatter" ? "Scatter" : "Grid"}
                  </button>
                ))}
              </span>
            </>,
            rail
          )
        : null}
      {says ? createPortal(<p style={{ margin: 0 }}>{label}</p>, says) : null}
      {open ? (
        <Sheet label={label} onClose={() => setOpen(false)}>
          {info}
        </Sheet>
      ) : null}
    </>
  );
}
