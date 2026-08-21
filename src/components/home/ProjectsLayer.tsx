"use client";

import {
  matchesFilter,
  PROJECTS,
  sortProjects,
  usedCollaborators,
  usedDisciplines,
  usedSectors,
  type ProjectRecord,
} from "@/components/home/catalog";
import type { FilterDim, ProjectsMode, SortId } from "@/components/home/workspace";
import { openingVisual, preloadProject } from "@/components/home/preload";
import { projectIdeaCopy } from "@/components/home/projects/experiences";
import { isVideoMedia, type ArchiveMedia } from "@/components/home/projects/types";
import { HBW_T, isMobileViewport, reduceMotion } from "@/components/home/motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const DISCIPLINE_LENSES = usedDisciplines();
const SECTOR_LENSES = usedSectors();
const COLLABORATOR_LENSES = usedCollaborators();

type Props = {
  open: boolean;
  dropping?: boolean;
  entering?: boolean;
  owning?: boolean;
  mode: ProjectsMode;
  selectedId: string;
  hoveredId: string | null;
  expandedId: string | null;
  filterDim: FilterDim;
  filterValue: string;
  sort: SortId;
  onHover: (id: string | null) => void;
  onExpand: (id: string | null) => void;
  onSelect: (id: string) => void;
  onEnterProject: (id: string) => void;
  onLens: (dim: FilterDim, value: string) => void;
};

function enterClick(event: React.MouseEvent, id: string, href: string, onEnter: (id: string) => void) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    if (event.metaKey || event.ctrlKey) window.open(href, "_blank", "noopener");
    return;
  }
  if (event.button !== 0) return;
  event.preventDefault();
  onEnter(id);
}

function hoverFromTarget(target: EventTarget | null, onHover: (id: string) => void) {
  const node = target instanceof Element ? target.closest("[data-hbw-project]") : null;
  const id = node instanceof HTMLElement ? node.dataset.hbwProject : undefined;
  if (id) onHover(id);
}

