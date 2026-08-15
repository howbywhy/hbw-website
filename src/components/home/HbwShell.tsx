"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Arrival } from "@/components/home/Arrival";
import { PosterTool } from "@/components/home/PosterTool";
import { ProjectsLayer } from "@/components/home/ProjectsLayer";
import { PROJECTS, matchesFilter, sortProjects } from "@/components/home/catalog";
import { ProjectsNavPreview, useNavPeek } from "@/components/home/ProjectsNavPreview";
import { NavRegister } from "@/components/home/NavRegister";
import { WorkspacePanel } from "@/components/home/WorkspacePanel";
import { MotionDebug } from "@/components/home/MotionDebug";
import { ProjectView, type ViewPhase } from "@/components/home/projects/ProjectView";
import { getExperience } from "@/components/home/projects/experiences";
import { nextProject } from "@/components/home/sequence";
import { commitProjectMedia, preloadOpening, preloadProject, withTimeout } from "@/components/home/preload";
import type { InfoSectionId } from "@/components/home/projects/types";
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
  syncProjectsUrl,
  workspace,
  type FilterDim,
  type OriginFrame,
  type ProjectsMode,
  type SortId,
  type WindowMode,
} from "@/components/home/workspace";
import { HBW_T, isMobileViewport, reduceMotion, type SwapPhase } from "@/components/home/motion";
import { isStudioPathname, isWorkspacePathname, projectSlugFromPath } from "@/lib/workspace-routes";

const INTRO_KEY = "hbw.entered.v2";

function completeIntro() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("hbw-intro");
  document.documentElement.classList.add("hbw-entered");
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

