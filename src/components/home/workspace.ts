import { PROJECTS } from "@/components/home/catalog";
import { persistableObjects } from "@/components/home/poster/image";
import { emptyPoster, migratePoster } from "@/components/home/poster/migrate";
import type { PosterObj, PosterState, PosterToolId, Pt } from "@/components/home/poster/types";

export type { PosterObj, PosterState, PosterToolId, Pt } from "@/components/home/poster/types";

export type ProjectsMode = "visual" | "index";

export type WindowMode = "make" | "browse" | "view";

export type FilterDim = "all" | "year" | "sector" | "discipline" | "collaborator";
export type SortId = "edited" | "newest" | "az";

export type OriginFrame =
  | { kind: "make" }
  | {
      kind: "browse";
      mode: ProjectsMode;
      id: string;
      filterDim?: FilterDim;
      filterValue?: string;
      sort?: SortId;
    }
  | { kind: "view"; slug: string; index: number };

export type ProjectsState = {
  open: boolean;
  mode: ProjectsMode;
  activeId: string;
  filterDim: FilterDim;
  filterValue: string;
  sort: SortId;
};

const STORAGE_KEY = "hbw.workspace.v2";
const LEGACY_KEY = "hbw.workspace.v1";

export const workspace = {
  poster: emptyPoster(),
  projects: {
    open: false,
    mode: "visual" as ProjectsMode,
    activeId: PROJECTS[0].id,
    filterDim: "all" as FilterDim,
    filterValue: "",
    sort: "edited" as SortId,
  },
  hydrated: false,
};

export function hydrateWorkspace() {
  if (workspace.hydrated || typeof window === "undefined") return;
  workspace.hydrated = true;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as { poster?: unknown; projects?: ProjectsState };
    workspace.poster = migratePoster(data.poster);
    if (data.projects && typeof data.projects.activeId === "string") {
      workspace.projects = {
        open: false,
        mode: data.projects.mode === "index" ? "index" : "visual",
        activeId: data.projects.activeId,
        filterDim:
          data.projects.filterDim === "year" ||
          data.projects.filterDim === "sector" ||
          data.projects.filterDim === "discipline" ||
          data.projects.filterDim === "collaborator"
            ? data.projects.filterDim
            : "all",
        filterValue: typeof data.projects.filterValue === "string" ? data.projects.filterValue : "",
        sort: data.projects.sort === "newest" || data.projects.sort === "az" ? data.projects.sort : "edited",
      };
    }
  } catch {
    workspace.poster = emptyPoster();
  }
}

export function persistWorkspace() {
  if (typeof window === "undefined") return;
  try {
    const poster = {
      ...workspace.poster,
      objects: persistableObjects(workspace.poster.objects),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ poster, projects: workspace.projects }));
  } catch {
    try {
      const poster = { ...workspace.poster, objects: workspace.poster.objects.filter((o) => o.kind !== "image") };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ poster, projects: workspace.projects }));
    } catch {
      /* ignore quota */
    }
  }
}

export function resetPoster() {
  workspace.poster = emptyPoster();
  persistWorkspace();
}

const RETURN_KEY = "hbw.projects.return";
const ORIGIN_KEY = "hbw.origin.v1";

export function persistOrigin(stack: OriginFrame[]) {
  if (typeof window === "undefined") return;
  try {
    if (!stack.length) sessionStorage.removeItem(ORIGIN_KEY);
    else sessionStorage.setItem(ORIGIN_KEY, JSON.stringify(stack));
  } catch {
    /* ignore */
  }
}

export function readOrigin(): OriginFrame[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(ORIGIN_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as OriginFrame[];
    if (!Array.isArray(data)) return [];
    return data.filter((frame) => frame && (frame.kind === "make" || frame.kind === "browse" || frame.kind === "view"));
  } catch {
    return [];
  }
}

export function markReturnToProjects() {
  workspace.projects.open = true;
  persistWorkspace();
  try {
    sessionStorage.setItem(RETURN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeReturnToProjects() {
  if (typeof window === "undefined") return false;
  try {
    const flag = sessionStorage.getItem(RETURN_KEY) === "1";
    if (flag) sessionStorage.removeItem(RETURN_KEY);
    return flag;
  } catch {
    return false;
  }
}

export function projectsLayerFromUrl() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("layer") === "projects";
}

export function syncProjectsUrl(open: boolean) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const has = url.searchParams.get("layer") === "projects";
  if (open && !has) {
    url.searchParams.set("layer", "projects");
    window.history.pushState({ hbw: "projects" }, "", url.pathname + url.search);
  } else if (!open && has) {
    url.searchParams.delete("layer");
    const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "");
    window.history.pushState({ hbw: "home" }, "", next);
  }
}
