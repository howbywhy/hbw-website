"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { RichTextBody } from "@/components/home/projects/RichText";
import { HBW_T, reduceMotion } from "@/components/home/motion";
import { PillThumb } from "@/components/home/pill-motion";
import { WORK, detail, keyArt } from "@/components/home/work-data";

type Props = {
  slug: string;
  /** Where the viewer grows from: the card that was chosen. */
  origin: DOMRect | null;
  closing: boolean;
  /** Closing towards the Poster: the viewer drops away where it is, rather than
   *  returning to a card the line is already carrying out of view. */
  closingAway?: boolean;
  onClose: () => void;
  onClosed: () => void;
  onSwitch: (slug: string) => void;
  onPoster: () => void;
};

type Mode = "gallery" | "info";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function towards(panel: HTMLElement, rect: DOMRect) {
  const to = panel.getBoundingClientRect();
  return `translate(${rect.left - to.left}px, ${rect.top - to.top}px) scale(${rect.width / to.width}, ${rect.height / to.height})`;
}

/**
 * The project, in one place: a viewer over the Poster. The gallery is a
 * horizontal carousel you scroll; Info turns the same frame to the story.
 * Nothing opens elsewhere.
 */
/** The phone layout: frames stacked, scrolled down. Read at event time, never during render. */
const stacked = () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

