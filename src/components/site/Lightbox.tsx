"use client";

/**
 * The whole sequence, over the page.
 *
 * A collage shows a project's shape; this shows its contents. Opening one
 * frame opens all of them, starting where you clicked, and the arrows walk the
 * set — so a visitor who wants to see everything does not have to scroll a
 * composition looking for it.
 *
 * The set is laid out as pages on a rail rather than one picture swapped in
 * place. The work either side stays in view, set back, so you can see where
 * you are in the sequence.
 *
 * The rail is a scroller, not a slideshow: you can push through the whole set
 * with a trackpad or a wheel, and the page you stop on becomes the page you
 * are on. Prev, Next, the arrows and the strip all do the same thing — put a
 * page in the middle — so there is one mechanism and four ways to ask.
 *
 * In colour. The listings are grey so six jobs read as one body of work, but
 * in here there is only one job and the work is the whole subject.
 */
import { useStillness } from "@/components/site/still";
import { useView } from "@/components/site/view";
import { useHeld } from "@/components/site/held";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { countOf } from "@/components/site/numbering";
import type { Shot } from "@/components/site/shots";

/** How far either side of the picture is worth loading: the next step, and the one after. */
const NEAR = 2;

/*
 * Which way the band runs.
 *
 * Across on a wide screen, down on a phone — the strip follows the shape of
 * the window holding it. Everything that reads the rail or moves it asks
 * this rather than assuming an axis.
 */
function runsDown(host: HTMLElement) {
  return host.scrollHeight > host.clientHeight + 4;
}

