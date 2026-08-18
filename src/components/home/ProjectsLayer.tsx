"use client";

import {
  matchesFilter,
  PROJECTS,
  sortProjects,
  type ProjectRecord,
} from "@/components/home/catalog";
import type { FilterDim, ProjectsMode, SortId } from "@/components/home/workspace";
import { openingVisual, preloadProject } from "@/components/home/preload";
import { projectIdeaCopy } from "@/components/home/projects/experiences";
import { isVideoMedia, type ArchiveMedia } from "@/components/home/projects/types";
import { HBW_T, isMobileViewport, reduceMotion } from "@/components/home/motion";
import { useEffect, useMemo, useState } from "react";

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
  const disciplines = project.disciplines ?? [];
  const collaborators = project.collaborators ?? [];
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

  const className = `hbw-browse__item ${visual ? "hbw-browse__cell" : "hbw-browse__row"} is-${layout}${
    selected ? " is-active" : ""
  }${hovered ? " is-hovered" : ""}${expanded ? " is-noted" : ""}`;
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
          {note ? <NoteToggle name={project.name} expanded={expanded} onToggle={() => onToggleNote(project.id)} /> : null}
        </span>
      ) : (
        <span className="hbw-browse__position hbw-browse__row-idea">{project.idea}</span>
      )}
      <span className="hbw-browse__row-disc">
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
      <span className="hbw-browse__row-collab">
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
      <a {...shared} href={external} target="_blank" rel="noopener noreferrer">
        {itemBody}
      </a>
    );
  }

  return (
    <div
      {...shared}
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
