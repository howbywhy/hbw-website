"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Arrival } from "@/components/home/Arrival";
import { IdentityNav } from "@/components/home/IdentityNav";
import { PosterTool } from "@/components/home/PosterTool";
import { ProjectsLayer } from "@/components/home/ProjectsLayer";
import { PROJECTS, matchesFilter, projectById, sortProjects } from "@/components/home/catalog";
import { ProjectsNavPreview, useNavPeek, type PeekProject } from "@/components/home/ProjectsNavPreview";
import { NavRegister } from "@/components/home/NavRegister";
import { WorkspacePanel } from "@/components/home/WorkspacePanel";
import { MotionDebug } from "@/components/home/MotionDebug";
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
import { commitProjectMedia, preloadOpening, preloadProject, withTimeout } from "@/components/home/preload";
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
import { isStudioPathname, previewSlugFromPath, projectSlugFromPath, viewSlugFromPath } from "@/lib/workspace-routes";

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
  if (mode === "browse" || mode === "view") return true;
  if (swap?.to === "make") return false;
  if (swap?.to === "browse") return true;
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
  if (path === "/" && projectsLayerFromUrl()) return "browse";
  return "make";
}

export function HbwShell({
  children,
  published = null,
}: {
  children: React.ReactNode;
  published?: ResolvedProjectExperience | null;
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
    isStudioPathname(pathname) ? "studio" : null
  );
  const [studioView, setStudioView] = useState<StudioView>(() =>
    pathname === "/manifesto" ? "manifesto" : "studio"
  );
  const [panelLeaving, setPanelLeaving] = useState(false);
  const [manifestoLeaving, setManifestoLeaving] = useState(false);
  const manifestoGen = useRef(0);
  const manifestoLeavingRef = useRef(false);
  const studioViewRef = useRef(studioView);
  studioViewRef.current = studioView;
  const studioPathRef = useRef(pathname);
  const [windowMode, setWindowMode] = useState<WindowMode>(() => resumed?.windowMode ?? modeFromLocation(pathname));
  const [browseMode, setBrowseMode] = useState<ProjectsMode>(resumed?.browse?.mode ?? "visual");
  const [filterDim, setFilterDim] = useState<FilterDim>(resumed?.browse?.filterDim ?? "all");
  const [filterValue, setFilterValue] = useState(resumed?.browse?.filterValue ?? "");
  const [sort, setSort] = useState<SortId>(resumed?.browse?.sort ?? "edited");
  const [activeId, setActiveId] = useState(resumed?.activeId ?? (slug || PROJECTS[0].id));
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [infoAnchor, setInfoAnchor] = useState<InfoSectionId>("idea");
  const [viewIndex, setViewIndex] = useState(resumed?.viewIndex ?? 0);
  const [phase, setPhase] = useState<ViewPhase>(() => phaseAfterRouteBoundary(resumed, pathname));
  const [swap, setSwap] = useState<Swap | null>(resumed?.swap ?? null);
  const [leaving, setLeaving] = useState<{ id: string; index: number } | null>(resumed?.leaving ?? null);
  const [heldSuffix, setHeldSuffix] = useState<string | null>(() => readMobileSuffixHold());
  const [narrow, setNarrow] = useState(false);
  const motionTimer = useRef<number[]>([]);
  const motionLock = useRef(false);
  const viewTransitionLock = useRef(false);
  const enterGen = useRef(0);
  const savedIndex = useRef<Record<string, number>>({});
  const keepBrowse = useRef(resumed?.keepBrowse ?? false);
  const entranceRef = useRef<"archive" | "reduced" | "handoff" | "field">(resumed?.entrance ?? "reduced");
  const [returnBrowseChrome, setReturnBrowseChrome] = useState(false);
  const [entryChrome, setEntryChrome] = useState(false);
  const [restoredBrowse, setRestoredBrowse] = useState(
    () => resumed?.kind === "exit" && resumed.entrance === "field"
  );
  const resumeLock = useRef(Boolean(resumed));
  const routeHold = useRef(false);
  if (resumeLock.current) motionLock.current = true;
  const originStack = useRef<OriginFrame[]>([]);
  const [originKind, setOriginKind] = useState<OriginFrame["kind"] | "none">("none");
  const [parkedX, setParkedX] = useState<number | null>(resumed?.parkedX ?? null);
  const browseScrollRef = useRef({ visual: 0, index: 0 });
  const pendingBrowseScroll = useRef<{ mode: ProjectsMode; y: number } | null>(
    resumed?.browse?.scroll != null && resumed.browse.mode
      ? { mode: resumed.browse.mode, y: resumed.browse.scroll }
      : null
  );
  const panelRef = useRef(panel);
  const closingPanelRef = useRef(false);
  const homeRef = useRef<HTMLDivElement>(null);

  function commitOrigin(stack: OriginFrame[]) {
    originStack.current = stack;
    persistOrigin(stack);
    setOriginKind(stack.at(-1)?.kind || "none");
  }

  function projectsScroller() {
    return homeRef.current?.querySelector<HTMLElement>(".hbw-projects");
  }

  function captureBrowseScroll() {
    const el = projectsScroller();
    const y = el ? el.scrollTop : browseScrollRef.current[browseMode];
    browseScrollRef.current[browseMode] = y;
    return y;
  }

  function restoreBrowseScroll(mode: ProjectsMode, y?: number) {
    const target = y ?? browseScrollRef.current[mode];
    const apply = () => {
      const el = projectsScroller();
      if (el) el.scrollTop = target;
    };
    apply();
    requestAnimationFrame(apply);
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
    setReturnBrowseChrome(false);
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
        const fieldEnter =
          resumed.kind === "enter" &&
          (resumed.entrance === "field" || resumed.swap?.from === "browse");
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
              ".hbw-home-strip__journey-close.is-on, .hbw-nav-studio.is-sheet-close, .hbw-nav-sub__face--info button"
            );
          }
        });
      } else if (resumed.kind === "exit") {
        if (resumed.phase === "idle" || (resumed.entrance === "field" && !resumed.swap)) {
          setWindowMode("browse");
          setPhase("idle");
          setRestoredBrowse(true);
          finishSwap();
          const pending = pendingBrowseScroll.current;
          pendingBrowseScroll.current = null;
          if (pending) {
            browseScrollRef.current[pending.mode] = pending.y;
            restoreBrowseScroll(pending.mode, pending.y);
          }
          restoreFocus();
        } else {
          later(remain(HBW_T.spatial), () => setReturnBrowseChrome(true));
          later(remain(HBW_T.continuity), () => {
            setWindowMode("browse");
            setPhase("idle");
            finishSwap({ unlock: false });
            setRestoredBrowse(true);
            const pending = pendingBrowseScroll.current;
            pendingBrowseScroll.current = null;
            if (pending) {
              browseScrollRef.current[pending.mode] = pending.y;
              restoreBrowseScroll(pending.mode, pending.y);
            }
            routeHold.current = true;
            if (viewSlugFromPath(window.location.pathname)) router.replace("/?layer=projects");
            else if (projectsLayerFromUrl()) releaseRouteHold();
            restoreFocus();
          });
        }
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
    setExpandedId(workspace.projects.expandedId);
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
    const sync = () => setNarrow(mq.matches);
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
    if (windowMode !== "browse") return;
    PROJECTS.forEach((project) => preloadProject(project.id));
  }, [windowMode]);

  useEffect(() => {
    if (!hoveredId) return;
    preloadProject(hoveredId);
  }, [hoveredId]);

  useEffect(() => {
    const root = homeRef.current;
    if (!root) return;
    function onScroll(event: Event) {
      const el = event.target;
      if (!(el instanceof HTMLElement) || !el.classList.contains("hbw-projects")) return;
      browseScrollRef.current[browseMode] = el.scrollTop;
    }
    root.addEventListener("scroll", onScroll, true);
    return () => root.removeEventListener("scroll", onScroll, true);
  }, [browseMode]);

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
    if (next === "studio") focusSelector(".hbw-nav-studio");
    if (next === "info") focusSelector('.hbw-sheet[data-hbw-sheet="project-right"]');
  }

  function closePanel() {
    if (!panel || panelLeaving) return;
    const leaveRoute = panel === "studio" && isStudioPathname(pathname);
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
    focusSelector(".hbw-nav-studio");
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

  function openProjects() {
    completeIntro();
    rememberFocus();
    if (windowMode === "view" || phase === "rising" || phase === "assembling" || phase === "active") {
      exitToProjects();
      return;
    }
    if (motionLock.current) return;
    setHoveredId(null);
    setPanel(null);
    setPanelLeaving(false);
    motionLock.current = true;
    clearMotionTimers();
    const fromPeek = peek.open;
    flipMark(() => {
      flushSync(() => {
        peek.hideNow();
        if (fromPeek) {
          setWindowMode("browse");
          setPhase("idle");
          setSwap({ from: "make", to: "browse", phase: "entering" });
        } else {
          setSwap({ from: "make", to: "browse", phase: "exiting" });
        }
      });
    }, HBW_T.spatial);
    if (fromPeek) {
      if (pathname !== "/") router.push("/?layer=projects");
      else syncProjectsUrl(true);
      later(HBW_T.spatial, () => {
        finishSwap();
        focusSelector(".hbw-nav-projects__hit");
      });
      return;
    }
    later(HBW_T.micro, () => {
      setWindowMode("browse");
      setPhase("idle");
      setSwap({ from: "make", to: "browse", phase: "entering" });
      if (pathname !== "/") router.push("/?layer=projects");
      else syncProjectsUrl(true);
      later(HBW_T.spatial, () => {
        finishSwap();
        focusSelector(".hbw-nav-projects__hit");
      });
    });
  }

  function arriveMake() {
    document.documentElement.classList.add("hbw-arriving-make");
    later(HBW_T.micro, completeIntro);
    later(HBW_T.continuity, () => document.documentElement.classList.remove("hbw-arriving-make"));
  }

  function arriveBrowse() {
    document.documentElement.classList.add("hbw-arriving-browse");
    later(HBW_T.micro, () => {
      document.documentElement.classList.remove("hbw-arriving-browse");
      openProjects();
    });
  }

  function closeProjects() {
    if (motionLock.current) return;
    setRestoredBrowse(false);
    setHoveredId(null);
    closePanel();
    motionLock.current = true;
    clearMotionTimers();
    flipMark(() => {
      flushSync(() => {
        setSwap({ from: "browse", to: "make", phase: "exiting" });
        setWindowMode("make");
        setPhase("idle");
      });
    }, HBW_T.spatial);
    if (pathname !== "/") {
      router.push("/");
    } else {
      syncProjectsUrl(false);
    }
    later(HBW_T.spatial, () => {
      finishSwap();
      restoreFocus();
    });
  }

  function returnToMake() {
    completeIntro();
    if (windowMode === "view" || phase === "rising" || phase === "assembling" || phase === "active" || phase === "handoff-in") {
      homeFromView();
      return;
    }
    if (windowMode === "browse") {
      closeProjects();
      return;
    }
    if (panel) closePanel();
  }

  function goProjects() {
    if (windowMode === "browse" || (swap?.from === "browse" && swap.to === "make")) return;
    openProjects();
  }

  function goPractice() {
    if (panel === "info") return;
    if (manifestoOpen) return;
    if (studioClose) return;
    openPanel("studio");
  }

  function exitToProjects(history: "push" | "replace" = "push") {
    if (phase === "exiting" || motionLock.current) return;
    commitOrigin([]);
    setHoveredId(null);
    setPanel(null);
    setPanelLeaving(false);
    setLeaving(null);
    setEntryChrome(false);
    setReturnBrowseChrome(false);
    motionLock.current = true;
    clearMotionTimers();
    if (viewSlug) savedIndex.current[viewSlug] = viewIndex;
    keepBrowse.current = true;
    const pending = pendingBrowseScroll.current;
    const browseState = pending
      ? { mode: pending.mode, filterDim, filterValue, sort, scroll: pending.y }
      : { mode: browseMode, filterDim, filterValue, sort, scroll: captureBrowseScroll() };
    pendingBrowseScroll.current = { mode: browseState.mode, y: browseState.scroll ?? 0 };
    restoreBrowseScroll(browseState.mode, browseState.scroll);
    setSwap({ from: "view", to: "browse", phase: "preparing" });
    restoreBrowseScroll(browseState.mode, browseState.scroll);
    flushSync(() => {
      setSwap({ from: "view", to: "browse", phase: "exiting" });
      setPhase("exiting");
    });
    writeMotionCrossing({
      kind: "exit",
      phase: "exiting",
      swap: { from: "view", to: "browse", phase: "exiting" },
      windowMode: "view",
      activeId,
      viewIndex,
      leaving: null,
      entrance: "field",
      keepBrowse: true,
      parkedX: null,
      cinematic: false,
      startedAt: Date.now(),
      browse: browseState,
    });
    later(HBW_T.spatial, () => setReturnBrowseChrome(true));
    later(HBW_T.continuity, () => {
      setWindowMode("browse");
      setPhase("idle");
      setSwap(null);
      setReturnBrowseChrome(false);
      setEntryChrome(false);
      setRestoredBrowse(true);
      homeRef.current?.querySelectorAll<HTMLElement>(".hbw-projects").forEach((node) => {
        node.getAnimations().forEach((anim) => anim.cancel());
      });
      writeMotionCrossing({
        kind: "exit",
        phase: "idle",
        swap: null,
        windowMode: "browse",
        activeId,
        viewIndex,
        leaving: null,
        entrance: "field",
        keepBrowse: true,
        parkedX: null,
        cinematic: false,
        startedAt: Date.now(),
        browse: browseState,
      });
      const next = pendingBrowseScroll.current;
      pendingBrowseScroll.current = null;
      if (next) {
        browseScrollRef.current[next.mode] = next.y;
        restoreBrowseScroll(next.mode, next.y);
      }
      routeHold.current = true;
      if (history === "replace") router.replace("/?layer=projects");
      else router.push("/?layer=projects");
      if (!viewSlugFromPath(window.location.pathname)) releaseRouteHold();
      restoreFocus();
    });
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

  async function enterProject(id: string, fromHint?: "make" | "browse") {
    completeIntro();
    if (motionLock.current) return;
    rememberFocus();
    const token = ++enterGen.current;
    const from: WindowMode =
      fromHint ?? (windowMode === "view" ? "view" : windowMode === "make" ? "make" : "browse");
    const fromBrowse = from === "browse";
    entranceRef.current = fromBrowse ? "field" : "reduced";
    setEntryChrome(false);
    setReturnBrowseChrome(false);
    setRestoredBrowse(false);
    setLeaving(null);
    setActive(id);
    setHoveredId(null);
    setPanel(null);
    setPanelLeaving(false);
    motionLock.current = true;
    clearMotionTimers();
    setViewIndex(0);
    savedIndex.current[id] = 0;
    setParkedX(null);
    keepBrowse.current = from === "browse" || from === "view";
    if (from === "make") commitOrigin([{ kind: "make" }]);
    else if (from === "browse")
      commitOrigin([
        {
          kind: "browse",
          mode: browseMode,
          id,
          filterDim,
          filterValue,
          sort,
          scroll: captureBrowseScroll(),
        },
      ]);
    else if (viewSlug) {
      commitOrigin([
        ...originStack.current,
        { kind: "view", slug: viewSlug, index: viewIndex, x: captureViewX() },
      ]);
    }
    setSwap({ from, to: "view", phase: "preparing" });
    const prepareMs = reduceMotion() ? 0 : HBW_T.prepareCap;
    await withTimeout(preloadOpening(id), prepareMs);
    if (token !== enterGen.current) return;
    const href = PROJECTS.find((p) => p.id === id)?.href || `/projects/${id}`;
    const assembleAt = fromBrowse ? HBW_T.spatial : 0;
    later(0, () => {
      if (token !== enterGen.current) return;
      const go = () => {
        flushSync(() => {
          peek.hideNow();
          practicePeek.hideNow();
          setWindowMode("view");
          setSwap({ from, to: "view", phase: "entering" });
          setPhase("rising");
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
        browse: {
          mode: browseMode,
          filterDim,
          filterValue,
          sort,
          scroll: browseScrollRef.current[browseMode],
        },
      });
      if (from === "make") flipMark(go);
      else go();
      if (!fromBrowse) router.push(href);
    });
    if (fromBrowse) {
      later(HBW_T.spatial, () => {
        if (token !== enterGen.current) return;
        setEntryChrome(true);
      });
    }
    later(assembleAt, () => {
      if (token !== enterGen.current) return;
      setPhase("assembling");
    });
    later(HBW_T.continuity, () => {
      if (token !== enterGen.current) return;
      setPhase("active");
      finishSwap();
      if (fromBrowse) router.push(href);
      focusSelector(
        ".hbw-home-strip__journey-close.is-on, .hbw-nav-studio.is-sheet-close, .hbw-nav-sub__face--info button"
      );
    });
  }

  function commitNext() {
    if (motionLock.current) return;
    const fromId = viewSlug;
    if (!fromId) return;
    const nxt = nextProject(fromId);
    if (!nxt) {
      exitToProjects();
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
      exitToProjects();
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

  function restoreBrowseOrigin(origin: Extract<OriginFrame, { kind: "browse" }>) {
    setProjectsMode(origin.mode, { silent: true });
    setActive(origin.id);
    setProjectsLens(origin.filterDim || "all", origin.filterValue || "");
    if (origin.sort) setProjectsSort(origin.sort);
    pendingBrowseScroll.current = {
      mode: origin.mode,
      y: origin.scroll ?? browseScrollRef.current[origin.mode],
    };
  }

  function resumeOrigin(origin: OriginFrame | undefined) {
    if (!origin || origin.kind === "browse") {
      if (origin?.kind === "browse") restoreBrowseOrigin(origin);
      exitToProjects("replace");
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
    const y = captureBrowseScroll();
    runViewTransition(() => {
      flushSync(apply);
      const el = projectsScroller();
      if (el) el.scrollTop = y;
    }, "archive");
  }

  function setProjectsLens(dim: FilterDim, value: string) {
    setFilterDim(dim);
    setFilterValue(value);
    setExpandedId(null);
    workspace.projects.filterDim = dim;
    workspace.projects.filterValue = value;
    workspace.projects.expandedId = null;
    persistWorkspace();
  }

  function setProjectsSort(next: SortId) {
    setSort(next);
    setExpandedId(null);
    workspace.projects.sort = next;
    workspace.projects.expandedId = null;
    persistWorkspace();
  }

  function setProjectsExpanded(id: string | null) {
    setExpandedId(id);
    workspace.projects.expandedId = id;
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
      if (document.querySelector(".hbw-nav-studio")?.contains(target)) return;
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
        if (windowMode === "view" || phase === "rising" || phase === "assembling" || phase === "active") {
          closeToOrigin();
          return;
        }
        if (windowMode === "browse") closeProjects();
        return;
      }
      if (windowMode !== "browse" || panel || peek.open || practicePeek.open) return;
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
  }, [activeId, browseMode, filterDim, filterValue, hoveredId, panel, peek.open, practicePeek.open, phase, sort, windowMode]);

  const makeActive = windowMode === "make" && swap?.from !== "browse";
  const browseDropping = swap?.from === "browse" && swap.to === "make";
  const preparingView = swap?.to === "view" && swap.phase === "preparing";
  const fromBrowse = swap?.from === "browse";
  const holdBrowseChrome =
    fromBrowse &&
    !entryChrome &&
    (swap?.phase === "preparing" || phase === "rising");
  const holdViewChromeOnReturn =
    swap?.from === "view" && swap.to === "browse" && !returnBrowseChrome;
  const browseOpen =
    windowMode === "browse" ||
    browseDropping ||
    (swap?.to === "browse" && (swap.phase === "preparing" || swap.phase === "exiting")) ||
    (keepBrowse.current &&
      (windowMode === "view" || preparingView || phase === "exiting" || phase === "rising" || phase === "assembling"));
  const viewToMakeExit = swap?.from === "view" && swap?.to === "make";
  const navFace =
    holdViewChromeOnReturn
      ? "view"
      : returnBrowseChrome && swap?.to === "browse"
        ? "browse"
        : holdBrowseChrome
      ? "browse"
      : viewToMakeExit
        ? "home"
        : phase === "assembling" ||
            phase === "active" ||
            phase === "handoff-in" ||
            phase === "exiting" ||
            (windowMode === "view" && phase !== "rising" && phase !== "idle")
          ? "view"
          : windowMode === "browse" || browseDropping
            ? "browse"
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
    Boolean(experience) &&
    (fromBrowse && preparingView
      ? true
      : !preparingView && (windowMode === "view" || phase !== "idle"));
  const viewExit = navFace === "view" && panel !== "info" && panel !== "studio";
  const assembled = identityAssembled(windowMode, swap);
  const sheetResolved = panel === "studio" && !panelLeaving && !assembled;
  const peekResolved = Boolean(!assembled && peek.open && peekProject);
  const resolved = sheetResolved || peekResolved;
  const hoverName =
    assembled && !narrow && windowMode === "browse" && hoveredId
      ? PROJECTS.find((project) => project.id === hoveredId)?.name
      : null;
  const identitySuffix =
    holdBrowseChrome || (returnBrowseChrome && swap?.to === "browse")
      ? hoverName || "Projects"
      : viewToMakeExit && swap.phase === "exiting" && experience && !reduceMotion()
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
  const viewJourneyClose = viewExit && panel !== "info";
  const studioAsClose = studioClose || manifestoSheet;
  const muteProjects = panel === "studio";
  const muteStudio = panel === "info";
  const hideProjectsHit =
    navFace !== "browse" && !(swap?.from === "browse" && swap.to === "make");
  const isOwning = fromBrowse
    ? phase === "rising" || phase === "assembling"
    : Boolean(swap?.to === "view" || phase === "rising" || phase === "assembling");
  const browseEntering = fromBrowse
    ? phase === "rising" || phase === "assembling"
    : windowMode === "view" || phase === "rising" || phase === "assembling";
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
        openProjects,
        closeProjects,
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
          isOwning ? " is-owning" : ""
        }${restoredBrowse ? " is-restored-browse" : ""}${boundaryNext ? " is-boundary" : ""} is-phase-${phase}${swap ? ` is-swap-${swap.phase}` : ""}`}
        data-hbw-project={viewSlug || undefined}
        data-hbw-held-suffix={heldSuffix || undefined}
        data-hbw-origin={originKind}
        data-hbw-lens={filterValue || undefined}
        data-hbw-browse={browseMode}
        data-hbw-motion={swap?.phase || phase}
        data-hbw-from={swap?.from}
        data-hbw-to={swap?.to}
      >
        <header className="hbw-home-strip">
          <IdentityNav
            onMake={returnToMake}
            onProjects={goProjects}
            onPractice={goPractice}
            practiceMuted={muteStudio}
            inert={panel === "studio"}
            assembled={assembled}
            resolved={resolved}
            suffix={identitySuffix}
            previewing={peek.open}
            previewingWhy={practicePeek.open && panel !== "studio"}
            projectIdea={projectIdea}
            whyHoverLocked={whyPeekLock}
            onPreviewShow={() => {
              practicePeek.hideNow();
              peek.show();
            }}
            onPreviewKeep={peek.show}
            onPreviewHide={() => {
              peek.hideSoon();
            }}
            onWhyPreviewShow={() => {
              if (whyPeekLock) return;
              peek.hideNow();
              practicePeek.show();
            }}
            onWhyPreviewKeep={practicePeek.show}
            onWhyPreviewHide={practicePeek.hideSoon}
          />
          <div className="hbw-home-strip__brand" inert={manifestoSheet || undefined}>
            <div className="hbw-home-strip__home">
              <span className="hbw-home-strip__identity">
                <span className="hbw-home-strip__times" aria-hidden="true">
                  ×
                </span>
                <span className="hbw-home-strip__project" />
              </span>
            </div>
            <button
              type="button"
              className={`hbw-home-strip__exit hbw-home-strip__journey-close${viewJourneyClose ? " is-on" : ""}`}
              aria-hidden={viewJourneyClose ? undefined : true}
              tabIndex={viewJourneyClose ? 0 : -1}
              onClick={closeJourney}
            >
              Close
            </button>
          </div>
          <nav
            className="hbw-home-strip__nav"
            aria-label={hideProjectsHit && hideStudioHit && navFace === "home" ? undefined : "Workspace"}
            aria-hidden={hideProjectsHit && hideStudioHit && navFace === "home" ? true : undefined}
          >
            <div
              className="hbw-nav-projects"
              inert={muteProjects || undefined}
              aria-hidden={muteProjects || undefined}
            >
              <button
                ref={projectsRef}
                type="button"
                className="hbw-nav-projects__hit"
                data-hbw-peek-enabled={peekEnabled ? "true" : "false"}
                aria-label={
                  navFace === "browse" || (swap?.from === "browse" && swap.to === "make")
                    ? "Close"
                    : "Projects"
                }
                aria-expanded={windowMode === "browse"}
                aria-controls="hbw-projects-layer"
                aria-hidden={muteProjects || hideProjectsHit || undefined}
                tabIndex={muteProjects || hideProjectsHit ? -1 : undefined}
                onClick={() => {
                  if (muteProjects) return;
                  if (navFace === "browse" || (swap?.from === "browse" && swap.to === "make")) {
                    peek.hideNow();
                    closeProjects();
                  } else openProjects();
                }}
              >
                {navFace === "browse" || (swap?.from === "browse" && swap.to === "make")
                  ? "Close"
                  : "Projects"}
              </button>
              <NavRegister
                face={navFace}
                browseMode={browseMode}
                onBrowseMode={setProjectsMode}
                filterValue={filterValue}
                onClearLens={() => setProjectsLens("all", "")}
                viewIndex={chromeIndex}
                experience={chromeExperience}
                boundaryName={boundaryNext?.name ?? null}
                boundaryHref={boundaryNext?.href ?? null}
              />
            </div>
            <button
              type="button"
              className={`hbw-nav-studio${studioAsClose ? " is-sheet-close" : ""}`}
              data-hbw-sheet-close={
                manifestoSheet ? "manifesto" : studioClose ? "studio" : undefined
              }
              aria-pressed={panel === "studio"}
              aria-label={studioAsClose ? "Close" : "Studio"}
              aria-hidden={muteStudio || hideStudioHit || undefined}
              tabIndex={muteStudio || hideStudioHit ? -1 : undefined}
              onClick={() => {
                if (muteStudio) return;
                if (studioClose || manifestoSheet) dismissStudioFamily();
                else openPanel("studio");
              }}
            >
              {studioAsClose ? "Close" : "Studio"}
            </button>
          </nav>
        </header>

        <ProjectsNavPreview
          open={peek.open}
          enabled={peekEnabled}
          onEnter={(id) => {
            enterProject(id, "make");
          }}
          onKeep={peek.show}
          onLeave={peek.hideSoon}
          onHoverProject={onPeekProject}
          onViewAll={() => {
            if (browseMode !== "visual") setProjectsMode("visual");
            openProjects();
          }}
        />

        <div className="hbw-window">
          <PosterTool dormant={!makeActive || panel === "studio"} />
          <Arrival onMake={arriveMake} onBrowse={arriveBrowse} />
          {children}
          <ProjectsLayer
            open={browseOpen && !inspecting}
            dropping={browseDropping}
            entering={browseEntering}
            owning={isOwning}
            mode={browseMode}
            selectedId={activeId}
            hoveredId={hoveredId}
            expandedId={expandedId}
            filterDim={filterDim}
            filterValue={filterValue}
            sort={sort}
            onHover={setHoveredId}
            onExpand={setProjectsExpanded}
            onSelect={setActive}
            onEnterProject={(id) => enterProject(id, "browse")}
            onLens={setProjectsLens}
          />
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
              onCommitNext={commitNext}
              onLeaveInspect={() => {
                if (panel === "info") closePanel();
              }}
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
          panel={panel}
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
