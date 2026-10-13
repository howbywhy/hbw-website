"use client";

/**
 * A project, and then the next one, and the next.
 *
 * A case study is not a page that ends — it runs into the one after it, so a
 * visitor who keeps scrolling keeps seeing work instead of hitting a footer
 * and having to decide something. Each project's mark holds in the middle of
 * the screen while that project passes, and is pushed out by the mark of the
 * project arriving behind it.
 *
 * The next project is fetched only when someone scrolls far enough to need
 * it. Stitching them on the server would put every sequence into every
 * project's payload, which the repo's own guard forbids and which is what
 * made a case study twenty megabytes before.
 *
 * The gallery belongs to one project. Opening a frame opens that project's
 * sequence and nothing else, however many are on the page by then.
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

function usable(ratio: number) {
  if (!Number.isFinite(ratio) || ratio <= 0) return 4 / 3;
  return Math.min(1.9, Math.max(0.72, ratio));
}

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
      <span className="hbw-col__shot" style={{ "--ar-fit": String(usable(own)) } as React.CSSProperties}>
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
  info,
  movements,
  after,
}: {
  slug: string;
  name: string;
  idea: string;
  year: string;
  mark: ReactNode;
  info: ReactNode;
  movements: Movement[];
  /** The projects that follow this one, in order. */
  after: string[];
}) {
  const [view, setView] = useState<"scatter" | "grid">("scatter");
  const [open, setOpen] = useState<{ run: number; at: number } | null>(null);
  const [from, setFrom] = useState(0);
  const [ready, setReady] = useState(false);
  const [more, setMore] = useState<Run[]>([]);
  const pulling = useRef(false);

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

  const runs: Run[] = useMemo(() => {
    const turned = from
      ? { ...first, frames: first.frames.slice(from).concat(first.frames.slice(0, from)) }
      : first;
    return [turned, ...more];
  }, [first, from, more]);

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

  /** Reach the end of what is loaded, and the next project is already coming. */
  useEffect(() => {
    const next = after[more.length];
    if (!next) return;
    const watch = () => {
      if (pulling.current) return;
      const left = document.body.scrollHeight - (window.scrollY + window.innerHeight);
      if (left > window.innerHeight * 1.2) return;
      pulling.current = true;
      fetch(`/api/sequence/${next}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((run) => {
          if (!run) return;
          setMore((was) => [
            ...was,
            {
              slug: run.slug,
              name: run.name,
              idea: run.idea,
              year: run.year,
              mark: run.mark ? (
                <span className="hbw-mark" role="img" aria-label={run.name} dangerouslySetInnerHTML={{ __html: run.mark }} />
              ) : (
                run.name
              ),
              info: <InfoBody data={run.info} />,
              frames: run.frames as Frame[],
            },
          ]);
        })
        .finally(() => {
          pulling.current = false;
        });
    };
    window.addEventListener("scroll", watch, { passive: true });
    watch();
    return () => window.removeEventListener("scroll", watch);
  }, [after, more.length]);

  /** The arrangement moves rather than cuts. */
  const stage = useRef<HTMLDivElement>(null);
  const was = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    if (!ready) return;
    const host = stage.current;
    if (!host) return;
    const frames = Array.from(host.querySelectorAll<HTMLElement>("[data-frame]"));
    const now = new Map<string, DOMRect>();
    for (const frame of frames) now.set(frame.dataset.frame!, frame.getBoundingClientRect());

    const firstPass = was.current.size === 0;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const turning = document.documentElement.hasAttribute("data-hbw-turning");

    if (firstPass && turning && !still) {
      document.documentElement.removeAttribute("data-hbw-turning");
      frames.forEach((frame, i) => {
        frame.animate(
          [
            { opacity: 0, transform: "translateY(14px) scale(0.985)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: SETTLE, delay: Math.min(i * STAGGER, STAGGER_CAP), easing: EASE, fill: "both" }
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
          );
          return;
        }
        const dx = before.left - after2.left;
        const dy = before.top - after2.top;
        const ds = before.width / after2.width;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(ds - 1) < 0.01) return;
        frame.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(${ds})`, opacity: 0.55 },
            { transform: "none", opacity: 1 },
          ],
          { duration: SETTLE, delay: Math.min(i * STAGGER, STAGGER_CAP), easing: EASE, fill: "both" }
        );
      });
    }
    was.current = now;
  }, [runs, view, ready]);

  /**
   * Which project the chrome is talking about.
   *
   * The nav said SCK while a visitor was three projects deep, because the
   * label was the page's own and the page no longer holds one project. It
   * follows whichever run is crossing the middle of the screen.
   */
  const [here, setHere] = useState(0);
  const sections = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const watch = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = sections.current.findIndex((el) => el === entry.target);
          if (i >= 0) setHere(i);
        }
      },
      // A band across the middle: the run crossing it is the one you are in.
      { rootMargin: "-45% 0px -45% 0px" }
    );
    for (const el of sections.current) if (el) watch.observe(el);
    return () => watch.disconnect();
  }, [runs.length]);

  const shown = open ? runs[open.run] : null;
  const current = runs[here] ?? runs[0];

  return (
    <>
      <Chrome
        label={`${current.name} — ${current.idea}, ${current.year}`}
        view={view}
        onPick={pick}
        info={current.info}
      />

      <div ref={stage}>
        {runs.map((run, index) => (
          <section
            className="hbw-run"
            key={`${run.slug}-${index}`}
            aria-label={run.name}
            ref={(el) => {
              sections.current[index] = el;
            }}
          >
            {/* Held in the middle of the screen, and pushed out by the next. */}
            <header
              className="hbw-run__mark"
              // Only the project that was navigated to: a name has to be
              // unique on the page, and the runs fetched below it were never
              // on the page you came from.
              style={index === 0 ? { viewTransitionName: `p-${run.slug}` } : undefined}
            >
              {index === 0 ? <h1>{run.mark}</h1> : <h2>{run.mark}</h2>}
            </header>
            <div className={`hbw-col${view === "grid" ? " is-grid" : ""}`}>
              {run.frames.map((frame, i) => (
                <Shot key={frame.id} frame={frame} i={i} onOpen={(at) => setOpen({ run: index, at })} />
              ))}
            </div>
            {index > 0 ? (
              <p className="hbw-run__says hbw-m">
                <a href={`/projects/${run.slug}`}>
                  {run.name} — {run.idea}, {run.year}
                </a>
              </p>
            ) : null}
          </section>
        ))}
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
