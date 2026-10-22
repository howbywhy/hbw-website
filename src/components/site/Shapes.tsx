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
import type { CSSProperties, ReactNode } from "react";
import dynamic from "next/dynamic";
import { Footer } from "@/components/site/Footer";
import { useNavSettled } from "@/components/site/navSettled";

/*
 * Seventeen hundred lines of editor has no business in the bundle of a
 * front page. It loads when the last bar is opened.
 */
const PosterTool = dynamic(
  () => import("@/components/home/PosterTool").then((m) => m.PosterTool),
  { ssr: false }
);
import { useCallback, useEffect, useRef, useState } from "react";
import { seamMask, type SeamFrame, type SeamLook } from "@/components/site/seam";

/** The site's gutter, in pixels, for the arithmetic that places the bars. */
const EDGE = 2;
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

/** A duration token in milliseconds, however it happens to be written. */
function beat(name: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const raw = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(name)
  );
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return name.endsWith("s") || raw > 20 ? raw : raw * 1000;
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
 * The work as an index, behaving the way the studio sheet does.
 *
 * Every project is a bar. The ones you have passed stack at the top of the
 * column, the ones you have not wait at the bottom, and the one you are on
 * is the last of the top stack — which is exactly how the parts of the
 * studio sheet sit around whichever one is open. What the sheet puts
 * between them is the part's writing; what this puts there is the work,
 * in the column beside it.
 *
 * At rest nothing is open: all seven wait at the bottom, the nav is the
 * studio, and the picture is one frame of the work. The first scroll opens
 * 01, and scrolling back up closes it again.
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
  /** null until the reader moves: at rest this page is the studio. */
  const [at, setAt] = useState<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const bars = useRef<HTMLOListElement>(null);
  const open = at === null ? null : (projects[at] ?? null);
  /** The last bar: not a project, but the way to get in touch. */
  const talking = at === projects.length;

  /*
   * The frame a project leads with.
   *
   * It was a different one each load, drawn from the sequence. The first
   * one is the frame chosen to open that project — picked over months, and
   * the one the project's own page opens on — so the index and the gallery
   * now show a reader the same picture, and the page is the same page
   * twice running.
   */

  /* Nothing in the gallery until a project is open — and with nothing in
     it there is no gallery, so the bars take the whole width. */
  const frame = open?.frames?.[0];

  /*
   * One project per gesture, however hard the gesture was.
   *
   * A trackpad sends a flick as thirty or forty wheel events, so stepping on
   * each one would run the whole index past in a quarter of a second.
   */
  /*
   * The page arrives as the studio, then opens the first project.
   *
   * Nothing open was never a state anybody chose — it is what "null until
   * the reader moves" looks like, and it put seven grey bars along the foot
   * of an empty screen in front of whoever arrived. The studio still gets
   * its moment: the nav says How by Why and the positioning, and only once
   * the bar has stopped moving does the work come up behind it.
   *
   * Once, and then it stops. Stepping on from here would make this a
   * carousel, which is a different kind of page and would spend the rest
   * of the visit arguing with the scroll.
   *
   * useNavSettled is the same gate everything else on this site arrives
   * on, so the order is the site's order rather than a number guessed
   * here — and a reader who has already scrolled is left where they are.
   */
  const settled = useNavSettled();
  const landed = useRef(false);
  const touched = useRef(false);
  useEffect(() => {
    if (!settled || landed.current) return;
    landed.current = true;
    if (touched.current) return;
    /*
     * Held, so the studio is read rather than glimpsed.
     *
     * The length of the hold is --hold, in the stylesheet beside the rest
     * of the site's timing, because it is a reading time and not a
     * transition — the note there says how it was arrived at. It has been
     * raised twice: 120ms was a stutter, and 720ms was still shorter than
     * the positioning line takes to read, so the work came up over it
     * before anybody had finished.
     */
    const open = window.setTimeout(() => {
      if (!touched.current) setAt(0);
    }, beat("--hold", 2000));
    return () => window.clearTimeout(open);
  }, [settled]);

  /*
   * A pointer only chooses when it has actually moved.
   *
   * Every bar opens on pointerenter, and a scroll moves the bars under a
   * cursor that is sitting still — so stepping down slid a bar beneath the
   * pointer, which fired enter and set the project back to it. Going up
   * past Our Boy Roy was impossible: the bar arriving under the cursor
   * kept re-opening itself, and the column stuck. The pointer is only
   * listened to after a real pointermove, and a step stops listening until
   * the next one.
   */
  const stirred = useRef(false);
  useEffect(() => {
    const moved = () => {
      stirred.current = true;
    };
    window.addEventListener("pointermove", moved, { passive: true });
    return () => window.removeEventListener("pointermove", moved);
  }, []);

  const since = useRef(0);
  const step = useCallback(
    (way: number) => {
      const now = Date.now();
      if (now < since.current) return;
      /* Short, because the gesture itself is gated below. This only stops
         a key held down from running the index past. */
      since.current = now + 150;
      stirred.current = false;
      touched.current = true;
      setAt((was) => {
        /* Down from nothing opens the first; up from the first closes it
           again, so the studio is always one gesture back. */
        if (was === null) return way > 0 ? 0 : null;
        const next = was + way;
        if (next < 0) return null;
        /* One past the last project is the way to get in touch, which is
           the last bar rather than a foot under them all. */
        if (next > projects.length) return projects.length;
        return next;
      });
    },
    [projects.length]
  );

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    /* Not passive: the page has nowhere to scroll and the browser should
       not spend a frame finding that out. */
    /*
     * One project per gesture, and a gesture is longer than it feels.
     *
     * A cooldown was the wrong instrument. A trackpad flick is not a burst
     * of events, it is a burst followed by a long momentum tail — often a
     * second or more — so a fixed 420ms window simply let the second and
     * third step through from the same flick, and the index went past two
     * or three at a time.
     *
     * The gate is quiet rather than elapsed: every event pushes the next
     * opening further out, so no amount of tail can reach it. The step is
     * taken on the first event of a gesture, and the next one cannot come
     * until the wheel has actually stopped.
     */
    let quiet = 0;
    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 2) return;
      event.preventDefault();
      const now = Date.now();
      const resting = now >= quiet;
      quiet = now + 160;
      if (resting) step(event.deltaY > 0 ? 1 : -1);
    };
    /* The same rule for a thumb: one project per swipe, however far the
       swipe goes, decided when it passes 36px and not again until it is
       lifted. */
    let from = 0;
    let swiped = false;
    const down = (event: TouchEvent) => {
      from = event.touches[0]?.clientY ?? 0;
      swiped = false;
    };
    const move = (event: TouchEvent) => {
      const now = event.touches[0]?.clientY ?? 0;
      if (Math.abs(now - from) < 36) return;
      event.preventDefault();
      if (swiped) return;
      swiped = true;
      step(now < from ? 1 : -1);
    };
    const up = () => {
      swiped = false;
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") step(1);
      else if (event.key === "ArrowUp") step(-1);
      else return;
      event.preventDefault();
    };
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("touchstart", down, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", up, { passive: true });
    window.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("touchstart", down);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", up);
      window.removeEventListener("keydown", key);
    };
  }, [step]);

  /*
   * The nav says which project this is, through the same hbw:over event the
   * gallery already uses — so the chrome reads the same here as anywhere
   * else on the site, and a bar below it does not have to say the name.
   */
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("hbw:over", {
        detail: open ? { name: open.name, says: open.idea } : null,
      })
    );
    if (open) onNear?.(open.slug);
    return () => {
      window.dispatchEvent(new CustomEvent("hbw:over", { detail: null }));
    };
  }, [open, onNear]);

  /*
   * The seam, bent to where these two pictures differ.
   *
   * Both frames arrive already reduced to sixty-four row brightnesses, so
   * this is arithmetic on a hundred and twenty-eight numbers and a canvas
   * the size of a postage stamp — no picture is loaded, decoded or read
   * here. That is why it can be done on the spot: the wipe does not start
   * for three quarters of a beat after the frame mounts, and this is
   * finished long before then.
   *
   * Everything it needs to know is read from the stylesheet, so the block
   * of tokens on .hbw-ind__shot stays the only place the move is tuned.
   */
  const plate = useRef<HTMLAnchorElement>(null);
  const wasFrame = useRef<{ slug: string; frame: SeamFrame } | null>(null);
  const masks = useRef(new Map<string, { map: string; span: string } | null>());
  useEffect(() => {
    const el = plate.current;
    if (!el) return;
    const clear = () => {
      el.style.removeProperty("--seam-map");
      el.style.removeProperty("--seam-span");
    };

    const lead = open?.frames?.[0];
    const now =
      open && lead?.rows?.length
        ? {
            slug: open.slug,
            frame: { rows: lead.rows, width: lead.width, height: lead.height },
          }
        : null;
    const before = wasFrame.current;
    wasFrame.current = now ?? before;

    /* The first picture has nothing to differ from, and the way out has no
       picture at all. Both get the even seam. */
    if (!before || !now || before.slug === now.slug) return clear();

    const box = el.getBoundingClientRect();
    if (!(box.width > 0) || !(box.height > 0)) return clear();
    const shape = box.width / box.height;

    const style = getComputedStyle(el);
    const number = (name: string, fallback: number) => {
      const value = Number.parseFloat(style.getPropertyValue(name));
      return Number.isFinite(value) ? value : fallback;
    };
    const look: SeamLook = {
      soft: number("--seam-soft", 0.2),
      linger: number("--seam-linger", 0.35),
      where: style.getPropertyValue("--seam-where").trim() === "agree" ? "agree" : "differ",
    };
    if (look.linger <= 0) return clear();

    /* Keyed by the pair and the plate's shape, because the crop depends on
       the shape and a reader who resizes should get a seam cut for the
       plate they are actually looking at. */
    const key = `${before.slug}>${now.slug}@${Math.round(shape * 20)}@${look.where}`;
    let built = masks.current.get(key);
    if (built === undefined) {
      built = seamMask(before.frame, now.frame, shape, look);
      masks.current.set(key, built);
    }
    if (!built) return clear();
    el.style.setProperty("--seam-map", built.map);
    el.style.setProperty("--seam-span", built.span);
  }, [open]);

  /*
   * Where each bar sits, in pixels, so moving between the stacks is a
   * transform rather than a re-parenting.
   *
   * Taking a bar out of one list and putting it in another is what made
   * this jump: the browser has no way to know the element at the foot of
   * the column and the one at its head are the same thing, so there is
   * nothing to animate between. One list, every bar placed, and the move
   * is a change of number.
   */
  const [box, setBox] = useState(0);
  const [row, setRow] = useState(0);
  useEffect(() => {
    const el = bars.current;
    if (!el) return;
    const measure = () => {
      const one = el.querySelector("li");
      setBox(el.clientHeight);
      setRow(one ? one.getBoundingClientRect().height + EDGE : 0);
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  /* Passed bars stack from the top; the rest wait at the foot in order. */
  const count = projects.length + 1;
  const placeOf = (i: number) =>
    at !== null && i <= at ? i * row : box - (count - i) * row;

  const bar = (project: GalleryProject, i: number) => (
    <li
      key={project.slug}
      data-here={i === at ? "true" : undefined}
      style={
        {
          "--y": `${Math.round(placeOf(i))}px`,
          /* The one that moves leads and the rest follow it, rather than
             the whole column setting off together. */
          "--wait": `${Math.min(Math.abs(i - (at ?? projects.length)) * 18, 140)}ms`,
        } as CSSProperties
      }
    >
      <a
        href={`/projects/${project.slug}`}
        aria-current={i === at ? "true" : undefined}
        /*
         * A pointer chooses on arrival; a thumb chooses on a press.
         *
         * Touch fires pointerenter too, so a tap would open the bar and
         * then its own click would read as a press on the already open one
         * and go straight to the project — a reader on a phone would never
         * get the step where the picture changes and the line lights. On
         * touch this does nothing, and the two taps mean what they say.
         */
        onPointerEnter={(event) => {
          if (event.pointerType === "touch") return;
          if (!stirred.current) return;
          touched.current = true;
          setAt(i);
        }}
        /*
         * Keyboard focus, not the focus a tap leaves behind.
         *
         * Tapping a bar focuses it, and this opened it — so by the time the
         * same tap's click arrived the bar was already the open one and it
         * went straight through to the project. A reader on a phone never
         * saw the step where the picture changes. :focus-visible is the
         * browser's own answer to "did they mean to focus this", and it is
         * false for a tap and true for a Tab.
         */
        onFocus={(event) => {
          if (!(event.target as HTMLElement).matches(":focus-visible")) return;
          setAt(i);
        }}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          /* A bar you are not on opens; the one you are on opens the project. */
          if (i !== at) {
            setAt(i);
            return;
          }
          onOpen(project.slug, 0);
        }}
      >
        {/* Two sizes on this page and no others: the number is the small
            one, what the work was and the year are the reading one. */}
        {/* Where you are, rather than which number this is. A reader
            counting to seven learns nothing; a mark that moves tells them
            the one thing the column is for. */}
        <span className="hbw-ind__no" aria-hidden="true" />
        <span className="hbw-ind__did">{didOf(project)}</span>
        <span className="hbw-ind__year">{project.year}</span>
        {/* The nav is saying the name. A link still has to say where it goes
            to anyone who cannot see which bar is lit. */}
        <span className="hbw-sr">{project.name}</span>
      </a>
    </li>
  );

  return (
    <div
      className="hbw-ind"
      ref={root}
      data-open={open || talking ? "true" : "false"}
      /* The foot of the index is the way out, and the nav is not part of
         it — said here so the chrome can stand down from the stylesheet. */
      data-talk={talking ? "true" : undefined}
    >
      <ol
        className="hbw-ind__bars"
        ref={bars}
        /* How many bars there are, for the one place that needs to know in
           CSS: a phone, where the column has to be told its height because
           every bar in it is positioned. */
        style={{ "--bars": count } as CSSProperties}
      >
        {projects.map((project, i) => bar(project, i))}
        {/* No number and no year: it is not one of the seven, it is the
            way out of them. */}
        <li
          key="talk"
          data-here={talking ? "true" : undefined}
          data-talk="true"
          style={
            {
              "--y": `${Math.round(placeOf(projects.length))}px`,
              "--wait": `${Math.min(Math.abs(projects.length - (at ?? projects.length + 1)) * 18, 140)}ms`,
            } as CSSProperties
          }
        >
          {talking ? (
            /* Open, the bar is the contact: the place, the list and where
               else the studio is, in the row itself rather than under a
               page that already ends. */
            <div className="hbw-ind__talk">
              <Footer line />
            </div>
          ) : (
            <button type="button" onClick={() => setAt(projects.length)}>
              <span className="hbw-ind__did">Talk</span>
            </button>
          )}
        </li>
      </ol>

      {/*
        The room. A project puts its work in here; the last bar puts the
        way to get in touch in here, which is why this page has no foot
        under it — the foot was a row saying the same four things, and a
        bar that opens is where they belong.
      */}
      {talking ? (
        /*
         * The drawing, which is the other way in: it exists for the person
         * who would rather not write a paragraph, and it has never had a
         * place on a front page.
         *
         * hbw-tool, because that is where the poster's hundred and
         * forty-eight rules live. Without it the tool renders its own bare
         * default — a bordered box of stacked rows in a corner — which is
         * why it felt like a different tool. It is the same tool; it was
         * just standing outside the room its clothes are in.
         */
        <div className="hbw-ind__shot hbw-ind__shot--talk hbw-tool">
          <PosterTool />
        </div>
      ) : (
      /*
       * The room is the way in.
       *
       * A reader looking at a project's picture and wanting to see the
       * project had to go back to the bar to press it. The picture is the
       * obvious thing to press, so it is: on a pointer it fades to the
       * type that says what pressing it does, and the cursor says so too.
       */
      <a
        className="hbw-ind__shot"
        ref={plate}
        href={open ? `/projects/${open.slug}` : undefined}
        onClick={(event) => {
          if (!open) return;
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          onOpen(open.slug, 0);
        }}
      >
        {frame ? (
          frame.video ? (
            <video key={open?.slug} poster={frame.src} autoPlay muted loop playsInline>
              {frame.webm ? <source src={frame.webm} type="video/webm" /> : null}
              <source src={frame.video} type="video/mp4" />
            </video>
          ) : (
            <img
              key={open?.slug}
              src={frame.src}
              srcSet={frame.peekset ?? frame.srcset}
              sizes="(max-width: 760px) 100vw, 50vw"
              alt=""
              decoding="async"
            />
          )
        ) : null}
        {/* The link's name, and the thing that appears when it is hovered.
            One span doing both, so there is never a name on screen that a
            reader using a pointer cannot see. */}
        <span className="hbw-ind__view">View project</span>
      </a>
      )}
    </div>
  );
}
