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
};

export function NavRegister({
  face,
  browseMode,
  onBrowseMode,
  filterValue = "",
  onClearLens,
  viewIndex,
  experience,
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
    const hint = experience ? infoHintForIndex(experience, Math.min(viewIndex, total - 1)) : "idea";
    window.dispatchEvent(new CustomEvent("hbw:info-anchor", { detail: hint }));
    openPanel("info");
  }

  return (
    <div className="hbw-nav-sub" data-face={face} aria-hidden={idle ? true : undefined} inert={idle || undefined}>
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
      <div className="hbw-nav-sub__view" inert={face !== "view" || undefined}>
        <button type="button" aria-pressed={panel === "info"} onClick={onInfo}>
          {panel === "info" ? "Close" : "Info"}
        </button>
        {panel !== "info" ? (
          <span className="hbw-nav-sub__meta">
            {String(displayIndex).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
