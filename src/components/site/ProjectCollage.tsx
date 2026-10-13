"use client";

/**
 * A case study as a collage.
 *
 * Not a column of pictures and not a grid. Frames sit at different widths and
 * different depths across a twelve-column field, some bleeding off the edge,
 * some pulled up into the one above — so the page is composed rather than
 * stacked, and the project's name sits inside the work instead of on top of
 * a banner above it.
 *
 * The arrangement is a fixed rhythm, not randomness. A random collage has to
 * be regenerated until it looks right and then never looks the same twice;
 * this repeats a seven-step pattern, so it is designed, stable between builds,
 * and the same for everyone.
 *
 * Film costs nothing until a pointer arrives — preload none, the still showing
 * until it runs. The old case studies autoplayed theirs and pulled twenty
 * megabytes a page.
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
import type { Movement } from "@/components/home/projects/types";
import { Lightbox, shotsOf } from "@/components/site/Lightbox";
import { EASE, SETTLE, STAGGER, STAGGER_CAP } from "@/components/site/motion";

/**
 * column start, how many columns wide, and how far it is pulled up.
 * Widths alternate so no two neighbours match; the pulls are what make frames
 * overlap rather than queue.
 */
/** Where the chosen view is kept. */
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

/**
 * Proportions a collage can carry.
 *
 * A sequence holds things that are not photographs — a colour field, a page of
 * type — and some are extremely tall or wide. Left alone, one of them takes a
 * whole screen and the composition is over. Frames are cropped into a range
 * instead; the picture is still the picture, it just cannot run the page.
 */
function usable(ratio: number) {
  if (!Number.isFinite(ratio) || ratio <= 0) return 4 / 3;
  return Math.min(1.9, Math.max(0.72, ratio));
}

function Frame({
  movement,
  i,
  name,
  onOpen,
}: {
  movement: Movement;
  i: number;
  name: string;
  onOpen: (i: number) => void;
}) {
  const film = useRef<HTMLVideoElement>(null);
  const place = RHYTHM[i % RHYTHM.length];
  const media = movement.media;
  const still = media.type === "video" ? media.poster ?? media.src : media.src;
  const video = media.type === "video" ? media.mp4 ?? media.videoSrc ?? media.src : undefined;
  // Two ratios. The scatter needs frames inside a usable range or one tall
  // panel takes a whole screen and the composition is over; the grid wants the
  // work at whatever shape it actually is, uncropped.
  const own = media.width && media.height ? media.width / media.height : 4 / 3;
  const ratio = usable(own);

  return (
    <figure
      className="hbw-col__frame hbw-col__frame--open"
      // Stable across arrangements, so a frame can be followed from where it
      // was to where it goes.
      data-frame={movement.id}
      onClick={() => onOpen(i)}
      // Custom properties, not finished declarations. An inline grid-column
      // beats any stylesheet rule that is not !important, so the grid view
      // could not override it — the same trap the tiles hit. CSS consumes
      // these, and CSS can therefore ignore them.
      style={
        {
          "--col": place.col,
          "--span": place.span,
          "--pull": `${place.pull}px`,
          "--ar": String(own),
          // Later frames sit over earlier ones, so a pull reads as depth.
          zIndex: i + 2,
        } as React.CSSProperties
      }
      onPointerEnter={() => film.current?.play().catch(() => {})}
      onPointerLeave={() => film.current?.pause()}
    >
      <span className="hbw-col__shot" style={{ "--ar-fit": String(ratio) } as React.CSSProperties}>
        <img src={still} alt={media.alt ?? ""} loading={i < 2 ? "eager" : "lazy"} decoding="async" />
        {video ? (
          <video ref={film} preload="none" poster={still} muted loop playsInline aria-label={`${name}, film`}>
            {media.webm ? <source src={media.webm} type="video/webm" /> : null}
            <source src={video} type="video/mp4" />
          </video>
        ) : null}
      </span>
      {/* The number, on hover. It says the sequence has an order and that this
          frame has a place in it — and that there is more than you can see. */}
      <figcaption className="hbw-col__no">{String(i + 1).padStart(2, "0")}</figcaption>
    </figure>
  );
}

