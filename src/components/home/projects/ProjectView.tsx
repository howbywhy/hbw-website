"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { HBW_T, isMobileViewport, reduceMotion } from "@/components/home/motion";
import { approachProject, commitProjectMedia, prefetchVideo, preloadProject } from "@/components/home/preload";
import { MovementVideo } from "@/components/home/projects/MovementVideo";
import { ProjectOutro } from "@/components/home/projects/ProjectOutro";
import { nextProject } from "@/components/home/sequence";
import { projectById } from "@/components/home/catalog";
import { isVideoMedia, movementSpan, type ProjectExperience } from "@/components/home/projects/types";

export type ViewPhase = "idle" | "rising" | "assembling" | "active" | "exiting" | "handoff-in" | "handoff-out";

type Props = {
  experience: ProjectExperience;
  phase: ViewPhase;
  index: number;
  inspecting?: boolean;
  entrance?: "archive" | "reduced" | "handoff";
  onIndex: (index: number) => void;
  onCommitNext?: () => void;
  onLeaveInspect?: () => void;
  restoreX?: number | null;
};

const ANCHOR = 0.4;

type FlipRect = { left: number; top: number; width: number; height: number };

function readRect(el: HTMLElement): FlipRect {
  const box = el.getBoundingClientRect();
  return { left: box.left, top: box.top, width: box.width, height: box.height };
}

function sheetCutX() {
  const studio = document.querySelector<HTMLElement>(".hbw-nav-studio");
  return studio?.getBoundingClientRect().left ?? 848;
}

function intersectsExposed(rect: FlipRect, cut: number, vh: number) {
  return rect.left < cut && rect.left + rect.width > 0 && rect.top < vh && rect.top + rect.height > 0;
}

const inspectScrollByProject = new Map<string, number>();

