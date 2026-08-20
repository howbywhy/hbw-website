"use client";

import { infoHintForIndex, type ProjectExperience } from "@/components/home/projects/types";
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
  showBack?: boolean;
};

export function NavRegister({
  face,
  browseMode,
  onBrowseMode,
  filterValue = "",
  onClearLens,
  viewIndex,
  experience,
  boundaryName = null,
  showBack = false,
}: Props) {
  const { openPanel, closePanel, panel } = useWorkspace();
  const idle = face === "home";
  const total = experience?.movements.length || 1;
  const displayIndex = Math.min(viewIndex + 1, total);

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

  const sheetOwnsRegister = panel === "studio";

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
          {filterValue ? (
            <button type="button" className="hbw-nav-rel" aria-label={`Clear ${filterValue}`} onClick={onClearLens}>
              {filterValue} ×
            </button>
          ) : null}
        </div>
      </div>
      <div className={`hbw-nav-sub__view${boundaryName ? " is-next" : ""}`} inert={face !== "view" || undefined}>
        {showBack ? (
          <span className="hbw-nav-sub__back-slot" aria-hidden="true">
            Back
          </span>
        ) : null}
        <span className="hbw-nav-sub__faces">
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
            {panel !== "info" ? (
              <span className="hbw-nav-sub__meta">
                {String(displayIndex).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            ) : null}
          </span>
          <button
            type="button"
            className="hbw-nav-sub__face hbw-nav-sub__face--next"
            tabIndex={boundaryName ? 0 : -1}
            aria-hidden={boundaryName ? undefined : true}
            aria-label={boundaryName ? `Next ${boundaryName}` : undefined}
            onClick={() => {
              if (!boundaryName) return;
              window.dispatchEvent(new Event("hbw:boundary-next"));
            }}
          >
            <span className="hbw-nav-sub__lead">Next</span>
            <span className="hbw-nav-sub__meta">{boundaryName || ""}</span>
          </button>
        </span>
      </div>
    </div>
  );
}
