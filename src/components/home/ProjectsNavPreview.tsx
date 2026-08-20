"use client";

import { homePreviewProjects } from "@/components/home/catalog";
import { decodeImage, openingVisual } from "@/components/home/preload";
import { HBW_T, isMobileViewport, reduceMotion } from "@/components/home/motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** Drops Coming Soon from the peek. Intentionally unreached.
 *  Retained for a future Coming Soon record. Verified by the Stage 2 KOJA probe
 *  and the Amendment B build — do not delete. */
const PREVIEW = homePreviewProjects().filter((project) => project.status !== "coming");

export type PeekProject = { name: string; idea: string };

type Props = {
  open: boolean;
  enabled: boolean;
  onEnter: (id: string) => void;
  onKeep: () => void;
  onLeave: () => void;
  onHoverProject?: (project: PeekProject | null) => void;
  onViewAll?: () => void;
};

export function ProjectsNavPreview({
  open,
  enabled,
  onEnter,
  onKeep,
  onLeave,
  onHoverProject,
  onViewAll,
}: Props) {
  const visible = open && enabled;
  const [hoverId, setHoverId] = useState<string | null>(null);
  const peekRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    PREVIEW.forEach((project) => {
      const media = openingVisual(project.id);
      void decodeImage(media.src);
    });
  }, [enabled]);

  useEffect(() => {
    if (!visible) {
      setHoverId(null);
      onHoverProject?.(null);
    }
  }, [visible, onHoverProject]);

  useLayoutEffect(() => {
    const peek = peekRef.current;
    if (!peek) return;

    function alignToBy() {
      const node = peekRef.current;
      const by = document.querySelector<HTMLElement>(".hbw-mark-by");
      const glyph = by?.querySelector<HTMLElement>(".hbw-mark-word--rest");
      if (!node || !by) return;
      node.style.left = `${(glyph ?? by).getBoundingClientRect().left}px`;
      node.style.top = `${by.getBoundingClientRect().bottom + 4}px`;
    }

    alignToBy();
    if (!visible) return;
    const by = document.querySelector(".hbw-mark-by");
    const glyph = by instanceof Element ? by.querySelector(".hbw-mark-word--rest") : null;
    const observer = new ResizeObserver(alignToBy);
    observer.observe(peek);
    if (by instanceof Element) observer.observe(by);
    if (glyph instanceof Element) observer.observe(glyph);
    window.addEventListener("resize", alignToBy);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", alignToBy);
    };
  }, [visible]);

  if (!enabled) return null;

  function activate(event: React.MouseEvent | React.KeyboardEvent, id: string) {
    event.preventDefault();
    event.stopPropagation();
    onEnter(id);
  }

  function nameOf(project: (typeof PREVIEW)[number]): PeekProject {
    return { name: project.name, idea: project.idea };
  }

  function onPeekKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !event.shiftKey) return;
    const root = peekRef.current;
    if (!root) return;
    const stops = [...root.querySelectorAll<HTMLElement>("a[data-hbw-peek], .hbw-mark-all")];
    if (document.activeElement !== stops[0]) return;
    event.preventDefault();
    document.querySelector<HTMLElement>(".hbw-mark-by")?.focus();
  }

  return (
    <div
      ref={peekRef}
      id="hbw-nav-peek"
      className={`hbw-nav-peek${visible ? " is-open" : ""}`}
      aria-hidden={!visible ? true : undefined}
      inert={!visible || undefined}
      onPointerEnter={onKeep}
      onPointerLeave={() => {
        setHoverId(null);
        onLeave();
      }}
      onFocus={onKeep}
      onKeyDown={onPeekKeyDown}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        if (next instanceof Element && next.closest(".hbw-mark-by")) return;
        setHoverId(null);
        onLeave();
      }}
    >
      <div className="hbw-nav-peek__row">
        {PREVIEW.map((project) => {
          const media = openingVisual(project.id);
          return (
            <a
              key={project.id}
              href={project.href}
              tabIndex={visible ? 0 : -1}
              data-hbw-peek={project.id}
              data-hbw-peek-active={hoverId === project.id ? "true" : undefined}
              aria-label={`${project.name} — ${project.idea}`}
              style={{ ["--hbw-crop" as string]: media.crop }}
              onPointerEnter={() => {
                setHoverId(project.id);
                onHoverProject?.(nameOf(project));
              }}
              onPointerLeave={(event) => {
                const next = event.relatedTarget;
                if (next instanceof Element && next.closest("[data-hbw-peek]")) return;
                setHoverId(null);
              }}
              onFocus={() => {
                setHoverId(project.id);
                onHoverProject?.(nameOf(project));
              }}
              onBlur={(event) => {
                const next = event.relatedTarget;
                if (next instanceof Element && next.closest("#hbw-nav-peek")) return;
                setHoverId(null);
              }}
              onClick={(event) => activate(event, project.id)}
            >
              <span className="hbw-nav-peek__frame">
                <img
                  src={media.src}
                  srcSet={media.srcSet}
                  sizes="52px"
                  alt=""
                  width={media.width}
                  height={media.height}
                  decoding="async"
                />
              </span>
            </a>
          );
        })}
        <p className="hbw-nav-peek__meta">
          <button
            type="button"
            className="hbw-mark-all"
            tabIndex={visible ? 0 : -1}
            onFocus={() => {
              setHoverId(null);
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              document.documentElement.classList.remove("hbw-nav-teach");
              onViewAll?.();
            }}
          >
            View more
          </button>
        </p>
      </div>
    </div>
  );
}

export function useNavPeek(enabled: boolean, wrapClose?: (close: () => void) => void) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number>(0);

  function cancelClose() {
    window.clearTimeout(closeTimer.current);
  }

  function show() {
    if (!enabled || isMobileViewport()) return;
    cancelClose();
    setOpen(true);
  }

  function hideSoon() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      const close = () => setOpen(false);
      if (wrapClose) wrapClose(close);
      else close();
    }, reduceMotion() ? 0 : HBW_T.micro);
  }

  function hideNow() {
    cancelClose();
    setOpen(false);
  }

  useEffect(() => {
    if (!enabled) hideNow();
  }, [enabled]);

  useEffect(() => () => cancelClose(), []);

  return { open, show, hideSoon, hideNow };
}
