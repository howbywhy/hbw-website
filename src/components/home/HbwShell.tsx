"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { SiteNav } from "@/components/home/SiteNav";
import { WorkScroll, type WorkInView, type WorkScrollHandle } from "@/components/home/WorkScroll";
import { PosterTool } from "@/components/home/PosterTool";
import { PROJECTS, matchesFilter, projectById, sortProjects } from "@/components/home/catalog";
import { useNavPeek, type PeekProject } from "@/components/home/ProjectsNavPreview";
import { NavRegister } from "@/components/home/NavRegister";
import { WorkspacePanel } from "@/components/home/WorkspacePanel";
import { StudioDetail } from "@/components/home/StudioDetail";
import { IndexDetail } from "@/components/home/IndexDetail";
import { indexSpan, type IndexEntry } from "@/components/home/index-entry";
import { MotionDebug } from "@/components/home/MotionDebug";
import { EnterBridge } from "@/components/home/projects/EnterBridge";
import {
  captureBrowseVisual,
  destinationStill,
  markEnterTiming,
  type BrowseVisual,
  type DestinationVisual,
} from "@/components/home/projects/enter-bridge";
import { ProjectView, type ViewPhase } from "@/components/home/projects/ProjectView";
import { useCmsPreviewExperience } from "@/components/home/CmsPreviewContext";
import {
  phaseAfterRouteBoundary,
  useHbwMotionSession,
  type MotionSession,
} from "@/components/home/HbwMotionSession";
import { getExperience } from "@/components/home/projects/experiences";
import type { ProjectExperience } from "@/components/home/projects/types";
import type { ResolvedProjectExperience } from "@/lib/project-source";
import { nextProject } from "@/components/home/sequence";
import { commitProjectMedia, decodeImage, preloadOpening, preloadProject, withTimeout } from "@/components/home/preload";
import { infoHintForIndex, type InfoSectionId } from "@/components/home/projects/types";
import {
  WorkspaceContext,
  type StudioView,
  type WorkspacePanelId,
} from "@/components/home/WorkspaceContext";
import {
  hydrateWorkspace,
  persistOrigin,
  persistWorkspace,
  projectsLayerFromUrl,
  readOrigin,
  sanitizeOrigin,
  syncProjectsUrl,
  workspace,
  type FilterDim,
  type OriginFrame,
  type ProjectsMode,
  type SortId,
  type WindowMode,
} from "@/components/home/workspace";
import { HBW_EASE, HBW_INTRO_MS, HBW_T, isMobileViewport, reduceMotion, type SwapPhase } from "@/components/home/motion";
import { isIndexPathname, isStudioPathname, previewSlugFromPath, projectSlugFromPath, viewSlugFromPath } from "@/lib/workspace-routes";

const INTRO_KEY = "hbw.entered.v2";

const mobileSuffixHold = { name: null as string | null, until: 0 };

function readMobileSuffixHold() {
  if (!mobileSuffixHold.name || Date.now() >= mobileSuffixHold.until) {
    mobileSuffixHold.name = null;
    return null;
  }
  return mobileSuffixHold.name;
}

function completeIntro() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("hbw-intro", "hbw-intro-live", "hbw-intro-yield", "hbw-intro-resolve");
  root.classList.add("hbw-entered");
  document
    .querySelectorAll<HTMLElement>(
      ".hbw-mark-how, .hbw-mark-by, .hbw-mark-why, .hbw-mark-word--rest, .hbw-intro-how, .hbw-intro-by, .hbw-intro-why"
    )
    .forEach((el) => {
      el.style.viewTransitionName = "none";
    });
  try {
    sessionStorage.setItem(INTRO_KEY, "1");
  } catch {
    /* ignore */
  }
}

type Swap = {
  from: WindowMode;
  to: WindowMode;
  phase: Exclude<SwapPhase, "idle">;
};

const MARK_FLIP_SELECTORS = [
  ".hbw-mark-how .hbw-mark-word--rest",
  ".hbw-mark-by .hbw-mark-word--rest",
  ".hbw-mark-why .hbw-mark-word--rest",
] as const;

function identityAssembled(mode: WindowMode, swap: Swap | null) {
  if (mode === "view") return true;
  if (swap?.to === "make") return false;
  return false;
}

function markIsGathered() {
  const mark = document.querySelector(".hbw-home-strip__mark");
  return Boolean(mark?.classList.contains("is-assembled") || mark?.classList.contains("is-resolved"));
}

function flipMark(update: () => void, ms: number = HBW_T.continuity) {
  if (typeof document === "undefined" || reduceMotion()) {
    update();
    return;
  }
  const words = MARK_FLIP_SELECTORS.map((sel) => document.querySelector<HTMLElement>(sel));
  const suffix = document.querySelector<HTMLElement>(".hbw-mark-suffix");
  const first = words.map((el) => el?.getBoundingClientRect() ?? null);
  const suffixFirst = suffix?.getBoundingClientRect() ?? null;
  const wasGathered = markIsGathered();
  update();
  if (wasGathered && markIsGathered()) return;
  words.forEach((el, i) => {
    const from = first[i];
    if (!el || !from) return;
    el.getAnimations().forEach((anim) => anim.cancel());
    const to = el.getBoundingClientRect();
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], {
      duration: ms,
      easing: HBW_EASE,
    });
  });
  if (!wasGathered || !suffix || !suffixFirst || !suffix.classList.contains("is-on")) return;
  suffix.getAnimations().forEach((anim) => anim.cancel());
  const to = suffix.getBoundingClientRect();
  const dx = suffixFirst.x - to.x;
  const dy = suffixFirst.y - to.y;
  suffix.style.transform = `translate(${dx}px, ${dy}px)`;
}

function modeFromLocation(path: string): WindowMode {
  if (viewSlugFromPath(path)) return "view";
  return "make";
}