function formatTime(d: Date) {
  const hour = d.getHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`;
}

function modeFromLocation(path: string): WindowMode {
  if (projectSlugFromPath(path)) return "view";
  if (path === "/" && projectsLayerFromUrl()) return "browse";
  return "make";
}

export function HbwShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const slug = projectSlugFromPath(pathname);
  const workspaceRoute = isWorkspacePathname(pathname);
  const [time, setTime] = useState("");
  const [panel, setPanel] = useState<WorkspacePanelId>(() =>
    isStudioPathname(pathname) ? "studio" : null
  );
  const [studioView, setStudioView] = useState<StudioView>(() =>
    pathname === "/manifesto" ? "manifesto" : "studio"
  );
  const [panelLeaving, setPanelLeaving] = useState(false);
  const studioPathRef = useRef(pathname);
  const [windowMode, setWindowMode] = useState<WindowMode>(() =>
    projectSlugFromPath(pathname) ? "view" : "make"
  );
  const [browseMode, setBrowseMode] = useState<ProjectsMode>("visual");
  const [filterDim, setFilterDim] = useState<FilterDim>("all");
  const [filterValue, setFilterValue] = useState("");
  const [sort, setSort] = useState<SortId>("edited");
  const [activeId, setActiveId] = useState(slug || PROJECTS[0].id);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [infoAnchor, setInfoAnchor] = useState<InfoSectionId>("idea");
  const [viewIndex, setViewIndex] = useState(0);
  const [phase, setPhase] = useState<ViewPhase>(() => (projectSlugFromPath(pathname) ? "active" : "idle"));
  const [swap, setSwap] = useState<Swap | null>(null);
  const [leaving, setLeaving] = useState<{ id: string; index: number } | null>(null);
  const [narrow, setNarrow] = useState(false);
  const motionTimer = useRef<number[]>([]);
  const motionLock = useRef(false);
  const viewTransitionLock = useRef(false);
  const enterGen = useRef(0);
  const savedIndex = useRef<Record<string, number>>({});
  const keepBrowse = useRef(false);
  const entranceRef = useRef<"archive" | "reduced">("reduced");
  const originStack = useRef<OriginFrame[]>([]);
  const [originKind, setOriginKind] = useState<OriginFrame["kind"] | "none">("none");
  const panelRef = useRef(panel);

  function commitOrigin(stack: OriginFrame[]) {
    originStack.current = stack;
    persistOrigin(stack);
    setOriginKind(stack.at(-1)?.kind || "none");
  }
  panelRef.current = panel;
  const peekEnabled =
    windowMode === "make" &&
    !panel &&
    !panelLeaving &&
    phase === "idle" &&
    !swap;
  const peek = useNavPeek(peekEnabled && !narrow);
  const inspecting = panel === "info" && !panelLeaving;
  const projectsRef = useRef<HTMLButtonElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const viewSlug =
    windowMode === "view" || phase !== "idle" || swap?.to === "view" ? activeId : slug;
  const experience = viewSlug ? getExperience(viewSlug) : null;

  function clearMotionTimers() {
    motionTimer.current.forEach((id) => window.clearTimeout(id));
    motionTimer.current = [];
  }

  function later(ms: number, fn: () => void) {
    const id = window.setTimeout(fn, reduceMotion() ? 0 : ms);
    motionTimer.current.push(id);
  }

  function finishSwap() {
    setSwap(null);
    motionLock.current = false;
  }

  function runViewTransition(update: () => void) {
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished?: Promise<unknown> };
    };
    if (reduceMotion() || viewTransitionLock.current || typeof doc.startViewTransition !== "function") {
      update();
      return;
    }
    viewTransitionLock.current = true;
    const transition = doc.startViewTransition(update);
    Promise.resolve(transition?.finished)
      .catch(() => undefined)
      .finally(() => {
        viewTransitionLock.current = false;
      });
  }

  useEffect(() => {
    if (!workspaceRoute) {
      document.documentElement.classList.remove("hbw-workspace", "hbw-home-prototype");
      return;
    }
    hydrateWorkspace();
    persistWorkspace();
    document.documentElement.classList.add("hbw-workspace", "hbw-home-prototype");
    document.documentElement.classList.remove("hbw-project-page-loading", "hbw-ss-active");
    function onHide() {
      persistWorkspace();
    }
    window.addEventListener("pagehide", onHide);
    const tick = () => setTime(formatTime(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    setBrowseMode(workspace.projects.mode);
    setFilterDim(workspace.projects.filterDim);
    setFilterValue(workspace.projects.filterValue);
    setSort(workspace.projects.sort);
    if (!slug) setActiveId(workspace.projects.activeId);

    function onAnchor(event: Event) {
      const detail = (event as CustomEvent<InfoSectionId>).detail;
      if (detail) setInfoAnchor(detail);
    }
    window.addEventListener("hbw:info-anchor", onAnchor);
    return () => {
      document.documentElement.classList.remove("hbw-workspace", "hbw-home-prototype");
      window.clearInterval(id);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("hbw:info-anchor", onAnchor);
    };
  }, [workspaceRoute, slug]);

  useEffect(() => {
    if (!workspaceRoute) return;
    function onPop() {
      setHoveredId(null);
      motionLock.current = false;
      enterGen.current += 1;
      setLeaving(null);
      setSwap(null);
      const next = modeFromLocation(window.location.pathname);
      const nextSlug = projectSlugFromPath(window.location.pathname);
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
        setStudioView("studio");
        setPanelLeaving(false);
      } else if (path === "/manifesto") {
        setPanel("studio");
        setStudioView("manifesto");
        setPanelLeaving(false);
      } else if (isStudioPathname(studioPathRef.current)) {
        setPanel(null);
        setPanelLeaving(false);
        setStudioView("studio");
      }
      studioPathRef.current = path;
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [workspaceRoute]);

  useEffect(() => {
    if (!workspaceRoute || motionLock.current) return;
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
    workspace.projects.open = nextMode === "browse";
  }, [pathname, workspaceRoute, slug]);

  useEffect(() => {
    if (!workspaceRoute) return;
    const prev = studioPathRef.current;
    if (pathname === "/studio") {
      setPanel("studio");
      setStudioView("studio");
      setPanelLeaving(false);
    } else if (pathname === "/manifesto") {
      setPanel("studio");
      setStudioView("manifesto");
      setPanelLeaving(false);
    } else if (isStudioPathname(prev) && panelRef.current === "studio") {
      setPanel(null);
      setPanelLeaving(false);
      setStudioView("studio");
    }
    studioPathRef.current = pathname;
  }, [pathname, workspaceRoute]);

  useEffect(() => {
    if (!workspaceRoute) return;
    document.documentElement.classList.toggle("hbw-route-sub3", viewSlug === "sub-3");
    document.documentElement.classList.toggle("hbw-route-home", windowMode === "make");
    document.documentElement.classList.remove("hbw-project-page-loading", "hbw-ss-active");
  }, [windowMode, workspaceRoute, viewSlug]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const stack = readOrigin();
    originStack.current = stack;
    setOriginKind(stack.at(-1)?.kind || "none");
  }, []);

  useLayoutEffect(() => {
    if (!document.documentElement.classList.contains("hbw-intro")) return;
    if (reduceMotion()) {
      completeIntro();
      return;
    }
    const id = window.setTimeout(completeIntro, HBW_T.spatial + HBW_T.continuity + HBW_T.ui);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (windowMode !== "browse") return;
    PROJECTS.forEach((project) => preloadProject(project.id));
  }, [windowMode]);

  useEffect(() => {
    if (!hoveredId) return;
    preloadProject(hoveredId);
  }, [hoveredId]);

  function openPanel(next: Exclude<WorkspacePanelId, null>) {
    completeIntro();
    setPanelLeaving(false);
    if (next === "studio") setStudioView("studio");
    setPanel(next);
    if (next === "studio" && windowMode === "make" && !isStudioPathname(pathname)) {
      router.push("/studio");
    }
  }

  function closePanel() {
    if (!panel) return;
    const leaveRoute = panel === "studio" && isStudioPathname(pathname);
    setPanelLeaving(true);
    later(HBW_T.spatial, () => {
      setPanel(null);
      setPanelLeaving(false);
      setStudioView("studio");
      if (leaveRoute) router.push("/");
    });
  }

  function showManifesto() {
    setStudioView("manifesto");
    if (isStudioPathname(pathname)) router.replace("/manifesto");
  }

  function showStudioContent() {
    setStudioView("studio");
    if (isStudioPathname(pathname)) router.replace("/studio");
  }

  function openProjects() {
    completeIntro();
    if (windowMode === "view" || phase === "rising" || phase === "assembling" || phase === "active") {
      exitToProjects();
      return;
    }
    if (motionLock.current) return;
    setHoveredId(null);
    setPanel(null);
    setPanelLeaving(false);
    workspace.projects.open = true;
    persistWorkspace();
    motionLock.current = true;
    clearMotionTimers();
    setSwap({ from: "make", to: "browse", phase: "exiting" });
    later(HBW_T.micro, () => {
      setWindowMode("browse");
      setPhase("idle");
      setSwap({ from: "make", to: "browse", phase: "entering" });
      if (pathname !== "/") router.push("/?layer=projects");
      else syncProjectsUrl(true);
      later(HBW_T.spatial, finishSwap);
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
    setHoveredId(null);
    closePanel();
    workspace.projects.open = false;
    persistWorkspace();
    motionLock.current = true;
    clearMotionTimers();
    setSwap({ from: "browse", to: "make", phase: "exiting" });
    setWindowMode("make");
    setPhase("idle");
    if (pathname !== "/") {
      router.push("/");
    } else {
      syncProjectsUrl(false);
    }
    later(HBW_T.spatial, finishSwap);
  }

  function returnToMake() {
    if (windowMode === "view" || phase === "rising" || phase === "assembling" || phase === "active" || phase === "handoff-in") {
      return;
    }
    if (windowMode === "browse") {
      closeProjects();
    }
  }

  function exitToProjects(history: "push" | "replace" = "push") {
    if (phase === "exiting" || motionLock.current) return;
    commitOrigin([]);
    setHoveredId(null);
    setPanel(null);
    setPanelLeaving(false);
    setLeaving(null);
    motionLock.current = true;
    clearMotionTimers();
    if (viewSlug) savedIndex.current[viewSlug] = viewIndex;
    keepBrowse.current = true;
    workspace.projects.open = true;
    persistWorkspace();
    setSwap({ from: "view", to: "browse", phase: "exiting" });
    setPhase("exiting");
    later(HBW_T.continuity, () => {
      setWindowMode("browse");
      setPhase("idle");
      finishSwap();
      if (history === "replace") router.replace("/?layer=projects");
      else router.push("/?layer=projects");
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
    workspace.projects.open = false;
    persistWorkspace();
    setSwap({ from: "view", to: "make", phase: "exiting" });
    setPhase("exiting");
    setWindowMode("make");
    later(HBW_T.continuity, () => {
      setPhase("idle");
      finishSwap();
      router.replace("/");
    });
  }

  async function enterProject(id: string, fromHint?: "make" | "browse") {
    completeIntro();
    if (motionLock.current) return;
    const token = ++enterGen.current;
    const from: WindowMode =
      fromHint ?? (windowMode === "view" ? "view" : windowMode === "make" ? "make" : "browse");
    const cinematic = from === "browse" && browseMode === "visual";
    entranceRef.current = cinematic ? "archive" : "reduced";
    setLeaving(null);
    setActive(id);
    setHoveredId(null);
    setPanel(null);
    setPanelLeaving(false);
    motionLock.current = true;
    clearMotionTimers();
    setViewIndex(0);
    savedIndex.current[id] = 0;
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
        },
      ]);
    else if (viewSlug) commitOrigin([...originStack.current, { kind: "view", slug: viewSlug, index: viewIndex }]);
    setSwap({ from, to: "view", phase: "preparing" });
    await withTimeout(preloadOpening(id), cinematic || reduceMotion() ? 0 : HBW_T.prepareCap);
    if (token !== enterGen.current) return;
    const href = PROJECTS.find((p) => p.id === id)?.href || `/projects/${id}`;
    const lead = 0;
    later(lead, () => {
      if (token !== enterGen.current) return;
      const go = () => {
        flushSync(() => {
          setWindowMode("view");
          setSwap({ from, to: "view", phase: "entering" });
          setPhase("rising");
        });
      };
      if (cinematic) runViewTransition(go);
      else go();
      router.push(href);
    });
    later(lead + (cinematic && !reduceMotion() ? HBW_T.micro : 0), () => {
      if (token !== enterGen.current) return;
      setPhase("assembling");
    });
    later(lead + HBW_T.continuity, () => {
      if (token !== enterGen.current) return;
      setPhase("active");
      finishSwap();
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
    entranceRef.current = "reduced";
    savedIndex.current[fromId] = experience?.movements.length ?? viewIndex;
    preloadProject(nxt.id);
    commitProjectMedia(nxt.id);
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
    runViewTransition(apply);
    router.push(nxt.href);
    if (reduceMotion()) {
      setLeaving(null);
      setPhase("active");
      finishSwap();
      return;
    }
    later(HBW_T.continuity, () => {
      setLeaving(null);
      setPhase("active");
      finishSwap();
    });
  }

  function restoreProject(slug: string, index: number) {
    if (motionLock.current) return;
    const fromId = viewSlug;
    if (!fromId || fromId === slug) {
      exitToProjects();
      return;
    }
    setHoveredId(null);
    setPanel(null);
    setPanelLeaving(false);
    motionLock.current = true;
    clearMotionTimers();
    savedIndex.current[fromId] = viewIndex;
    keepBrowse.current = true;
    preloadProject(slug);
    commitProjectMedia(slug);
    setLeaving({ id: fromId, index: viewIndex });
    setActive(slug);
    setViewIndex(index);
    savedIndex.current[slug] = index;
    setWindowMode("view");
    setSwap({ from: "view", to: "view", phase: "entering" });
    setPhase("handoff-in");
    router.replace(PROJECTS.find((p) => p.id === slug)?.href || `/projects/${slug}`);
    if (reduceMotion()) {
      setLeaving(null);
      setPhase("active");
      finishSwap();
      return;
    }
    later(HBW_T.continuity, () => {
      setLeaving(null);
      setPhase("active");
      finishSwap();
    });
  }

  function closeToOrigin() {
    if (motionLock.current && phase !== "active" && phase !== "rising") return;
    motionLock.current = false;
    clearMotionTimers();
    const next = originStack.current.slice(0, -1);
    const origin = originStack.current.at(-1);
    commitOrigin(next);
    if (!origin || origin.kind === "browse") {
      if (origin?.kind === "browse") {
        setProjectsMode(origin.mode);
        setActive(origin.id);
        setProjectsLens(origin.filterDim || "all", origin.filterValue || "");
        if (origin.sort) setProjectsSort(origin.sort);
      }
      exitToProjects("replace");
      return;
    }
    if (origin.kind === "make") {
      commitOrigin([]);
      homeFromView();
      return;
    }
    restoreProject(origin.slug, origin.index);
  }

  function setActive(id: string) {
    setActiveId(id);
    workspace.projects.activeId = id;
    persistWorkspace();
  }

  function setProjectsMode(next: ProjectsMode) {
    if (next === browseMode) return;
    const apply = () => {
      setBrowseMode(next);
      workspace.projects.mode = next;
      persistWorkspace();
    };
    runViewTransition(() => {
      flushSync(apply);
    });
  }

  function setProjectsLens(dim: FilterDim, value: string) {
    setFilterDim(dim);
    setFilterValue(value);
    workspace.projects.filterDim = dim;
    workspace.projects.filterValue = value;
    persistWorkspace();
  }

  function setProjectsSort(next: SortId) {
    setSort(next);
    workspace.projects.sort = next;
    persistWorkspace();
  }

  function onViewIndex(next: number) {
    setViewIndex(next);
    if (viewSlug) savedIndex.current[viewSlug] = next;
  }

  useEffect(() => {
    if (!workspaceRoute) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (peek.open) {
          peek.hideNow();
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
      if (windowMode !== "browse" || panel || peek.open) return;
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
  }, [activeId, browseMode, filterDim, filterValue, hoveredId, panel, peek.open, phase, sort, windowMode, workspaceRoute]);

  useEffect(() => {
    if (panel !== "info") return;
    const inspector = document.querySelector<HTMLElement>(".hbw-sheet.is-project-right");
    const node = inspector?.querySelector<HTMLElement>(`[data-hbw-info-section="${infoAnchor}"]`);
    if (inspector && node) inspector.scrollTop = Math.max(0, node.offsetTop - 24);
  }, [panel, infoAnchor]);

  if (!workspaceRoute) return children;

  const makeActive = windowMode === "make" && swap?.from !== "browse";
  const browseDropping = swap?.from === "browse" && swap.to === "make";
  const preparingView = swap?.to === "view" && swap.phase === "preparing";
  const browseOpen =
    windowMode === "browse" ||
    browseDropping ||
    (keepBrowse.current &&
      (windowMode === "view" || preparingView || phase === "exiting" || phase === "rising" || phase === "assembling"));
  const navFace =
    phase === "assembling" ||
    phase === "active" ||
    phase === "handoff-in" ||
    (windowMode === "view" && phase !== "exiting" && phase !== "rising" && phase !== "idle")
      ? "view"
      : windowMode === "browse" || phase === "exiting" || browseDropping
        ? "browse"
        : "home";
  const leavingExp = leaving ? getExperience(leaving.id) : null;
  const showView =
    Boolean(experience) && !preparingView && (windowMode === "view" || phase !== "idle");
  const viewExit = navFace === "view" && panel !== "info" && panel !== "studio";
  const manifestoOpen = panel === "studio" && studioView === "manifesto" && !panelLeaving;
  const manifestoSheet = panel === "studio" && studioView === "manifesto";
  const studioClose = panel === "studio" && studioView !== "manifesto";
  const muteProjects = panel === "studio" && studioView !== "manifesto";
  const muteStudio = inspecting;

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
          panel === "studio" && !panelLeaving ? " is-studio" : ""
        }${panel === "studio" && studioView === "manifesto" && !panelLeaving ? " is-manifesto" : ""}${
          swap?.to === "view" || phase === "rising" || phase === "assembling" ? " is-owning" : ""
        } is-phase-${phase}${swap ? ` is-swap-${swap.phase}` : ""}`}
        data-hbw-project={viewSlug || undefined}
        data-hbw-origin={originKind}
        data-hbw-lens={filterValue || undefined}
        data-hbw-browse={browseMode}
        data-hbw-motion={swap?.phase || phase}
        data-hbw-from={swap?.from}
        data-hbw-to={swap?.to}
      >
        <header className="hbw-home-strip">
          <div className="hbw-home-strip__brand" inert={manifestoSheet || undefined}>
            <button type="button" className="hbw-home-strip__home" aria-label="How by Why" onClick={navFace === "view" ? undefined : returnToMake}>
              <span className="hbw-home-strip__mark">How by Why</span>
              <span className={`hbw-home-strip__identity${navFace === "view" && experience ? " is-on" : ""}`}>
                <span className="hbw-home-strip__times" aria-hidden={navFace === "view" ? undefined : true}>
                  ×
                </span>
                <span
                  key={navFace === "view" && experience ? experience.name : "idle"}
                  className="hbw-home-strip__project"
                >
                  {navFace === "view" && experience ? experience.name : ""}
                </span>
              </span>
            </button>
            <button
              type="button"
              className={`hbw-home-strip__exit${viewExit ? " is-on" : ""}`}
              aria-hidden={viewExit ? undefined : true}
              tabIndex={viewExit ? 0 : -1}
              onClick={closeToOrigin}
            >
              Close
            </button>
          </div>
          <nav className="hbw-home-strip__nav" aria-label="Primary">
            <div
              className={`hbw-nav-projects${manifestoSheet ? " is-sheet-close" : ""}`}
              inert={muteProjects || undefined}
              aria-hidden={muteProjects || undefined}
            >
              <button
                ref={projectsRef}
                type="button"
                className="hbw-nav-projects__hit"
                data-hbw-peek-enabled={peekEnabled ? "true" : "false"}
                data-hbw-sheet-close={manifestoSheet ? "manifesto" : undefined}
                aria-label={
                  manifestoSheet || navFace === "browse" || (swap?.from === "browse" && swap.to === "make")
                    ? "Close"
                    : "Projects"
                }
                aria-expanded={windowMode === "browse" || peek.open}
                aria-controls="hbw-projects-layer"
                tabIndex={muteProjects ? -1 : undefined}
                onPointerEnter={peek.show}
                onPointerLeave={(event) => {
                  const next = event.relatedTarget as Node | null;
                  if (event.currentTarget.parentElement?.querySelector(".hbw-nav-peek")?.contains(next)) {
                    peek.show();
                    return;
                  }
                  peek.hideSoon();
                }}
                onFocus={peek.show}
                onBlur={(event) => {
                  if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) peek.hideSoon();
                }}
                onClick={() => {
                  if (muteProjects) return;
                  peek.hideNow();
                  if (manifestoSheet) {
                    closePanel();
                    return;
                  }
                  if (navFace === "browse" || (swap?.from === "browse" && swap.to === "make")) closeProjects();
                  else openProjects();
                }}
              >
                {manifestoSheet || navFace === "browse" || (swap?.from === "browse" && swap.to === "make")
                  ? "Close"
                  : "Projects"}
              </button>
              <NavRegister
                face={navFace}
                browseMode={browseMode}
                onBrowseMode={setProjectsMode}
                filterValue={filterValue}
                onClearLens={() => setProjectsLens("all", "")}
                viewIndex={viewIndex}
                experience={experience}
              />
              <ProjectsNavPreview
                open={peek.open}
                enabled={peekEnabled}
                onEnter={(id) => enterProject(id, "make")}
                onKeep={peek.show}
                onLeave={peek.hideSoon}
              />
            </div>
            <button
              type="button"
              className={`hbw-nav-studio${studioClose ? " is-sheet-close" : ""}`}
              data-hbw-sheet-close={studioClose ? "studio" : undefined}
              aria-pressed={panel === "studio"}
              aria-label={studioClose ? "Close" : "Studio"}
              aria-hidden={muteStudio || undefined}
              tabIndex={muteStudio ? -1 : undefined}
              onClick={() => {
                if (muteStudio) return;
                if (manifestoOpen) showStudioContent();
                else if (studioClose) closePanel();
                else openPanel("studio");
              }}
            >
              {studioClose ? "Close" : "Studio"}
            </button>
          </nav>
          <span className="hbw-home-strip__time">
            {time}
          </span>
        </header>

        <div className="hbw-window">
          <PosterTool dormant={!makeActive} />
          <Arrival onMake={arriveMake} onBrowse={arriveBrowse} />
          <ProjectsLayer
            open={browseOpen}
            dropping={browseDropping}
            entering={windowMode === "view" || phase === "rising" || phase === "assembling"}
            owning={Boolean(swap?.to === "view" || phase === "rising" || phase === "assembling")}
            mode={browseMode}
            selectedId={activeId}
            hoveredId={hoveredId}
            filterDim={filterDim}
            filterValue={filterValue}
            sort={sort}
            onHover={setHoveredId}
            onSelect={setActive}
            onEnterProject={(id) => enterProject(id, "browse")}
            onLens={setProjectsLens}
          />
          {leaving && leavingExp ? (
            <ProjectView
              key={`out-${leaving.id}`}
              experience={leavingExp}
              phase="handoff-out"
              index={leavingExp.movements.length}
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
              onCommitNext={commitNext}
            />
          ) : null}
        </div>
        <WorkspacePanel
          panel={panel}
          leaving={panelLeaving}
          studioView={studioView}
          infoAnchor={infoAnchor}
          experience={experience}
          onShowManifesto={showManifesto}
          onShowStudio={showStudioContent}
        />
        <MotionDebug
          mode={windowMode}
          project={viewSlug}
          index={viewIndex}
          total={experience?.movements.length || 0}
          phase={swap ? `${swap.phase}:${swap.from}→${swap.to}` : phase}
        />
      </div>
    </WorkspaceContext.Provider>
  );
}
