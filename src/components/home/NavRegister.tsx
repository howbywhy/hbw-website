"use client";

import { useEffect, useRef, useState } from "react";
import { isVideoMedia, infoHintForIndex, type ProjectExperience, type ProjectMedia } from "@/components/home/projects/types";
import type { ProjectsMode } from "@/components/home/workspace";
import { useWorkspace } from "@/components/home/WorkspaceContext";

type Props = {
  face: "home" | "browse" | "view";
  browseMode: ProjectsMode;
  onBrowseMode: (mode: ProjectsMode) => void;
  filterValue?: string;
  onClearLens?: () => void;
  viewIndex: number;
  experience: ProjectExperience | null;
  boundaryName?: string | null;
};

function thumbSrc(media: ProjectMedia) {
  if (isVideoMedia(media)) return media.poster || media.src;
  return media.src;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function NavRegister({
  face,
  browseMode,
  onBrowseMode,
  filterValue = "",
  onClearLens,
  viewIndex,
  experience,
  boundaryName = null,
}: Props) {
  const { openPanel, closePanel, panel } = useWorkspace();
  const idle = face === "home";
  const total = experience?.movements.length || 1;
  const displayIndex = Math.min(viewIndex + 1, total);
  const [sequenceOpen, setSequenceOpen] = useState(false);
  const sequenceRef = useRef<HTMLSpanElement>(null);

  function onInfo() {
    if (panel === "info") {
      closePanel();
      return;
    }
    const movementIndex = experience ? Math.min(viewIndex, Math.max(0, total - 1)) : 0;
    const hint = experience ? infoHintForIndex(experience, movementIndex) : "idea";
    window.dispatchEvent(new CustomEvent("hbw:info-anchor", { detail: hint }));
    openPanel("info");
  }

  function seek(index: number) {
    window.dispatchEvent(new CustomEvent("hbw:seek-index", { detail: index }));
  }

  useEffect(() => {
    if (face !== "view" || boundaryName) setSequenceOpen(false);
  }, [boundaryName, face]);

  useEffect(() => {
    if (!sequenceOpen) return;
    const current = sequenceRef.current?.querySelector<HTMLElement>(".hbw-contact__frame.is-current");
    current?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [sequenceOpen, viewIndex]);

  useEffect(() => {
    if (!sequenceOpen) return;
    function onPointer(event: PointerEvent) {
      const node = sequenceRef.current;
      if (node && event.target instanceof Node && node.contains(event.target)) return;
      setSequenceOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setSequenceOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [sequenceOpen]);

  const sheetOwnsRegister = panel === "studio";
  const movements = experience?.movements ?? [];

  return (
    <div
      className="hbw-nav-sub"
      data-face={face}
      aria-hidden={idle || sheetOwnsRegister ? true : undefined}
      inert={idle || sheetOwnsRegister || undefined}
    >
      <div className="hbw-nav-sub__browse" inert={face !== "browse" || undefined}>
        <div className="hbw-nav-sub__row" role="tablist" aria-label="View">
          <button
            type="button"
            aria-label="Visual"
            className={browseMode === "visual" ? "is-current" : undefined}
            aria-pressed={browseMode === "visual"}
            onClick={() => onBrowseMode("visual")}
          >
            Visual
          </button>
          <button
            type="button"
            aria-label="Index"
            className={browseMode === "index" ? "is-current" : undefined}
            aria-pressed={browseMode === "index"}
            onClick={() => onBrowseMode("index")}
          >
            Index
          </button>
        </div>
        {filterValue ? (
          <button type="button" className="hbw-nav-rel" aria-label={`Clear ${filterValue}`} onClick={onClearLens}>
            {filterValue} ×
          </button>
        ) : null}
      </div>
      <div className={`hbw-nav-sub__view${boundaryName ? " is-next" : ""}`} inert={face !== "view" || undefined}>
        <span className="hbw-nav-sub__face hbw-nav-sub__face--info">
          <button
            type="button"
            className={panel === "info" ? "is-sheet-close" : undefined}
            aria-pressed={panel === "info"}
            aria-label={panel === "info" ? "Close" : "Info"}
            tabIndex={boundaryName ? -1 : 0}
            onClick={onInfo}
          >
            {panel === "info" ? "Close" : "Info"}
          </button>
          <span ref={sequenceRef} className={`hbw-nav-sub__sequence${sequenceOpen ? " is-open" : ""}`}>
            <button
              type="button"
              className="hbw-nav-sub__meta"
              aria-expanded={sequenceOpen}
              aria-controls="hbw-contact"
              aria-label={`${pad(displayIndex)} of ${pad(total)}. Sequence`}
              tabIndex={boundaryName ? -1 : 0}
              onClick={() => {
                if (movements.length < 2) return;
                setSequenceOpen((open) => !open);
              }}
            >
              {pad(displayIndex)} / {pad(total)}
            </button>
            {sequenceOpen && movements.length > 1 ? (
              <div id="hbw-contact" className="hbw-contact" role="listbox" aria-label="Sequence">
                {movements.map((movement, i) => {
                  const src = thumbSrc(movement.media);
                  return (
                    <button
                      key={movement.id}
                      type="button"
                      role="option"
                      className={`hbw-contact__frame${i === Math.min(viewIndex, total - 1) ? " is-current" : ""}`}
                      aria-selected={i === Math.min(viewIndex, total - 1)}
                      aria-label={`${pad(i + 1)} / ${pad(total)}`}
                      onClick={() => seek(i)}
                    >
                      <img
                        src={src}
                        srcSet={movement.media.srcSet}
                        sizes="28px"
                        alt=""
                        width={movement.media.width}
                        height={movement.media.height}
                        decoding="async"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </span>
        </span>
        <span className="hbw-nav-sub__face hbw-nav-sub__face--next" aria-hidden={boundaryName ? undefined : true}>
          <span className="hbw-nav-sub__lead">Next</span>
          <button
            type="button"
            className="hbw-nav-sub__meta hbw-nav-sub__next-name"
            tabIndex={boundaryName ? 0 : -1}
            aria-label={boundaryName ? `Next ${boundaryName}` : undefined}
            onClick={() => {
              if (!boundaryName) return;
              window.dispatchEvent(new Event("hbw:boundary-next"));
            }}
          >
            {boundaryName || ""}
          </button>
        </span>
      </div>
    </div>
  );
}
