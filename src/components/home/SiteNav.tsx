"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { WorkInView } from "@/components/home/WorkScroll";
import { FluidPill, PillThumb } from "@/components/home/pill-motion";

export const CONTACT_EMAIL = "mark@hbw.works";
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}`;
const MARK = "How by Why";
const TAGLINE = "Clarity for brands at a turning point.";

type Props = {
  face: "home" | "browse" | "view";
  projectName?: string | null;
  projectIdea?: string | null;
  workOpen: boolean;
  studioOpen: boolean;
  studioMuted?: boolean;
  journeyClose: boolean;
  onHome: () => void;
  onWork: () => void;
  onStudio: () => void;
  onClose: () => void;
  /** Project register (Info, sequence). Only shown inside a project. */
  register: ReactNode;
  /** On home, the plate in view re-authors the line under the mark. */
  workInView?: WorkInView;
};

/**
 * Work · Studio · Contact on the left, How by Why at the centre, the line on the right.
 * The line is re-authored by whatever is being viewed: the practice at rest,
 * each project's idea as it passes, the open project's idea inside it.
 */
export function SiteNav({
  face,
  projectName = null,
  projectIdea = null,
  workOpen,
  studioOpen,
  studioMuted = false,
  journeyClose,
  onHome,
  onWork,
  onStudio,
  onClose,
  register,
  workInView = null,
}: Props) {
  const inProject = face === "view" && Boolean(projectName);
  const line = inProject && projectIdea ? projectIdea : face === "home" && workInView ? workInView.idea : TAGLINE;
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  // The Contact pill eases between "Contact" and the copied address, like the line pill,
  // so the nav never jumps when its words change.
  const contactRef = useRef<HTMLButtonElement>(null);
  const contactWidth = useRef(0);
  useLayoutEffect(() => {
    const el = contactRef.current;
    if (!el) return;
    const from = contactWidth.current;
    el.style.transition = "none";
    el.style.width = "";
    const to = el.offsetWidth;
    contactWidth.current = to;
    if (!from || from === to || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.style.width = `${from}px`;
    void el.offsetWidth;
    el.style.transition = "width var(--hbw-t-move) var(--hbw-arrive), color var(--hbw-answer)";
    el.style.width = `${to}px`;
    const done = () => {
      el.style.transition = "";
      el.style.width = "";
    };
    el.addEventListener("transitionend", done, { once: true });
    return () => el.removeEventListener("transitionend", done);
  }, [copied]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = CONTACT_HREF;
    }
  }

  return (
    <div className="hbw-pills-wrap">
      {inProject ? null : <h1 className="hbw-site-nav__h1">{MARK} — {TAGLINE}</h1>}
      <div className="hbw-pills">
        {inProject ? (
          <>
            <span key="project" className="hbw-pill-group">
              <PillThumb />
              <button
                type="button"
                className="hbw-pill-group__item hbw-site-nav__close is-current"
                aria-label={`Close ${projectName}`}
                aria-disabled={!journeyClose || undefined}
                tabIndex={journeyClose ? 0 : -1}
                onClick={() => {
                  if (journeyClose) onClose();
                }}
              >
                <span aria-hidden="true">←</span> {projectName}
              </button>
            </span>
            <span key="register" className="hbw-pill-group hbw-site-nav__register" data-face={face}>
              {register}
            </span>
          </>
        ) : (
          <nav key="site" className="hbw-pill-group" aria-label="Site">
            <PillThumb />
            <button type="button" className="hbw-pill-group__item" aria-pressed={workOpen} onClick={onWork}>
              Work
            </button>
            <button
              type="button"
              className="hbw-pill-group__item hbw-site-nav__studio"
              aria-pressed={studioOpen}
              aria-disabled={studioMuted || undefined}
              onClick={() => {
                if (!studioMuted) onStudio();
              }}
            >
              Studio
            </button>
            <button
              type="button"
              ref={contactRef}
              className="hbw-pill-group__item hbw-site-nav__contact"
              aria-label={copied ? `${CONTACT_EMAIL} copied` : `Copy ${CONTACT_EMAIL}`}
              title={CONTACT_EMAIL}
              onClick={copyEmail}
            >
              <span key={copied ? "copied" : "contact"} className="hbw-fluid__text">
                {copied ? `Copied ${CONTACT_EMAIL}` : "Contact"}
              </span>
            </button>
          </nav>
        )}
      </div>
      <button type="button" className="hbw-pill hbw-pill--mark" aria-label={`${MARK} — Poster`} onClick={onHome}>
        <span className="hbw-site-nav__mark-full">{MARK}</span>
        <span className="hbw-site-nav__mark-short" aria-hidden="true">
          HBW
        </span>
      </button>
      <p className="hbw-site-nav__line-wrap" aria-live="polite">
        <FluidPill className="hbw-site-nav__line" text={line} />
      </p>
    </div>
  );
}
