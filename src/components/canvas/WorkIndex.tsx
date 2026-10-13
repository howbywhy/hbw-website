"use client";

/**
 * The work, plainly.
 *
 * The paper is a way in, not the only one. Someone who wants the list wants
 * the list: six lines, a year, an idea, and a link. No reveal, no motion, no
 * cards — this is the part of the site that should be boring and fast.
 */
import { useEffect, useRef } from "react";
import type { ProjectRecord } from "@/components/home/catalog";

export function WorkIndex({
  projects,
  onClose,
}: {
  projects: ProjectRecord[];
  onClose: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    opener.current = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => opener.current?.focus?.();
  }, []);

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);

  return (
    <div className="hbw-sheet" role="dialog" aria-modal="true" aria-label="Work">
      <button type="button" className="hbw-sheet__scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <section ref={panel} className="hbw-sheet__panel" tabIndex={-1}>
        <button type="button" className="hbw-sheet__shut" onClick={onClose}>
          Close
        </button>
        <h2 className="hbw-sheet__title">Work</h2>
        <ul className="hbw-list">
          {projects.map((project) => (
            <li key={project.id}>
              <a href={`/projects/${project.id}`}>
                <span className="hbw-list__name">{project.name}</span>
                <span className="hbw-list__idea">{project.idea}</span>
                <span className="hbw-list__year">{project.year}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
