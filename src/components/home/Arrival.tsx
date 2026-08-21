"use client";

import { useLayoutEffect } from "react";
import { HBW_INTRO_MS, HBW_T, isMobileViewport, reduceMotion } from "@/components/home/motion";

type Props = {
  onMake: () => void;
  onBrowse: () => void;
};

const MARK_NAMES = ["hbw-mark-how", "hbw-mark-by", "hbw-mark-why"] as const;
const INTRO_SELECTORS = [".hbw-intro-how", ".hbw-intro-by", ".hbw-intro-why"] as const;
const MARK_SELECTORS = [
  ".hbw-mark-how .hbw-mark-word--rest",
  ".hbw-mark-by .hbw-mark-word--rest",
  ".hbw-mark-why .hbw-mark-word--rest",
] as const;

function setTransitionName(el: HTMLElement | null, name: string) {
  if (!el) return;
  el.style.viewTransitionName = name;
}

export function Arrival({ onMake, onBrowse }: Props) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("hbw-intro")) return;
    if (reduceMotion()) return;

    root.classList.add("hbw-intro-live");

    const introEls = INTRO_SELECTORS.map((sel) => document.querySelector<HTMLElement>(sel));
    const markEls = MARK_SELECTORS.map((sel) => document.querySelector<HTMLElement>(sel));

    function nameIntro() {
      introEls.forEach((el, i) => setTransitionName(el, MARK_NAMES[i]));
      markEls.forEach((el) => setTransitionName(el, "none"));
    }

    function nameMark() {
      introEls.forEach((el) => setTransitionName(el, "none"));
      markEls.forEach((el, i) => setTransitionName(el, MARK_NAMES[i]));
    }

    const mobile = isMobileViewport();
    if (!mobile) nameIntro();

    const yieldAt = HBW_T.spatial + HBW_T.continuity + HBW_T.ui + HBW_T.ui;
    const resolveAt = yieldAt + HBW_T.ui;

    const yieldId = window.setTimeout(() => {
      if (!root.classList.contains("hbw-intro")) return;
      root.classList.add("hbw-intro-yield");
    }, yieldAt);

    let teachOnId = 0;
    let teachOffId = 0;
    const resolveId = window.setTimeout(() => {
      if (!root.classList.contains("hbw-intro")) return;
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { finished?: Promise<unknown> };
      };
      const update = () => {
        root.classList.add("hbw-intro-resolve");
        if (!mobile) nameMark();
      };
      if (!mobile && typeof doc.startViewTransition === "function") {
        doc.startViewTransition(update);
      } else {
        update();
      }
      if (!mobile) return;
      teachOnId = window.setTimeout(() => {
        if (reduceMotion() || !isMobileViewport()) return;
        if (!document.documentElement.classList.contains("hbw-entered")) return;
        if (document.querySelector(".hbw-home-strip__mark.is-assembled")) return;
        document.documentElement.classList.add("hbw-nav-teach");
        teachOffId = window.setTimeout(() => {
          document.documentElement.classList.remove("hbw-nav-teach");
        }, HBW_T.spatial);
      }, HBW_INTRO_MS - resolveAt + HBW_T.ui);
    }, resolveAt);

    return () => {
      window.clearTimeout(yieldId);
      window.clearTimeout(resolveId);
      window.clearTimeout(teachOnId);
      window.clearTimeout(teachOffId);
    };
  }, []);

  return (
    <>
      <p className="hbw-intro-thought">
        <span className="hbw-intro-line hbw-intro-line--name">
          <span className="hbw-intro-how">How</span>
          <span className="hbw-intro-by">by</span>
          <span className="hbw-intro-why">Why</span>
        </span>
        <span className="hbw-intro-line hbw-intro-line--role hbw-intro-support">
          Brand Strategy &amp; Creative Direction
        </span>
        <span className="hbw-intro-line hbw-intro-line--practice hbw-intro-support">
          Independent Practice
        </span>
      </p>
      <div className="hbw-arrive">
        <p className="hbw-arrive__line hbw-arrive__line--clarity">Clarity for brands at a turning point.</p>
        <p className="hbw-arrive__line hbw-arrive__line--prompt">Start with the problem.</p>
        <nav className="hbw-arrive__paths" aria-label="Start">
          <button type="button" className="hbw-arrive__path" onClick={onMake}>
            Make something
          </button>
          <button type="button" className="hbw-arrive__path" onClick={onBrowse}>
            See the work
          </button>
        </nav>
      </div>
    </>
  );
}