export function WorkDetail({ slug, origin, closing, closingAway = false, onClose, onClosed, onSwitch, onPoster }: Props) {
  const project = WORK.find((p) => p.id === slug) ?? WORK[0];
  const d = detail(project);
  const total = d.frames.length;
  const start = Math.max(0, d.frames.findIndex((f) => f.src === d.art.src));
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("gallery");
  const [index, setIndex] = useState(start);
  /** The strip has run past this project's last frame: the next one is being revealed. */
  const [upNext, setUpNext] = useState(false);
  const glide = useRef<{ target: number | null; raf: number }>({ target: null, raf: 0 });
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  /** Survives pointer-up, so a drag that ends over "Next" doesn't count as choosing it. */
  const dragged = useRef(false);

  /* ---- Carousel mechanics ---------------------------------------------- */
  // On a desktop the frames run sideways, a carousel. On a phone they stack and you
  // scroll down through them, full width, each at its own proportion — the way a
  // thumb reads. The same mechanics serve both, along whichever axis is live.

  const frameLeft = useCallback((i: number) => {
    const strip = stripRef.current;
    const el = strip?.children[i] as HTMLElement | undefined;
    if (!strip || !el) return 0;
    return stacked() ? el.offsetTop : el.offsetLeft - Number.parseFloat(getComputedStyle(strip).paddingLeft || "0");
  }, []);

  const glideTo = useCallback((x: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const g = glide.current;
    const axis = stacked() ? "scrollTop" : "scrollLeft";
    const room = stacked() ? strip.scrollHeight - strip.clientHeight : strip.scrollWidth - strip.clientWidth;
    g.target = Math.max(0, Math.min(room, x));
    if (reduceMotion()) {
      strip[axis] = g.target;
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
      const cur = strip[axis];
      const next = cur + (target - cur) * 0.16;
      if (Math.abs(target - cur) < 4 || Math.round(next) === Math.round(cur)) {
        strip[axis] = target;
        g.target = null;
        g.raf = 0;
        return;
      }
      strip[axis] = next;
      g.raf = requestAnimationFrame(tick);
    };
    g.raf = requestAnimationFrame(tick);
  }, []);

  const toFrame = useCallback((i: number) => glideTo(frameLeft(Math.max(0, Math.min(total - 1, i)))), [frameLeft, glideTo, total]);

  // The counter follows the frame at the viewer's leading edge: its left, or on a phone, its top.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const kids = Array.from(strip.querySelectorAll<HTMLElement>(":scope > .hbw-viewer__frame"));
      let best = 0;
      if (stacked()) {
        const y = strip.scrollTop + 2;
        kids.forEach((el, i) => {
          if (el.offsetTop <= y) best = i;
        });
        if (strip.scrollTop >= strip.scrollHeight - strip.clientHeight - 2) best = kids.length - 1;
      } else {
        const pad = Number.parseFloat(getComputedStyle(strip).paddingLeft || "0");
        const x = strip.scrollLeft + pad + 1;
        let dist = Infinity;
        kids.forEach((el, i) => {
          const dd = Math.abs(el.offsetLeft - x);
          if (dd < dist) {
            dist = dd;
            best = i;
          }
        });
        if (strip.scrollLeft >= strip.scrollWidth - strip.clientWidth - 2) best = kids.length - 1;
      }
      setIndex(best);
      // The end: how far into the pause and the next project the strip has run, 0 → 1.
      // Written as --end, it dims the last frame and wipes the next project into view.
      const clip = strip.querySelector<HTMLElement>(":scope > .hbw-viewer__next-clip");
      if (clip) {
        const lead = Number.parseFloat(getComputedStyle(clip)[stacked() ? "marginTop" : "marginLeft"] || "0");
        const seen = stacked()
          ? strip.scrollTop + strip.clientHeight - (clip.offsetTop - lead)
          : strip.scrollLeft + strip.clientWidth - (clip.offsetLeft - lead);
        const span = (stacked() ? clip.offsetHeight : clip.offsetWidth) + lead;
        const end = Math.round(Math.max(0, Math.min(1, seen / Math.max(1, span))) * 1000) / 1000;
        strip.style.setProperty("--end", String(end));
        setUpNext(end > 0.6);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    strip.addEventListener("scroll", onScroll, { passive: true });
    read();
    return () => {
      strip.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [slug]);

  // The wheel pages sideways: vertical movement becomes travel along the carousel.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey || !strip || stacked()) return;
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? strip.clientWidth : 1;
      const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * unit;
      glideTo((glide.current.target ?? strip.scrollLeft) + delta);
    }
    strip.addEventListener("wheel", onWheel, { passive: false });
    return () => strip.removeEventListener("wheel", onWheel);
  }, [glideTo, slug]);

  // Frames play only while they're in view.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const v = e.target as HTMLVideoElement;
          if (e.intersectionRatio > 0.55 && mode === "gallery") void v.play().catch(() => undefined);
          else v.pause();
        }),
      { root: strip, threshold: [0, 0.55, 1] }
    );
    strip.querySelectorAll("video").forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [mode, slug]);

  // Info is set to fill its frame: find the largest type (80–135%) at which the text
  // still sits inside the columns, so every project reads as a composed page at any size.
  useLayoutEffect(() => {
    const info = infoRef.current;
    const flow = info?.querySelector<HTMLElement>(".hbw-viewer__flow");
    if (!info || !flow || mode !== "info") return;
    const fits = (scale: number) => {
      info.style.setProperty("--fit", String(scale));
      // Every block must end inside its own field.
      return Array.from(flow.children).every((el) => {
        const part = el as HTMLElement;
        return part.scrollHeight <= part.clientHeight + 1 && part.scrollWidth <= part.clientWidth + 1;
      });
    };
    const fit = () => {
      if (window.matchMedia("(max-width: 767px)").matches) {
        info.style.removeProperty("--fit");
        return;
      }
      let lo = 0.8;
      let hi = 1.35;
      if (fits(hi)) return;
      for (let i = 0; i < 8; i++) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) lo = mid;
        else hi = mid;
      }
      fits(Math.floor(lo * 100) / 100);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(info);
    return () => observer.disconnect();
  }, [mode, slug]);

  /* ---- Arrive, switch, leave -------------------------------------------- */

  const shownSlug = useRef(slug);
  const outgoing = useRef<Animation[]>([]);
  const titleRef = useRef<HTMLParagraphElement>(null);

  // Turning to the next project: this one steps back first, then the next arrives in
  // its place — one movement, never a blink.
  const turning = useRef(false);
  const turnTo = useCallback(
    (id: string) => {
      const strip = stripRef.current;
      if (turning.current) return;
      if (!strip || reduceMotion()) {
        onSwitch(id);
        return;
      }
      turning.current = true;
      const away = stacked() ? "translateY(-24px)" : "translateX(-24px)";
      const timing = { duration: 240, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" as const };
      const leave = [
        strip.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: away }], timing),
        ...(titleRef.current ? [titleRef.current.animate([{ opacity: 1 }, { opacity: 0 }], timing)] : []),
      ];
      outgoing.current = leave;
      leave[0].onfinish = () => {
        turning.current = false;
        onSwitch(id);
      };
    },
    [onSwitch]
  );
  useLayoutEffect(() => {
    const strip = stripRef.current;
    // A carousel opens on the project's key frame; a stack opens at its top.
    const first = stacked() ? 0 : start;
    if (strip) {
      strip.scrollLeft = stacked() ? 0 : frameLeft(first);
      strip.scrollTop = 0;
    }
    const turned = slug !== shownSlug.current;
    // The outgoing fades hold until the new project takes over, then let go.
    outgoing.current.forEach((a) => a.cancel());
    outgoing.current = [];
    if (turned && titleRef.current && !reduceMotion()) {
      titleRef.current.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], {
        duration: 520,
        easing: EASE,
      });
    }
    shownSlug.current = slug;
    if (turned && strip && !reduceMotion()) {
      strip.animate(
        [
          { opacity: 0, transform: stacked() ? "translateY(32px)" : "translateX(32px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 600, easing: EASE }
      );
    }
    setIndex(first);
    setMode("gallery");
    infoRef.current?.scrollTo(0, 0);
    // A new project opens on its own key frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const root = rootRef.current;
    if (!panel || !root) return;
    root.focus({ preventScroll: true });
    if (reduceMotion()) return;
    root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: HBW_T.spatial, easing: EASE });
    panel.animate(
      [
        { transform: origin ? towards(panel, origin) : "translateY(24px) scale(0.98)", opacity: origin ? 1 : 0, borderRadius: "8px" },
        { transform: "none", opacity: 1, borderRadius: "14px" },
      ],
      { duration: 600, easing: EASE }
    );
    // Only the arrival grows from the card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!closing) return;
    const panel = panelRef.current;
    const root = rootRef.current;
    if (!panel || !root || reduceMotion()) {
      onClosed();
      return;
    }
    const card = document.querySelector<HTMLElement>(`.hbw-card[data-hbw-plate="${slug}"] .hbw-card__hit`);
    const r = card?.getBoundingClientRect();
    const visible = !closingAway && r && r.right > 0 && r.left < window.innerWidth;
    root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 440, easing: EASE, fill: "forwards" });
    const anim = panel.animate(
      [{ transform: "none" }, { transform: visible && r ? towards(panel, r) : "translateY(24px) scale(0.98)", opacity: visible ? 1 : 0 }],
      { duration: 440, easing: EASE, fill: "forwards" }
    );
    anim.onfinish = onClosed;
    return () => {
      anim.onfinish = null;
    };
  }, [closing, closingAway, onClosed, slug]);

  // Keys: Esc closes, ← → page the gallery, I turns to Info and back.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const el = event.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === "i" || event.key === "I") {
        event.stopPropagation();
        setMode((m) => (m === "gallery" ? "info" : "gallery"));
        return;
      }
      if (mode !== "gallery" || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
      event.preventDefault();
      event.stopPropagation();
      toFrame(index + (event.key === "ArrowRight" ? 1 : -1));
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [index, mode, onClose, toFrame]);

  /* ---- Content ---------------------------------------------------------- */

  const facts: [string, React.ReactNode][] = [];
  if (d.sectors.length) facts.push(["Sector", d.sectors.join(" · ")]);
  facts.push(["Year", project.year]);
  if (d.roles.length) facts.push(["Role", d.roles.join(", ")]);
  if (d.collaborators.length) facts.push(["With", d.collaborators.join(" · ")]);
  if (d.credits.length) facts.push(["Credits", d.credits.join(", ")]);
  if (d.features.length)
    facts.push([
      "Featured",
      d.features.map((f, i) => (
        <Fragment key={f.name}>
          {i ? " · " : null}
          {f.url ? (
            <a href={f.url} target="_blank" rel="noopener noreferrer">
              {f.name}
            </a>
          ) : (
            f.name
          )}
        </Fragment>
      )),
    ]);
  // The spread: Context leads, then each chapter. The Idea chapter's first line restates
  // the project's idea, which the viewer's bar already names — so it isn't said twice.
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const lead = d.context.length ? { heading: "Context", body: d.context } : null;
  const chapters = d.chapters.map((c) => {
    const [first, ...rest] = c.body;
    const firstText = first?.spans.map((sp) => sp.text).join("") ?? "";
    const repeats = c.id === "idea" && rest.length > 0 && norm(firstText) === norm(project.idea);
    return { id: c.id, heading: c.heading, body: repeats ? rest : c.body };
  });
  const next = WORK[(WORK.findIndex((p) => p.id === slug) + 1) % WORK.length];
  const nextArt = keyArt(next);

  return (
    <div ref={rootRef} className="hbw-detail" role="dialog" aria-modal="true" aria-label={project.name} tabIndex={-1}>
      <button type="button" className="hbw-detail__scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <article ref={panelRef} className={`hbw-viewer is-${mode}`}>
        <header className="hbw-viewer__bar">
          <p ref={titleRef} className="hbw-viewer__title">
            <span className="hbw-viewer__name">{project.name}</span>
            <span className="hbw-viewer__idea">{project.idea}</span>
          </p>
          <div className="hbw-viewer__tools">
            <span className="hbw-pill-group" role="tablist" aria-label="View">
              <PillThumb />
              <button
                type="button"
                role="tab"
                className="hbw-pill-group__item"
                aria-selected={mode === "gallery"}
                onClick={() => setMode("gallery")}
              >
                Gallery
              </button>
              <button
                type="button"
                role="tab"
                className="hbw-pill-group__item"
                aria-selected={mode === "info"}
                onClick={() => setMode("info")}
              >
                Info
              </button>
            </span>
            <span className={`hbw-pill hbw-viewer__count${mode === "gallery" ? "" : " is-away"}`} aria-live="polite">
              <span key={upNext ? "next" : "count"} className="hbw-viewer__count-text">
                {upNext ? "Up next" : `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
              </span>
            </span>
            <button type="button" className="hbw-pill hbw-viewer__close" aria-label="Close" onClick={onClose}>
              ✕
            </button>
          </div>
        </header>

        <div className="hbw-viewer__body">
          <div
            ref={stripRef}
            className="hbw-viewer__gallery"
            aria-hidden={mode === "gallery" ? undefined : true}
            inert={mode !== "gallery" || undefined}
            onPointerDown={(e) => {
              if (e.pointerType !== "mouse" || e.button !== 0) return;
              const strip = stripRef.current;
              if (!strip) return;
              glide.current.target = null;
              dragged.current = false;
              drag.current = { x: e.clientX, left: strip.scrollLeft, moved: false };
            }}
            onPointerMove={(e) => {
              const g = drag.current;
              const strip = stripRef.current;
              if (!g || !strip) return;
              const dx = e.clientX - g.x;
              if (Math.abs(dx) > 3) {
                g.moved = true;
                dragged.current = true;
                strip.classList.add("is-dragging");
              }
              strip.scrollLeft = g.left - dx;
            }}
            onPointerUp={() => {
              drag.current = null;
              stripRef.current?.classList.remove("is-dragging");
              // The click that ends a drag is swallowed; anything after it (a click, Enter) counts again.
              window.setTimeout(() => {
                dragged.current = false;
              }, 0);
            }}
            onPointerLeave={() => {
              drag.current = null;
              stripRef.current?.classList.remove("is-dragging");
            }}
          >
            {d.frames.map((f) => (
              // Keyed by project: a <video> doesn't reload when only its <source> changes, so
              // reusing elements across a switch would keep playing the last project's film.
              <figure
                key={`${slug}:${f.index}`}
                className="hbw-viewer__frame"
                style={{ aspectRatio: `${f.width} / ${f.height}` }}
              >
                {f.video && f.videoSrc ? (
                  <video poster={f.src} muted loop playsInline preload="metadata" aria-label={f.alt}>
                    {f.webm ? <source src={f.webm} type="video/webm" /> : null}
                    <source src={f.videoSrc} type="video/mp4" />
                  </video>
                ) : (
                  <img
                    src={f.src}
                    srcSet={f.srcSet}
                    sizes="(max-width: 767px) 90vw, 70vw"
                    alt={f.alt ?? ""}
                    loading={Math.abs(f.index - start) <= 2 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                  />
                )}
              </figure>
            ))}
            {/* After a pause, the next project edges in. Choosing it turns the viewer, in place. */}
            <div className="hbw-viewer__next-clip">
              <button
                type="button"
                className="hbw-viewer__next"
                aria-label={`Next project: ${next.name}`}
                onClick={() => {
                  if (dragged.current) return;
                  turnTo(next.id);
                }}
              >
                <img src={nextArt.src} srcSet={nextArt.srcSet} sizes="40vw" alt="" loading="lazy" decoding="async" draggable={false} style={{ objectPosition: nextArt.crop }} />
                <span className="hbw-pill hbw-viewer__next-label">
                  Next <span className="hbw-viewer__next-name">{next.name}</span>
                </span>
              </button>
            </div>
          </div>

          <div
            ref={infoRef}
            className="hbw-viewer__info"
            aria-hidden={mode === "info" ? undefined : true}
            inert={mode !== "info" || undefined}
          >
            {/* Read in one pass. The bar names it; left: why (the lead) and the facts; right: how,
                as labelled rows, closing on the ask. Every row is label | text. */}
            <div className="hbw-viewer__flow">
              <div className="hbw-viewer__intro">
                {lead ? (
                  <div className="hbw-viewer__lead">
                    <RichTextBody value={lead.body} />
                  </div>
                ) : null}
              </div>
              <div className="hbw-viewer__chapters">
                {chapters.map((part) => (
                  <section key={part.id} className="hbw-viewer__row">
                    <h3 className="hbw-viewer__label">{part.heading}</h3>
                    <div className="hbw-viewer__text">
                      <RichTextBody value={part.body} />
                    </div>
                  </section>
                ))}
              </div>
              <dl className="hbw-viewer__facts">
                {facts.map(([k, v]) => (
                  <div key={k} className="hbw-viewer__fact">
                    <dt className="hbw-viewer__label">{k}</dt>
                    <dd className="hbw-viewer__text">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="hbw-viewer__ask">
                <p className="hbw-viewer__label">At a turning point of your own?</p>
                <div className="hbw-viewer__text">
                  <button type="button" className="hbw-viewer__link" onClick={onPoster}>
                    Start a poster <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