export function ProjectCollage({
  movements,
  name,
  mark,
}: {
  movements: Movement[];
  name: string;
  /** The project's own logotype, rendered on the server. */
  mark?: ReactNode;
}) {

  const [open, setOpen] = useState<number | null>(null);

  /**
   * Two ways to look at a project, and the choice sticks.
   *
   * Scatter is the composition — sizes and depths, the shape of the job.
   * Grid is the contact sheet — everything the same size, in order, for
   * someone comparing rather than browsing. Neither is right for everyone, so
   * it is a choice, and a choice that has to be made again on every project
   * is not a choice, it is a chore.
   *
   * Read after mount: the prerendered HTML cannot know what this visitor
   * picked last time, and rendering a different view on the server than the
   * client would be a hydration mismatch.
   */
  const [view, setView] = useState<"scatter" | "grid">("scatter");

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
      /* nothing to do: the choice just does not outlive the visit */
    }
  }, []);

  /**
   * Arriving from a picture on the front page: that picture leads.
   *
   * The sequence rotates rather than the page jumping to a position in it, so
   * the frame you clicked takes the first slot of the composition and
   * everything else follows from there. The same project is a different page
   * depending on the way in, which is the point — it adapts to where you came
   * from instead of always opening at its own beginning.
   *
   * Read after mount: a query string cannot change a statically built page, so
   * the server and the first client render have to agree on the plain order.
   */
  const [from, setFrom] = useState(0);

  useEffect(() => {
    const asked = Number(new URLSearchParams(window.location.search).get("f"));
    if (Number.isInteger(asked) && asked > 0 && asked <= movements.length) setFrom(asked - 1);
  }, [movements.length]);

  const order = useMemo(
    () => (from ? movements.slice(from).concat(movements.slice(0, from)) : movements),
    [movements, from]
  );

  /**
   * The arrangement moves rather than cuts.
   *
   * Whenever the order or the view changes, every frame is carried from where
   * it was to where it now is — measured, not guessed: the browser does the
   * layout and this animates the difference. Each frame starts a little after
   * the one before it, so the set reads as a sequence resettling rather than
   * a page swapping.
   *
   * The duration and curve come from motion.ts, which is the same pair the
   * stylesheet uses, so a frame moving and a colour changing are one hand.
   *
   * It is a no-op on first paint, because there is no previous arrangement to
   * come from, and it does nothing at all under reduced motion.
   */
  const stage = useRef<HTMLDivElement>(null);
  const was = useRef(new Map<string, DOMRect>());

  useLayoutEffect(() => {
    const host = stage.current;
    if (!host) return;
    const frames = Array.from(host.querySelectorAll<HTMLElement>("[data-frame]"));
    const now = new Map<string, DOMRect>();
    for (const frame of frames) now.set(frame.dataset.frame!, frame.getBoundingClientRect());

    const first = was.current.size === 0;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!first && !still) {
      frames.forEach((frame, i) => {
        const before = was.current.get(frame.dataset.frame!);
        const after = now.get(frame.dataset.frame!);
        if (!before || !after || !after.width) return;
        const dx = before.left - after.left;
        const dy = before.top - after.top;
        const ds = before.width / after.width;
        // Anything that has not actually moved is left alone, or the whole
        // field animates every time one thing changes.
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(ds - 1) < 0.01) return;
        frame.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(${ds})`, opacity: 0.55 },
            { transform: "none", opacity: 1 },
          ],
          {
            duration: SETTLE,
            delay: Math.min(i * STAGGER, STAGGER_CAP),
            easing: EASE,
            fill: "both",
          }
        );
      });
    }
    was.current = now;
  }, [order, view]);

  return (
    <>
      {/*
        The name is NOT a grid item. It was, with an explicit row, and dense
        auto-placement put a full-height frame in the same row and pushed the
        title under it — the one thing the layout exists to prevent. It sits
        above the grid now and the grid is pulled up over it, so the first
        frames cross the type by construction rather than by luck.
      */}
      <div className="hbw-col__view">
        {(["scatter", "grid"] as const).map((one) => (
          <button
            key={one}
            type="button"
            aria-pressed={view === one}
            onClick={() => pick(one)}
          >
            {one === "scatter" ? "Scatter" : "Grid"}
          </button>
        ))}
      </div>

      <div className="hbw-col__stage">
        {/*
          The title holds while the work moves over it. Sticky rather than
          fixed, so it is the collage that governs how long it stays — it
          arrives with the first frame and leaves with the last, instead of
          sitting under the Information panel at the end of the page.
        */}
        <header className="hbw-col__name">
          <h1>{mark ?? name}</h1>
        </header>
        <div className={`hbw-col${view === "grid" ? " is-grid" : ""}`} ref={stage}>
          {order.map((movement, i) => (
            <Frame key={movement.id} movement={movement} i={i} name={name} onOpen={setOpen} />
          ))}
        </div>
      </div>

      {open !== null ? (
        <Lightbox
          shots={shotsOf(order)}
          at={open}
          onAt={setOpen}
          onClose={() => setOpen(null)}
          name={name}
        />
      ) : null}
    </>
  );
}
