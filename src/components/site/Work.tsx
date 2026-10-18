"use client";

/**
 * The site, as one page.
 *
 * The work is the page: a contact sheet per project, and a project opens as a
 * gallery over it. There is no case-study page any more — opening a project
 * used to mean leaving this one for a collage of the same pictures, which was
 * two places showing one thing.
 *
 * The address still changes. /projects/<slug> is a real, indexable page that
 * renders this same sheet with the gallery already open, so a link someone
 * shares, or a crawler follows, arrives at the project and not at the top of
 * the site. Opening one here pushes that address; closing goes back.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import type { GalleryProject } from "@/sanity/load-gallery";
import { useStillness } from "@/components/site/still";
import type { InfoData } from "@/components/site/project-info";
import { Catalogue } from "@/components/site/Catalogue";
import { Lightbox } from "@/components/site/Lightbox";
import type { Shot } from "@/components/site/shots";
import { InfoBody } from "@/components/site/InfoBody";

/** A project's sequence, once it is known — from the server or from the route. */
type Run = { name: string; says: string; shots: Shot[]; info: InfoData };
type Open = Run & {
  slug: string;
  at: number;
  /** Whether the project opens with its frame already full bleed. */
  full?: boolean;
  /**
   * Whether this project arrived from another one rather than from the page.
   *
   * It changes what the nav has to do before the work may land. Coming from
   * the catalogue the nav is built — blocks in from the edges, then the type
   * — and the work waits all of it out. Handing over, the nav is already
   * standing there and the only thing that moves is the mark and the count
   * changing inside bubbles that do not move. Waiting out a construction
   * that is not happening left the room empty for six hundred milliseconds
   * between the set that left and the set that came.
   */
  over?: boolean;
};

export type Opening = Open;

/**
 * A CSS time, in milliseconds.
 *
 * getComputedStyle normalises a custom property, so "240ms" comes back as
 * ".24s" — and parseFloat on that is 0.24, which as a timeout is no wait at
 * all. Both the handover and the way out were reading their own duration and
 * getting a quarter of a millisecond, so the gallery vanished instead of
 * leaving. The unit is the whole point, so it is read.
 */
function msOf(value: string) {
  const time = value.trim();
  const amount = parseFloat(time);
  if (!Number.isFinite(amount)) return 0;
  return time.endsWith("ms") ? amount : amount * 1000;
}

/** Which frame an address is asking for. ?f=1 is the first. */
function frameAsked(search: string) {
  const asked = Number(new URLSearchParams(search).get("f"));
  return Number.isInteger(asked) && asked > 0 ? asked - 1 : 0;
}

