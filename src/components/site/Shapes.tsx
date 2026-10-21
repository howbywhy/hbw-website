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
import { useCallback, useEffect, useRef, useState } from "react";
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
/**
 * The work as an index that does not scroll.
 *
 * One project is open: its line at the top, its frames across the middle,
 * and every other project's line stacked at the foot of the screen waiting
 * its turn. A scroll does not move the page — there is nowhere for it to go
 * — it opens the next project, whose line rises to the top as the pictures
 * change under it.
 *
 * A line says the number, the name, what the work was and the year. The
 * proposition has gone from it: with one project open at a time the frames
 * are saying that, and a line that says everything is a paragraph.
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
  const [at, setAt] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const open = projects[at];
  const frames = open?.frames ?? [];

  /*
   * One project per gesture, however hard the gesture was.
   *
   * A trackpad sends a flick as thirty or forty wheel events, so stepping
   * on each one would run the whole index past in a quarter of a second.
   * The step is taken on the first of them and the rest are the same flick
   * until it has had time to land.
   */
  const since = useRef(0);
  const step = useCallback(
    (way: number) => {
      const now = Date.now();
      if (now < since.current) return;
      since.current = now + 420;
      setAt((was) => (was + way + projects.length) % projects.length);
    },
    [projects.length]
  );

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    /* Not passive: the page has nowhere to scroll and the browser should
       not spend a frame finding that out. */
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 2) return;
      event.preventDefault();
      step(event.deltaY > 0 ? 1 : -1);
    };
    let from = 0;
    const down = (event: TouchEvent) => {
      from = event.touches[0]?.clientY ?? 0;
    };
    const move = (event: TouchEvent) => {
      const now = event.touches[0]?.clientY ?? 0;
      if (Math.abs(now - from) < 36) return;
      event.preventDefault();
      step(now < from ? 1 : -1);
      from = now;
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") step(1);
      else if (event.key === "ArrowUp" || event.key === "PageUp") step(-1);
      else return;
      event.preventDefault();
    };
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("touchstart", down, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("touchstart", down);
      el.removeEventListener("touchmove", move);
      window.removeEventListener("keydown", key);
    };
  }, [step]);

  /* The one that is open is fetched ahead, so pressing it has nothing left
     to wait for. */
  useEffect(() => {
    if (open) onNear?.(open.slug);
  }, [open, onNear]);

  const line = (project: GalleryProject, i: number, isOpen: boolean) => (
    <a
      href={`/projects/${project.slug}`}
      onPointerEnter={isOpen ? undefined : () => setAt(i)}
      onFocus={isOpen ? undefined : () => setAt(i)}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        /* A line that is not open opens; the open one opens the project. */
        if (!isOpen) {
          setAt(i);
          return;
        }
        onOpen(project.slug, 0);
      }}
    >
      <span className="hbw-ind__no hbw-m">{String(i + 1).padStart(2, "0")}</span>
      <span className="hbw-ind__name">{project.name}</span>
      <span className="hbw-ind__did hbw-m">{didOf(project)}</span>
      <span className="hbw-ind__year hbw-m">{project.year}</span>
    </a>
  );

  return (
    <div className="hbw-ind" ref={root}>
      <p className="hbw-ind__open">{open ? line(open, at, true) : null}</p>

      {/* The project, across the middle. Decorative: the line above it
          says what it is, and pressing that line opens it properly. */}
      <div className="hbw-ind__shot" aria-hidden="true">
        {frames.map((one, i) => (
          <img
            key={`${open?.slug}-${i}`}
            src={one.src}
            srcSet={one.peekset ?? one.srcset}
            sizes="46vw"
            width={one.width}
            height={one.height}
            alt=""
            loading={i < 3 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>

      {/* Everything else, waiting at the foot of the screen in its order. */}
      <ol className="hbw-ind__list">
        {projects.map((project, i) =>
          i === at ? null : (
            <li key={project.slug}>{line(project, i, false)}</li>
          )
        )}
      </ol>
    </div>
  );
}