export function Lightbox({
  shots,
  at,
  onAt,
  onClose,
  reading,
  setReading,
  name,
  says,
  idea,
  info,
  next,
  onNext,
  prev,
  onPrev,
}: {
  shots: Shot[];
  at: number;
  onAt: (next: number) => void;
  onClose: () => void;
  /**
   * Whether the information is up, held by the page rather than by this
   * gallery — walking to the next project mounts a new one, and a reader who
   * had the writing open meant to keep it open.
   */
  reading: boolean;
  setReading: (to: boolean) => void;
  name: string;
  /** The project's line, set on the gallery's own row of chrome. */
  says?: string;
  /** The project's line, for the row under the nav. */
  idea?: string;
  /**
   * The project after this one, as the last panel on the rail.
   *
   * The set does not stop, it hands over: keep going past the final frame and
   * the next project's mark arrives on its own ground, the counter says whose
   * it is, and one more step opens it. Nobody has to find their way back to
   * an index to see the next thing.
   */
  next?: {
    slug: string;
    name: string;
    mark: ReactNode;
    /** The next project's first frame, shown at the end of this one. */
    peek?: string;
    peekSet?: string;
  } | null;
  onNext?: () => void;
  /**
   * The project before this one, for the nav along the bottom.
   *
   * The handover at the end of the rail is the way out for someone who has
   * watched the whole set; this is the way out for everyone else. Wanting the
   * next job on frame three is not a reason to walk sixteen frames or go back
   * to the index, and it is the same move in both directions, so the foot
   * carries both.
   */
  prev?: { slug: string; name: string; mark: ReactNode } | null;
  onPrev?: () => void;
  /**
   * What the project says about itself. It opens as the same sheet the studio
   * uses, from this bar — the gallery is where a visitor is when they want to
   * read about the work, so the way to it belongs here.
   */
  info?: ReactNode;
}) {
  /**
   * The project's name at the foot, and what it opens.
   *
   * Shut, it is the mark run the width of the screen and cut off by the band
   * it sits in — a thing to press rather than a button that says "press me".
   * Open, the work stands back to a row of thumbnails and the project's
   * facts take the room that frees up.
   */
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  /*
   * One frame, on its own, over the set.
   *
   * Pressing a picture in the grid used to drop you back into the band on
   * it, which answered a question nobody asked: you pressed it because you
   * wanted to see THAT, bigger. It opens over the grid and closes back to
   * it, so the set you were scanning is still there when you are done.
   */
  const [view, setView] = useView();
  const [full, setFull] = useState(false);
  /**
   * Opening a frame from the grid is three moves, like opening a project.
   *
   * The set goes first — every frame taken downward, the way the catalogue
   * is taken when you leave the home page — and only then does the gallery's
   * row travel to the foot of the window, uncovering the picture as it goes.
   * The row already made that journey; what it did not do was carry the
   * picture with it, so the picture simply existed once the row had left.
   *
   * `parting` holds the set out of the way for as long as the picture is up.
   * `closing` keeps the picture mounted while it is covered again, because
   * an element that unmounts on the press cannot be seen to leave.
   */
  /* Asked for here because the staging below reads it. */
  const stillness = useStillness();
  /**
   * Whether this project is still arriving.
   *
   * The swipe in from the right belongs to a project coming into the room:
   * opening one from the catalogue, and stepping to the next at the end of
   * this one. It was written as "the rail, whenever the view is the band",
   * which is also true the moment you press Gallery — so switching views
   * threw the whole set in from the side again instead of moving the frames
   * you were already looking at from one arrangement to the other.
   *
   * The gallery is keyed on the project, so a new one is a new component:
   * this is true for its first breath and false for the rest of its life,
   * and the view switch cannot bring it back.
   */
  const [arriving, setArriving] = useState(true);
  /**
   * The writing takes the room it needs, and the work gives it up.
   *
   * Its height was a clamp — never less than 180, never more than 320 —
   * with a scrollbar for anything that did not fit, so a project with more
   * to say had it cut off mid-sentence inside a box the same size as a
   * project with less. The modules are what they hold now, the panel is as
   * tall as the tallest of them, and the gallery above gives up exactly
   * that much. Measured, because a grid row cannot be transitioned to a
   * height nobody has worked out yet.
   */
  const infoRoom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const ms = (token: string, fallback: number) => {
      const raw = Number.parseFloat(root.getPropertyValue(token));
      if (!Number.isFinite(raw) || raw <= 0) return fallback;
      return raw < 20 ? raw * 1000 : raw;
    };
    const id = window.setTimeout(
      () => setArriving(false),
      ms("--enter-work", 530) + ms("--in", 460) + 120
    );
    return () => window.clearTimeout(id);
  }, []);
  const [closing, setClosing] = useState(false);
  const staging = useRef(0);
  useEffect(() => () => window.clearTimeout(staging.current), []);
  useEffect(() => {
    setFull(false);
    setClosing(false);
  }, [view, name]);

  /** A duration token in milliseconds, however it happens to be written. */
  const beat = useCallback((token: string, fallback: number) => {
    const raw = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(token)
    );
    if (!Number.isFinite(raw) || raw <= 0) return fallback;
    return raw < 20 ? raw * 1000 : raw;
  }, []);

  /**
   * The row comes down over the set. The set does not go anywhere.
   *
   * It used to leave first — every frame taken downward, then the row
   * travelling into the room they had left. Which looked like the grid
   * being switched off: a hundred frames clipped to nothing in a quarter
   * of a second is a flash, not a departure, and nothing was gained by it
   * because the picture covers the grid anyway.
   *
   * One move instead. The row starts down the moment you press, the
   * picture is uncovered from the top at the row's own pace, and the set
   * stays where it is underneath — visible through the glass until the
   * picture has passed over it.
   */
  useEffect(() => {
    const room = infoRoom.current;
    if (!room) return;
    const root = document.documentElement;
    const read = () => {
      const want = room.scrollHeight;
      if (!want) return;
      /* Never more than the room can give: the gallery has to stay a
         gallery, so the writing stops at a little over half the screen and
         scrolls past that. Short writing is simply short. */
      const cap = Math.round(window.innerHeight * 0.56);
      root.style.setProperty("--info-h", `${Math.min(want, cap)}px`);
    };
    read();
    const watch = new ResizeObserver(read);
    watch.observe(room);
    for (const kid of room.querySelectorAll(".hbw-info__grid > *")) watch.observe(kid);
    window.addEventListener("resize", read);
    return () => {
      watch.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [info, reading]);

  const openFull = useCallback(
    (i: number) => {
      window.clearTimeout(staging.current);
      onAt?.(i);
      setFull(true);
    },
    [onAt]
  );

  const shutFull = useCallback(() => {
    window.clearTimeout(staging.current);
    if (stillness) {
      setFull(false);
      setClosing(false);
      return;
    }
    setClosing(true);
    setFull(false);
    staging.current = window.setTimeout(() => setClosing(false), beat("--in", 460));
  }, [beat, stillness]);
  const pages = useRef<HTMLDivElement>(null);
  /** The handover panel sits one past the last frame. */
  const handover = next ? shots.length : -1;
  const onHandover = at === handover;
  const count = next ? shots.length + 1 : shots.length;

  /** Which page is nearest the middle of the rail right now. */
  const middle = useCallback(() => {
    const host = pages.current;
    if (!host) return at;
    const down = runsDown(host);
    const centre =
      (down ? host.scrollTop : host.scrollLeft) +
      (down ? host.clientHeight : host.clientWidth) / 2;
    const kids = Array.from(host.children) as HTMLElement[];
    let best = 0;
    let gap = Infinity;
    kids.forEach((kid, i) => {
      const mid = down
        ? kid.offsetTop + kid.offsetHeight / 2
        : kid.offsetLeft + kid.offsetWidth / 2;
      const to = Math.abs(mid - centre);
      if (to < gap) {
        gap = to;
        best = i;
      }
    });
    return best;
  }, [at]);

  /**
   * Scrolling is the primary way through. What the rail settles on is what
   * the counter says, so the two can never disagree — and because the
   * answer is read back from the scroll, putting a page in the middle
   * below does not start a loop.
   */
  useEffect(() => {
    const host = pages.current;
    if (!host) return;
    let waiting = 0;
    const settled = () => {
      waiting = 0;
      const now = middle();
      if (now !== at) onAt(now);
    };
    const watch = () => {
      if (waiting) return;
      waiting = requestAnimationFrame(settled);
    };
    host.addEventListener("scroll", watch, { passive: true });
    return () => {
      host.removeEventListener("scroll", watch);
      if (waiting) cancelAnimationFrame(waiting);
    };
  }, [at, middle, onAt]);

  /**
   * One page at a time, from the keys and the strip.
   *
   * There is no wheel handler any more. The set runs down the screen, so a
   * wheel or a two-finger push is already doing exactly the right thing to
   * exactly the right element, and everything that was here existed to turn
   * one axis into the other and then to fight the snapping that turn caused.
   */
  const nudge = useCallback(
    (by: number) => {
      // Scrolling never opens the next project: the handover is a stop, and
      // walking into one by accident is how you lose your place.
      const to = Math.min(count - 1, Math.max(0, at + by));
      if (to !== at) onAt(to);
    },
    [at, count, onAt]
  );
  void nudge;

  /**
   * A wheel over the gallery runs the band along.
   *
   * The band lies across the screen and a trackpad's usual push is down, so
   * without this the set could not be moved at all by the gesture most people
   * reach for first. A sideways push over the band is already right and is
   * left alone. Safe to add back now the rail snaps by proximity: under
   * mandatory snapping each small push was dragged back where it came from,
   * which is what the old step-counting machinery existed to work around.
   */
  useEffect(() => {
    const host = panel.current;
    if (!host) return;
    const roll = (event: WheelEvent) => {
      const field = pages.current;
      const target = event.target as Node | null;
      if (!field || !target) return;
      // The information sheet is over the gallery, so its wheel is its own.
      if (target instanceof Element && target.closest(".hbw-studio-sheet")) return;
      // Running down, the band is already on the reader's own axis: let it be.
      if (runsDown(field)) return;
      const sideways = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (sideways && field.contains(target)) return;
      event.preventDefault();
      field.scrollLeft += sideways ? event.deltaX : event.deltaY;
    };
    host.addEventListener("wheel", roll, { passive: false });
    return () => host.removeEventListener("wheel", roll);
  }, []);

  /**
   * Coming to the end.
   *
   * Once the next project is genuinely in view, this one steps back: the
   * frames behind soften and the project arriving stays sharp. The old
   * behaviour had it the other way round — the next project's picture was
   * blurred and tinted so a mark could sit on it, which made the two bleed
   * into each other instead of one handing over to the other.
   */
  useEffect(() => {
    const host = pages.current;
    const lamp = panel.current;
    if (!host || !lamp || handover < 0) return;
    let waiting = 0;
    const read = () => {
      waiting = 0;
      const peep = host.querySelector<HTMLElement>(".hbw-lamp__page--next");
      if (!peep) return;
      const box = peep.getBoundingClientRect();
      /*
       * In view by more than a sliver, measured the way the band runs.
       *
       * This asked how much of the panel was across the screen. Down a
       * column every frame spans the full width, so the answer was always
       * all of it and a project read as ending the moment it opened — the
       * whole set softened and dimmed on the first frame.
       */
      /*
       * How much of the plate is on screen, both ways at once.
       *
       * This picked an axis first and measured along it, which only works
       * while the band is the only thing the gallery can be. With the plate
       * hidden in the grid, or sitting off to the right of a band that the
       * code had decided runs downwards, it measured the axis the plate was
       * NOT off the edge of — so a project read as ending two frames in,
       * and every picture in it softened to a blur.
       *
       * Area is the honest question: the plate is in view when more than
       * half of it is on screen, whichever way the work is laid out. A
       * plate with no box at all — the grid hides it — is not in view.
       */
      const room = box.width * box.height;
      if (room <= 0) {
        lamp.dataset.ending = "false";
        return;
      }
      const across = Math.max(0, Math.min(box.right, window.innerWidth) - Math.max(box.left, 0));
      const down = Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0));
      lamp.dataset.ending = across * down > room * 0.5 ? "true" : "false";
    };
    const watch = () => {
      if (!waiting) waiting = requestAnimationFrame(read);
    };
    read();
    host.addEventListener("scroll", watch, { passive: true });
    window.addEventListener("resize", watch);
    return () => {
      host.removeEventListener("scroll", watch);
      window.removeEventListener("resize", watch);
      if (waiting) cancelAnimationFrame(waiting);
    };
  }, [handover]);

  /** Asked for a page by any other means: put it in the middle. */
  useEffect(() => {
    const host = pages.current;
    if (!host) return;
    if (middle() === at) return;
    const kid = host.children[at] as HTMLElement | undefined;
    if (!kid) return;
    if (runsDown(host)) {
      host.scrollTop = kid.offsetTop + kid.offsetHeight / 2 - host.clientHeight / 2;
    } else {
      host.scrollLeft = kid.offsetLeft + kid.offsetWidth / 2 - host.clientWidth / 2;
    }
  }, [at, middle]);

  const step = useCallback(
    (by: number) => {
      // One step on from the handover is the next project itself.
      if (at === handover && by > 0) {
        onNext?.();
        return;
      }
      onAt((at + by + count) % count);
    },
    [at, count, handover, onAt, onNext]
  );

  // The keyboard stays in here while this is up, as aria-modal promises.
  useHeld(panel);

  useEffect(() => {
    opener.current = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const had = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = had;
      opener.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    function key(event: KeyboardEvent) {
      // The sheet is on top and closes itself; Escape here would shut both.
      if (event.key === "Escape") {
        if (full) {
          shutFull();
          return;
        }
        if (reading) {
          setReading(false);
          return;
        }
        onClose();
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") step(1);
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") step(-1);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose, step, reading, full]);

  /*
   * The next project arriving takes the leaving state off again.
   *
   * Stepping to the next project fades this panel out and swaps the work in
   * underneath it, but nothing ever cleared the flag: the panel stayed faded
   * and you were left looking through it at the homepage. The new work
   * landing is what ends the leaving.
   */
  useEffect(() => {
    const lamp = panel.current;
    if (lamp) delete lamp.dataset.going;
  }, [name]);

  /** Whether this reader has asked their system for less movement. */

  /*
   * Asking for less movement stops the films that have already started.
   *
   * autoPlay only decides whether a film begins; turning it off does not
   * stop one that is already running. The answer arrives in an effect, a
   * beat after the first paint, so on a quick connection a film could be
   * playing before this reader's preference was even known — and then
   * nothing ever paused it.
   */
  useEffect(() => {
    if (!stillness) return;
    const room = panel.current;
    if (!room) return;
    const hush = () => {
      for (const film of room.querySelectorAll("video")) {
        if (!film.paused) film.pause();
      }
    };
    hush();
    /* A film whose data arrives later starts itself; it is stopped too. */
    room.addEventListener("play", hush, true);
    return () => room.removeEventListener("play", hush, true);
  }, [stillness]);

  /*
   * How much of this row is already spoken for, told to the bar.
   *
   * The bar's line runs the width of the page on every other page. Here the
   * count stands at one end of its row and the view switch at the other, and
   * the line has to run between them instead — so the two ends say how wide
   * they are and the bar insets its field by exactly that. Measured rather
   * than guessed, because the count changes width at ten and the switch
   * changes with its words.
   *
   * Cleared when the gallery goes, which is what returns the line to the
   * full width of the page: the same element, travelling, rather than one
   * disappearing and another arriving in its place.
   */
  /*
   * How the grid is laid out for THIS series, in THIS room.
   *
   * A fixed eight columns fits sixteen pictures and loses the last row of
   * nineteen off the bottom of the screen — and a sheet you have to scroll
   * is not a sheet. The set's length and the room's shape are both known
   * here, so the column count is worked out from them: the arrangement
   * whose cells come closest to square is the one that wastes least, and
   * every frame is on screen whatever the project happens to hold.
   */
  const field = useRef<HTMLDivElement>(null);
  /* Before paint, so the arrangement is final by the time the move below
     measures where each frame ended up. */
  useLayoutEffect(() => {
    const box = field.current;
    if (!box || view !== "grid") return;
    const fit = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      const n = shots.length;
      if (!w || !h || !n) return;
      let best = 1;
      let kindest = Infinity;
      for (let cols = 1; cols <= n; cols++) {
        const rows = Math.ceil(n / cols);
        const cell = Math.min(w / cols, h / rows);
        /* How far from square the cell is, and how much of the room is left
           over: a grid that fits but leaves half the screen empty is not a
           fit either. */
        const waste = w * h - cell * cell * n;
        if (waste < kindest) {
          kindest = waste;
          best = cols;
        }
      }
      box.style.setProperty("--cols", String(best));
      box.style.setProperty("--rows", String(Math.ceil(n / best)));
    };
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(box);
    return () => watch.disconnect();
  }, [view, shots.length]);

  /*
   * Changing view is a move, not a cut.
   *
   * The band and the grid are two arrangements of the same pictures, and
   * swapping one for the other in a single frame reads as the set being
   * replaced rather than rearranged — you lose track of which picture was
   * which. Each frame is measured where it was, put back there, and then
   * released: they travel from the row they were in to the sheet they are
   * going to, and back again when you ask for the row.
   *
   * Where each one was is taken at the moment the switch is pressed, before
   * React has had a chance to change anything.
   */
  const places = useRef<Map<string, DOMRect>>(new Map());
  const held = useRef(false);

  const move = useCallback(
    (next: "band" | "grid") => {
      if (next === view) return;
      const box = pages.current;
      if (box && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const was = new Map<string, DOMRect>();
        box.querySelectorAll<HTMLElement>(".hbw-lamp__page").forEach((one, i) => {
          /*
           * Every frame travels, and none of them travels far.
           *
           * Taking only the ones on screen meant half a sheet simply
           * appeared while the rest moved, which reads as two different
           * things happening. Taking all of them as they were meant the
           * frames three thousand pixels off the left of a scrolled band
           * spent the whole move flying in, with the sheet empty behind
           * them. So every frame moves, and a frame that was off the screen
           * starts from just beyond the edge it was off — the journey is
           * bounded, the sheet is full the moment it arrives, and nothing
           * stands still while its neighbours move.
           */
          const where = one.getBoundingClientRect();
          const reach = window.innerWidth * 0.6;
          const drop = window.innerHeight * 0.6;
          const from = new DOMRect(
            Math.min(Math.max(where.left, -reach), window.innerWidth + reach),
            Math.min(Math.max(where.top, -drop), window.innerHeight + drop),
            where.width,
            where.height,
          );
          was.set(one.dataset.frame ?? String(i), from);
        });
        places.current = was;
        held.current = true;
      }
      setView(next);
    },
    [view, setView],
  );

  useLayoutEffect(() => {
    if (!held.current) return;
    held.current = false;
    const was = places.current;
    places.current = new Map();
    const box = pages.current;
    if (!box || !was.size) return;
    const frames = Array.from(box.querySelectorAll<HTMLElement>(".hbw-lamp__page"));
    const moving: HTMLElement[] = [];
    for (const one of frames) {
      const before = was.get(one.dataset.frame ?? "");
      if (!before) continue;
      const after = one.getBoundingClientRect();
      if (!after.width || !before.width) continue;
      let dx = before.left - after.left;
      let dy = before.top - after.top;
      const sx = before.width / after.width;
      const sy = before.height / after.height;
      /*
       * Everything moves, including the one that barely has to.
       *
       * A frame whose place in the row and its place in the sheet happen to
       * be within a pixel of each other was skipped as having nothing to
       * do — so eighteen of nineteen travelled and one sat still through
       * it, which is the thing a reader notices. It is given the smallest
       * journey the rest are making instead.
       */
      const still =
        Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01;
      if (still) {
        dy = -8;
      }
      one.style.transformOrigin = "top left";
      one.style.transition = "none";
      one.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      moving.push(one);
    }
    if (!moving.length) return;
    /* Two frames: one to be put back where it was, one to let go. */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        for (const one of moving) {
          one.style.transition = "transform var(--in) var(--ease)";
          one.style.transform = "";
        }
      });
    });
    const clear = () => {
      for (const one of moving) {
        one.style.transition = "";
        one.style.transformOrigin = "";
        one.style.transform = "";
      }
    };
    const done = window.setTimeout(clear, 900);
    return () => window.clearTimeout(done);
  }, [view]);

  const rowLeft = useRef<HTMLSpanElement>(null);
  const rowWays = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    const nav = document.querySelector(".hbw-bar");
    const say = () => {
      if (!nav) return;
      /*
       * The real widths, not the whole-pixel ones.
       *
       * offsetWidth rounds, so a count 62.75 wide was reported as 63 and the
       * row's gap came out a quarter of a pixel short of the nav's — three
       * gaps on one screen reading 8.63, 8.86 and 8.70 where every other row
       * on the site reads 8.64.
       */
      const l = rowLeft.current?.getBoundingClientRect().width ?? 0;
      const r = rowWays.current?.getBoundingClientRect().width ?? 0;
      /*
       * Plus the gap the nav itself keeps between its three fields, read off
       * the nav rather than named again here — so this row is set out like
       * the one above it by construction, and cannot drift from it. Measured
       * flush, the count and the switch were welded to the line between them
       * while every other row on the page breathed.
       *
       * The gap is added here, in pixels, because a custom property holding
       * var(--gut) is invalid on the root element: --gut is not declared
       * there, so the whole margin fell back to the bare measurement.
       */
      const gut = parseFloat(getComputedStyle(nav).columnGap) || 0;
      /* The foot and the bar say how tall they are, so the writing that
         opens between them knows how much room it has without a guess. */
      const foot = panel.current?.querySelector(".hbw-lamp__feet");
      const bar = panel.current?.querySelector(".hbw-lamp__bar");
      /*
       * How far the foot's own pills reach up from the bottom of the window.
       *
       * The container is five pixels taller than the pills in it, so anything
       * measured off the container sat that much clear of the words a reader
       * actually sees. This is the edge things line up with.
       */
      const pill = foot?.querySelector<HTMLElement>(".hbw-lamp__foot") ?? (foot as HTMLElement | null);
      const room = panel.current;
      if (pill && room) {
        /*
         * Where it sits, not where it is being drawn.
         *
         * A rect read during the arrival catches the foot mid-slide — it
         * came back as eighteen pixels off the bottom instead of thirty-three,
         * and the writing that hangs off it was laid over the words. offsetTop
         * is the layout's answer and the animation cannot move it.
         */
        let y = 0;
        let node: HTMLElement | null = pill;
        /* offsetTop is measured from the nearest positioned ancestor, which
           is the foot's own row, not the gallery — so the chain is walked. */
        while (node && node !== room) {
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        root.style.setProperty("--foot-top", `${Math.max(0, room.clientHeight - y)}px`);
      }
      if (foot) root.style.setProperty("--foot-h", `${foot.getBoundingClientRect().height}px`);
      if (bar) root.style.setProperty("--bar-h", `${bar.getBoundingClientRect().height}px`);
      root.style.setProperty("--row-left", l ? `${l + gut}px` : "0px");
      root.style.setProperty("--row-right", r ? `${r + gut}px` : "0px");
    };
    say();
    const watch = new ResizeObserver(say);
    if (rowLeft.current) watch.observe(rowLeft.current);
    if (rowWays.current) watch.observe(rowWays.current);
    return () => {
      watch.disconnect();
      root.style.setProperty("--row-left", "0px");
      root.style.setProperty("--row-right", "0px");
    };
  }, [view, full]);

  /*
   * Whether a project is handing over to the next one.
   *
   * Read from the document rather than passed down, because the panel is
   * keyed on the project: the one leaving is thrown away and a new one built,
   * so the state has to outlive both.
   */
  const [crossing, setCrossing] = useState(() =>
    /*
     * Read during the first render, not after it.
     *
     * This started false and was corrected by the effect — but the panel is
     * keyed on the project, so stepping to the next one throws this panel
     * away and builds another, and the new one's first painted frame had no
     * cover on it at all: glass, with its pictures still arriving and the
     * page showing through. Every fix so far was to the panel leaving. The
     * one arriving has been starting uncovered the whole time.
     */
    typeof document === "undefined"
      ? false
      : document.documentElement.classList.contains("hbw-crossing")
  );
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setCrossing(root.classList.contains("hbw-crossing"));
    read();
    const eyes = new MutationObserver(read);
    eyes.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => eyes.disconnect();
  }, []);

  if (!shots.length) return null;

  return (
    <div
      className="hbw-lamp hbw-over"
      role="dialog"
      aria-modal="true"
      aria-label={`${name}, image ${at + 1} of ${shots.length}`}
      ref={panel}
      tabIndex={-1}
      data-reading={reading ? "true" : undefined}
      data-full={full ? "true" : undefined}
      data-arriving={arriving ? "true" : undefined}
      /*
       * The glass, pinned so nothing can switch it off.
       *
       * The leaving state in the stylesheet also sets backdrop-filter to
       * none, and data-going still has to drive the pictures leaving, so the
       * rule cannot simply go. Said inline it outranks the stylesheet: the
       * filter now holds one value for the life of the panel, which is what
       * stops the compositor rebuilding the layer and showing a frame of the
       * page behind. (Fold this back into the stylesheet once the parallel
       * work there has landed — it belongs with the rest of the gallery's
       * ground, not here.)
       */
      style={{
        /*
         * The blur is the ground; there is no fill over it.
         *
         * A white at 74% sat between the work and the page behind, so every
         * gap in a band of staggered pictures was a panel of paper. Taken
         * away, what shows through those gaps is the page you came from,
         * softened — which is a texture that belongs to this site rather
         * than a blank.
         *
         * Said inline because the leaving state in the stylesheet switches
         * the filter off, and that switch is what rebuilt a GPU layer and
         * flashed the page behind. Held here, it never changes.
         */
        backdropFilter: "blur(16px) saturate(0.9)",
        WebkitBackdropFilter: "blur(16px) saturate(0.9)",
        background: "transparent",
      }}
    >
      {/*
        The ground that covers the room while the work changes.
        
        A negative z-index puts it above the panel's own background and the
        glass behind it, and below everything in the panel — so the work and
        the chrome sit on it rather than under it. Fading a plain sheet costs
        the compositor nothing, where switching the filter itself rebuilt a
        layer and showed a frame of the page behind.
      */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1,
          background: "#ffffff",
          /*
           * Up while the project is arriving as well as while one is handing
           * over to another. Without it the gallery's glass showed the
           * catalogue through every gap in the band for as long as the
           * pictures took, which reads as the work you just left flashing
           * behind the work you asked for. The project stands on its own
           * paper from its first frame and the paper goes once it has.
           */
          opacity: crossing || arriving ? 1 : 0,
          /*
           * Covers at once, uncovers gently.
           *
           * Fading in took 90ms, and the work fades out faster than that — so
           * for the first two frames of a hand-over the pictures were already
           * half gone while the sheet was only half there, and the page
           * showed through the gap. Arriving is instant; only the leaving is
           * worth watching.
           */
          transition: crossing || stillness ? "none" : "opacity 200ms linear",
          pointerEvents: "none",
        }}
      />
      <div className="hbw-lamp__bar">
        {/*
          Where you are, and nothing else on this side.
          
          Prev and Next were here, and they were the fourth way to do one
          thing: either side of the picture is already a target, the arrow
          keys walk it, the strip jumps it and a wheel scrolls it. Four ways
          to step, two of them taking a permanent row, is what makes a simple
          thing look complicated.
          
          The counter has lost its "SCK" too — the bar directly above says
          which project this is, and a visitor reading two rows that both
          start with the same three letters is reading a mistake.
        */}
        {/*
          A count, and only a count.
          
          It said "Up next: Chris Sisarich" at the end, which is what the foot
          says in the corner below it and what the mark peeping under the last
          frame says for itself — the same project named three times on one
          screen. The counter counts; the other two do the naming.
        */}
        {/*
          How the work is laid out, said where the work is.
          
          It sat in the site bar for a moment, in the slot that gets you back
          to the index — which made the one labelled way out of a project
          into a pair of view options. It belongs here, beside the count,
          because it is about this set of pictures and nothing else.
        */}
        {/*
          The two ways of looking, one at each end, with where you are
          between them. The row reads as a pair of choices either side of a
          reading, rather than a huddle in one corner.
        */}
        {/* Where you are, at the near end. */}
        <span className="hbw-lamp__left" ref={rowLeft}>
          <span className="hbw-lamp__count">
            {/*
              Keyed on what it says, so the plate stays and the digits are
              what change. Walking to the next project rebuilds the gallery
              and took the count's own bubble away with it; the bubble is
              chrome, and chrome does not come and go because the work it
              counts has.
            */}
            <span
              key={countOf(Math.min(at, shots.length - 1), shots.length)}
              className="hbw-lamp__said"
            >
              {countOf(Math.min(at, shots.length - 1), shots.length)}
            </span>
          </span>
        </span>
        {/* The project's line, on the same row as where you are in it. */}
        {/*
          The project's name, as the page's heading.
          
          It was a span, and the only h1 on a project page was a copy of it
          hidden up in the chrome — so the first heading anybody met, reader
          or crawler, was the year on a catalogue row. The name is already on
          screen in the right place; it just was not saying what it is.
        */}
        {/*
          The line is not said again here.

          It was a second element carrying the same words as the bar's own
          line, which is why crossing between a project and the index read as
          a fade out and a fade in: two elements taking turns, where a visitor
          sees one line that ought to simply stay. The bar keeps it on every
          page and this row leaves it the room — see --row-left below. Only
          the heading stays, read rather than seen.
        */}
        <span className="hbw-lamp__mid">
          <h1 className="hbw-lamp__says">{says}</h1>
          {/*
            The line again, for the one view where the bar cannot carry it.

            Opening a frame full bleed moves this row to the foot of the
            window, and the bar's own line cannot come with it: transforming
            an element that carries a backdrop filter inside a fixed parent
            paints it a bar's height adrift. So the row says the line itself
            in there, in the same words the bar uses everywhere else, and is
            not shown in any other view.
          */}
          {idea ? <span className="hbw-lamp__idea">{idea}</span> : null}
        </span>
        {/* The count moved across to balance the switch: one thing at each
            end of the row, with the project's name holding the middle. */}
        <span className="hbw-lamp__ways hbw-lamp__view" ref={rowWays} role="group" aria-label="How the work is laid out">
          <button type="button" aria-pressed={view === "band"} onClick={() => move("band")}>
            Gallery
          </button>
          <button type="button" aria-pressed={view === "grid"} onClick={() => move("grid")}>
            Grid
          </button>
          {/*
            No Information button.
            
            What it opened is set at the foot of the gallery now — small, in
            three columns, there to be read rather than asked for. A button
            that opens a panel over the work, to tell you about the work, was
            a step between a visitor and the thing they are already looking
            at.
          */}
          {/*
            Close belongs to the information, not to the gallery.
            
            Shut, there is nothing to close — the way out of a project is
            Work or the studio's name, which is where a visitor looks for it
            anyway. Open, Close means the one thing it can mean.
          */}
          {/*
            One way out at a time.
            
            Reading put a Close up here while the foot already held one —
            two words for the same action, eight hundred pixels apart. The
            foot's is the one you pressed to open the writing, so it keeps
            the job; this slot is for the picture plate, which has no other.
          */}
          {full ? (
            <button type="button" onClick={shutFull}>
              Close
            </button>
          ) : null}
        </span>
      </div>

      {/*
        The picture, and nothing under it. The description was the frame's alt
        text printed out: it is written for someone who cannot see the picture,
        and setting it under the picture says it twice to everyone else. It
        stays on the image, where it is read by the people it is for.
      */}
      <div
        className="hbw-lamp__field"
        data-view={view}
        ref={field}
      >
        {/* One rail carrying every frame as a page, scrolled and snapped. */}
        <div
          className="hbw-lamp__pages"
          ref={pages}
          /*
           * The set is laid out one way, whatever is open over it.
           *
           * The track count used to change with the writing — two rows in
           * the grid, one long row in the band — which is what made opening
           * the information rebuild the gallery around it. Nothing reflows
           * now: the writing comes up over the work and the work is exactly
           * where it was left.
           */
        >
          {[...shots.map((one, i) => {
            /*
             * Every frame is laid out, not just the ones near you.
             *
             * A band of natural widths cannot be built from pages that have
             * no width until their picture arrives: the un-drawn ones
             * collapsed, the rail measured short, and the frames jumped
             * sideways as they loaded. Each page is a column of known width
             * and the picture fills it; the browser still only fetches what
             * is close, because the images are lazy.
             */
            const near = true;
            return (
              <div
                className="hbw-lamp__page"
                key={one.id ?? one.src + i}
                /* The same picture, under the same name, in either view —
                   which is what lets the move follow it across. */
                data-frame={i}
                data-here={i === at}
                aria-hidden={i === at ? undefined : true}
                /* The page is the shape of its picture, known before it loads,
                   so the band is laid out right from the first paint and
                   nothing has to be cropped to fit a column. */
                style={
                  {
                    ...(one.width && one.height ? { "--ar": `${one.width} / ${one.height}` } : {}),
                    /*
                     * How much of a row this frame is worth, on a phone.
                     *
                     * Six tracks, so a row can hold one, two or three
                     * pictures and nothing finer. A landscape takes all six
                     * and stands alone, because shrunk to a third of a phone
                     * it is a smear; a square takes half; a portrait takes a
                     * third, which is the one shape that still reads small.
                     * The number is worked out from the picture because only
                     * the data knows its shape; whether to use it is the
                     * stylesheet's business.
                     */
                    "--span":
                      one.width && one.height
                        ? one.width / one.height > 1.1
                          ? 6
                          : one.width / one.height > 0.85
                            ? 3
                            : 2
                        : 2,
                    /* Its place in the run, so the band assembles in order
                       rather than appearing all at once. */
                    "--i": i,
                  } as React.CSSProperties
                }
              >
                {/* Film plays on the page you are on; elsewhere it is its own still. */}
                {/*
                  Film plays wherever it is in the band.
                  
                  It played only on the frame you were on, which made sense
                  when one frame filled the screen. In a band several are in
                  view at once and a stopped one reads as a hole in the run.
                */}
                {/* In the grid every frame is a way into itself: press one
                    and the band opens on it. */}
                {view === "grid" ? (
                  <button
                    type="button"
                    className="hbw-lamp__pick"
                    aria-label={`Frame ${i + 1} of ${shots.length}`}
                    onClick={() => {
                      // Open on this one, and stay on it: the plate shows
                      // whichever frame you are on, so stepping works in here
                      // exactly as it does everywhere else. The set leaves
                      // first; openFull holds the order.
                      openFull(i);
                    }}
                  >
                    {/*
                      Its place in the set, said on the picture.

                      Two digits, the same half of the reading the count in
                      the bar gives — "04" here, "04 / 16" up there — so the
                      sheet can be read as a sequence rather than a wall. The
                      button already says "Frame 4 of 16" to a reader who
                      cannot see it, so this is for the eye only.
                    */}
                    <span className="hbw-lamp__no" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </button>
                ) : null}
                {one.video ? (
                  <video
                    src={one.video}
                    poster={one.src}
                    /* Not when the reader has asked for less movement: a
                       looping film with no stop is the one thing they cannot
                       opt out of. The poster is the same frame. */
                    /*
                     * Only the films you are near.
                     *
                     * Every frame in the band autoplayed, so opening a
                     * project downloaded every film in it at once — fifteen
                     * megabytes on KOJA, most of it for pictures three
                     * screens away. The ones in reach play and the rest hold
                     * their poster until you get to them.
                     */
                    autoPlay={!stillness && Math.abs(i - at) <= 2}
                    muted
                    loop
                    playsInline
                    preload={Math.abs(i - at) <= 2 ? "metadata" : "none"}
                  />
                ) : near ? (
                  <img
                    src={one.src}
                    alt={i === at ? one.alt ?? "" : ""}
                    /* The frame you are on and the two either side are what
                       a reader sees while the sheet is still up, so they are
                       asked for first and the rest stay lazy. */
                    loading={Math.abs(i - at) <= 2 ? undefined : "lazy"}
                    fetchPriority={i === at ? "high" : undefined}
                    decoding="async"
                  />
                ) : null}
              </div>
            );
          }),
          next ? (
            <div className="hbw-lamp__page hbw-lamp__page--next" key="next" data-here={onHandover}>
              <button type="button" onClick={() => onNext?.()} aria-label={`Open ${next.name}`}>
                {/*
                  A glimpse of the next project's own work.
                  
                  A mark on a panel was a card about what is coming; its first
                  frame is the thing itself, arriving at the edge of this one.
                  The foot already names it, so nothing here has to.
                */}
                {next.peek ? (
                  <img
                    className="hbw-lamp__peek"
                    src={next.peek}
                    srcSet={next.peekSet}
                    /* It is a quarter of the screen wide but the whole of
                       it tall, and covers — so the width it has to supply is
                       far more than the width it occupies. */
                    sizes="(max-width: 760px) 100vw, 60vw"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="hbw-lamp__hand">{next.mark}</span>
                )}
              </button>
            </div>
          ) : null]}
        </div>

      </div>

      {/*
        The floor: the work either side of this one, always.

        Named rather than arrowed. The arrows on the field step a frame, and a
        second pair of arrows a few pixels below them, meaning something a
        hundred times bigger, is the kind of thing that makes a visitor stop
        trusting a control. These say which project they open.
      */}
      {/*
        The writing itself, under the ways through.

        It was a word the width of the screen that you pressed. A word that
        big is a title, and it sat where a title would — so it read as the
        name of the thing rather than as a way into it. Information is a
        button now, beside Previous and Next, because that is what it does:
        the same kind of move, in the same kind of control.
      */}
      {info ? (
        <div className="hbw-lamp__info" ref={infoRoom}>
          {info}
        </div>
      ) : null}

      {(full || closing) && shots[Math.min(at, shots.length - 1)] ? (
        <div
          className="hbw-lamp__full"
          data-closing={closing ? "true" : undefined}
          role="group"
          aria-label={`Frame ${at + 1} of ${shots.length}`}
        >
          {(() => {
            const one = shots[Math.min(at, shots.length - 1)];
            return one.video ? (
              <video src={one.video} poster={one.src} autoPlay={!stillness} muted loop playsInline />
            ) : (
              <img src={one.src} alt={one.alt ?? ""} />
            );
          })()}
          {/*
            The set is still walkable from in here.
            
            Opening one picture should not mean leaving the others: either
            side steps, the keys do too, and the count in the bar above says
            where you are the whole time.
          */}
          <button
            type="button"
            className="hbw-lamp__full-step hbw-lamp__full-step--back"
            aria-label="Previous frame"
            onClick={() => step(-1)}
          />
          <button
            type="button"
            className="hbw-lamp__full-step hbw-lamp__full-step--on"
            aria-label="Next frame"
            onClick={() => step(1)}
          />
          {/*
            The end of the set, and the way on from it.

            On the last frame the forward half of the picture had nothing to
            do: you could press it and stay where you were, with no sign the
            project had ended. The rail says so by handing over to the next
            project's plate; in here there is no rail, so it is said the only
            way this view can say anything — one control, arriving on its own
            beat once you have had a moment with the last picture.
          */}
          {next && at === shots.length - 1 ? (
            <button type="button" className="hbw-lamp__onward" onClick={() => onNext?.()}>
              Next <span className="hbw-ink">{next.name}</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {prev || next ? (
        <nav className="hbw-lamp__feet" aria-label="Projects">
          {prev ? (
            <button type="button" className="hbw-lamp__foot" onClick={() => onPrev?.()}>
              <span className="hbw-m">Previous</span> {prev.name}
            </button>
          ) : (
            <span />
          )}
          {info ? (
            <button
              type="button"
              className="hbw-lamp__foot hbw-lamp__foot--info"
              aria-expanded={reading}
              onClick={() => setReading(!reading)}
            >
              {reading ? "Close" : "Information"}
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button type="button" className="hbw-lamp__foot is-on" onClick={() => onNext?.()}>
              <span className="hbw-m">Next</span> {next.name}
            </button>
          ) : (
            <span />
          )}
        </nav>
      ) : null}


    </div>
  );
}