export function HbwShell({
  children,
  published = null,
  index = [],
}: {
  children: React.ReactNode;
  published?: ResolvedProjectExperience | null;
  /** The record of work, read from the CMS by the server layout above. */
  index?: IndexEntry[];
}) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const slug = viewSlugFromPath(pathname);
  const motion = useHbwMotionSession();
  const [resumed] = useState<MotionSession | null>(() => motion?.read() ?? null);
  const cmsPreview = useCmsPreviewExperience();
  const publishedHeld = useRef<ResolvedProjectExperience | null>(null);
  if (published?.experience) publishedHeld.current = published;
  const publishedResolved = published ?? publishedHeld.current;
  const previewHeld = useRef<ProjectExperience | null>(null);
  if (cmsPreview) previewHeld.current = cmsPreview;
  const onPreviewPath = Boolean(previewSlugFromPath(pathname));
  const [panel, setPanel] = useState<WorkspacePanelId>(() =>
    isStudioPathname(pathname) ? "studio" : isIndexPathname(pathname) ? "index" : null
  );
  const [studioView, setStudioView] = useState<StudioView>(() =>
    pathname === "/manifesto" ? "manifesto" : "studio"
  );
  const [panelLeaving, setPanelLeaving] = useState(false);
  /** A project opened from the index returns to the index, not to the line. */
  const cameFromIndex = useRef(false);
  /** That return is a resumption, not an arrival: it does not rise again. */
  const [indexResuming, setIndexResuming] = useState(false);
  /**
   * Which surface Work means right now. The index is part of the work, so
   * leaving it for the Studio and pressing Work again comes back to the index,
   * not to the line you were not looking at.
   */
  const lastWorkSurface = useRef<"line" | "index">("line");
  const indexPathRef = useRef(pathname);
  const [manifestoLeaving, setManifestoLeaving] = useState(false);
  const manifestoGen = useRef(0);
  const manifestoLeavingRef = useRef(false);
  const studioViewRef = useRef(studioView);
  studioViewRef.current = studioView;
  const studioPathRef = useRef(pathname);
  // Server-safe first render: the server can't see `?layer=`, so the sheet opens in a layout effect below.
  const [windowMode, setWindowMode] = useState<WindowMode>(
    () => resumed?.windowMode ?? (viewSlugFromPath(pathname) ? "view" : "make")
  );
  useLayoutEffect(() => {
    if (resumed?.windowMode) return;
    const next = modeFromLocation(window.location.pathname);
    if (next !== windowMode) setWindowMode(next);
    // Mount only: later changes go through the swap handlers and popstate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [browseMode, setBrowseMode] = useState<ProjectsMode>(resumed?.browse?.mode ?? "visual");
  const [filterDim, setFilterDim] = useState<FilterDim>(resumed?.browse?.filterDim ?? "all");
  const [filterValue, setFilterValue] = useState(resumed?.browse?.filterValue ?? "");
  const [sort, setSort] = useState<SortId>(resumed?.browse?.sort ?? "edited");
  const [activeId, setActiveId] = useState(resumed?.activeId ?? (slug || PROJECTS[0].id));
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [infoAnchor, setInfoAnchor] = useState<InfoSectionId>("idea");
  const [viewIndex, setViewIndex] = useState(resumed?.viewIndex ?? 0);
  const [fullFrame, setFullFrame] = useState(false);
  const fullFrameLock = useRef(false);
  const [phase, setPhase] = useState<ViewPhase>(() => phaseAfterRouteBoundary(resumed, pathname));
  const [swap, setSwap] = useState<Swap | null>(resumed?.swap ?? null);
  const [leaving, setLeaving] = useState<{ id: string; index: number } | null>(resumed?.leaving ?? null);
  const [heldSuffix, setHeldSuffix] = useState<string | null>(() => readMobileSuffixHold());
  const [narrow, setNarrow] = useState(false);
  const workScrollRef = useRef<WorkScrollHandle>(null);
  const [workInView, setWorkInView] = useState<WorkInView>(null);
  /** A project is open over the Poster. The Poster is not merely behind it —
   *  it is completely covered, and a covered surface should not hold focus. */
  const [workCovering, setWorkCovering] = useState(false);
  const motionTimer = useRef<number[]>([]);
  const motionLock = useRef(false);
  const viewTransitionLock = useRef(false);
  const enterGen = useRef(0);
  const savedIndex = useRef<Record<string, number>>({});
  const keepBrowse = useRef(resumed?.keepBrowse ?? false);
  const entranceRef = useRef<"archive" | "reduced" | "handoff" | "field">(resumed?.entrance ?? "reduced");
  const [entryChrome, setEntryChrome] = useState(false);
  const resumeLock = useRef(Boolean(resumed));
  const routeHold = useRef(false);
  if (resumeLock.current) motionLock.current = true;
  const originStack = useRef<OriginFrame[]>([]);
  const [originKind, setOriginKind] = useState<OriginFrame["kind"] | "none">("none");
  const [parkedX, setParkedX] = useState<number | null>(resumed?.parkedX ?? null);
  const panelRef = useRef(panel);
  const closingPanelRef = useRef(false);
  const homeRef = useRef<HTMLDivElement>(null);
  const [enterBridge, setEnterBridge] = useState<{
    visual: BrowseVisual;
    dest: DestinationVisual | null;
    mode: "hold" | "travel" | "fade";
  } | null>(null);
  const heldVisual = useRef<BrowseVisual | null>(null);
  const geometryWait = useRef<((dest: DestinationVisual) => void) | null>(null);
  const settleEnter = useRef<(() => void) | null>(null);

  function commitOrigin(stack: OriginFrame[]) {
    originStack.current = stack;
    persistOrigin(stack);
    setOriginKind(stack.at(-1)?.kind || "none");
  }

  function captureViewX() {
    const field = homeRef.current?.querySelector<HTMLElement>(".hbw-project-view.is-active");
    const x = Number(field?.getAttribute("data-hbw-track-x"));
    return Number.isFinite(x) ? x : undefined;
  }
  panelRef.current = panel;
  const peekEnabled = !narrow && windowMode === "make" && panel !== "studio";
  const [peekProject, setPeekProject] = useState<PeekProject | null>(null);
  const peek = useNavPeek(peekEnabled && !narrow, (close) => {
    if (!peekProject) {
      close();
      return;
    }
    flipMark(() => {
      flushSync(close);
    }, HBW_T.micro);
  });
  const practicePeek = useNavPeek(peekEnabled && !narrow && !panelLeaving);

  function onPeekProject(next: PeekProject | null) {
    const was = Boolean(peek.open && peekProject);
    const will = Boolean(peek.open && next);
    if (was === will) {
      setPeekProject(next);
      return;
    }
    flipMark(() => {
      flushSync(() => setPeekProject(next));
    }, HBW_T.micro);
  }
  const [whyPeekLock, setWhyPeekLock] = useState(false);
  const inspecting = panel === "info" && !panelLeaving;
  const projectsRef = useRef<HTMLButtonElement>(null);
  const focusReturn = useRef<HTMLElement[]>([]);
  const viewSlug =
    windowMode === "view" || phase !== "idle" || swap?.to === "view" ? activeId : slug;
  const experience = viewSlug
    ? onPreviewPath
      ? previewHeld.current?.slug === viewSlug
        ? previewHeld.current
        : null
      : publishedResolved?.experience?.slug === viewSlug
        ? publishedResolved.experience
        : getExperience(viewSlug)
    : null;

  function clearMotionTimers() {
    motionTimer.current.forEach((id) => window.clearTimeout(id));
    motionTimer.current = [];
  }

  function later(ms: number, fn: () => void) {
    const id = window.setTimeout(fn, reduceMotion() ? 0 : ms);
    motionTimer.current.push(id);
  }

  function rememberFocus() {
    const node = document.activeElement;
    if (!(node instanceof HTMLElement) || node === document.body) return;
    focusReturn.current.push(node);
  }

  function restoreFocus() {
    const node = focusReturn.current.pop();
    window.setTimeout(() => {
      if (!node?.isConnected || node.closest("[inert]")) return;
      node.focus();
    }, 0);
  }

  function focusSelector(selector: string) {
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(selector)?.focus();
    }, 0);
  }

  function finishSwap(opts?: { unlock?: boolean }) {
    setSwap(null);
    setEnterBridge(null);
    heldVisual.current = null;
    geometryWait.current = null;
    settleEnter.current = null;
    setEntryChrome(false);
    motion?.clear();
    homeRef.current?.querySelectorAll<HTMLElement>(".hbw-projects").forEach((node) => {
      node.getAnimations().forEach((anim) => anim.cancel());
    });
    if (opts?.unlock === false) return;
    motionLock.current = false;
    resumeLock.current = false;
  }

  function releaseRouteHold() {
    routeHold.current = false;
    motionLock.current = false;
    resumeLock.current = false;
  }

  function writeMotionCrossing(session: MotionSession) {
    motion?.write({ ...session, startedAt: Date.now() });
  }

  useLayoutEffect(() => {
    if (resumed) {
      if (resumed.handoffFrom != null) {
        homeRef.current?.style.setProperty("--hbw-handoff-from", `${resumed.handoffFrom}px`);
      }
      const elapsed = Date.now() - resumed.startedAt;
      const remain = (ms: number) => Math.max(0, ms - elapsed);
      if (resumed.kind === "enter" || resumed.kind === "handoff") {
        const fieldEnter = resumed.kind === "enter" && resumed.entrance === "field";
        if (resumed.kind === "handoff" && !reduceMotion()) {
          requestAnimationFrame(() => requestAnimationFrame(() => setPhase("assembling")));
        } else if (fieldEnter) {
          later(remain(HBW_T.spatial), () => setEntryChrome(true));
          later(remain(HBW_T.spatial), () => setPhase("assembling"));
        } else {
          later(remain(resumed.cinematic && !reduceMotion() ? HBW_T.micro : 0), () => {
            setPhase("assembling");
          });
        }
        later(remain(HBW_T.continuity), () => {
          setPhase("active");
          setLeaving(null);
          finishSwap();
          homeRef.current?.style.removeProperty("--hbw-handoff-from");
          if (resumed.kind === "enter") {
            focusSelector(
              ".hbw-site-nav__close:not([aria-disabled]), .hbw-site-nav__studio[aria-pressed=\"true\"], .hbw-nav-sub__face--info button"
            );
          }
        });
      } else if (resumed.kind === "exit") {
        /*
         * "exit" was a project closing back into the browse grid. A session
         * written by the old build can still say this — it lives in
         * sessionStorage, not in the bundle — so it settles on the Poster
         * rather than being treated as a state that no longer exists.
         */
        later(remain(HBW_T.continuity), () => {
          setWindowMode("make");
          setPhase("idle");
          finishSwap();
          restoreFocus();
        });
      } else {
        later(remain(HBW_T.continuity), () => {
          setPhase("idle");
          finishSwap();
          restoreFocus();
        });
      }
    }
    return () => clearMotionTimers();
  }, []);

  function holdMobileSuffix(name: string | null) {
    if (name) {
      mobileSuffixHold.name = name;
      mobileSuffixHold.until = Date.now() + HBW_T.continuity;
      setHeldSuffix(name);
      return;
    }
    if (Date.now() < mobileSuffixHold.until) return;
    mobileSuffixHold.name = null;
    mobileSuffixHold.until = 0;
    setHeldSuffix(null);
  }

  function runViewTransition(update: () => void, envelope: "spatial" | "continuity" | "archive" = "continuity") {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished?: Promise<unknown> };
    };
    if (reduceMotion() || viewTransitionLock.current || typeof doc.startViewTransition !== "function") {
      update();
      return;
    }
    viewTransitionLock.current = true;
    const root = document.documentElement;
    if (envelope === "spatial" || envelope === "archive") root.classList.add("hbw-vt-spatial");
    if (envelope === "archive") root.classList.add("hbw-vt-archive");
    const transition = doc.startViewTransition(update);
    Promise.resolve(transition?.finished)
      .catch(() => undefined)
      .finally(() => {
        viewTransitionLock.current = false;
        root.classList.remove("hbw-vt-spatial", "hbw-vt-archive");
      });
  }

  useEffect(() => {
    hydrateWorkspace();
    persistWorkspace();
    document.documentElement.classList.add("hbw-workspace", "hbw-home-prototype");
    function onHide() {
      persistWorkspace();
    }
    window.addEventListener("pagehide", onHide);
    setBrowseMode(workspace.projects.mode);
    setFilterDim(workspace.projects.filterDim);
    setFilterValue(workspace.projects.filterValue);
    setSort(workspace.projects.sort);
    if (!slug) setActiveId(workspace.projects.activeId);
    return () => {
      document.documentElement.classList.remove("hbw-workspace", "hbw-home-prototype");
      window.removeEventListener("pagehide", onHide);
    };
  }, [slug]);

  useEffect(() => {
    function onAnchor(event: Event) {
      const detail = (event as CustomEvent<InfoSectionId>).detail;
      if (detail === "idea" || detail === "shift" || detail === "system" || detail === "outcome") {
        setInfoAnchor(detail);
      }
    }
    window.addEventListener("hbw:info-anchor", onAnchor);
    return () => window.removeEventListener("hbw:info-anchor", onAnchor);
  }, []);

  useEffect(() => {
    function onPop() {
      setHoveredId(null);
      motionLock.current = false;
      enterGen.current += 1;
      setLeaving(null);
      setSwap(null);
      setEnterBridge(null);
      heldVisual.current = null;
      geometryWait.current = null;
      settleEnter.current = null;
      const next = modeFromLocation(window.location.pathname);
      const nextSlug = viewSlugFromPath(window.location.pathname);
      if (next !== "view") {
        commitOrigin([]);
      }
      setWindowMode(next);
      setPhase(next === "view" ? "active" : "idle");
      if (nextSlug) {
        setActiveId(nextSlug);
        const restored = savedIndex.current[nextSlug];
        setViewIndex(restored != null ? restored : 0);
      }
      const path = window.location.pathname;
      if (path === "/studio") {
        setPanel("studio");
        if (!manifestoLeavingRef.current) {
          setStudioView("studio");
          setPanelLeaving(false);
        }
      } else if (path === "/manifesto") {
        setPanel("studio");
        setStudioView("manifesto");
        setPanelLeaving(false);
      } else if (isStudioPathname(studioPathRef.current)) {
        if (closingPanelRef.current) {
          studioPathRef.current = path;
          closingPanelRef.current = false;
          return;
        }
        setPanel(null);
        setPanelLeaving(false);
        setStudioView("studio");
      }
      studioPathRef.current = path;
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (routeHold.current) {
      if (!slug && projectsLayerFromUrl()) releaseRouteHold();
      return;
    }
    if (motionLock.current) return;
    setBrowseMode(workspace.projects.mode);
    setFilterDim(workspace.projects.filterDim);
    setFilterValue(workspace.projects.filterValue);
    setSort(workspace.projects.sort);
    const nextMode = modeFromLocation(pathname);
    if (slug) {
      setActiveId(slug);
      workspace.projects.activeId = slug;
      persistWorkspace();
      setWindowMode("view");
      setPhase((current) =>
        current === "rising" ||
        current === "assembling" ||
        current === "active" ||
        current === "exiting" ||
        current === "handoff-in" ||
        current === "handoff-out"
          ? current
          : "active"
      );
      const restored = savedIndex.current[slug];
      if (restored != null && restored > 0) setViewIndex(restored);
    } else {
      setActiveId(workspace.projects.activeId);
      setWindowMode(nextMode);
      if (nextMode !== "view") {
        setPhase("idle");
      }
    }
  }, [pathname, slug]);

  // The index follows its address, the way Studio follows /studio.
  useEffect(() => {
    const prev = indexPathRef.current;
    indexPathRef.current = pathname;
    if (isIndexPathname(pathname)) {
      setPanel("index");
      setPanelLeaving(false);
    } else if (isIndexPathname(prev) && panelRef.current === "index") {
      if (closingPanelRef.current) {
        closingPanelRef.current = false;
        return;
      }
      setPanel(null);
      setPanelLeaving(false);
    }
  }, [pathname]);

  useEffect(() => {
    const prev = studioPathRef.current;
    if (pathname === "/studio") {
      setPanel("studio");
      if (!manifestoLeavingRef.current) {
        setStudioView("studio");
        setPanelLeaving(false);
      }
    } else if (pathname === "/manifesto") {
      setPanel("studio");
      setStudioView("manifesto");
      setPanelLeaving(false);
    } else if (isStudioPathname(prev) && panelRef.current === "studio") {
      if (closingPanelRef.current) {
        studioPathRef.current = pathname;
        closingPanelRef.current = false;
        return;
      }
      setPanel(null);
      setPanelLeaving(false);
      setStudioView("studio");
    }
    studioPathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      const mobile = mq.matches;
      setNarrow(mobile);
      if (mobile) setFullFrame(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const stack = sanitizeOrigin(readOrigin(), projectSlugFromPath(pathname) || null);
    originStack.current = stack;
    persistOrigin(stack);
    setOriginKind(stack.at(-1)?.kind || "none");
    // Hydrate once from the session origin; later mutations go through commitOrigin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (motionLock.current) return;
    const cleaned = sanitizeOrigin(originStack.current, slug);
    if (cleaned.length !== originStack.current.length) commitOrigin(cleaned);
  }, [slug]);

  useLayoutEffect(() => {
    if (projectsLayerFromUrl() || viewSlugFromPath(pathname)) {
      completeIntro();
      return;
    }
    if (!document.documentElement.classList.contains("hbw-intro")) return;
    if (reduceMotion()) {
      completeIntro();
      return;
    }
    const id = window.setTimeout(completeIntro, HBW_INTRO_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!heldSuffix) return;
    const wait = Math.max(16, mobileSuffixHold.until - Date.now());
    const id = window.setTimeout(() => {
      mobileSuffixHold.name = null;
      mobileSuffixHold.until = 0;
      setHeldSuffix(null);
    }, wait);
    return () => window.clearTimeout(id);
  }, [heldSuffix]);

  useEffect(() => {
    if (!hoveredId) return;
    preloadProject(hoveredId);
  }, [hoveredId]);

  function captureInspectMedia() {
    window.dispatchEvent(new Event("hbw:inspect-capture"));
  }

  function openPanel(next: Exclude<WorkspacePanelId, null>) {
    completeIntro();
    rememberFocus();
    if (next === "info") {
      captureInspectMedia();
      if (experience) {
        const movementIndex = Math.min(Math.max(0, viewIndex), experience.movements.length - 1);
        if (movementIndex !== viewIndex) setViewIndex(movementIndex);
        setInfoAnchor(infoHintForIndex(experience, movementIndex));
      }
    }
    const gatherMark = next === "studio" && panel !== "studio" && !identityAssembled(windowMode, swap);
    const apply = () => {
      setPanelLeaving(false);
      closingPanelRef.current = false;
      if (next === "studio") {
        peek.hideNow();
        practicePeek.hideNow();
        setStudioView("studio");
      }
      setPanel(next);
    };
    if (gatherMark) {
      flipMark(() => {
        flushSync(apply);
      }, HBW_T.spatial);
    } else {
      apply();
    }
    if (next === "studio" && windowMode === "make" && !isStudioPathname(pathname)) {
      router.push("/studio");
    }
    if (next === "index" && windowMode === "make" && !isIndexPathname(pathname)) {
      router.push("/projects");
    }
    // The Studio is not listed here. It is a role="dialog" aria-modal="true"
    // panel and it focuses its own root on mount; pointing focus back at the
    // nav pill afterwards left the reader standing outside a dialog that tells
    // assistive technology everything outside it is hidden. Escape still
    // returns focus to the pill, through rememberFocus/restoreFocus.
    if (next === "info") focusSelector('.hbw-sheet[data-hbw-sheet="project-right"]');
  }

  function closePanel(options?: { keepRoute?: boolean }) {
    if (!panel || panelLeaving) return;
    if (panel === "index" && !options?.keepRoute) lastWorkSurface.current = "line";
    const leaveRoute =
      !options?.keepRoute &&
      ((panel === "studio" && isStudioPathname(pathname)) || (panel === "index" && isIndexPathname(pathname)));
    const spreadMark = panel === "studio" && !identityAssembled(windowMode, swap);
    const applyLeave = () => {
      closingPanelRef.current = true;
      if (panel === "info") captureInspectMedia();
      if (panel === "studio") {
        setWhyPeekLock(true);
        practicePeek.hideNow();
      }
      setPanelLeaving(true);
      manifestoLeavingRef.current = false;
      setManifestoLeaving(false);
    };
    if (spreadMark) {
      flipMark(() => {
        flushSync(applyLeave);
      }, HBW_T.spatial);
    } else {
      applyLeave();
    }
    later(HBW_T.spatial, () => {
      setPanel(null);
      setPanelLeaving(false);
      setStudioView("studio");
      if (leaveRoute) router.replace("/");
      closingPanelRef.current = false;
      restoreFocus();
    });
  }

  function showManifesto() {
    rememberFocus();
    manifestoGen.current += 1;
    manifestoLeavingRef.current = false;
    setManifestoLeaving(false);
    setStudioView("manifesto");
    if (isStudioPathname(pathname)) router.replace("/manifesto");
    focusSelector(".hbw-site-nav__studio");
  }

  function showStudioContent() {
    if (studioViewRef.current !== "manifesto") {
      manifestoGen.current += 1;
      manifestoLeavingRef.current = false;
      setStudioView("studio");
      setManifestoLeaving(false);
      if (isStudioPathname(pathname)) router.replace("/studio");
      return;
    }
    if (manifestoLeavingRef.current) return;
    if (reduceMotion()) {
      manifestoLeavingRef.current = false;
      setStudioView("studio");
      setManifestoLeaving(false);
      if (isStudioPathname(pathname)) router.replace("/studio");
      restoreFocus();
      return;
    }
    const token = ++manifestoGen.current;
    manifestoLeavingRef.current = true;
    setManifestoLeaving(true);
    later(HBW_T.spatial, () => {
      if (token !== manifestoGen.current) return;
      manifestoLeavingRef.current = false;
      setStudioView("studio");
      setManifestoLeaving(false);
      if (isStudioPathname(pathname)) router.replace("/studio");
      restoreFocus();
    });
  }

  function dismissStudioFamily() {
    if (studioViewRef.current === "manifesto" || manifestoLeavingRef.current) {
      showStudioContent();
      return;
    }
    closePanel();
  }

  function returnToMake() {
    completeIntro();
    if (windowMode === "view" || phase === "rising" || phase === "assembling" || phase === "active" || phase === "handoff-in") {
      homeFromView();
      return;
    }
    if (panel) closePanel();
  }

  /**
   * Back to the Poster. The mark means this and nothing else: not "up a level",
   * not "back to the work you were looking at" — the Poster, every time.
   *
   * If the line is the thing in front of you it glides back, because you can
   * see it travel. If something is covering it — a project, the index, the
   * Studio — the line is put back instantly instead, so lifting the cover
   * reveals the Poster rather than a scroll that starts off-screen.
   */
  function toPoster() {
    // A project opened over the line belongs to WorkScroll, not to panel or
    // windowMode, so closing the surface is not enough to clear it. Without
    // this, pressing the mark on a deep-linked project scrolled the line home
    // underneath a viewer that stayed open, with ?work= still in the URL.
    //
    // Closing a project normally returns you to wherever you opened it from,
    // which for one opened from the index means the index comes back. That is
    // right for Close and wrong for the mark: pressing it from a project you
    // reached through the index landed on /projects with the index open again.
    // The mark leaves.
    cameFromIndex.current = false;
    const hadProject = workScrollRef.current?.closeWork() ?? false;
    if (!hadProject && windowMode === "make" && !panel) {
      workScrollRef.current?.toTop();
      return;
    }
    workScrollRef.current?.settleTop();
    returnToMake();
  }

  function goPractice() {
    if (panel === "info") return;
    if (manifestoOpen) return;
    if (studioClose) return;
    openPanel("studio");
  }

  function homeFromView() {
    if (motionLock.current) return;
    setHoveredId(null);
    setPanel(null);
    setPanelLeaving(false);
    setLeaving(null);
    motionLock.current = true;
    clearMotionTimers();
    commitOrigin([]);
    flipMark(() => {
      flushSync(() => {
        setSwap({ from: "view", to: "make", phase: "exiting" });
        setPhase("exiting");
        setWindowMode("make");
      });
    });
    writeMotionCrossing({
      kind: "home",
      phase: "exiting",
      swap: { from: "view", to: "make", phase: "exiting" },
      windowMode: "make",
      activeId,
      viewIndex,
      leaving: null,
      entrance: "reduced",
      keepBrowse: false,
      parkedX: null,
      cinematic: false,
      startedAt: Date.now(),
    });
    router.replace("/");
    later(HBW_T.continuity, () => {
      setPhase("idle");
      finishSwap();
      restoreFocus();
    });
  }

  async function enterProject(id: string, fromHint?: "make") {
    completeIntro();
    if (motionLock.current) return;
    rememberFocus();
    const token = ++enterGen.current;
    const from: WindowMode = fromHint ?? (windowMode === "view" ? "view" : "make");
    // The travelling card came from the grid, which is where a card was.
    const source = null;
    const mobileEnter = isMobileViewport();
    const reducedEnter = reduceMotion();
    const travel = false;
    entranceRef.current = "reduced";
    setEntryChrome(false);
    setLeaving(null);
    setActive(id);
    setHoveredId(null);
    setPanel(null);
    setPanelLeaving(false);
    motionLock.current = true;
    clearMotionTimers();
    setViewIndex(0);
    savedIndex.current[id] = 0;
    setFullFrame(false);
    setParkedX(null);
    settleEnter.current = null;
    if (from === "make") commitOrigin([{ kind: "make" }]);
    else if (viewSlug) {
      commitOrigin([
        ...originStack.current,
        { kind: "view", slug: viewSlug, index: viewIndex, x: captureViewX() },
      ]);
    }
    markEnterTiming({ click: performance.now() });
    heldVisual.current = null;
    setEnterBridge(null);
    setSwap({ from, to: "view", phase: "preparing" });
    const href = PROJECTS.find((p) => p.id === id)?.href || `/projects/${id}`;
    const destStill = destinationStill(id);
    const destReady = new Promise<DestinationVisual | null>((resolve) => {
      geometryWait.current = (dest) => {
        geometryWait.current = null;
        resolve(dest);
      };
    });
    const destDecode = destStill && source ? decodeImage(destStill) : Promise.resolve();
    const [dest] = await Promise.all([
      Promise.race([
        destReady,
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), HBW_T.prepareCap)),
      ]),
      withTimeout(Promise.all([preloadOpening(id), destDecode]).then(() => undefined), HBW_T.prepareCap),
    ]);
    if (token !== enterGen.current) return;
    markEnterTiming({
      mounted: performance.now(),
      geometryReady: dest ? performance.now() : undefined,
    });

    let finished = false;
    const finishEnter = () => {
      if (token !== enterGen.current || finished) return;
      finished = true;
      markEnterTiming({ transitionComplete: performance.now(), interactionEnabled: performance.now() });
      geometryWait.current = null;
      settleEnter.current = null;
      flushSync(() => {
        setEnterBridge(null);
        setPhase("active");
        finishSwap();
      });
      focusSelector(
        ".hbw-site-nav__close:not([aria-disabled]), .hbw-site-nav__studio[aria-pressed=\"true\"], .hbw-nav-sub__face--info button"
      );
    };
    settleEnter.current = finishEnter;

    later(0, () => {
      if (token !== enterGen.current) return;
      const go = () => {
        flushSync(() => {
          peek.hideNow();
          practicePeek.hideNow();
          setWindowMode("view");
          setSwap({ from, to: "view", phase: "entering" });
          setPhase("rising");
          if (source) {
            setEnterBridge({
              visual: heldVisual.current ?? source,
              dest,
              mode: travel && dest ? "travel" : "fade",
            });
          }
        });
      };
      writeMotionCrossing({
        kind: "enter",
        phase: "rising",
        swap: { from, to: "view", phase: "entering" },
        windowMode: "view",
        activeId: id,
        viewIndex: 0,
        leaving: null,
        entrance: entranceRef.current,
        keepBrowse: keepBrowse.current,
        parkedX: null,
        cinematic: false,
        startedAt: Date.now(),
      });
      markEnterTiming({ transitionStart: performance.now() });
      if (from === "make") flipMark(go);
      else go();
      router.push(href);
    });
    later(0, () => {
      if (token !== enterGen.current) return;
      setPhase("assembling");
    });
    later(HBW_T.continuity, finishEnter);
  }

  function commitNext() {
    if (motionLock.current) return;
    const fromId = viewSlug;
    if (!fromId) return;
    const nxt = nextProject(fromId);
    if (!nxt) {
      homeFromView();
      return;
    }
    setHoveredId(null);
    setPanel(null);
    setPanelLeaving(false);
    motionLock.current = true;
    clearMotionTimers();
    entranceRef.current = "handoff";
    savedIndex.current[fromId] = viewIndex;
    setParkedX(null);
    commitOrigin([
      ...originStack.current,
      { kind: "view", slug: fromId, index: viewIndex, x: captureViewX() },
    ]);
    preloadProject(nxt.id);
    commitProjectMedia(nxt.id);
    const field = homeRef.current?.querySelector<HTMLElement>(".hbw-project-view.is-active");
    const mobileHandoff = isMobileViewport();
    holdMobileSuffix(projectById(fromId).name);
    if (!mobileHandoff && field) {
      const preview = field.querySelector<HTMLElement>(".hbw-outro.is-next .hbw-outro__preview");
      const stage = field.getBoundingClientRect();
      const from = preview ? Math.round(preview.getBoundingClientRect().left - stage.left) : 0;
      homeRef.current?.style.setProperty("--hbw-handoff-from", `${Math.max(0, from)}px`);
    } else {
      homeRef.current?.style.removeProperty("--hbw-handoff-from");
    }
    const apply = () => {
      flushSync(() => {
        setLeaving({ id: fromId, index: viewIndex });
        setActive(nxt.id);
        setViewIndex(0);
        setFullFrame(false);
        setWindowMode("view");
        setSwap({ from: "view", to: "view", phase: "entering" });
        setPhase("handoff-in");
      });
    };
    if (mobileHandoff) runViewTransition(apply);
    else apply();
    const handoffFrom = Number.parseFloat(
      homeRef.current?.style.getPropertyValue("--hbw-handoff-from") || ""
    );
    writeMotionCrossing({
      kind: "handoff",
      phase: "handoff-in",
      swap: { from: "view", to: "view", phase: "entering" },
      windowMode: "view",
      activeId: nxt.id,
      viewIndex: 0,
      leaving: { id: fromId, index: viewIndex },
      entrance: "handoff",
      keepBrowse: keepBrowse.current,
      parkedX: null,
      handoffFrom: Number.isFinite(handoffFrom) ? handoffFrom : null,
      cinematic: false,
      startedAt: Date.now(),
    });
    router.push(nxt.href);
    if (reduceMotion()) {
      entranceRef.current = "reduced";
      mobileSuffixHold.until = 0;
      holdMobileSuffix(null);
      setLeaving(null);
      setPhase("active");
      finishSwap();
      homeRef.current?.style.removeProperty("--hbw-handoff-from");
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("assembling"));
    });
    later(HBW_T.continuity, () => {
      entranceRef.current = "reduced";
      holdMobileSuffix(null);
      setLeaving(null);
      setPhase("active");
      finishSwap();
      homeRef.current?.style.removeProperty("--hbw-handoff-from");
    });
  }

  function restoreProject(nextSlug: string, index: number, x?: number) {
    if (motionLock.current) return;
    const fromId = viewSlug;
    if (!fromId || fromId === nextSlug) {
      homeFromView();
      return;
    }
    setHoveredId(null);
    setPanel(null);
    setPanelLeaving(false);
    motionLock.current = true;
    clearMotionTimers();
    entranceRef.current = "reduced";
    homeRef.current?.style.removeProperty("--hbw-handoff-from");
    savedIndex.current[fromId] = viewIndex;
    keepBrowse.current = true;
    preloadProject(nextSlug);
    commitProjectMedia(nextSlug);
    if (reduceMotion()) {
      flushSync(() => {
        setLeaving(null);
        setActive(nextSlug);
        setViewIndex(index);
        savedIndex.current[nextSlug] = index;
        setFullFrame(false);
        setParkedX(x ?? null);
        setWindowMode("view");
        setSwap(null);
        setPhase("active");
      });
      motionLock.current = false;
      router.replace(PROJECTS.find((p) => p.id === nextSlug)?.href || `/projects/${nextSlug}`);
      return;
    }
    flushSync(() => {
      setLeaving({ id: fromId, index: viewIndex });
      setActive(nextSlug);
      setViewIndex(index);
      savedIndex.current[nextSlug] = index;
      setFullFrame(false);
      setParkedX(x ?? null);
      setWindowMode("view");
      setSwap({ from: "view", to: "view", phase: "entering" });
      setPhase("rising");
    });
    writeMotionCrossing({
      kind: "enter",
      phase: "rising",
      swap: { from: "view", to: "view", phase: "entering" },
      windowMode: "view",
      activeId: nextSlug,
      viewIndex: index,
      leaving: { id: fromId, index: viewIndex },
      entrance: "reduced",
      keepBrowse: true,
      parkedX: x ?? null,
      cinematic: false,
      startedAt: Date.now(),
    });
    router.replace(PROJECTS.find((p) => p.id === nextSlug)?.href || `/projects/${nextSlug}`);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("assembling"));
    });
    later(HBW_T.continuity, () => {
      setLeaving(null);
      setPhase("active");
      finishSwap();
    });
  }

  function resumeOrigin(origin: OriginFrame | undefined) {
    /*
     * No origin means the reader did not arrive from anywhere in the site:
     * a search result, a shared link, an old bookmark. They were falling into
     * the browse branch, so the one control on a /projects/<slug> page sent
     * them to a grid of six projects that nothing else links to and that the
     * index contradicts. They land on the Poster now, like anyone else who
     * has just arrived.
     */
    if (!origin) {
      homeFromView();
      return;
    }
    if (origin.kind === "make") {
      homeFromView();
      return;
    }
    restoreProject(origin.slug, origin.index, origin.x);
  }

  function closeToOrigin() {
    if (motionLock.current && phase !== "active" && phase !== "rising") return;
    motionLock.current = false;
    clearMotionTimers();
    const next = originStack.current.slice(0, -1);
    const origin = originStack.current.at(-1);
    commitOrigin(origin?.kind === "make" ? [] : next);
    resumeOrigin(origin);
  }

  function closeJourney() {
    if (motionLock.current && phase !== "active" && phase !== "rising") return;
    motionLock.current = false;
    clearMotionTimers();
    const origin = originStack.current[0];
    commitOrigin([]);
    resumeOrigin(origin);
  }

  function setActive(id: string) {
    setActiveId(id);
    workspace.projects.activeId = id;
    persistWorkspace();
  }

  function setProjectsMode(next: ProjectsMode, opts?: { silent?: boolean }) {
    if (next === browseMode) return;
    const apply = () => {
      setBrowseMode(next);
      workspace.projects.mode = next;
      persistWorkspace();
    };
    if (opts?.silent) {
      apply();
      return;
    }
    if (isMobileViewport() || reduceMotion()) {
      apply();
      return;
    }
    runViewTransition(() => flushSync(apply), "archive");
  }

  function setProjectsLens(dim: FilterDim, value: string) {
    setFilterDim(dim);
    setFilterValue(value);
    workspace.projects.filterDim = dim;
    workspace.projects.filterValue = value;
    workspace.projects.expandedId = null;
    persistWorkspace();
  }

  function setProjectsSort(next: SortId) {
    setSort(next);
    workspace.projects.sort = next;
    workspace.projects.expandedId = null;
    persistWorkspace();
  }

  function onViewIndex(next: number) {
    setViewIndex(next);
    if (viewSlug) savedIndex.current[viewSlug] = next;
    if (panel === "info" && experience) setInfoAnchor(infoHintForIndex(experience, next));
  }

  useEffect(() => {
    if (!whyPeekLock) return;
    function release(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (document.querySelector(".hbw-mark-why")?.contains(target)) return;
      if (document.querySelector(".hbw-site-nav__studio")?.contains(target)) return;
      setWhyPeekLock(false);
    }
    window.addEventListener("pointermove", release);
    return () => window.removeEventListener("pointermove", release);
  }, [whyPeekLock]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        const typing =
          event.target instanceof HTMLElement &&
          event.target.closest("textarea, input, [contenteditable]");
        if (typing) return;
        if (peek.open) {
          peek.hideNow();
          return;
        }
        if (practicePeek.open) {
          practicePeek.hideNow();
          return;
        }
        if (panel === "studio") {
          dismissStudioFamily();
          return;
        }
        if (panel) {
          closePanel();
          return;
        }
        if (fullFrame) {
          setFullFrame(false);
          return;
        }
        if (windowMode === "view" || phase === "rising" || phase === "assembling" || phase === "active") {
          closeToOrigin();
          return;
        }
        return;
      }
      // Arrow keys walked the grid. Nothing walks now.
      return;
      const list = sortProjects(
        PROJECTS.filter((p) => matchesFilter(p, filterDim, filterValue)),
        sort
      );
      if (!list.length) return;
      const current = hoveredId ?? activeId;
      const i = Math.max(0, list.findIndex((p) => p.id === current));
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        const next = list[(i + 1) % list.length];
        setHoveredId(next.id);
        document
          .querySelector<HTMLElement>(`.hbw-projects [data-hbw-project="${next.id}"]`)
          ?.focus();
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        const prev = list[(i - 1 + list.length) % list.length];
        setHoveredId(prev.id);
        document
          .querySelector<HTMLElement>(`.hbw-projects [data-hbw-project="${prev.id}"]`)
          ?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeId, browseMode, filterDim, filterValue, fullFrame, hoveredId, panel, peek.open, practicePeek.open, phase, sort, windowMode]);

  const makeActive = windowMode === "make";
  const preparingView = swap?.to === "view" && swap.phase === "preparing";
  const viewToMakeExit = swap?.from === "view" && swap?.to === "make";
  const navFace =
    viewToMakeExit
      ? "home"
      : phase === "assembling" ||
          phase === "active" ||
          phase === "handoff-in" ||
          phase === "exiting" ||
          (windowMode === "view" && phase !== "rising" && phase !== "idle")
        ? "view"
        : "home";
  const leavingExp = leaving
    ? previewHeld.current?.slug === leaving.id
      ? previewHeld.current
      : publishedResolved?.experience?.slug === leaving.id
        ? publishedResolved.experience
        : getExperience(leaving.id)
    : null;
  const chromeLocked =
    Boolean(leavingExp) &&
    (phase === "handoff-in" || (isMobileViewport() && phase === "assembling"));
  const chromeExperience = chromeLocked ? leavingExp : experience;
  const chromeIndex = chromeLocked && leaving ? leaving.index : viewIndex;
  const showView =
    Boolean(experience) && !preparingView && (windowMode === "view" || phase !== "idle");
  const viewExit = navFace === "view" && panel !== "info" && panel !== "studio" && panel !== "index";
  const assembled = identityAssembled(windowMode, swap);
  const sheetResolved = panel === "studio" && !panelLeaving && !assembled;
  const peekResolved = Boolean(!assembled && peek.open && peekProject);
  const resolved = sheetResolved || peekResolved;
  // The grid was the only surface with cards to hover.
  const hoverName = null;
  const identitySuffix =
    viewToMakeExit && swap.phase === "exiting" && experience && !reduceMotion()
      ? projectById(experience.slug).name
      : (navFace === "view" || windowMode === "view") && experience
        ? heldSuffix ||
          (isMobileViewport() && leavingExp && leaving && (phase === "handoff-in" || phase === "assembling")
            ? projectById(leaving.id).name
            : projectById(experience.slug).name)
        : assembled
          ? hoverName || "Projects"
          : !narrow && peek.open && peekProject?.name
            ? peekProject.name
            : null;
  const namedProject =
    identitySuffix && identitySuffix !== "Projects"
      ? PROJECTS.find((project) => project.name === identitySuffix) ?? null
      : null;
  const projectIdea =
    namedProject && (navFace === "view" || windowMode === "view" || Boolean(!assembled && peek.open))
      ? namedProject.idea
      : null;
  const manifestoSheet = panel === "studio" && (studioView === "manifesto" || manifestoLeaving);
  const manifestoOpen = manifestoSheet && !manifestoLeaving;
  const studioClose = panel === "studio" && !manifestoSheet;
  const viewJourneyClose = viewExit;
  const studioAsClose = studioClose || manifestoSheet;
  const indexOpen = panel === "index";
  /** One h1 per page. Three pages sharing "How by Why" told a crawler nothing. */
  const pageHeading =
    indexOpen || isIndexPathname(pathname)
      ? "HBW Projects — every project the studio has worked on, 2018 to now"
      : pathname === "/manifesto"
        ? "HBW Manifesto — brand is not what you see, it is what you feel"
        : panel === "studio" || isStudioPathname(pathname)
          ? "HBW Studio — Mark Blackler, independent brand and design practice"
          : "HBW — clarity for brands at a turning point";
  const muteProjects = panel === "studio" || indexOpen;
  const muteStudio = panel === "info";
  const hideProjectsHit = true;
  const hideStudioHit = !studioAsClose;
  const boundaryNext =
    !narrow &&
    navFace === "view" &&
    chromeExperience &&
    chromeIndex >= chromeExperience.movements.length
      ? nextProject(chromeExperience.slug)
      : null;

  return (
    <WorkspaceContext.Provider
      value={{
        windowMode,
        openPanel,
        closePanel,
        panel,
        returnToMake,
      }}
    >
      <div
        ref={homeRef}
        className={`hbw-home is-${windowMode}${panel ? " is-panel" : ""}${inspecting ? " is-inspect" : ""}${
          panel === "studio" ? " is-studio" : ""
        }${manifestoOpen ? " is-manifesto" : ""}${
          panelLeaving ? " is-sheet-leaving" : ""
        }${
          practicePeek.open && panel !== "studio" ? " is-practice-peek" : ""
        }${
          swap?.to === "view" || phase === "rising" || phase === "assembling" ? " is-owning" : ""
        }${enterBridge ? " is-bridging" : ""}${
          enterBridge?.mode === "fade" ? " is-enter-fade" : ""
        }${boundaryNext ? " is-boundary" : ""}${
          fullFrame && phase === "active" ? " is-full-frame" : ""
        } is-phase-${phase}${swap ? ` is-swap-${swap.phase}` : ""}`}
        data-hbw-project={viewSlug || undefined}
        data-hbw-held-suffix={heldSuffix || undefined}
        data-hbw-origin={originKind}
        data-hbw-motion={swap?.phase || phase}
        data-hbw-from={swap?.from}
        data-hbw-to={swap?.to}
      >
        <header className="hbw-home-strip hbw-site-nav">
          <SiteNav
            face={navFace}
            projectName={namedProject?.name ?? null}
            projectIdea={projectIdea}
            /* Studio lights its own pill while it is open; the index belongs to Work, so Work stays lit. */
            workOpen={navFace === "home" && Boolean(workInView) && (!panel || indexOpen)}
            studioOpen={studioAsClose}
            surfaceOpen={studioAsClose || indexOpen}
            studioMuted={muteStudio}
            journeyClose={viewJourneyClose}
            onHome={toPoster}
            onWork={() => {
              if (windowMode === "make") {
                // Work means the work surface you were last on. Pressing it from
                // the Studio returns you to the index if that is where you were;
                // pressing it inside the index takes you back out to the line.
                if (panel === "index") {
                  closePanel();
                  workScrollRef.current?.toWork();
                } else if (lastWorkSurface.current === "index") {
                  setIndexResuming(false);
                  openPanel("index");
                } else {
                  if (panel) closePanel();
                  workScrollRef.current?.toWork();
                }
              } else {
                // Work means the record of the work, which is the index.
                lastWorkSurface.current = "index";
                openPanel("index");
              }
            }}
            workInView={navFace === "home" && !panel ? workInView : null}
            heading={pageHeading}
            onStudio={() => {
              if (studioClose || manifestoSheet) dismissStudioFamily();
              else openPanel("studio");
            }}
            onStudioClose={closePanel}
            onClose={closeJourney}
            register={
              <NavRegister
                face={navFace === "view" ? "view" : "home"}
                browseMode={browseMode}
                onBrowseMode={setProjectsMode}
                filterValue={filterValue}
                onClearLens={() => setProjectsLens("all", "")}
                viewIndex={chromeIndex}
                experience={chromeExperience}
                boundaryName={boundaryNext?.name ?? null}
                boundaryHref={boundaryNext?.href ?? null}
                fullFrame={fullFrame}
                fullFrameEnabled={false}
                onToggleFullFrame={() => {
                  if (phase !== "active" || narrow || fullFrameLock.current) return;
                  fullFrameLock.current = true;
                  setFullFrame((on) => !on);
                  window.setTimeout(() => {
                    fullFrameLock.current = false;
                  }, reduceMotion() ? 0 : HBW_T.spatial);
                }}
              />
            }
          />
        </header>

        <div className="hbw-window">
          <PosterTool dormant={!makeActive || panel === "studio" || indexOpen || workCovering} />
          <WorkScroll
            ref={workScrollRef}
            visible={makeActive && !swap && panel !== "studio" && !indexOpen}
            onInView={setWorkInView}
            onDetailState={setWorkCovering}
            onStudio={() => openPanel("studio")}
            onIndex={() => {
              cameFromIndex.current = false;
              setIndexResuming(false);
              lastWorkSurface.current = "index";
              openPanel("index");
            }}
            onDetailClosing={() => {
              if (!cameFromIndex.current) return;
              cameFromIndex.current = false;
              // Come back underneath the leaving project, so the two cross
              // instead of queueing with a blank poster in between.
              setIndexResuming(true);
              openPanel("index");
              // closeDetail drops ?work= from the address in this same tick;
              // put /index back once it has.
              later(0, () => router.replace("/projects"));
            }}
          />
          {panel === "studio" ? (
            <StudioDetail
              view={studioView === "manifesto" ? "manifesto" : "studio"}
              leaving={panelLeaving}
              onClose={closePanel}
              onPoster={toPoster}
            />
          ) : null}
          {indexOpen ? (
            <IndexDetail
              entries={index}
              span={indexSpan(index)}
              leaving={panelLeaving}
              onClose={closePanel}
              /* Open it the way a card on the line does: in the viewer over the
                 poster, with ?work= in the address. enterProject would navigate
                 to /projects/<slug> and leave the page. */
              resuming={indexResuming}
              onOpen={(id) => {
                cameFromIndex.current = true;
                // The project owns the address from here, so closePanel must not
                // replace it — that race is what wiped ?work= before. Opening at
                // once lets the project rise through the leaving index instead
                // of waiting for a blank poster in between.
                closePanel({ keepRoute: true });
                workScrollRef.current?.openWork(id, { away: true });
              }}
            />
          ) : null}
          {children}
          {leaving && leavingExp ? (
            <ProjectView
              key={`out-${leaving.id}`}
              experience={leavingExp}
              phase="handoff-out"
              index={leaving.index}
              onIndex={() => {}}
            />
          ) : null}
          {showView && experience ? (
            <ProjectView
              key={experience.slug}
              experience={experience}
              phase={phase}
              index={viewIndex}
              inspecting={inspecting}
              entrance={entranceRef.current}
              onIndex={onViewIndex}
              restoreX={parkedX}
              fullFrame={fullFrame}
              fill
              onCommitNext={commitNext}
              onGeometryReady={(rect) => {
                if (!window.__hbwEnterTiming?.geometryReady) {
                  markEnterTiming({ mounted: performance.now(), geometryReady: performance.now() });
                }
                geometryWait.current?.(rect);
              }}
              onLeaveInspect={() => {
                if (panel === "info") closePanel();
              }}
            />
          ) : null}
          {enterBridge ? (
            <EnterBridge
              visual={enterBridge.visual}
              dest={enterBridge.dest}
              mode={enterBridge.mode}
              onSettled={() => settleEnter.current?.()}
            />
          ) : null}
        </div>
        <MotionDebug
          mode={windowMode}
          project={viewSlug}
          index={viewIndex}
          total={experience?.movements.length || 0}
          phase={swap ? `${swap.phase}:${swap.from}→${swap.to}` : phase}
        />
      </div>
      <div className={`hbw-sheet-layer${manifestoOpen ? " is-manifesto" : ""}${panel === "studio" ? " is-studio" : ""}`}>
        <WorkspacePanel
          panel={panel === "studio" ? null : panel}
          leaving={panelLeaving}
          manifestoClosing={manifestoLeaving}
          studioView={studioView}
          infoAnchor={infoAnchor}
          experience={experience}
          atProjectEnd={Boolean(experience && viewIndex === experience.movements.length - 1)}
          nextProjectName={experience ? nextProject(experience.slug)?.name ?? null : null}
          nextProjectHref={experience ? nextProject(experience.slug)?.href ?? null : null}
          practicePreview={practicePeek.open}
          onShowManifesto={showManifesto}
          onShowStudio={showStudioContent}
          onNextProject={() => window.dispatchEvent(new Event("hbw:boundary-next"))}
          onPracticePreviewEnter={practicePeek.show}
          onPracticePreviewLeave={practicePeek.hideSoon}
          onPracticePreviewOpen={() => {
            if (inspecting) return;
            openPanel("studio");
          }}
        />
      </div>
    </WorkspaceContext.Provider>
  );
}