export function ProjectView({
  experience,
  phase,
  index,
  inspecting = false,
  entrance = "reduced",
  onIndex,
  onCommitNext,
  onLeaveInspect,
  restoreX = null,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const indexRef = useRef(index);
  const offsets = useRef<number[]>([]);
  const outroLeft = useRef(0);
  const boundaryRef = useRef(false);
  const boundaryHold = useRef(false);
  const skipClick = useRef(false);
  const drag = useRef<{ x: number; from: number } | null>(null);
  const mobile = useRef(false);
  const inspectAdvance = useRef(false);
  const inspectHeldX = useRef<number | null>(null);
  const restoreXRef = useRef(restoreX);
  restoreXRef.current = restoreX;
  const parkHold = useRef<number | null>(null);
  const committed = useRef(false);
  const movingTimer = useRef(0);
  const total = experience.movements.length;
  const next = nextProject(experience.slug);
  const live = phase !== "idle";
  const canDrive = phase === "active";

  indexRef.current = index;

  const markMoving = useCallback(() => {
    if (inspecting || !canDrive || mobile.current) return;
    const home = rootRef.current?.closest(".hbw-home");
    if (!(home instanceof HTMLElement)) return;
    home.classList.add("is-moving");
    window.clearTimeout(movingTimer.current);
    movingTimer.current = window.setTimeout(() => home.classList.remove("is-moving"), HBW_T.continuity);
  }, [canDrive, inspecting]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;
    mobile.current = isMobileViewport();
    root.style.setProperty("--hbw-stage-w", `${root.clientWidth}px`);
    if (mobile.current) return;
    const items = [...track.querySelectorAll<HTMLElement>(":scope > .hbw-mv")];
    const outro = track.querySelector<HTMLElement>(":scope > .hbw-outro");
    const origin = track.getBoundingClientRect().left;
    offsets.current = items.map((el) => Math.round(el.getBoundingClientRect().left - origin));
    outroLeft.current = outro ? Math.round(outro.getBoundingClientRect().left - origin) : 0;
  }, []);

  const nextRestX = useCallback(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const preview = track?.querySelector<HTMLElement>(".hbw-outro.is-next .hbw-outro__preview");
    if (!root) return 0;
    if (track && preview) {
      const trackBox = track.getBoundingClientRect();
      const box = preview.getBoundingClientRect();
      const tx = new DOMMatrixReadOnly(getComputedStyle(preview).transform).m41 || 0;
      const rest = Math.round(box.left - trackBox.left - tx + box.width - root.clientWidth);
      if (rest > 0) return rest;
    }
    const stage = root.clientWidth;
    const last = offsets.current[total - 1] ?? 0;
    const parked = Math.max(0, last - Math.round(stage * 0.07));
    return parked + Math.round(stage * 0.28);
  }, [total]);

  const leaveInspectToBoundary = useCallback(() => {
    if (mobile.current || !next || indexRef.current < total - 1) return false;
    inspectAdvance.current = true;
    onLeaveInspect?.();
    return true;
  }, [next, onLeaveInspect, total]);

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
      if (next && !boundaryHold.current && active >= total) return Math.max(0, total - 1);
      return active;
    },
    [next, total]
  );

  const pastOutro = useCallback(
    (x: number) => {
      const root = rootRef.current;
      if (!root || !next || !outroLeft.current) return false;
      return outroLeft.current <= x + root.clientWidth * ANCHOR + 1;
    },
    [next]
  );

  const applyX = useCallback(
    (px: number, animate = false, silent = false, ms: number = HBW_T.ui) => {
      const root = rootRef.current;
      const track = trackRef.current;
      if (!root || !track || mobile.current) return;
      if (!offsets.current.length) measure();
      let max = Math.max(0, track.scrollWidth - root.clientWidth);
      if (next && offsets.current.length) {
        max = Math.min(max, nextRestX());
      }
      xRef.current = Math.max(0, Math.min(max, px));
      root.setAttribute("data-hbw-track-x", String(Math.round(xRef.current)));
      if (!silent) inspectHeldX.current = null;
      const instant = reduceMotion() || !animate;
      track.style.transition = instant ? "none" : `transform ${ms}ms var(--hbw-ease)`;
      track.style.transform = `translate3d(${-xRef.current}px, 0, 0)`;
      if (silent) return;
      parkHold.current = null;
      const nextIndex = indexFromX(xRef.current);
      if (nextIndex !== indexRef.current) onIndex(nextIndex);
    },
    [indexFromX, measure, next, nextRestX, onIndex]
  );

  const goTo = useCallback(
    (i: number) => {
      const root = rootRef.current;
      const inset = root && i > 0 ? Math.round(root.clientWidth * 0.07) : 0;
      const fromBoundary = indexRef.current >= total;
      if (i < 0) {
        applyX(0, true);
        return;
      }
      if (i >= total) {
        if (next) boundaryHold.current = true;
        applyX(nextRestX(), true, false, HBW_T.continuity);
        return;
      }
      if (next) boundaryHold.current = false;
      applyX(
        Math.max(0, (offsets.current[i] ?? 0) - inset),
        true,
        false,
        fromBoundary && i === total - 1 ? HBW_T.continuity : HBW_T.ui
      );
    },
    [applyX, next, nextRestX, total]
  );

  useLayoutEffect(() => {
    committed.current = false;
    const shouldRestore = indexRef.current >= total;
    xRef.current = 0;
    const root = rootRef.current;
    const track = trackRef.current;
    mobile.current = isMobileViewport();
    if (track) {
      track.style.transition = "none";
      track.style.transform = mobile.current ? "none" : "translate3d(0,0,0)";
    }
    if (root && !shouldRestore && indexRef.current <= 0) root.scrollTo({ top: 0, behavior: "auto" });
    measure();
    const parkedX = restoreXRef.current;
    const atBoundary = indexRef.current >= total;
    boundaryHold.current = Boolean(next) && !mobile.current && atBoundary;
    boundaryRef.current = boundaryHold.current;
    parkHold.current = parkedX != null && parkedX >= 0 && !mobile.current && !atBoundary ? parkedX : null;
    if (parkedX != null && parkedX >= 0 && !mobile.current) {
      applyX(atBoundary ? nextRestX() || parkedX : parkedX, false, true);
    } else if (shouldRestore) {
      if (mobile.current) {
        const outro = track?.querySelector<HTMLElement>(".hbw-outro");
        if (root && outro) root.scrollTo({ top: Math.max(0, outro.offsetTop - 12), behavior: "auto" });
      } else {
        applyX(nextRestX(), false, true);
      }
    } else if (indexRef.current > 0) {
      if (mobile.current) {
        const items = track?.querySelectorAll<HTMLElement>(".hbw-mv");
        const target = items?.[indexRef.current];
        if (root && target) root.scrollTo({ top: target.offsetTop, behavior: "auto" });
      } else {
        const inset = root ? Math.round(root.clientWidth * 0.07) : 0;
        applyX(Math.max(0, (offsets.current[indexRef.current] ?? 0) - inset), false, true);
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
    if (phase !== "active" || !mobile.current) return;
    const track = trackRef.current;
    if (!track) return;
    track.style.transform = "none";
    track.querySelectorAll<HTMLElement>(".hbw-mv").forEach((el) => {
      el.style.transform = "none";
    });
  }, [measure, phase]);

  useEffect(() => {
    return () => {
      window.clearTimeout(movingTimer.current);
      rootRef.current?.closest(".hbw-home")?.classList.remove("is-moving");
    };
  }, []);

  const inspectX = useRef(0);
  const inspectY = useRef(0);
  const inspectingRef = useRef(inspecting);
  inspectingRef.current = inspecting;
  const wasInspecting = useRef(false);
  const flipRects = useRef<Map<string, FlipRect>>(new Map());
  const flipTimer = useRef(0);
  const ignoreResize = useRef(false);
  const slugRef = useRef(experience.slug);
  slugRef.current = experience.slug;
  const currentId = experience.movements[Math.min(index, Math.max(0, total - 1))]?.id;

  const clearFlip = useCallback(() => {
    const track = trackRef.current;
    if (track) {
      track.querySelectorAll<HTMLElement>(".hbw-mv").forEach((el) => {
        el.style.transition = "";
        el.style.transform = "";
        el.style.transformOrigin = "";
        el.style.zIndex = "";
        el.style.willChange = "";
      });
    }
    rootRef.current?.classList.remove("is-reflowing");
    ignoreResize.current = false;
  }, []);

  const playFlip = useCallback((mode: "open" | "close") => {
    const root = rootRef.current;
    const track = trackRef.current;
    const prev = flipRects.current;
    flipRects.current = new Map();
    window.clearTimeout(flipTimer.current);
    if (!root || !track || mobile.current || reduceMotion() || !prev.size) {
      ignoreResize.current = false;
      return;
    }
    if (mode === "open") {
      const remembered = inspectScrollByProject.get(slugRef.current);
      if (remembered != null) {
        root.scrollTop = remembered;
      } else {
        const currentEl = track.querySelector<HTMLElement>(".hbw-mv.is-current");
        const currentPrev = currentId ? prev.get(currentId) : undefined;
        if (currentEl && currentPrev) {
          const cell = currentEl.getBoundingClientRect();
          const rootBox = root.getBoundingClientRect();
          const minY = Math.max(rootBox.top, 0);
          const maxY = Math.max(minY, window.innerHeight - Math.min(cell.height, window.innerHeight * 0.86));
          const desired = Math.min(Math.max(currentPrev.top, minY), maxY);
          root.scrollTop = Math.max(0, root.scrollTop + (cell.top - desired));
        }
      }
    }
    const cut = sheetCutX();
    const vh = window.innerHeight;
    const plays: HTMLElement[] = [];
    track.querySelectorAll<HTMLElement>(".hbw-mv").forEach((el) => {
      const id = el.dataset.hbwMv;
      if (!id) return;
      const old = prev.get(id);
      if (!old) return;
      const next = readRect(el);
      const current = el.classList.contains("is-current") || id === currentId;
      if (!current && !intersectsExposed(old, cut, vh) && !intersectsExposed(next, cut, vh)) return;
      const dx = old.left - next.left;
      const dy = old.top - next.top;
      const sx = old.width / Math.max(1, next.width);
      const sy = old.height / Math.max(1, next.height);
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;
      el.style.transition = "none";
      el.style.transformOrigin = "top left";
      el.style.willChange = "transform";
      el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      el.style.zIndex = current ? "6" : "1";
      plays.push(el);
    });
    if (!plays.length) {
      ignoreResize.current = false;
      return;
    }
    root.classList.add("is-reflowing");
    void root.offsetWidth;
    requestAnimationFrame(() => {
      plays.forEach((el) => {
        el.style.transition = `transform ${HBW_T.spatial}ms var(--hbw-ease)`;
        el.style.transform = "none";
      });
    });
    flipTimer.current = window.setTimeout(() => {
      clearFlip();
    }, HBW_T.spatial);
  }, [clearFlip, currentId]);

  useLayoutEffect(() => {
    function onCapture() {
      const root = rootRef.current;
      const track = trackRef.current;
      if (inspectingRef.current && root && !mobile.current) {
        inspectScrollByProject.set(slugRef.current, root.scrollTop);
      }
      if (!track || mobile.current || reduceMotion()) {
        flipRects.current = new Map();
        return;
      }
      const next = new Map<string, FlipRect>();
      track.querySelectorAll<HTMLElement>(".hbw-mv").forEach((el) => {
        const id = el.dataset.hbwMv;
        if (id) next.set(id, readRect(el));
      });
      flipRects.current = next;
    }
    window.addEventListener("hbw:inspect-capture", onCapture);
    return () => window.removeEventListener("hbw:inspect-capture", onCapture);
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || phase === "idle") return;
    if (inspecting && !wasInspecting.current) {
      wasInspecting.current = true;
      ignoreResize.current = true;
      window.clearTimeout(movingTimer.current);
      root.closest(".hbw-home")?.classList.remove("is-moving");
      if (mobile.current) inspectY.current = root.scrollTop;
      else {
        inspectX.current = xRef.current;
        inspectHeldX.current = xRef.current;
      }
      if (!mobile.current) {
        root.scrollTop = inspectScrollByProject.get(experience.slug) ?? 0;
      }
      ignoreResize.current = true;
      playFlip("open");
      return;
    }
    if (!inspecting && wasInspecting.current) {
      wasInspecting.current = false;
      if (mobile.current) {
        root.scrollTop = inspectY.current;
        return;
      }
      ignoreResize.current = true;
      inspectHeldX.current = inspectX.current;
      root.scrollTop = 0;
      measure();
      applyX(inspectX.current, false, true);
      playFlip("close");
      const after = reduceMotion() ? 0 : inspectAdvance.current ? HBW_T.continuity : HBW_T.spatial;
      if (inspectAdvance.current) {
        inspectAdvance.current = false;
        inspectHeldX.current = null;
        window.setTimeout(() => {
          measure();
          goTo(total);
          ignoreResize.current = false;
        }, after);
      } else {
        window.setTimeout(() => {
          ignoreResize.current = false;
        }, after);
      }
    }
  }, [applyX, experience.slug, goTo, inspecting, measure, phase, playFlip, total]);

  useEffect(() => {
    return () => {
      window.clearTimeout(flipTimer.current);
      clearFlip();
    };
  }, [clearFlip]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !inspecting || mobile.current) return;
    function onScroll() {
      if (!root) return;
      inspectScrollByProject.set(slugRef.current, root.scrollTop);
    }
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [inspecting]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => {
      const track = trackRef.current;
      if (!track) return;
      if (mobile.current) return;
      if (inspectingRef.current || ignoreResize.current) return;
      if (parkHold.current != null) {
        measure();
        applyX(parkHold.current, false, true);
        return;
      }
      if (inspectHeldX.current != null) {
        measure();
        applyX(inspectHeldX.current, false, true);
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
      if (i >= total && next) {
        applyX(nextRestX(), false, true);
        return;
      }
      const newLefts = offsets.current;
      const newOutro = outroLeft.current;
      const newTrack = track.scrollWidth;
      const newLeft = newLefts[i] ?? 0;
      const newNext = i + 1 < newLefts.length ? newLefts[i + 1] : newOutro || newTrack;
      applyX(had ? newLeft + progress * Math.max(1, newNext - newLeft) : savedX, false, true);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [applyX, measure, next, nextRestX, total]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !canDrive) return;

    function onWheel(event: WheelEvent) {
      const el = rootRef.current;
      if (!el || mobile.current) return;
      if (document.querySelector(".hbw-sheet.is-global-right.is-visible, .hbw-sheet.is-global-left.is-visible")) return;
      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      let delta = absX > absY ? event.deltaX : event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      if (event.deltaMode === 2) delta *= el.clientWidth * 0.8;
      if (delta === 0) return;
      if (inspecting) {
        if (delta > 0 && leaveInspectToBoundary()) event.preventDefault();
        return;
      }
      event.preventDefault();
      markMoving();
      applyX(xRef.current + delta, false);
      if (pastOutro(xRef.current) && !boundaryHold.current) goTo(total);
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [applyX, canDrive, goTo, inspecting, leaveInspectToBoundary, markMoving, pastOutro]);

  useEffect(() => {
    if (!canDrive) return;
    function onBoundaryNext() {
      if (mobile.current || !next) return;
      if (inspectingRef.current) {
        leaveInspectToBoundary();
        return;
      }
      if (indexRef.current < total) goTo(total);
    }
    window.addEventListener("hbw:boundary-next", onBoundaryNext);
    return () => window.removeEventListener("hbw:boundary-next", onBoundaryNext);
  }, [canDrive, goTo, leaveInspectToBoundary, next, total]);

  useEffect(() => {
    if (!canDrive) return;
    function onKey(event: KeyboardEvent) {
      if (document.querySelector(".hbw-sheet.is-global-right.is-visible, .hbw-sheet.is-global-left.is-visible")) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        if (inspecting) {
          if (leaveInspectToBoundary()) event.preventDefault();
          return;
        }
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
        if (inspecting) return;
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
  }, [canDrive, goTo, inspecting, leaveInspectToBoundary, total]);

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
      const nearby = Math.abs(i - Math.min(index, total - 1)) <= 1 && (phase === "active" || phase === "rising" || phase === "assembling" || phase === "handoff-in");
      if (nearby && !reduceMotion()) {
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

  useLayoutEffect(() => {
    const root = rootRef.current;
    const now =
      Boolean(next) && !mobile.current && boundaryHold.current && (phase === "active" || phase === "handoff-out");
    if (root) root.classList.toggle("is-boundary", now);
    boundaryRef.current = now;
  }, [index, next, phase, total]);

  function movementIndexFromTarget(target: EventTarget | null) {
    const node = target instanceof Element ? target.closest(".hbw-mv") : null;
    const track = trackRef.current;
    if (!node || !track) return -1;
    return [...track.querySelectorAll<HTMLElement>(":scope > .hbw-mv")].indexOf(node as HTMLElement);
  }

  function onPointerDown(event: React.PointerEvent) {
    if (mobile.current || event.button !== 0 || !canDrive) return;
    if ((event.target as HTMLElement).closest("button, a")) return;
    if (inspecting && (indexRef.current < total - 1 || !next)) return;
    drag.current = { x: event.clientX, from: xRef.current };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    const root = rootRef.current;
    if (mobile.current || !canDrive || !root) return;
    if (inspecting) return;
    if (drag.current) {
      const delta = event.clientX - drag.current.x;
      if (Math.abs(delta) > 6) {
        root.classList.add("is-dragging");
        markMoving();
      }
      applyX(drag.current.from - delta, false);
      return;
    }
    if ((event.target as HTMLElement).closest(".hbw-outro.is-next .hbw-outro__preview")) {
      root.classList.remove("is-zone-next", "is-zone-prev", "is-over-mv-next", "is-over-mv-prev", "is-over-mv-current");
      root.classList.add("is-over-next");
      return;
    }
    root.classList.remove("is-over-next", "is-zone-next", "is-zone-prev", "is-over-mv-next", "is-over-mv-prev", "is-over-mv-current");
    const i = movementIndexFromTarget(event.target);
    const current = Math.min(indexRef.current, total - 1);
    if (i < 0) return;
    if (i === current && indexRef.current < total) root.classList.add("is-over-mv-current");
    else if (i > current) root.classList.add("is-over-mv-next");
    else root.classList.add("is-over-mv-prev");
  }

  function onPointerUp(event: React.PointerEvent) {
    const root = rootRef.current;
    const start = drag.current;
    root?.classList.remove("is-dragging");
    drag.current = null;
    if (!start || mobile.current || !root) return;
    if (inspecting) {
      const dx = event.clientX - start.x;
      if (dx < -8 || (Math.abs(dx) <= 8 && event.clientX >= root.getBoundingClientRect().left + root.clientWidth * 0.5)) {
        leaveInspectToBoundary();
      }
      return;
    }
    skipClick.current = Math.abs(event.clientX - start.x) > 8;
    if (pastOutro(xRef.current) && !boundaryHold.current) goTo(total);
  }

  function onMediaClick(event: React.MouseEvent) {
    if (mobile.current || !canDrive || inspecting) return;
    if ((event.target as HTMLElement).closest("button, a")) return;
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    const i = movementIndexFromTarget(event.target);
    if (i < 0) return;
    const current = Math.min(indexRef.current, total - 1);
    if (i === current && indexRef.current < total) return;
    const node = (event.target as HTMLElement).closest(".hbw-mv");
    const root = rootRef.current;
    if (!node || !root) return;
    const media = node.getBoundingClientRect();
    const stage = root.getBoundingClientRect();
    if (media.right < stage.left + 8 || media.left > stage.right - 8) return;
    goTo(i);
  }

  function onPointerLeave() {
    rootRef.current?.classList.remove(
      "is-zone-next",
      "is-zone-prev",
      "is-over-next",
      "is-over-mv-next",
      "is-over-mv-prev",
      "is-over-mv-current"
    );
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
      onClick={onMediaClick}
    >
      <div ref={trackRef} className="hbw-project-view__track">
        {experience.movements.map((movement, i) => {
          const media = movement.media;
          const span = movementSpan(movement);
          const current = Math.min(index, total - 1);
          const dist = Math.abs(i - current);
          const eager = i === 0;
          const nearby = inspecting || i < 3;
          const load = isVideoMedia(media) && (i === 0 || i === 1 || dist <= 1);
          const openingName =
            i !== 0 || phase === "handoff-out" || restoreX != null
              ? undefined
              : phase === "handoff-in" || phase === "active" || entrance === "handoff"
                ? `hbw-cover-${experience.slug}`
                : entrance === "archive"
                  ? `hbw-media-${experience.slug}`
                  : undefined;
          return (
            <section
              key={movement.id}
              data-hbw-mv={movement.id}
              className={`hbw-mv hbw-mv--${movement.kind} hbw-mv--${span}${movement.align ? ` is-${movement.align}` : ""}${
                i === current ? " is-current" : ""
              }`}
              style={{
                background: movement.surface || undefined,
                ["--hbw-mv-ratio" as string]: `${media.width} / ${media.height}`,
              }}
              aria-label={`${projectById(experience.slug).name} ${String(i + 1).padStart(2, "0")}`}
            >
              {isVideoMedia(media) ? (
                <MovementVideo
                  media={media}
                  load={load}
                  eager={eager}
                  active={live && i === current}
                  viewTransitionName={openingName}
                />
              ) : (
                <img
                  className={`hbw-mv__media is-${media.fit}`}
                  src={media.src}
                  srcSet={media.srcSet}
                  sizes={span === "narrow" || span === "contained" ? "(max-width: 767px) 100vw, 46vw" : "(max-width: 767px) 100vw, 88vw"}
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
          fromTotal={total}
        />
      </div>
    </div>
  );
}