export function Work({
  projects,
  marks,
  opening = null,
}: {
  projects: GalleryProject[];
  marks: Record<string, ReactNode>;
  /** Set when the address already names a project, so it opens on arrival. */
  opening?: Opening | null;
}) {
  const [open, setOpen] = useState<Open | null>(opening);
  const [bar, setBar] = useState<HTMLElement | null>(null);
  /** Whether a sheet — the studio, or contact — is over everything else. */
  const [sheet, setSheet] = useState(false);
  /** The information, open or shut, across whichever project you walk to. */
  const [reading, setReading] = useState(false);
  const loop = useRef<HTMLDivElement>(null);
  /** Whether the loop has been placed on the join yet. Once only. */
  const landed = useRef(false);
  /** Which project is currently in colour and moving. */
  const alive = useRef<string | null>(null);

  /**
   * The bar's right-hand slot, borrowed while a project is open.
   *
   * The name has to be said once and in one place. The slot is the page's —
   * the positioning on the sheet, the project on a project's own address —
   * so while the gallery is up it says whichever project the gallery is
   * showing, which the page itself cannot know.
   */
  useEffect(() => setBar(document.querySelector<HTMLElement>(".hbw-bar__what")), []);

  /*
   * Where the nav ends, said out loud for the gallery to hang from.
   *
   * The gallery's offset had been a sum of tokens — gutter plus pill plus
   * gap plus mark — which is arithmetic standing in for a measurement, and
   * it was out by twenty-three pixels. Crossing into a project opened a gap
   * under the nav that exists nowhere else on the site, so the two rows of
   * chrome stopped reading as one piece.
   *
   * Read off the bar itself, as the hand-over point already is, so the two
   * can never drift apart: whatever the nav turns out to be at this width,
   * the gallery's row starts the same two pixels below it that the bar
   * keeps between its own rows.
   */
  useEffect(() => {
    const say = () => {
      const row =
        document.querySelector<HTMLElement>(".hbw-bar__mark") ??
        document.querySelector<HTMLElement>(".hbw-bar");
      if (!row) return;
      /*
       * Where it sits, not where it is being drawn.
       *
       * The nav arrives by sliding down into place, so a rect read on mount
       * is the animation's position rather than the row's — fourteen pixels
       * out, and frozen there. offsetTop and offsetHeight ignore transforms
       * and give the row where the layout put it, which is the only answer
       * that is the same before, during and after the arrival.
       */
      /*
       * Built from the bar's own padding rather than read off the row.
       *
       * offsetTop is a whole number, and the bar's padding is 6.48 — so the
       * gallery hung at 32 while the bar's second row began at 32.48, and the
       * count and the line beside it were half a pixel out of step all the
       * way along. The padding is exact and, unlike a rect, it is not moved
       * by the arrival animation.
       */
      const bar = row.closest(".hbw-bar") ?? row;
      const pad = parseFloat(getComputedStyle(bar).paddingTop) || 0;
      document.documentElement.style.setProperty(
        "--bar-bottom",
        `${pad + row.offsetHeight}px`,
      );
    };
    say();
    const watch = new ResizeObserver(say);
    const bar = document.querySelector(".hbw-bar");
    if (bar) watch.observe(bar);
    window.addEventListener("resize", say);
    return () => {
      watch.disconnect();
      window.removeEventListener("resize", say);
    };
  }, []);

  /*
   * The sheet has the chrome while it is open.
   *
   * The slot said which project the gallery was showing even with the studio
   * open over it, so the page you were reading was headed by the name of a
   * bar. Whoever is on top does the naming.
   */
  useEffect(() => {
    /*
     * Watched for, not listened for. The sheet is opened with pushState,
     * which fires neither hashchange nor popstate, so asking the address
     * never heard it. The sheet's own arrival is the only honest signal.
     */
    const read = () => setSheet(Boolean(document.querySelector(".hbw-studio-sheet")));
    read();
    const eyes = new MutationObserver(read);
    eyes.observe(document.body, { childList: true, subtree: true });
    return () => eyes.disconnect();
  }, []);

  /** Sequences already fetched. Reopening a project asks the network once. */
  const known = useRef(new Map<string, Run>());
  if (opening && !known.current.has(opening.slug)) {
    known.current.set(opening.slug, {
      name: opening.name,
      says: opening.says,
      shots: opening.shots,
      info: opening.info,
    });
  }

  /** Sequences being asked for now, so two askers share one request. */
  const asking = useRef(new Map<string, Promise<Run | null>>());

  /*
   * Learning a project, apart from showing it.
   *
   * Pulled out of show so the projects either side can be learned before
   * anybody asks for them — stepping to an uncached one took two thirds of a
   * second on the network, and the gallery sat empty for all of it. A second
   * caller now joins the request already in flight instead of starting
   * another or, as it used to, quietly giving up.
   */
  const learn = useCallback((slug: string): Promise<Run | null> => {
    const had = known.current.get(slug);
    if (had) return Promise.resolve(had);
    const going = asking.current.get(slug);
    if (going) return going;
    const job = (async () => {
      try {
        const answer = await fetch(`/api/sequence/${slug}`);
        if (!answer.ok) return null;
        const run = await answer.json();
        const got: Run = {
          name: run.name,
          says: `${run.name} — ${run.idea}, ${run.year}`,
        shots: (
          run.frames as {
            id: string;
            src: string;
            video?: string;
            webm?: string;
            width?: number;
            height?: number;
          }[]
        ).map((frame) => ({
          id: frame.id,
          src: frame.src,
          video: frame.video,
          webm: frame.webm,
          width: frame.width,
          height: frame.height,
        })),
          info: run.info,
        };
        known.current.set(slug, got);
        return got;
      } catch {
        /* Offline, or the route is gone: the sheet is still the whole site. */
        return null;
      } finally {
        asking.current.delete(slug);
      }
    })();
    asking.current.set(slug, job);
    return job;
  }, []);

  const stillness = useStillness();
  /** Pictures already asked for, so a neighbour is warmed once and not again. */
  const warmed = useRef<Set<string>>(new Set());

  /*
   * The cover is gone, and so is everything that lifted it.
   *
   * A white sheet went up over the panel while a project handed over, and
   * a watcher held it there until the new set had drawn, its rail was back
   * at full strength and its writing had landed. All of it existed because
   * the panel's ground was glass: an empty band meant the homepage showing
   * through. Measured frame by frame on a press of Next, the sheet itself
   * was one wholly white frame on the rail and five in the grid — a flash
   * put there to hide a flash.
   *
   * The ground is the plate's own now, dark and blurred in every view, so
   * an empty band over it is the room rather than a fault. Nothing to
   * hide, nothing to wait for, and one fewer thing that could decide to
   * stay up for six seconds on a slow connection.
   */

  /**
   * The catalogue goes before the project comes.
   *
   * Opening a project used to be one moment: the nav moved and the new work
   * appeared, with the page you were leaving simply replaced underneath the
   * cover. It is three now, in the order a reader can follow — the work you
   * were looking at swipes down and off, the chrome moves to where it is
   * going, and then the project arrives. Each waits for the one before it,
   * so the whole thing reads as a single move rather than three at once.
   *
   * The wait is read from the token the leaving is drawn with, so the two
   * cannot drift apart, and with movement stood down there is no wait at
   * all — the stages collapse to the one event they describe.
   */
  /**
   * And the catalogue comes back when there is no project over it.
   *
   * The leaving state is set on the way into a project and nothing cleared
   * it, because the home loop is never unmounted — it waits underneath. So
   * closing the project returned you to a catalogue still clipped to
   * nothing from the last time you left it.
   */
  useEffect(() => {
    if (open) return;
    for (const one of document.querySelectorAll<HTMLElement>(".hbw-turn")) {
      delete one.dataset.leaving;
    }
  }, [open]);

  const leave = useCallback(
    (slug: string, at: number) => {
      const turn = document.querySelector<HTMLElement>(".hbw-turn");
      if (!turn || stillness) {
        void show(slug, at);
        return;
      }
      const out = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--out")
      );
      const ms = Number.isFinite(out) && out > 0 ? out * (out < 20 ? 1000 : 1) : 240;
      for (const one of document.querySelectorAll<HTMLElement>(".hbw-turn")) {
        one.dataset.leaving = "true";
      }
      window.setTimeout(() => void show(slug, at), ms);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stillness]
  );

  const show = useCallback(
    async (slug: string, at: number, push = true, began = false, over = false) => {
      const place = () => {
        if (!push) return;
        const where = `/projects/${slug}${at ? `?f=${at + 1}` : ""}`;
        if (window.location.pathname + window.location.search !== where) {
          window.history.pushState(null, "", where);
        }
      };
      const got = known.current.get(slug) ?? (await learn(slug));
      if (!got) return;
      setOpen({ slug, at, ...got, full: began, over });
      place();
    },
    [learn]
  );

  const close = useCallback(() => {
    /*
     * Back to where you were, not to where you started.
     *
     * You might have opened SCK and walked on to KOJA; the page behind is
     * still sitting at SCK. Closing scrolls it to whichever project you were
     * actually looking at — the copy of it nearest where the page already is,
     * because the work is laid out three times and jumping to the wrong turn
     * would throw you a whole loop away.
     */
    const slug = open?.slug;
    setOpen(null);
    setReading(false);
    if (/^\/projects\//.test(window.location.pathname)) window.history.pushState(null, "", "/");
    if (!slug) return;
    const here = window.scrollY;
    let best: HTMLElement | null = null;
    let gap = Infinity;
    for (const section of document.querySelectorAll<HTMLElement>(`[data-project="${slug}"]`)) {
      const to = Math.abs(section.getBoundingClientRect().top + here - here);
      if (to < gap) {
        gap = to;
        best = section;
      }
    }
    best?.scrollIntoView({ block: "start" });
  }, [open?.slug]);

  /**
   * The frame a shared link asks for.
   *
   * /projects/sck?f=7 is prerendered, so the page that opens the gallery was
   * built without ever seeing the query — it always opens on the first frame.
   * Read before paint, so the seventh is the one that appears rather than the
   * one that replaces the first.
   */
  useLayoutEffect(() => {
    if (!opening) return;
    const asked = frameAsked(window.location.search);
    if (!asked || asked >= opening.shots.length) return;
    setOpen((was) => (was && was.slug === opening.slug ? { ...was, at: asked } : was));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening?.slug]);

  /**
   * The gallery is a dark wash over a light sheet, and the fixed chrome paints
   * above it. While it is open the chrome reads against the wash rather than
   * against the page it belongs to, so it is told which of the two it is on.
   */
  useEffect(() => {
    const root = document.documentElement;
    /*
     * One site, one set of inks.
     *
     * Opening a project used to flip the whole document to the dark token
     * set — different ground, different greys, different rules — so the work
     * and the gallery read as two sites that happened to share a nav. The
     * gallery is a surface over this page, not another place.
     */
    root.classList.remove("hbw-lit");
    return () => root.classList.remove("hbw-lit");
  }, [open]);

  /** The address is the state. Back and forward close and reopen. */
  useEffect(() => {
    const walked = () => {
      const match = /^\/projects\/([a-z0-9-]+)/i.exec(window.location.pathname);
      if (match) void show(match[1], frameAsked(window.location.search), false);
      else setOpen(null);
    };
    window.addEventListener("popstate", walked);
    return () => window.removeEventListener("popstate", walked);
  }, [show]);

  /**
   * The project either side of this one, in the order the sheet lists them,
   * wrapping round so the last hands on to the first and the work never ends
   * on a dead stop.
   */
  const beside = useCallback(
    (slug: string, way: 1 | -1) => {
      const at = projects.findIndex((project) => project.slug === slug);
      if (at < 0) return null;
      const to = projects[(at + way + projects.length) % projects.length];
      if (!to || to.slug === slug) return null;
      /*
       * A glimpse of the work, not a card with a logo on it.
       *
       * The next project's own first frame says more about what is coming
       * than its mark does — and it is the same kind of thing as everything
       * else on the band, so the end of one project reads as the start of the
       * next rather than as a slide between them.
       */
      const peek = to.frames?.[0];
      return {
        slug: to.slug,
        name: to.name,
        mark: marks[to.slug] ?? to.name,
        peek: peek?.src,
        peekSet: peek?.srcset,
      };
    },
    [projects, marks]
  );

  /*
   * The projects either side, learned while you are looking at this one.
   *
   * Stepping to a project nobody had opened yet meant waiting on the network
   * with the gallery already emptied — the leaving animation took a quarter
   * of a second and the fetch took two thirds of one, so for most of a
   * second there was nothing in the room. Both neighbours are fetched
   * quietly as soon as a project settles, so the step is a swap.
   */
  useEffect(() => {
    if (!open) return;
    const near = [beside(open.slug, 1), beside(open.slug, -1)];
    const waiting = window.setTimeout(() => {
      for (const to of near) {
        if (!to) continue;
        void (async () => {
          const got = known.current.get(to.slug) ?? (await learn(to.slug));
          if (!got) return;
          /*
           * And the pictures, not only the list of them.
           *
           * Learning a neighbour fetched its frames as data and stopped
           * there, so pressing Next swapped to a project whose every
           * picture was still unrequested. Measured on a hand-over, none
           * of the seventeen had loaded by the time the panel was built
           * and the first arrived around a second later — so the room
           * stood empty while the work was fetched, which is the hole
           * the white sheet used to be covering.
           *
           * All of them, as soon as this project settles. Ten was a
           * screenful of the rail and most of a grid, and the rest showed:
           * filmed frame by frame, the next project's grid came in with
           * holes in it and filled them over the following half second,
           * which reads as the set assembling itself rather than arriving.
           * Decoded asynchronously and never attached, so nothing is laid
           * out and nothing competes with the project actually on screen.
           */
          for (const shot of got.shots) {
            if (!shot.src || warmed.current.has(shot.src)) continue;
            warmed.current.add(shot.src);
            const warm = new window.Image();
            warm.decoding = "async";
            warm.src = shot.src;
          }
        })();
      }
    }, 400);
    return () => window.clearTimeout(waiting);
  }, [open, beside, learn]);

  /**
   * Which project the page is standing in, told to the bar.
   *
   * Read from where the sections actually are rather than from a count of
   * pixels: the one whose top has passed under the chrome is the one you are
   * looking at. Above the first, nobody is — which is how the mark and the
   * positioning line get their own place back at the top of the page.
   */
  useEffect(() => {
    const say = (detail: { name: string; says: string } | null) =>
      window.dispatchEvent(new CustomEvent("hbw:over", { detail }));
    /*
     * A project open is a project you are standing in.
     *
     * This bailed out and let the gallery push its own line into the chrome,
     * so the bar read differently depending on whether the work was open or
     * merely scrolled past. Told the same thing either way, the nav on a
     * project is the nav on the catalogue.
     */
    if (open) {
      /*
       * The line, not the whole title.
       *
       * open.says is "NAME - idea, year", which is what the gallery's own
       * row used to print. The bar's line carries the idea alone on the
       * index, so a project open should read the same: the name above, the
       * idea beneath.
       */
      const here = projects.find((one) => one.slug === open.slug);
      say({ name: open.name, says: here?.idea ?? open.says });
      return;
    }
    let waiting = 0;
    const read = () => {
      waiting = 0;
      /*
       * The studio has the chrome while it is open.
       *
       * It names the part being read in the same slot, and two things writing
       * to one slot every frame is a flicker, not a handover. The page behind
       * says nothing until the sheet is shut.
       */
      if (document.querySelector(".hbw-studio-sheet")) return;
      /*
       * The handover happens where the bar's own pills are, not where the
       * chrome ends.
       *
       * Read off the bar itself rather than off a token, so the two can never
       * drift apart. A project's name and its line are already in the bar's
       * two columns — the name on the gutter, the line on the right — so as
       * the band arrives at that row the bar takes the words over and the
       * band gives them up in the same place, at the same moment. Measured at
       * the end of the chrome instead, the band stopped 44 short of the bar
       * and the name was printed twice while it closed the gap.
       */
      const bar = document.querySelector<HTMLElement>(".hbw-bar");
      // Where a project's row comes to rest: just under the chrome, which now
      // holds the middle of the screen. Measured at the mark's own top instead,
      // the switch fired a whole project early — at every resting place the
      // middle named the project above the one you had stopped on.
      const hand = bar ? bar.getBoundingClientRect().bottom + 48 : 16;
      /*
       * Every section of both turns, in the order they are laid out: the last
       * one whose top has passed the line is the one you are standing in.
       * Asking for a slug by name instead found the first turn's copy of it
       * and named that, so on the second turn the middle fell a whole turn
       * behind what was on the screen.
       */
      let now: { name: string; says: string } | null = null;
      const sections = document.querySelectorAll<HTMLElement>("[data-project]");
      for (const section of sections) {
        const box = section.getBoundingClientRect();
        /*
         * The line has to be inside the project, not merely past its top.
         *
         * Past-the-top alone, the last project went on being named through
         * the white that follows it — so the stretch the loop comes up for
         * air in was still captioned with the work that had just gone by,
         * and the studio's own name never came back between turns.
         */
        const handed = box.top <= hand + 1 && box.bottom > hand;
        section.toggleAttribute("data-handed", handed);
        if (!handed) continue;
        const project = projects.find((one) => one.slug === section.dataset.project);
        // Just the idea: the year is on the page now, at the head of the row,
        // and the middle of the screen saying it as well was saying it twice.
        if (project) now = { name: project.name, says: project.idea };
      }
      say(now);

      /*
       * The project you are standing in plays.
       *
       * The sheets are grey so six jobs read as one body of work — but the one
       * the chrome is naming is not one of six any more, it is the one you are
       * looking at, so it is shown as it is: in colour, and moving. Only when
       * it changes: asking a dozen films to play on every frame of a scroll is
       * a request the browser has to answer every time.
       */
      const named = now?.name ?? null;
      if (named !== alive.current) {
        alive.current = named;
        for (const one of sections) {
          const on = one.hasAttribute("data-handed");
          /*
           * One film to a project, not every film in it.
           *
           * Three ran at once, each drawn at 144 square and each natively
           * sixteen hundred wide — seventy times the pixels the cell can
           * show, and 1.1MB of the front page. The first one carries the
           * idea that this project is alive; the rest were costing a
           * megabyte to say it three times. The others hold their still.
           *
           * The real fix is smaller files; this is what can be done from
           * here until they exist.
           */
          const reel = Array.from(one.querySelectorAll("video"));
          for (const [place, film] of reel.entries()) {
            if (place > 0) {
              film.pause();
              continue;
            }
            if (!on) {
              film.pause();
              continue;
            }
            /*
             * Asked again when it is ready to answer.
             *
             * This ran once, on the frame a project changed hands, and threw
             * the rejection away — so any film that had not loaded yet was
             * asked at the one moment it could not say yes, and nothing ever
             * asked it a second time. Most of a project's films were still
             * holding their poster. Whatever is not playing yet gets another
             * go the moment it has something to play.
             */
            const start = () => {
              if (!one.hasAttribute("data-handed")) return;
              /*
               * Asked for no motion, the work holds still.
               *
               * These films loop with no way to stop them, which is the one
               * thing a visitor who has asked their system for less movement
               * cannot sit through. The poster frame is the same picture.
               */
              if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
              void film.play().catch(() => {});
            };
            start();
            if (film.readyState < 3) {
              film.addEventListener("canplay", start, { once: true });
              film.addEventListener("loadeddata", start, { once: true });
            }
          }
        }
      }
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
      say(null);
    };
  }, [open, projects]);

  /**
   * The seam.
   *
   * One turn down, the scroll goes back one turn; at the very top, a push
   * upwards goes forward one turn. Both land on the same view they left,
   * because both turns are the same. The browser will not scroll above zero,
   * so going back up has to be caught on the wheel rather than waited for.
   */
  useEffect(() => {
    if (open) return;
    const host = loop.current;
    if (!host) return;
    const turn = () => Math.round(host.scrollHeight / 3);

    /*
     * The reader is kept on the middle turn, with a whole turn either side.
     *
     * Two turns were enough to make the seam invisible going down, but the
     * top of the document is still the top of the document: in the white
     * between projects there was nothing above, so there was no way to tell
     * the page went back as well as on. Held in the middle, there is always
     * work above and work below, whichever way you push.
     */
    const watch = () => {
      const round = turn();
      if (round <= 0) return;
      const y = window.scrollY;
      if (y >= round * 2) window.scrollTo(0, y - round);
      else if (y < round) window.scrollTo(0, y + round);
    };

    /*
     * Opened looking at the join.
     *
     * Not at the top of the white but a little way into it, so the project
     * just gone is still showing above the fold and the next one's row is
     * below: the page says, before anything is scrolled, that it runs both
     * ways.
     */
    const land = () => {
      const round = turn();
      const sheets = host.querySelectorAll<HTMLElement>(".hbw-sheet");
      /*
       * On the work, not on the join.
       *
       * This opened a little way into the white between the last project of
       * one turn and the first of the next, so the page said it ran both ways
       * before anything was scrolled. Then the foot moved into that white —
       * and the first thing anybody saw on arriving was a newsletter field
       * and a row of ways out. Worse, a join is between projects, so nothing
       * was in colour and not one film was playing.
       *
       * It opens on the first project of the middle turn instead. There is
       * still a whole turn above, so the page still runs both ways; it just
       * starts on the work, which is what the page is.
       */
      const first = sheets[Math.floor(sheets.length / 3)];
      if (!round || !first) return;
      const band = first.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, Math.max(0, Math.round(band) - 1));
    };
    /*
     * Only on arrival, never on the way back.
     *
     * This effect runs again when a project closes, and landing a second time
     * threw the reader to the opening view — you opened KOJA from halfway
     * down and came back to the top of the loop. The page is only placed when
     * it is first met.
     */
    if (!landed.current) {
      landed.current = true;
      /*
       * Placed at once, and held there until the page stops moving.
       *
       * The second attempt was hung off document.fonts.ready, which on a
       * cold connection does not resolve for eight seconds — so the first
       * thing a visitor saw, for eight seconds, was the foot of the site: a
       * newsletter field and a row of ways out, with the work below the fold.
       * Then it jumped.
       *
       * The browser also restores the scroll of a reloaded page after this
       * runs, which is the other way the first attempt was being undone, so
       * that is turned off for the loop.
       *
       * Now it lands, and keeps landing for as long as the page is still
       * settling — a few frames, or until the reader takes over, whichever
       * comes first. Nobody waits for a font to be ready to be shown the
       * work.
       */
      try {
        if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      } catch {
        /* a browser that will not have it simply restores; the retry covers it */
      }

      /*
       * The reader taking over is a fact, not an inference.
       *
       * Both of these stood down by comparing where the page is now with
       * where they last put it, and giving up if it had moved more than two
       * pixels. Which is a guess about intent made from a number: a reader
       * easing into a trackpad scroll moves less than that between frames,
       * and the gentler the scroll the more likely the page was to decide
       * nobody had touched it and haul them back. Fonts resolving late made
       * it worse — that second landing fires whenever it fires, and on a
       * cold connection that can be seconds after the reader started
       * reading.
       *
       * So the page listens for the reader instead. One touch of the wheel,
       * a finger, a key or the scrollbar and the landing is over for good,
       * which is the same test the inline script above already uses.
       */
      let taken = false;
      const theirs = () => {
        taken = true;
      };
      for (const name of ["wheel", "touchstart", "keydown", "pointerdown"]) {
        window.addEventListener(name, theirs, { passive: true, once: true });
      }

      let tries = 0;
      let mine = -1;
      const settle = () => {
        if (taken) return;
        /* And still stand down if the page moved without us hearing it. */
        if (mine >= 0 && Math.abs(window.scrollY - mine) > 2) return;
        land();
        mine = window.scrollY;
        if (++tries < 30) requestAnimationFrame(settle);
      };
      settle();
      void document.fonts?.ready.then(() => {
        if (taken) return;
        if (mine >= 0 && Math.abs(window.scrollY - mine) <= 2) land();
      });
    }

    window.addEventListener("scroll", watch, { passive: true });
    return () => window.removeEventListener("scroll", watch);
  }, [open]);

  /**
   * Work, and the studio's name, are the way back out of a project.
   *
   * They are ordinary links to the front page, so they reloaded it. With a
   * project open they close it instead, and they close it the way the
   * handover leaves — the gallery goes first, then the page is underneath.
   */
  useEffect(() => {
    if (!open) return;
    const back = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      const target = event.target as Element | null;
      const link = target?.closest<HTMLAnchorElement>(".hbw-bar__nav a, .hbw-bar__mark a");
      if (!link || new URL(link.href).pathname !== "/") return;
      event.preventDefault();
      const lamp = document.querySelector<HTMLElement>(".hbw-lamp");
      const out =
        msOf(getComputedStyle(document.documentElement).getPropertyValue("--out"));
      if (!lamp || out === 0) {
        close();
        return;
      }
      lamp.dataset.going = "true";
      window.setTimeout(close, out);
    };
    document.addEventListener("click", back, true);
    return () => document.removeEventListener("click", back, true);
  }, [open, close]);

  /** Walking the set keeps the address honest without stacking history. */
  const step = useCallback(
    (at: number) => {
      setOpen((was) => (was ? { ...was, at } : was));
      const slug = open?.slug;
      if (!slug) return;
      // The handover sits one past the last frame, so it has no ?f to claim:
      // the address would otherwise offer a seventeenth of sixteen.
      const real = at > 0 && at < (open?.shots.length ?? 0);
      window.history.replaceState(null, "", `/projects/${slug}${real ? `?f=${at + 1}` : ""}`);
    },
    [open?.slug, open?.shots.length]
  );

  return (
    <>
      {/*
        The work, twice.
        
        The page has no end: you run through the projects, out into white with
        the studio's name and positioning on it, and into the projects again.
        The second turn is what the first scrolls into — at the seam the
        scroll is sent back one turn, and because the two turns are identical
        the view either side of the jump is the same view. One copy and the
        jump would be visible; this way there is nothing to see.
      */}
      {/*
        The gallery before the sheet behind it.
        
        It was rendered last, so the first heading in the document was a year
        on a catalogue row and the project's own name came after six of them.
        It is a fixed overlay either way — nothing moves — but a page should
        lead with what it is about.
      */}
      {/*
        Nothing portalled into the bar any more.
        
        The open project was pushed into the chrome as a line of its own,
        which is why a project page said "How by Why" with the project's name
        underneath it in a second row — while the catalogue, scrolled to the same
        project, said the project's name with its line beneath. Two ways of
        saying where you are. The bar is told the same way in both cases now,
        by the event below.
      */}
      {/*
        The cover, behind the gallery and above the page.
        
        Painted under the panel rather than inside it, so the panel's glass
        has white to sample instead of the work underneath — which is what
        was showing through. Rendered here because this component survives a
        project change and the panel does not: a cover built at the same
        moment as the thing it is meant to be covering is always one frame
        too late.
      */}
      {/*
        The white sheet is gone.

        It was put up to hide the gallery's glass while the next project's
        pictures arrived, because through the glass you saw the homepage
        behind and that read as a page that had failed. But the catalogue
        now stays where it is and travels down as the project comes over
        it, so what is behind the glass is the thing you just left — which
        is the same answer the picture plate gives over the grid, and the
        reason you can see there is something to come back to.

        It was also the one white frame in the site: measured across the
        hand-over, nine tenths of the screen went blank on the fifth frame
        and came back. Nothing covers anything with nothing any more.
      */}
      {open ? (
        <Lightbox
          /*
           * Keyed on the project, so moving to the next one mounts a new
           * gallery rather than swapping the contents of the old one. The
           * leaving state belongs to the element that is leaving, and the
           * arriving animations get something to arrive.
           */
          key={open.slug}
          began={open.full}
          over={open.over}
          shots={open.shots}
          at={open.at}
          onAt={step}
          onClose={close}
          reading={reading}
          setReading={setReading}
          name={open.name}
          says={open.says}
          idea={projects.find((one) => one.slug === open.slug)?.idea}
          info={<InfoBody data={open.info} name={open.name} />}
          next={beside(open.slug, 1)}
          onNext={() => {
            const to = beside(open.slug, 1);
            if (!to) return;
            /*
             * The nav is told now, not when the next project is built.
             *
             * It used to learn the new name from the gallery that replaces
             * this one, so the order ran: the set leaves, three hundred
             * milliseconds of nothing, the name turns over, and only then
             * does the work arrive. Filmed frame by frame, the room was
             * blank from 368ms to past 1100 — the blink.
             *
             * The next project is known the moment you press, so the nav
             * changes while the set is still leaving. It still leads — it
             * has finished its move before the work lands — but the move
             * happens over the departure instead of in a gap after it.
             */
            const said = projects.find((one) => one.slug === to.slug);
            window.dispatchEvent(
              new CustomEvent("hbw:over", {
                detail: { name: to.name, says: said?.says ?? "" },
              })
            );
            /*
             * Out of this one, then into the next.
             *
             * Opening the next project on the click swapped one gallery for
             * another between two frames, which read as a fault rather than
             * as a move. The set leaves first — it is already going when you
             * click the thing that is coming — and the next arrives on its
             * own. The wait is the leaving animation's own length, read from
             * the stylesheet rather than guessed at, so the two can never
             * drift apart.
             */
            const lamp = document.querySelector<HTMLElement>(".hbw-lamp");
            const out =
              msOf(getComputedStyle(document.documentElement).getPropertyValue("--out"));
            if (!lamp || out === 0) {
              void show(to.slug, 0);
              return;
            }
            /*
             * The room stays solid for the whole hand-over.
             *
             * The flag has to outlive the panel: the gallery is keyed on the
             * project, so the one you are leaving is thrown away and a new
             * one is built for the project arriving. That new panel starts
             * with its usual glass ground and an empty band — its pictures
             * settle in over the best part of a second — so the homepage
             * came back through it after the swap, which is the flash that
             * survived fixing the leaving half. Held on the document, the
             * solid ground spans both panels and lifts once the work has
             * actually arrived.
             */
            /*
             * In order: the work leaves, then the room is held, then the
             * next project arrives.
             *
             * The room used to be held in the same breath as the leaving,
             * which meant the leaving happened underneath it — you pressed
             * Next and the set was simply gone. Nothing about that reads as
             * a sequence, because the only part you can see is the end of
             * it. The panel keeps its ground while the pictures go, so there
             * is nothing to hide for that quarter of a second; the sheet is
             * only needed for the instant the old panel is thrown away and
             * the new one is built.
             */
            /*
             * With a picture open, the hand-over is a step, not an exit.
             *
             * Out here the set leaves and the next one arrives in its place,
             * which is right for a rail you can see. In the full view there
             * is no set on screen to take away — there is one picture, and
             * taking it away put you back on the grid of a project you had
             * not asked to see yet. So the picture stays until the next one
             * covers it: the same travel every other step in there makes,
             * from the side you are going, with the nav moving first.
             */
            if (lamp.dataset.full === "true") {
              void show(to.slug, 0, true, true, true);
              return;
            }
            lamp.dataset.going = "true";
            window.setTimeout(() => {
              void show(to.slug, 0, true, false, true);
            }, out);
          }}
          prev={beside(open.slug, -1)}
          onPrev={() => {
            const to = beside(open.slug, -1);
            if (to) void show(to.slug, 0, true, false, true);
          }}
        />
      ) : null}
      <div className="hbw-loop" ref={loop} data-turns="3">
        {[0, 1, 2].map((pass) => (
          <div className="hbw-turn" key={pass}>
            <Catalogue
              projects={projects}
              onOpen={(slug, at) => void leave(slug, at)}
              pass={pass}
              /*
               * With a project open the gallery covers the whole window, and
               * the strip is behind it. It still fetched eighty of its
               * pictures on a page where not one of them could be seen —
               * three and a half megabytes of thumbnails competing with the
               * gallery the visitor was actually waiting for. Behind
               * something, it waits.
               */
              behind={open !== null}
            />
            {/*
              A foot you can scroll past.
              
              The page had none, which left it the one place on the site with
              no way to contact. A foot at the end of a page that has no end
              would be a wall, so it sits inside the turn: the work, the way
              to get in touch, and then the work again. The turns have to stay
              identical for the loop to wrap without a jump, so each one
              carries it.
            */}
            {/*
              No foot on the front page.

              The work is the page, and the foot was a second set of ways out
              underneath it — the studio's name, its addresses and a
              newsletter field, repeated once per turn of a loop that prints
              the catalogue three times. The nav carries the only two moves
              the front page needs, and everything the foot said lives in
              About, which is one of them.
            */}
          </div>
        ))}
      </div>

      {/*
        The page is placed before the bundle arrives.

        Landing was done in an effect, which cannot run until React has
        hydrated — and on a cold connection the bundle takes eight or nine
        seconds. For all of that time the first thing a visitor saw was the
        foot of the site, a newsletter field and a row of ways out, with the
        work below the fold; then it jumped to the work without being asked.

        The markup is already there, rendered on the server, so the position
        can be worked out the moment the loop has been parsed. This runs
        then, again when the document is ready and again on load, and stands
        down for good the first time the reader touches the page.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{
if('scrollRestoration' in history)history.scrollRestoration='manual';
var moved=false,stop=function(){moved=true;};
['wheel','touchstart','keydown','pointerdown'].forEach(function(n){window.addEventListener(n,stop,{passive:true,once:true});});
var go=function(){
if(moved)return;
var s=document.querySelectorAll('.hbw-sheet');
if(!s.length)return;
var f=s[Math.floor(s.length/3)];
if(!f)return;
var y=Math.max(0,Math.round(f.getBoundingClientRect().top+window.pageYOffset)-1);
if(Math.abs(window.pageYOffset-y)>2)window.scrollTo(0,y);
};
go();
document.addEventListener('DOMContentLoaded',go,{once:true});
window.addEventListener('load',go,{once:true});
}catch(e){}})();`,
        }}
      />
    </>
  );
}
