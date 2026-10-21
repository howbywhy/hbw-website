"use client";

/**
 * Two other front pages, for looking at.
 *
 * The one the site has prints the catalogue three times so it can wrap
 * without a seam, which is where its weight and its sameness both come
 * from: 186 cells on every page, and a project page whose readable text is
 * mostly the front page's. These are the two arrangements that answer that
 * by not doing it — one picture per project rather than twenty-seven.
 *
 * Both take the same callbacks as the catalogue, so a press opens the
 * project's gallery exactly as it does now. Nothing here is a mock.
 */
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { GalleryProject } from "@/sanity/load-gallery";
import { TITLE_WHAT } from "@/components/home/catalog";

/**
 * What the work was, in the site's own words.
 *
 * The CMS holds disciplines in title case — "Launch Strategy", "Content
 * Planning" — which is right in a credit and shouts in a caption. TITLE_WHAT
 * is the same list written for a line of type, and it is the same one the
 * project titles are built from, so a discipline cannot read one way in a
 * search result and another here.
 */
function didOf(project: GalleryProject) {
  const said = project.disciplines
    .map((one) => TITLE_WHAT[one as keyof typeof TITLE_WHAT])
    .filter(Boolean)
    .slice(0, 3);
  if (!said.length) return "";
  const line = said.join(", ");
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** The frame a project leads with: its first, which is the one chosen to open the sequence. */
function lead(project: GalleryProject) {
  return project.frames[0];
}

/**
 * One picture per project, the width of the page, scrolling down.
 *
 * The catalogue's cells are about a ninth of the screen, which is a size
 * that shows there is work rather than what the work is. At full width a
 * project gets one frame and has to be chosen for rather than counted.
 */
export function LargeWork({
  projects,
  marks,
  onOpen,
  onNear,
}: {
  projects: GalleryProject[];
  marks: Record<string, ReactNode>;
  onOpen: (slug: string, at: number) => void;
  onNear?: (slug: string) => void;
}) {
  return (
    <div className="hbw-big">
      {projects.map((project, i) => {
        const frame = lead(project);
        if (!frame) return null;
        return (
          <article className="hbw-big__one" key={project.slug}>
            <div className="hbw-band">
              <h2 className="hbw-chip" style={{ margin: 0 }}>
                <a
                  href={`/projects/${project.slug}`}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                    event.preventDefault();
                    onOpen(project.slug, 0);
                  }}
                >
                  {project.name} — {project.year}
                </a>
              </h2>
              <p className="hbw-cat__say">{project.says}</p>
            </div>
            <a
              className="hbw-big__shot"
              href={`/projects/${project.slug}`}
              onPointerEnter={onNear ? () => onNear(project.slug) : undefined}
              onFocus={onNear ? () => onNear(project.slug) : undefined}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                onOpen(project.slug, 0);
              }}
            >
              <img
                src={frame.src}
                srcSet={frame.peekset ?? frame.srcset}
                /* One picture across the page: it is asked for at the width
                   it is drawn, which is the whole of it. */
                sizes="100vw"
                alt={frame.alt?.trim() || `${project.name} — ${project.idea}`}
                width={frame.width}
                height={frame.height}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                decoding="async"
              />
            </a>
          </article>
        );
      })}
      <p className="hbw-big__mark" aria-hidden="true">
        {marks[projects[0]?.slug ?? ""] ?? null}
      </p>
    </div>
  );
}

/**
 * The work as an index: the names first, the picture on the one you are on.
 *
 * The front page as it stands is pictures with the names withheld — seven
 * headings that each said a year until this week. This inverts it. The
 * names are the page, set as type and readable by anything that reads, and
 * the picture belongs to whichever line you are on.
 */
export function IndexWork({
  projects,
  onOpen,
  onNear,
}: {
  projects: GalleryProject[];
  onOpen: (slug: string, at: number) => void;
  onNear?: (slug: string) => void;
}) {
  const [here, setHere] = useState(projects[0]?.slug ?? "");
  const [at, setAt] = useState(0);
  const list = useRef<HTMLOListElement>(null);
  const shown = projects.find((project) => project.slug === here) ?? projects[0];
  const frames = shown?.frames ?? [];

  /* A new row starts at that project's first frame, which is the one chosen
     to open its sequence. */
  useEffect(() => {
    setAt(0);
  }, [here]);

  /*
   * The row you are on shows its work, not one still of it.
   *
   * A single frame per project says there is a project; nine of them say
   * what it was. They turn over while you are on the row and stop the
   * moment you leave it, so only ever one project's pictures are being
   * fetched.
   *
   * Not when the reader has asked for less movement: then it is the first
   * frame and nothing moves, which is the same answer the rest of the site
   * gives.
   */
  useEffect(() => {
    if (frames.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const turn = window.setInterval(() => {
      setAt((was) => (was + 1) % frames.length);
    }, 1800);
    return () => window.clearInterval(turn);
  }, [here, frames.length]);

  /*
   * Where there is no pointer, the page walks the work itself.
   *
   * "The picture on the one you are on" is a hover, and a phone has none.
   * The first answer was to take the row nearest the middle of the screen
   * as you scroll — measured, it does not work here and could not: the
   * list is 210px on a phone and sits entirely above the middle, so the
   * nearest row was the last one at every scroll position, including the
   * top, and a page this short barely scrolls at all. Seven rows that are
   * all on screen at once have no "one you are on" for a scroll to find.
   *
   * So where there is nothing to hover with, the page moves instead: each
   * project holds the picture for three of its frames and then hands on to
   * the next, and its row lights as it goes. Every name is readable the
   * whole time and the work shows itself, which is what the hover does for
   * a reader who has a pointer.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: hover)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (projects.length < 2) return;
    const walk = window.setInterval(() => {
      setHere((was) => {
        const i = projects.findIndex((project) => project.slug === was);
        return projects[(i + 1) % projects.length]!.slug;
      });
    }, 1800 * 3);
    return () => window.clearInterval(walk);
  }, [projects]);

  const frame = frames[at] ?? frames[0];
  return (
    <div className="hbw-ind">
      <ol className="hbw-ind__list" ref={list}>
        {projects.map((project, i) => (
          <li
            key={project.slug}
            data-slug={project.slug}
            data-here={project.slug === here ? "true" : undefined}
          >
            <a
              href={`/projects/${project.slug}`}
              onPointerEnter={() => {
                setHere(project.slug);
                onNear?.(project.slug);
              }}
              onFocus={() => {
                setHere(project.slug);
                onNear?.(project.slug);
              }}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                onOpen(project.slug, 0);
              }}
            >
              <span className="hbw-ind__no hbw-m">{String(i + 1).padStart(2, "0")}</span>
              <span className="hbw-ind__name">{project.name}</span>
              <span className="hbw-ind__idea">{project.idea}</span>
              {/* What the work was. The disciplines are the words somebody
                  searching for this kind of practice actually types, and the
                  front page had none of them on it. */}
              <span className="hbw-ind__did hbw-m">{didOf(project)}</span>
              <span className="hbw-ind__year hbw-m">{project.year}</span>
            </a>
          </li>
        ))}
      </ol>
      {/* The pictures of the line you are on. Decorative: the line beside
          them already says what it is, and they turn over on their own. */}
      <div className="hbw-ind__shot" aria-hidden="true">
        {frame ? (
          <img
            key={`${shown?.slug}-${at}`}
            src={frame.src}
            srcSet={frame.peekset ?? frame.srcset}
            sizes="(max-width: 760px) 100vw, 46vw"
            alt=""
            decoding="async"
          />
        ) : null}
      </div>
    </div>
  );
}