export function ProjectsLayer({
  open,
  dropping = false,
  entering = false,
  owning = false,
  mode,
  selectedId,
  hoveredId,
  expandedId,
  filterDim,
  filterValue,
  sort,
  onHover,
  onExpand,
  onSelect,
  onEnterProject,
  onLens,
}: Props) {
  const filtered = useMemo(() => {
    const next = PROJECTS.filter((project) => matchesFilter(project, filterDim, filterValue));
    return sortProjects(next, sort);
  }, [filterDim, filterValue, sort]);

  function activate(id: string) {
    onSelect(id);
    onEnterProject(id);
  }

  function onRowHover(id: string) {
    if (isMobileViewport()) return;
    onHover(id);
    preloadProject(id);
  }

  const livePeek = mode === "index" && hoveredId && !entering && !owning ? hoveredId : null;
  const [peekId, setPeekId] = useState<string | null>(null);
  const [peekOn, setPeekOn] = useState(false);

  useEffect(() => {
    if (!livePeek) {
      setPeekOn(false);
      return;
    }
    setPeekId(livePeek);
    setPeekOn(true);
  }, [livePeek]);

  useEffect(() => {
    if (peekOn || !peekId) return;
    const id = window.setTimeout(() => setPeekId(null), HBW_T.ui);
    return () => window.clearTimeout(id);
  }, [peekOn, peekId]);

  const hoverPeek = peekId ? openingVisual(peekId) : null;
  const archiveRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const archive = archiveRef.current;
    if (!archive || mode !== "index" || !open) return;

    function alignDiscToBy() {
      const node = archiveRef.current;
      if (!node) return;
      const glyph = document.querySelector<HTMLElement>(".hbw-mark-by .hbw-mark-word--rest");
      if (!glyph) return;
      const mark = document.querySelector(".hbw-home-strip__mark");
      const gathered = Boolean(
        mark?.classList.contains("is-assembled") || mark?.classList.contains("is-resolved")
      );
      const glyphBox = glyph.getBoundingClientRect();
      const byLeft = gathered ? window.innerWidth / 2 - glyphBox.width / 2 : glyphBox.left;
      const axis = byLeft - node.getBoundingClientRect().left;
      node.style.setProperty("--hbw-index-axis", `${Math.max(0, axis)}px`);
    }

    alignDiscToBy();
    void document.fonts?.ready.then(alignDiscToBy);
    const observer = new ResizeObserver(alignDiscToBy);
    observer.observe(archive);
    const by = document.querySelector(".hbw-mark-by");
    if (by instanceof Element) observer.observe(by);
    window.addEventListener("resize", alignDiscToBy);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", alignDiscToBy);
      archive.style.removeProperty("--hbw-index-axis");
    };
  }, [mode, open]);

  return (
    <div
      id="hbw-projects-layer"
      className={`hbw-projects${open ? " is-open" : ""}${dropping ? " is-dropping" : ""}${
        entering ? " is-entering" : ""
      } is-${mode}`}
      aria-hidden={!open || dropping ? true : undefined}
      inert={!open || dropping || entering}
    >
      <div className="hbw-browse">
        {hoverPeek ? (
          <div className={`hbw-browse__hover-image${peekOn ? " is-on" : ""}`} aria-hidden="true">
            <img
              src={hoverPeek.src}
              srcSet={hoverPeek.srcSet}
              sizes="280px"
              alt=""
              width={hoverPeek.width}
              height={hoverPeek.height}
              decoding="async"
            />
          </div>
        ) : null}
        <div
          ref={archiveRef}
          className={`hbw-browse__archive hbw-browse__grid${mode === "index" ? " hbw-browse__index" : ""}`}
          role="list"
          onPointerOver={(event) => hoverFromTarget(event.target, onRowHover)}
          onPointerLeave={() => {
            if (isMobileViewport()) return;
            onHover(null);
          }}
        >
          {filtered.map((project, index) => (
            <ArchiveItem
              key={project.id}
              project={project}
              mode={mode}
              selected={project.id === selectedId}
              hovered={project.id === hoveredId}
              expanded={expandedId === project.id}
              filterDim={filterDim}
              filterValue={filterValue}
              eager={mode === "visual" && index < 4}
              entering={entering}
              owning={owning}
              onHover={onRowHover}
              onActivate={activate}
              onToggleNote={(id) => {
                onHover(id);
                onExpand(expandedId === id ? null : id);
              }}
              onLens={onLens}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NoteToggle({
  name,
  expanded,
  onToggle,
}: {
  name: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="hbw-browse__more"
      aria-expanded={expanded}
      aria-label={expanded ? `Hide ${name} note` : `Show ${name} note`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      onMouseDown={(event) => event.preventDefault()}
    >
      {expanded ? "−" : "+"}
    </button>
  );
}

function ArchiveThumb({
  media,
  sizes,
  eager,
  named,
  play,
}: {
  media: ArchiveMedia;
  sizes: string;
  eager: boolean;
  named?: string;
  play: boolean;
}) {
  return (
    <>
      <img
        src={media.src}
        srcSet={media.srcSet}
        sizes={sizes}
        alt=""
        width={media.width}
        height={media.height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : undefined}
        style={named ? { viewTransitionName: named } : undefined}
      />
      {play && (media.videoSrc || media.mp4) ? (
        <video
          className="hbw-browse__media-video"
          src={media.mp4 || media.videoSrc}
          poster={media.poster || media.src}
          width={media.width}
          height={media.height}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          disablePictureInPicture
        />
      ) : null}
    </>
  );
}

function RelValue({
  dim,
  value,
  currentDim,
  currentValue,
  onLens,
}: {
  dim: FilterDim;
  value: string;
  currentDim: FilterDim;
  currentValue: string;
  onLens: (dim: FilterDim, value: string) => void;
}) {
  const active = currentDim === dim && currentValue === value;
  return (
    <button
      type="button"
      className={`hbw-browse__rel${active ? " is-active" : ""}`}
      data-hbw-rel={dim}
      data-hbw-rel-value={value}
      aria-pressed={active}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onLens(active ? "all" : dim, active ? "" : value);
      }}
    >
      {value}
    </button>
  );
}

function ArchiveItem({
  project,
  mode,
  selected,
  hovered,
  expanded = false,
  filterDim,
  filterValue,
  eager = false,
  entering = false,
  owning = false,
  onHover,
  onActivate,
  onToggleNote,
  onLens,
}: {
  project: ProjectRecord;
  mode: ProjectsMode;
  selected: boolean;
  hovered: boolean;
  expanded?: boolean;
  filterDim: FilterDim;
  filterValue: string;
  eager?: boolean;
  entering?: boolean;
  owning?: boolean;
  onHover: (id: string) => void;
  onActivate: (id: string) => void;
  onToggleNote: (id: string) => void;
  onLens: (dim: FilterDim, value: string) => void;
}) {
  const visual = mode === "visual";
  // Coming Soon branch: intentionally unreached. Retained for a future Coming Soon
  // record. Verified by the Stage 2 KOJA probe and the Amendment B build — do not delete.
  const coming = project.status === "coming";
  const external = coming ? project.external : undefined;
  const note = coming ? "Coming Soon" : projectIdeaCopy(project.id);
  const media = openingVisual(project.id);
  const layout = project.layout;
  const span = project.visualSpan ?? (layout === "wide" ? 8 : layout === "landscape" ? 6 : layout === "contained" ? 4 : 7);
  const start = project.visualStart;
  const before = project.visualBefore;
  const disciplines = DISCIPLINE_LENSES.filter((item) => project.disciplines?.includes(item));
  const sectors = SECTOR_LENSES.filter((item) => project.sectors?.includes(item));
  const collaborators = COLLABORATOR_LENSES.filter((item) => project.collaborators?.includes(item.id));
  const sizes = visual
    ? span >= 7
      ? "(max-width: 767px) 94vw, 62vw"
      : span >= 5
        ? "(max-width: 767px) 94vw, 48vw"
        : "(max-width: 767px) 46vw, 32vw"
    : "(max-width: 767px) 80px, 40px";
  const named = entering || (owning && !selected) ? undefined : `hbw-media-${project.id}`;
  const playVideo =
    !coming &&
    visual &&
    hovered &&
    isVideoMedia(media) &&
    Boolean(media.videoSrc || media.mp4) &&
    !reduceMotion();
  const rowRef = useRef<HTMLElement | null>(null);
  const [ideaIn, setIdeaIn] = useState(false);

  useEffect(() => {
    if (visual || reduceMotion() || !isMobileViewport()) {
      setIdeaIn(true);
      return;
    }
    const node = rowRef.current;
    if (!node) return;
    setIdeaIn(false);
    const root = node.closest(".hbw-projects");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && (entry.intersectionRatio ?? 0) >= 0.2) {
          setIdeaIn(true);
          io.disconnect();
        }
      },
      { root: root instanceof Element ? root : null, threshold: [0, 0.2, 0.5, 1] }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [project.id, visual]);

  const className = `hbw-browse__item ${visual ? "hbw-browse__cell" : "hbw-browse__row"} is-${layout}${
    selected ? " is-active" : ""
  }${hovered ? " is-hovered" : ""}${expanded ? " is-noted" : ""}${ideaIn ? " is-idea-in" : ""}`;
  const style = {
    ["--hbw-crop" as string]: media.crop,
    ["--hbw-span" as string]: String(span),
    ...(visual && start ? { ["--hbw-start" as string]: String(start) } : {}),
    ...(visual && before ? { marginTop: `var(--hbw-space-${before})` } : {}),
  };
  const itemBody = (
    <>
      <span className="hbw-browse__media hbw-browse__row-thumb" aria-hidden="true">
        <ArchiveThumb media={media} sizes={sizes} eager={eager} named={named} play={playVideo} />
      </span>
      <span className="hbw-browse__title hbw-browse__row-name">{project.name}</span>
      {visual ? (
        <span className="hbw-browse__caption">
          <span className="hbw-browse__position hbw-browse__row-idea">{project.idea}</span>
          {note ? (
            <span inert={!hovered && !expanded ? true : undefined} aria-hidden={!hovered && !expanded ? true : undefined}>
              <NoteToggle name={project.name} expanded={expanded} onToggle={() => onToggleNote(project.id)} />
            </span>
          ) : null}
        </span>
      ) : (
        <span className="hbw-browse__position hbw-browse__row-idea">{project.idea}</span>
      )}
      <span
        className={visual ? "hbw-browse__clip" : "hbw-browse__row-meta"}
        inert={visual || undefined}
        aria-hidden={visual || undefined}
      >
        <span className={`hbw-browse__row-disc${disciplines.length ? "" : " is-empty"}`}>
          {disciplines.map((value, i) => (
            <span key={value}>
              {i > 0 ? <span aria-hidden="true"> · </span> : null}
              <RelValue
                dim="discipline"
                value={value}
                currentDim={filterDim}
                currentValue={filterValue}
                onLens={onLens}
              />
            </span>
          ))}
        </span>
        <span className={`hbw-browse__row-sector${sectors.length ? "" : " is-empty"}`}>
          {sectors.map((value, i) => (
            <span key={value}>
              {i > 0 ? <span aria-hidden="true"> · </span> : null}
              <RelValue
                dim="sector"
                value={value}
                currentDim={filterDim}
                currentValue={filterValue}
                onLens={onLens}
              />
            </span>
          ))}
        </span>
        <span className={`hbw-browse__row-collab${collaborators.length ? "" : " is-empty"}`}>
          {collaborators.map((collab, i) => (
            <span key={collab.name}>
              {i > 0 ? <span aria-hidden="true"> · </span> : null}
              <RelValue
                dim="collaborator"
                value={collab.name}
                currentDim={filterDim}
                currentValue={filterValue}
                onLens={onLens}
              />
            </span>
          ))}
        </span>
        <span className="hbw-browse__row-year">
          <RelValue
            dim="year"
            value={project.year}
            currentDim={filterDim}
            currentValue={filterValue}
            onLens={onLens}
          />
        </span>
        {!visual && note ? <NoteToggle name={project.name} expanded={expanded} onToggle={() => onToggleNote(project.id)} /> : null}
      </span>
      {note ? (
        <div
          className="hbw-browse__note"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <p>{note}</p>
        </div>
      ) : null}
    </>
  );

  const shared = {
    role: "listitem" as const,
    tabIndex: 0 as const,
    "data-hbw-project": project.id,
    "data-layout": layout,
    "data-span": span,
    className,
    "aria-label": project.name,
    "aria-current": selected ? ("true" as const) : undefined,
    style,
    onFocus: () => onHover(project.id),
    onPointerEnter: () => onHover(project.id),
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) onHover("");
    },
  };

  if (external) {
    return (
      <a
        {...shared}
        ref={(node) => {
          rowRef.current = node;
        }}
        href={external}
        target="_blank"
        rel="noopener noreferrer"
      >
        {itemBody}
      </a>
    );
  }

  return (
    <div
      {...shared}
      ref={(node) => {
        rowRef.current = node;
      }}
      onClick={(event) => enterClick(event, project.id, project.href, onActivate)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onActivate(project.id);
      }}
    >
      {itemBody}
    </div>
  );
}
