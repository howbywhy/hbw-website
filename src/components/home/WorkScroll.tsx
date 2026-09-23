"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from "react";
import { preloadProject } from "@/components/home/preload";
import { STUDIO_COPY } from "@/components/home/studio-copy";
import { WorkDetail } from "@/components/home/WorkDetail";
import { WORK, keyArt } from "@/components/home/work-data";

const SCROLL_KEY = "hbw.work.scroll.v1";
const HOVER_INTENT_MS = 320;

function readScroll() {
  try {
    return Number(sessionStorage.getItem(SCROLL_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeScroll(y: number) {
  try {
    sessionStorage.setItem(SCROLL_KEY, String(Math.round(y)));
  } catch {
    /* per-visit convenience only */
  }
}

function workFromUrl() {
  if (typeof window === "undefined") return null;
  const id = new URLSearchParams(window.location.search).get("work");
  return id && WORK.some((p) => p.id === id) ? id : null;
}

export type WorkScrollHandle = {
  toWork: () => void;
  toTop: () => void;
  /** Open a project in the viewer over the poster, as a card on the line does.
   *  `away` means it was opened from somewhere other than the line, so closing
   *  leaves rather than flying back to a card the reader is not returning to. */
  openWork: (slug: string, options?: { away?: boolean }) => void;
};

export type WorkInView = { n: string; total: string; name: string; idea: string } | null;

type Props = {
  /** Home only. Hidden (but kept mounted, so scroll is remembered) while a project or Studio owns the window. */
  visible: boolean;
  /** Re-authors the header line with whatever the viewer is looking at. */
  onInView: (work: WorkInView) => void;
  /** After the work: on to the studio behind it. */
  onStudio?: () => void;
  /** After the six on the line: the whole record underneath them. */
  onIndex?: () => void;
  /** A project opened from here has started closing. Whoever sent you in can
   *  come back underneath it, so the two cross rather than queue. */
  onDetailClosing?: () => void;
  /** …and has finished closing. */
  onDetailClosed?: () => void;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

type Geometry = { rise: number; travel: number; step: number };

/**
 * The work, as one line over the Poster.
 *
 * Scroll raises the line (cards come up and are squared into a row while the
 * Poster softens), then travels it, one project to the front at a time. Hover
 * a card and it opens into a preview; choose it and its detail grows out of it,
 * over everything. Nothing ever navigates away from the Poster.
 */
export const WorkScroll = forwardRef<WorkScrollHandle, Props>(function WorkScroll({ visible, onInView, onStudio, onIndex, onDetailClosing, onDetailClosed }, ref) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLOListElement>(null);
  const geo = useRef<Geometry>({ rise: 1, travel: 0, step: 1 });
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const [active, setActive] = useState(-1);
  const activeRef = useRef(-1);
  const [preview, setPreview] = useState<string | null>(null);
  const intent = useRef(0);
  const [open, setOpen] = useState<{ slug: string; origin: DOMRect | null } | null>(null);
  const [closing, setClosing] = useState(false);
  const [away, setAway] = useState(false);
  /** Opened from the index: closing goes back there, so it must not fly to a card. */
  const returnsAway = useRef(false);
  /** closeDetail is memoised with no deps; the latest callback lives here. */
  const closingSignal = useRef(onDetailClosing);
  closingSignal.current = onDetailClosing;
  const openRef = useRef(open);
  openRef.current = open;
  const glide = useRef<{ target: number | null; raf: number }>({ target: null, raf: 0 });
  // Case-study films never enter the server HTML of unrelated pages (see ssg-payload tests):
  // cards render their still on the server and take their film after mount.
  const [live, setLive] = useState(false);
  useEffect(() => setLive(true), []);

  const report = useCallback(
    (i: number) => {
      if (i === activeRef.current) return;
      activeRef.current = i;
      setActive(i);
      onInView(i < 0 ? null : { n: pad(i + 1), total: pad(WORK.length), name: WORK[i].name, idea: WORK[i].idea });
    },
    [onInView]
  );

  /** One easing for every scroll the site performs: wheel, Work, dashes, back to the Poster. */
  const glideTo = useCallback((y: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const max = scroller.scrollHeight - scroller.clientHeight;
    const g = glide.current;
    g.target = clamp(y, 0, max);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scroller.scrollTop = g.target;
      g.target = null;
      return;
    }
    if (g.raf) return;
    const tick = () => {
      const target = g.target;
      if (target == null) {
        g.raf = 0;
        return;
      }
      const cur = scroller.scrollTop;
      const next = cur + (target - cur) * 0.16;
      // Scroll positions round to device pixels: once a step can't move a whole pixel, land on the target.
      // Without this the loop sits a few pixels short and runs forever.
      if (Math.abs(target - cur) < 4 || Math.round(next) === Math.round(cur)) {
        scroller.scrollTop = target;
        g.target = null;
        g.raf = 0;
        return;
      }
      scroller.scrollTop = next;
      g.raf = requestAnimationFrame(tick);
    };
    g.raf = requestAnimationFrame(tick);
  }, []);

  const frontOf = useCallback((i: number) => {
    const { rise, step, travel } = geo.current;
    return rise + Math.min(travel, Math.max(0, i) * step);
  }, []);

  /**
   * A row of cards on a phone reads as a carousel, so a sideways swipe has to
   * move the line — even though the rail is really driven by vertical scroll.
   * The transform tracks scrollTop one for one, so a horizontal drag maps
   * straight onto it, and letting go settles on the nearest project.
   *
   * The axis is decided once per gesture: past an 8px threshold, whichever of
   * dx or dy is larger wins, and a vertical swipe is left alone so the page
   * still scrolls normally.
   */
  useEffect(() => {
    const line = lineRef.current;
    const scroller = scrollerRef.current;
    if (!line || !scroller) return;
    if (typeof window === "undefined" || !window.matchMedia("(hover: none)").matches) return;

    let startX = 0;
    let startY = 0;
    let from = 0;
    let axis: "x" | "y" | null = null;

    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
      from = scroller.scrollTop;
      axis = null;
    };

    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (!axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axis !== "x") return;
      // Take the gesture over: otherwise the browser treats it as a page pan.
      event.preventDefault();
      const { rise, travel } = geo.current;
      scroller.scrollTop = Math.min(rise + travel, Math.max(rise, from - dx));
    };

    const onEnd = () => {
      if (axis !== "x") return;
      axis = null;
      const { rise, step } = geo.current;
      const i = Math.round((scroller.scrollTop - rise) / Math.max(1, step));
      glideTo(frontOf(Math.min(WORK.length - 1, Math.max(0, i))));
    };

    line.addEventListener("touchstart", onStart, { passive: true });
    line.addEventListener("touchmove", onMove, { passive: false });
    line.addEventListener("touchend", onEnd, { passive: true });
    line.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      line.removeEventListener("touchstart", onStart);
      line.removeEventListener("touchmove", onMove);
      line.removeEventListener("touchend", onEnd);
      line.removeEventListener("touchcancel", onEnd);
    };
  }, [frontOf, glideTo]);

  /** Rearrange without a move you'd see: used while the viewer covers the line. */
  const settleAt = useCallback((y: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const g = glide.current;
    g.target = null;
    if (g.raf) cancelAnimationFrame(g.raf);
    g.raf = 0;
    scroller.scrollTop = clamp(y, 0, scroller.scrollHeight - scroller.clientHeight);
  }, []);
  const settleTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  useImperativeHandle(ref, () => ({
    toWork() {
      glideTo(geo.current.rise);
    },
    toTop() {
      glideTo(0);
    },
    openWork(slug: string, options?: { away?: boolean }) {
      returnsAway.current = Boolean(options?.away);
      // Put that project at the front of the line behind the viewer, so closing
      // lands on its card rather than wherever the line happened to be.
      const i = WORK.findIndex((project) => project.id === slug);
      settleAt(i >= 0 ? frontOf(i) : geo.current.rise);
      openDetail(slug, null);
    },
  }));

  // Measure: how far the line rises, and how far it travels (every project gets its turn at the front).
  useEffect(() => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    const cards = cardsRef.current;
    if (!scroller || !track || !cards) return;
    const measure = () => {
      const h = scroller.clientHeight;
      const narrow = scroller.clientWidth < 768;
      const rise = Math.round(h * (narrow ? 0.55 : 0.7));
      const first = cards.children[0] as HTMLElement | undefined;
      const gap = Number.parseFloat(getComputedStyle(cards).columnGap) || 8;
      const step = first ? first.offsetWidth + gap : 1;
      const travel = step * Math.max(0, WORK.length - 1);
      geo.current = { rise, travel, step };
      track.style.height = `${h + rise + travel}px`;
      track.style.setProperty("--stage-h", `${h}px`);
      scroller.dispatchEvent(new Event("scroll"));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  // Scroll → rise and travel. Written straight to two elements, only when a value actually changes.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const host = scroller?.closest<HTMLElement>(".hbw-window");
    const line = lineRef.current;
    const cards = cardsRef.current;
    if (!scroller || !host || !line || !cards) return;
    let frame = 0;
    let lastRise = -1;
    let lastX = -1;
    let lastIn = "";
    const write = () => {
      frame = 0;
      const { rise, travel, step } = geo.current;
      const y = scroller.scrollTop;
      if (visibleRef.current) writeScroll(y);
      const up = Math.round(clamp(y / Math.max(1, rise)) * 1000) / 1000;
      const x = Math.round(clamp(y - rise, 0, travel));
      if (up !== lastRise) {
        line.style.setProperty("--rise", String(up));
        lastRise = up;
      }
      if (x !== lastX) {
        cards.style.transform = `translate3d(${-x}px, 0, 0)`;
        lastX = x;
      }
      // The Poster recedes once, as a transition — never a per-frame filter.
      const state = up > 0.02 ? "in" : "out";
      if (state !== lastIn) {
        host.dataset.hbwWork = state;
        lastIn = state;
      }
      const past = y > rise + travel + scroller.clientHeight * 0.35;
      report(up < 0.5 || past ? -1 : Math.min(WORK.length - 1, Math.round(x / step)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(write);
      setPreview(null);
    };
    const saved = readScroll();
    if (saved) scroller.scrollTop = saved;
    write();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      delete host.dataset.hbwWork;
    };
  }, [report]);

  // The wheel glides. Over the Poster it drives the work (the Poster never uses the wheel);
  // sideways swipes travel the line. Touch keeps the browser's own scrolling.
  useEffect(() => {
    if (!visible) return;
    function onWheel(event: WheelEvent) {
      const scroller = scrollerRef.current;
      if (!scroller || openRef.current || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!scroller.contains(target) && !target.closest(".hbw-poster-field")) return;
      event.preventDefault();
      const sideways = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientHeight : 1;
      const delta = (sideways ? event.deltaX : event.deltaY) * unit;
      glideTo((glide.current.target ?? scroller.scrollTop) + delta);
    }
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [visible, glideTo]);

  // While a project is open its own bar names it, so the nav's idea pill steps aside.
  useEffect(() => {
    document.documentElement.classList.toggle("hbw-viewing", Boolean(open) && !closing);
    return () => document.documentElement.classList.remove("hbw-viewing");
  }, [open, closing]);

  // Cards that aren't being looked at don't decode video.
  useEffect(() => {
    cardsRef.current?.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
      const id = video.closest<HTMLElement>(".hbw-card")?.dataset.hbwPlate;
      const live = id === preview || id === WORK[active]?.id;
      if (live) void video.play().catch(() => undefined);
      else video.pause();
    });
  }, [active, preview]);

  // The detail lives in the address (?work=slug), so it can be shared and Back closes it.
  const openDetail = useCallback((slug: string, origin: DOMRect | null, push = true) => {
    setPreview(null);
    setClosing(false);
    setOpen({ slug, origin });
    if (push) {
      const url = new URL(window.location.href);
      url.searchParams.set("work", slug);
      // Always "/": a project opened from /index still belongs to the home path.
      window.history.pushState({ hbw: "work", slug }, "", "/" + url.search);
    }
  }, []);

  const closeDetail = useCallback(() => {
    if (!openRef.current) return;
    if (returnsAway.current) {
      setAway(true);
      closingSignal.current?.();
    }
    setClosing(true);
    const url = new URL(window.location.href);
    if (url.searchParams.has("work")) {
      url.searchParams.delete("work");
      window.history.pushState({ hbw: "home" }, "", url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : ""));
    }
  }, []);

  useEffect(() => {
    const deep = workFromUrl();
    if (deep) {
      glideTo(frontOf(WORK.findIndex((p) => p.id === deep)));
      openDetail(deep, null, false);
    }
    function onPop() {
      const slug = workFromUrl();
      if (slug) openDetail(slug, null, false);
      else if (openRef.current) setClosing(true);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [frontOf, glideTo, openDetail]);


  function hoverIn(slug: string, pointer: string) {
    if (pointer === "touch") return;
    window.clearTimeout(intent.current);
    preloadProject(slug);
    intent.current = window.setTimeout(() => setPreview(slug), HOVER_INTENT_MS);
  }

  function hoverOut() {
    window.clearTimeout(intent.current);
    setPreview(null);
  }

  return (
    <>
      <div
        ref={scrollerRef}
        className={`hbw-scroll${visible ? " is-on" : ""}`}
        aria-hidden={visible ? undefined : true}
        inert={!visible || Boolean(open) || undefined}
      >
        <div ref={trackRef} className="hbw-line-track">
          <div className="hbw-line-stage">
            {/* The space above the line is the Poster's: a click there lowers the work and returns to it. */}
            <button
              type="button"
              className="hbw-line-away"
              aria-label="Back to the poster"
              tabIndex={-1}
              onClick={() => glideTo(0)}
            />
            <section ref={lineRef} className={`hbw-line${active >= 0 ? " has-front" : ""}`} aria-label="Work">
              <header className="hbw-line__head">
                <span className="hbw-line__heading">
                  <span className="hbw-line__title">Work</span>
                  {/* The six here are what we lead with; the record is one click away. */}
                  {onIndex ? (
                    <button type="button" className="hbw-line__index" onClick={onIndex}>
                      Index <span aria-hidden="true">↗</span>
                    </button>
                  ) : null}
                </span>
                <span className="hbw-line__dashes">
                  {WORK.map((project, i) => (
                    <button
                      key={project.id}
                      type="button"
                      className={i === active ? "is-on" : undefined}
                      aria-label={`Bring ${project.name} to the front`}
                      onClick={() => glideTo(frontOf(i))}
                    />
                  ))}
                </span>
              </header>
              <ol ref={cardsRef} className="hbw-line__cards">
                {WORK.map((project, i) => {
                  const art = keyArt(project);
                  const isPreview = preview === project.id;
                  return (
                    <li
                      key={project.id}
                      className={`hbw-card${i === active ? " is-active" : ""}${isPreview ? " is-preview" : ""}${
                        i === 0 ? " is-first" : i === WORK.length - 1 ? " is-last" : ""
                      }`}
                      data-hbw-plate={project.id}
                      style={{ "--i": i } as CSSProperties}
                      onPointerEnter={(e) => hoverIn(project.id, e.pointerType)}
                      onPointerLeave={hoverOut}
                    >
                      <a
                        className="hbw-card__hit"
                        href={`/?work=${project.id}`}
                        // Only keyboard focus brings a card forward; a click opens it where it is.
                        onFocus={(event) => {
                          if (event.currentTarget.matches(":focus-visible")) glideTo(frontOf(i));
                        }}
                        onClick={(event) => {
                          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                          event.preventDefault();
                          openDetail(project.id, event.currentTarget.getBoundingClientRect());
                          // Once the viewer has grown over the line, the project moves to the front
                          // behind it — so closing returns you to it, first in the line.
                          window.clearTimeout(settleTimer.current);
                          if (i !== active) settleTimer.current = window.setTimeout(() => settleAt(frontOf(i)), 650);
                        }}
                      >
                        <span className="hbw-card__media">
                          {live && art.type === "video" && art.video ? (
                            <video
                              src={art.video}
                              poster={art.src}
                              muted
                              loop
                              playsInline
                              preload="metadata"
                              disablePictureInPicture
                              style={{ objectPosition: art.crop }}
                            />
                          ) : (
                            <img
                              src={art.src}
                              srcSet={art.srcSet}
                              sizes="(max-width: 767px) 80vw, 40vw"
                              alt=""
                              width={art.width}
                              height={art.height}
                              style={{ objectPosition: art.crop }}
                              loading={i < 3 ? "eager" : "lazy"}
                              decoding="async"
                            />
                          )}
                        </span>
                        <span className="hbw-pill hbw-card__label">{project.name}</span>
                        <span className="hbw-card__preview" aria-hidden={isPreview ? undefined : true}>
                          <span className="hbw-card__idea">{project.idea}</span>
                          <span className="hbw-card__meta">
                            {(project.sectors ?? []).join(" · ")} · {project.year}
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
        </div>

        <section className="hbw-scroll__practice" aria-label="Practice">
          <p className="hbw-scroll__statement">{STUDIO_COPY.partners}</p>
          <p className="hbw-scroll__body">
            Got something you’re trying to solve? Put it on the poster: write it, draw it, drop in a picture, then
            send it over.
          </p>
          <p className="hbw-scroll__links">
            <button type="button" className="hbw-viewer__link" onClick={() => glideTo(0)}>
              Start a poster <span aria-hidden="true">↑</span>
            </button>
            {onStudio ? (
              <button type="button" className="hbw-viewer__link" onClick={onStudio}>
                About the studio <span aria-hidden="true">↗</span>
              </button>
            ) : null}
          </p>
        </section>

        <div className="hbw-scroll__tail" aria-hidden="true" />
      </div>

      {open ? (
        <WorkDetail
          key="detail"
          slug={open.slug}
          origin={open.origin}
          closing={closing}
          closingAway={away}
          onClose={closeDetail}
          onClosed={() => {
            setOpen(null);
            setClosing(false);
            setAway(false);
            returnsAway.current = false;
            onDetailClosed?.();
          }}
          onSwitch={(slug) => {
            setOpen({ slug, origin: null });
            const url = new URL(window.location.href);
            url.searchParams.set("work", slug);
            window.history.replaceState({ hbw: "work", slug }, "", url.pathname + url.search);
            glideTo(frontOf(WORK.findIndex((p) => p.id === slug)));
          }}
          onPoster={() => {
            setAway(true);
            closeDetail();
            glideTo(0);
          }}
        />
      ) : null}
    </>
  );
});
