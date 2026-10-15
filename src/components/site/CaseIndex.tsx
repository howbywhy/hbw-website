"use client";

/**
 * The index down the side of a project's in-depth page.
 *
 * The same object the studio sheet has: a short list of what is here, holding
 * its place in the margin while the writing moves past it, marking the part
 * being read. It is the only piece of this page that needs the browser — the
 * writing itself is rendered on the server and readable without it.
 *
 * The ways through are plain anchors, so a reader with no JavaScript, or one
 * who opens a link in a new tab, gets the behaviour they asked for. Nothing
 * is scrolled by script, which is also why there is nothing here for
 * prefers-reduced-motion to turn off: the jump is the browser's own.
 */
import { useEffect, useState } from "react";

export type CasePart = { id: string; name: string };

export function CaseIndex({
  parts,
  work,
}: {
  parts: CasePart[];
  /** The way into this project's gallery, kept beside the ways through the writing. */
  work: { href: string; label: string };
}) {
  /** Where the index stands before anything has been scrolled past. */
  const first = parts[0]?.id ?? "";
  /** Which part is being read, for the index to mark. */
  const [here, setHere] = useState<string>(first);

  /**
   * The part being read is the last one that has reached its resting place.
   *
   * The line is read off the part's own scroll-margin-top rather than off the
   * bar, which is the fault this had first: the bar's underside is fifty-two
   * pixels down and a part anchored from the index comes to rest at a hundred
   * and four, so pressing Shift scrolled to Shift and the index went on
   * marking Idea. One number decides both — the stylesheet's — so the mark
   * and the jump cannot disagree.
   *
   * Two pixels of tolerance, because the rest is a fractional number of CSS
   * pixels and the browser's own scroll lands a fraction short of it.
   */
  useEffect(() => {
    if (!parts.length) return;
    let waiting = 0;
    const read = () => {
      waiting = 0;
      const list = [...document.querySelectorAll<HTMLElement>("[data-case-part]")];
      let now: string | null = null;
      for (const part of list) {
        const rest = parseFloat(getComputedStyle(part).scrollMarginTop) || 0;
        if (part.getBoundingClientRect().top <= rest + 2) now = part.dataset.casePart ?? null;
      }
      /*
       * The last part cannot always reach the line.
       *
       * On a short project there is less page under the final section than
       * the distance it would have to travel, so the scroll runs out with
       * The system half way down the screen and the index still marking The
       * shift — the reader is plainly in the last part and the margin says
       * otherwise. At the bottom of the page, the last part is the one being
       * read; that is what the bottom of the page means.
       */
      const atEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atEnd) now = list[list.length - 1]?.dataset.casePart ?? now;
      /*
       * Above the first part, the first part is the one you are about to
       * read. Left as null the mark simply stayed where it was, so scrolling
       * back to the top from the end of the page left the index saying
       * System over the project's name.
       */
      const mark = now ?? first;
      if (mark) setHere((was) => (was === mark ? was : mark));
    };
    const watch = () => {
      if (!waiting) waiting = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", watch, { passive: true });
    window.addEventListener("resize", watch);
    return () => {
      window.removeEventListener("scroll", watch);
      window.removeEventListener("resize", watch);
      if (waiting) cancelAnimationFrame(waiting);
    };
  }, [parts.length, first]);

  return (
    <nav className="hbw-case__index" aria-label="This project">
      {parts.map((part) => (
        <a key={part.id} href={`#${part.id}`} aria-current={here === part.id ? "true" : undefined}>
          {part.name}
        </a>
      ))}
      {/* The pictures are the other half of the project, and the index is the
          one thing on the page that is always on screen to hold the way in. */}
      <a className="hbw-case__index-work" href={work.href}>
        {work.label}
      </a>
    </nav>
  );
}
