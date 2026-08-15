"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { HBW_T, isMobileViewport, reduceMotion } from "@/components/home/motion";
import { approachProject, commitProjectMedia, prefetchVideo, preloadProject } from "@/components/home/preload";
import { MovementVideo } from "@/components/home/projects/MovementVideo";
import { ProjectOutro } from "@/components/home/projects/ProjectOutro";
import { nextProject } from "@/components/home/sequence";
import { movementSpan, type ProjectExperience } from "@/components/home/projects/types";

export type ViewPhase = "idle" | "rising" | "assembling" | "active" | "exiting" | "handoff-in" | "handoff-out";

type Props = {
  experience: ProjectExperience;
  phase: ViewPhase;
  index: number;
  inspecting?: boolean;
  entrance?: "archive" | "reduced";
  onIndex: (index: number) => void;
  onCommitNext?: () => void;
};

const ANCHOR = 0.4;

export function ProjectView({
  experience,
  phase,
  index,
  inspecting = false,
  entrance = "reduced",
  onIndex,
  onCommitNext,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const indexRef = useRef(index);
  const offsets = useRef<number[]>([]);
  const outroLeft = useRef(0);
  const drag = useRef<{ x: number; from: number } | null>(null);
  const inspectX = useRef(0);
  const inspectY = useRef(0);
  const mobile = useRef(false);
  const committed = useRef(false);
  const movingTimer = useRef(0);
  const total = experience.movements.length;
  const next = nextProject(experience.slug);
  const live = phase !== "idle";
  const canDrive = phase === "active";

  indexRef.current = index;

  const markMoving = useCallback(() => {
    if (inspecting || !canDrive) return;
    const home = rootRef.current?.closest(".hbw-home");
    if (!(home instanceof HTMLElement)) return;
    home.classList.add("is-moving");
    window.clearTimeout(movingTimer.current);
    movingTimer.current = window.setTimeout(() => home.classList.remove("is-moving"), 600);
  }, [canDrive, inspecting]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;
    mobile.current = isMobileViewport();
    root.style.setProperty("--hbw-stage-w", `${root.clientWidth}px`);
    if (mobile.current) return;
    const origin = track.getBoundingClientRect().left;
    const items = [...track.querySelectorAll<HTMLElement>(".hbw-mv")];
    offsets.current = items.map((el) => Math.round(el.getBoundingClientRect().left - origin));
    const outro = track.querySelector<HTMLElement>(".hbw-outro");
    outroLeft.current = outro ? Math.round(outro.getBoundingClientRect().left - origin) : 0;
  }, []);

  const indexFromX = useCallback(
    (x: number) => {
      const root = rootRef.current;
      if (!root) return 0;
      const pts = offsets.current.map((left, i) => ({ i, left }));
      if (outroLeft.current) pts.push({ i: total, left: outroLeft.current });
      if (!pts.length) return 0;
      const anchor = x + root.clientWidth * ANCHOR;
      let active = pts[0].i;
      for (const item of pts) {
        if (item.left <= anchor + 1) active = item.i;
        else break;
      }
      return active;
    },
    [total]
  );

  const applyX = useCallback(
    (px: number, animate = false, silent = false) => {
      const root = rootRef.current;
      const track = trackRef.current;
      if (!root || !track || mobile.current) return;
      if (!offsets.current.length) measure();
      const max = Math.max(0, track.scrollWidth - root.clientWidth);
      xRef.current = Math.max(0, Math.min(max, px));
      const instant = reduceMotion() || !animate;
      track.style.transition = instant ? "none" : `transform ${HBW_T.ui}ms var(--hbw-ease)`;
      track.style.transform = `translate3d(${-xRef.current}px, 0, 0)`;
      if (silent) return;
      const nextIndex = indexFromX(xRef.current);
      if (nextIndex !== indexRef.current) onIndex(nextIndex);
    },
    [indexFromX, measure, onIndex]
  );

  const goTo = useCallback(
    (i: number) => {
      const root = rootRef.current;
      const inset = root && i > 0 ? Math.round(root.clientWidth * 0.07) : 0;
      if (i < 0) {
        applyX(0, true);
        return;
      }
      if (i >= total) {
        applyX(outroLeft.current || offsets.current[total - 1] || 0, true);
        return;
      }
      applyX(Math.max(0, (offsets.current[i] ?? 0) - inset), true);
    },
    [applyX, total]
  );

  useLayoutEffect(() => {
    committed.current = false;
    const shouldRestore = indexRef.current >= total;
    xRef.current = 0;
    const root = rootRef.current;
    const track = trackRef.current;
    if (track) {
      track.style.transition = "none";
      track.style.transform = "translate3d(0,0,0)";
    }
    if (root && !shouldRestore) root.scrollTo({ top: 0, behavior: "auto" });
    measure();
    if (shouldRestore) {
      if (mobile.current) {
        const outro = track?.querySelector<HTMLElement>(".hbw-outro");
        if (root && outro) root.scrollTo({ top: Math.max(0, outro.offsetTop - 12), behavior: "auto" });
      } else {
        applyX(outroLeft.current, false, true);
      }
    } else {
      applyX(0, false, true);
    }
    // Reset only when the project changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experience.slug]);

  useLayoutEffect(() => {
    if (phase === "idle") {
      const root = rootRef.current;
      root?.scrollTo(0, 0);
      return;
    }
    measure();
  }, [measure, phase]);

  useEffect(() => {
    return () => {
      window.clearTimeout(movingTimer.current);
      rootRef.current?.closest(".hbw-home")?.classList.remove("is-moving");
    };
  }, []);

  const wasInspecting = useRef(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || phase === "idle") return;
    if (inspecting && !wasInspecting.current) {
      wasInspecting.current = true;
      window.clearTimeout(movingTimer.current);
      root?.closest(".hbw-home")?.classList.remove("is-moving");
      if (mobile.current) inspectY.current = root.scrollTop;
      else inspectX.current = xRef.current;
      if (!mobile.current) {
        const i = Math.min(indexRef.current, total - 1);
        root.querySelectorAll<HTMLElement>(".hbw-mv")[i]?.scrollIntoView({ block: "start", behavior: "instant" });
      }
      return;
    }
    if (!inspecting && wasInspecting.current) {
      wasInspecting.current = false;
      if (mobile.current) {
        root.scrollTop = inspectY.current;
        return;
      }
      measure();
      applyX(inspectX.current, false, true);
    }
  }, [applyX, inspecting, measure, phase, total]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => {
      const track = trackRef.current;
      if (!track) return;
      if (mobile.current || inspecting) {
        measure();
        return;
      }
      const savedX = xRef.current;
      const i = Math.min(indexRef.current, total);
      const oldLefts = offsets.current;
      const oldOutro = outroLeft.current;
      const oldTrack = track.scrollWidth;
      const had = oldLefts.length > 0;
      const oldLeft = i >= total ? oldOutro : oldLefts[i] ?? 0;
      const oldNext =
        i >= total ? oldTrack : i + 1 < oldLefts.length ? oldLefts[i + 1] : oldOutro || oldTrack;
      const progress = had ? (savedX - oldLeft) / Math.max(1, oldNext - oldLeft) : 0;
      measure();
      if (!offsets.current.length) {
        applyX(savedX, false, true);
        return;
      }
      const newLefts = offsets.current;
      const newOutro = outroLeft.current;
      const newTrack = track.scrollWidth;
      const newLeft = i >= total ? newOutro : newLefts[i] ?? 0;
      const newNext =
        i >= total ? newTrack : i + 1 < newLefts.length ? newLefts[i + 1] : newOutro || newTrack;
      applyX(had ? newLeft + progress * Math.max(1, newNext - newLeft) : savedX, false, true);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [applyX, inspecting, measure, total]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !canDrive) return;

    function onWheel(event: WheelEvent) {
      const el = rootRef.current;
      if (!el || mobile.current) return;
      if (inspecting) return;
      if (document.querySelector(".hbw-sheet.is-global-right.is-visible, .hbw-sheet.is-global-left.is-visible")) return;
      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      let delta = absX > absY ? event.deltaX : event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      if (event.deltaMode === 2) delta *= el.clientWidth * 0.8;
      if (delta === 0) return;
      event.preventDefault();
      markMoving();
      applyX(xRef.current + delta, false);
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [applyX, canDrive, inspecting, markMoving]);

  useEffect(() => {
    if (!canDrive) return;
    function onKey(event: KeyboardEvent) {
      if (inspecting) return;
      if (document.querySelector(".hbw-sheet.is-global-right.is-visible, .hbw-sheet.is-global-left.is-visible")) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        if (mobile.current) {
          rootRef.current?.scrollBy({
            top: Math.round((rootRef.current.clientHeight || 600) * 0.72),
            behavior: reduceMotion() ? "auto" : "smooth",
          });
          return;
        }
        goTo(Math.min(indexRef.current + 1, total));
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        if (mobile.current) {
          rootRef.current?.scrollBy({
            top: -Math.round((rootRef.current.clientHeight || 600) * 0.72),
            behavior: reduceMotion() ? "auto" : "smooth",
          });
          return;
        }
        if (indexRef.current <= 0) return;
        goTo(indexRef.current - 1);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [canDrive, goTo, inspecting, total]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !mobile.current || !canDrive) return;
    const items = [...root.querySelectorAll<HTMLElement>(".hbw-mv")];
    const outro = root.querySelector<HTMLElement>(".hbw-outro");
    if (!items.length) return;

    function nearest() {
      if (!root) return;
      let active = 0;
      let best = Infinity;
      items.forEach((el, i) => {
        const d = Math.abs(el.offsetTop - root.scrollTop);
        if (d < best) {
          best = d;
          active = i;
        }
      });
      if (outro && root.scrollTop + root.clientHeight >= outro.offsetTop + 24) active = total;
      if (active !== indexRef.current) onIndex(active);
    }

    function onScroll() {
      markMoving();
      nearest();
    }

    const delay = 0;
    const timer = window.setTimeout(() => {
      root.addEventListener("scroll", onScroll, { passive: true });
    }, reduceMotion() ? 0 : delay);
    return () => {
      window.clearTimeout(timer);
      root.removeEventListener("scroll", onScroll);
    };
  }, [canDrive, experience.slug, markMoving, onIndex, total]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const videos = [...track.querySelectorAll("video")];
    videos.forEach((video, i) => {
      if (Math.abs(i - Math.min(index, total - 1)) <= 1 && (phase === "active" || phase === "rising" || phase === "assembling" || phase === "handoff-in")) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [index, phase, total]);

  useEffect(() => {
    if (!canDrive || !next) return;
    if (index < total - 2) return;
    approachProject(next.id);
    preloadProject(next.id);
  }, [canDrive, index, next, total]);

  useEffect(() => {
    if (!canDrive || !next) return;
    if (index < total) return;
    commitProjectMedia(next.id);
  }, [canDrive, index, next, total]);

  useEffect(() => {
    if (!canDrive) return;
    experience.movements.forEach((movement, i) => {
      if (movement.media.type !== "video") return;
      const current = Math.min(index, total - 1);
      const dist = Math.abs(i - current);
      if (i === 0 || i === 1 || dist <= 1) void prefetchVideo(movement.media.src);
    });
  }, [canDrive, experience.movements, index, total]);

  function onPointerDown(event: React.PointerEvent) {
    if (mobile.current || event.button !== 0 || !canDrive || inspecting) return;
    if ((event.target as HTMLElement).closest("button, a")) return;
    drag.current = { x: event.clientX, from: xRef.current };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    const root = rootRef.current;
    if (inspecting || mobile.current || !canDrive || !root) return;
    if (drag.current) {
      const delta = event.clientX - drag.current.x;
      if (Math.abs(delta) > 6) {
        root.classList.add("is-dragging");
        markMoving();
      }
      applyX(drag.current.from - delta, false);
      return;
    }
    const mid = root.getBoundingClientRect().left + root.clientWidth * 0.5;
    root.classList.toggle("is-zone-next", event.clientX >= mid);
    root.classList.toggle("is-zone-prev", event.clientX < mid);
  }

  function onPointerUp(event: React.PointerEvent) {
    const root = rootRef.current;
    const start = drag.current;
    root?.classList.remove("is-dragging");
    drag.current = null;
    if (!start || inspecting || mobile.current || !root) return;
    if (Math.abs(event.clientX - start.x) > 8) return;
    const mid = root.getBoundingClientRect().left + root.clientWidth * 0.5;
    if (event.clientX >= mid) goTo(Math.min(indexRef.current + 1, total));
    else if (indexRef.current > 0) goTo(indexRef.current - 1);
  }

  function onPointerLeave() {
    rootRef.current?.classList.remove("is-zone-next", "is-zone-prev");
  }

  function commitFromOutro() {
    if (!canDrive || committed.current) return;
    committed.current = true;
    onCommitNext?.();
  }

  return (
    <div
      ref={rootRef}
      className={`hbw-stage hbw-project-view is-${phase}${inspecting ? " is-read" : ""}`}
      data-hbw-track-x={Math.round(xRef.current)}
      data-hbw-index={index}
      aria-hidden={!live ? true : undefined}
      inert={live ? undefined : true}
      tabIndex={live ? 0 : -1}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      <div ref={trackRef} className="hbw-project-view__track">
        {experience.movements.map((movement, i) => {
          const media = movement.media;
          const span = movementSpan(movement);
          const current = Math.min(index, total - 1);
          const dist = Math.abs(i - current);
          const eager = i === 0;
          const nearby = dist <= 1;
          const load = media.type === "video" && (i === 0 || i === 1 || dist <= 1);
          const openingName =
            i !== 0 || phase === "handoff-out"
              ? undefined
              : phase === "handoff-in" || phase === "active"
                ? `hbw-cover-${experience.slug}`
                : entrance === "archive"
                  ? `hbw-media-${experience.slug}`
                  : undefined;
          return (
            <section
              key={movement.id}
              className={`hbw-mv hbw-mv--${movement.kind} hbw-mv--${span}${movement.align ? ` is-${movement.align}` : ""}${
                i === current ? " is-current" : ""
              }`}
              style={{
                background: movement.surface || undefined,
                ["--hbw-mv-ratio" as string]: `${media.width} / ${media.height}`,
              }}
              aria-label={`${experience.name} ${String(i + 1).padStart(2, "0")}`}
            >
              {media.type === "video" ? (
                <MovementVideo
                  media={media}
                  load={load}
                  eager={eager}
                  viewTransitionName={openingName}
                />
              ) : (
                <img
                  className={`hbw-mv__media is-${media.fit}`}
                  src={media.src}
                  srcSet={media.srcSet}
                  sizes={span === "narrow" || span === "contained" ? "(max-width: 767px) 92vw, 46vw" : "(max-width: 767px) 94vw, 88vw"}
                  alt=""
                  width={media.width}
                  height={media.height}
                  loading={eager || nearby ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={eager ? "high" : undefined}
                  style={openingName ? { viewTransitionName: openingName } : undefined}
                />
              )}
            </section>
          );
        })}
        <ProjectOutro
          next={next}
          onCommit={commitFromOutro}
          coverName={phase !== "handoff-out" ? next?.id : undefined}
        />
      </div>
    </div>
  );
}
