"use client";

/**
 * The studio, on the same structure as the front page.
 *
 * The front page works because the chrome holds the middle of the screen and
 * names where you are while the work runs past it. This does the same: a
 * vertical run of parts, each coming to rest just under the middle line, and
 * the chrome saying which part you are in.
 *
 * Everything that was here to make that happen by other means has gone — the
 * two carried columns, the four movements, the tall spacer they ran on, the
 * measured handover between them and the scroll-speed blur over the top. It
 * was a lot of machinery to move a page downwards, which is the one thing a
 * page does on its own.
 *
 * It is the short version, too. The press, the manifesto in full and the
 * ways into contact are on /studio, which is the page written to be found.
 * This is the one someone reads when they are already here.
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Footer } from "@/components/site/Footer";
import { MANIFESTO_COPY, STUDIO_COPY } from "@/components/home/studio-copy";
import { CONTACT_EMAIL, CONTACT_WAYS, STUDIO_PLACE } from "@/lib/contact";

/**
 * Seventeen hundred lines of editor has no business in the bundle of a sheet
 * that is mostly five paragraphs and an address. It loads when asked for.
 */
const PosterTool = dynamic(
  () => import("@/components/home/PosterTool").then((m) => m.PosterTool),
  { ssr: false }
);

/** A duration token in milliseconds, however it happens to be written. */
function beat(name: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const raw = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(name)
  );
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return raw < 20 ? raw * 1000 : raw;
}

const PARTS = [
  { id: "practice", name: "Practice" },
  { id: "approach", name: "Approach" },
  { id: "process", name: "Process" },
  { id: "manifesto", name: "Manifesto" },
  { id: "contact", name: "Talk" },
] as const;

const FACTS = [
  { label: "Led by", value: "Mark Blackler" },
  { label: "Works with", value: "Founders and leadership teams" },
  { label: "Based", value: STUDIO_PLACE },
];

export function StudioBody({ start }: { start?: string }) {
  const doc = useRef<HTMLDivElement>(null);
  /** Which part is being read, for the index to mark. */
  const [here, setHere] = useState<string>(PARTS[0].id);
  const said = useRef<HTMLDivElement>(null);
  const landed = useRef(false);

  /**
   * The poster is Contact's other state, not a window over the studio.
   *
   * It used to open as a layer: a portalled window with its own paper, its
   * own way out and its own focus trap, laid over the sheet you asked it
   * from. That is the one kind of move this site does not make — nothing
   * here appears on top of anything, it makes room.
   *
   * So the block does what every block does, only further. `tool` grows it
   * into the sheet, the reading stands down as it goes, and `armed` mounts
   * the tool only once the room is actually there. That order is not
   * politeness: the editor sizes its canvas from its wrapper and redraws on
   * every resize, so mounted into a growing block it would re-size on every
   * frame of the opening and reflow the drawing under your hand.
   */
  const [tool, setTool] = useState(false);
  const [armed, setArmed] = useState(false);
  const [going, setGoing] = useState(false);
  /**
   * Shut on its first frame, so there is something to open from.
   *
   * The other modules open with a keyframe, which this one could not use:
   * mounted into the page after the block has already made its room, the
   * animation never registered on it at all — declared, with a name and a
   * duration, and no animation object on the element at any frame of its
   * life. Driven from the markup instead it is a plain transition between
   * two states the component owns, which is also the more honest account
   * of what is happening: the tool is put there shut, and then opened.
   */
  const [arriving, setArriving] = useState(false);
  const staging = useRef(0);

  useEffect(() => () => window.clearTimeout(staging.current), []);

  /* Two frames: one for the shut state to be painted, one to leave it. */
  useEffect(() => {
    if (!arriving) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setArriving(false));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [arriving]);

  const openTool = useCallback(() => {
    window.clearTimeout(staging.current);
    setGoing(false);
    setTool(true);
    staging.current = window.setTimeout(() => {
      setArriving(true);
      setArmed(true);
    }, beat("--in", 560));
  }, []);

  /** It leaves the way it came: the tool stands down, then the block closes. */
  const shutTool = useCallback(() => {
    window.clearTimeout(staging.current);
    setGoing(true);
    staging.current = window.setTimeout(() => {
      setArmed(false);
      setArriving(false);
      setTool(false);
      setGoing(false);
    }, beat("--out", 300));
  }, []);

  /**
   * Where a part comes to rest, measured rather than assumed.
   *
   * The sheet is inset, so its scroller does not start at the top of the
   * screen — and a scroll-margin written in viewport units is read against
   * the scroller, not the window. Set in vh it put every part a hundred and
   * thirty pixels below the chrome. This is the distance from the top of the
   * scroller to just under the chrome, which is what the browser actually
   * wants, and it is re-read whenever the window changes.
   */
  useEffect(() => {
    const host = said.current;
    if (!host) return;
    const set = () => {
      const bar = document.querySelector<HTMLElement>(".hbw-bar");
      if (!bar) return;
      const rest = bar.getBoundingClientRect().bottom + 48 - host.getBoundingClientRect().top;
      host.style.setProperty("--rest", `${Math.round(rest)}px`);
      /*
       * Tell the watcher too, on an event of its own.
       *
       * It reads the same bar to decide which part is being read, and its one
       * reading on mount was taken against the same un-settled chrome — so
       * the sheet opened marking the second part while sitting on the first.
       *
       * Not a resize: this function is itself a resize listener, so firing
       * one here called it again, and again, until the stack gave out.
       */
      window.dispatchEvent(new Event("hbw:settled"));
    };
    /*
     * Measured once the chrome has finished moving.
     *
     * The bar slides from the middle of the screen to the top as the sheet
     * opens, and this was read on the first frame of that move — so the rest
     * line was computed against a bar still four hundred pixels down the
     * page. Every part came to rest that far too low, and the last one could
     * not reach the line at all. It is read again when the move ends, and
     * once more after it in case the move never ran.
     */
    set();
    const bar = document.querySelector<HTMLElement>(".hbw-bar");
    const settled = () => set();
    bar?.addEventListener("transitionend", settled);
    const after = window.setTimeout(set, 600);
    window.addEventListener("resize", set);
    return () => {
      bar?.removeEventListener("transitionend", settled);
      window.clearTimeout(after);
      window.removeEventListener("resize", set);
    };
  }, []);

  /**
   * The chrome names the part, the way it names a project.
   *
   * Told rather than wired: the bar does not know what a studio part is and
   * does not need to. The last part whose top has passed the line under the
   * chrome is the one being read.
   */
  /*
   * Scrolling moves from one block to the next.
   *
   * The blocks fit the screen between them, so there is no page left to
   * scroll — the wheel advances the reading instead: down opens the next
   * block and closes this one, up goes back. A block with more to say than
   * fits keeps its own scroll first, and only hands the wheel on once its
   * reading has run out, so nothing is skipped past unread. At either end
   * the gesture is left alone, so a reader can still get out of the sheet.
   */
  useEffect(() => {
    const host = said.current;
    if (!host) return;
    let carry = 0;
    let cooling = 0;
    let last = 0;
    const onWheel = (event: WheelEvent) => {
      /*
       * Narrow, the wheel is nobody's but the reader's.
       *
       * Advancing a block at a time is what this sheet does when it fills
       * the screen and each block is a panel of it. Stacked in a column
       * that is taller than the window — which is what it is on a phone —
       * the blocks are a page to be read down, and taking the gesture to
       * jump between them makes scrolling snap from one to the next
       * instead of moving. The column scrolls; nothing is intercepted.
       */
      if (window.matchMedia("(max-width: 760px)").matches) return;
      /*
       * One owner at a time.
       *
       * With the poster open the wheel is the tool's: a gesture over a
       * drawing is panning it or doing nothing, never advancing to the next
       * block. Closing it gives the wheel back to the sequence.
       */
      if (tool) {
        event.preventDefault();
        return;
      }
      const open = host.querySelector<HTMLElement>('.hbw-part[data-open="true"] .hbw-part__say');
      if (open) {
        const down = event.deltaY > 0;
        const left = down
          ? open.scrollTop + open.clientHeight < open.scrollHeight - 1
          : open.scrollTop > 1;
        if (left) return;
      }
      const at = PARTS.findIndex((part) => part.id === here);
      const next = at + (event.deltaY > 0 ? 1 : -1);
      if (next < 0 || next >= PARTS.length) return;
      event.preventDefault();
      if (Date.now() < cooling) return;
      /*
       * One gesture, one block, then a pause.
       *
       * A trackpad throws a long tail of events for a single flick, so a
       * low threshold and a short cooldown ran the whole studio past in
       * about a second. The tail is discarded — a gap of a sixth of a
       * second ends the gesture — and after a block opens the wheel is
       * ignored for long enough that the block has opened and its columns
       * have come in before the next push is heard.
       */
      const now = Date.now();
      if (now - last > 160) carry = 0;
      last = now;
      carry += event.deltaY;
      if (Math.abs(carry) < 140) return;
      carry = 0;
      cooling = now + 1100;
      setHere(PARTS[next].id);
    };
    host.addEventListener("wheel", onWheel, { passive: false });
    return () => host.removeEventListener("wheel", onWheel);
  }, [here, tool]);

  useEffect(() => {
    const host = said.current;
    if (!host) return;
    let waiting = 0;
    const read = () => {
      waiting = 0;
      const bar = document.querySelector<HTMLElement>(".hbw-bar");
      const line = bar ? bar.getBoundingClientRect().bottom + 48 : 120;
      let now: string | null = null;
      for (const part of host.querySelectorAll<HTMLElement>("[data-part]")) {
        const box = part.getBoundingClientRect();
        if (box.top <= line + 1 && box.bottom > line) now = part.dataset.part ?? null;
      }
      /*
       * The scroll no longer names the part.
       *
       * It did when the studio was a document and you scrolled past its
       * sections. The blocks fit the screen now and the wheel moves between
       * them, so a second thing setting the same state from where the parts
       * happen to sit would fight the first and the reading would jump.
       */
      void now;
      /*
       * The chrome stops naming the part.
       *
       * It said "Practice" in the middle of the screen while the index said
       * "Practice" in the margin — one indicator, in two places, three lines
       * apart. The index marks where you are; the chrome keeps the studio's
       * own name, as it does everywhere else.
       */
      window.dispatchEvent(new CustomEvent("hbw:over", { detail: null }));
    };
    const watch = () => {
      if (!waiting) waiting = requestAnimationFrame(read);
    };
    read();
    host.addEventListener("scroll", watch, { passive: true });
    window.addEventListener("resize", watch);
    window.addEventListener("hbw:settled", watch);
    return () => {
      host.removeEventListener("scroll", watch);
      window.removeEventListener("resize", watch);
      window.removeEventListener("hbw:settled", watch);
      if (waiting) cancelAnimationFrame(waiting);
      window.dispatchEvent(new CustomEvent("hbw:over", { detail: null }));
    };
  }, []);

  /**
   * Escape shuts the tool before it shuts the sheet.
   *
   * Taken in the capture phase and stopped there, so the studio under it
   * does not close along with the drawing. The ink panel owns the key ahead
   * of both — one layer at a time, as everywhere else here — and a block of
   * type being written owns it ahead of everything, because Escape is how a
   * block of type is finished.
   */
  useEffect(() => {
    if (!tool) return;
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(".hbw-poster-edit")) return;
      event.stopPropagation();
      if (document.querySelector(".hbw-poster-palette")) {
        document.dispatchEvent(new CustomEvent("hbw:shut-palette"));
        return;
      }
      shutTool();
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [tool, shutTool]);

  /** Moving to another block puts the drawing away — you have left it. */
  useEffect(() => {
    if (tool && here !== "contact") shutTool();
  }, [here, tool, shutTool]);

  /**
   * Opened at a part — Contact from the nav — rather than at the top.
   *
   * The parts are laid out now rather than carried by a transform, so the
   * browser can do this itself: there is nothing to compute, and nothing to
   * compute it from before the type has settled.
   */
  useEffect(() => {
    if (!start || landed.current) return;
    const part = said.current?.querySelector<HTMLElement>(`[data-part="${start}"]`);
    if (!part) return;
    landed.current = true;
    part.scrollIntoView({ block: "start" });
  }, [start]);

  return (
    <div className="hbw-studio-doc" ref={doc} data-tool={tool ? "poster" : undefined}>
      {/*
        The writing on one side, the room it comes from on the other.
        
        Two columns, each with its own scroll: everything there is to read
        runs down the left in one typographic structure, and the right holds
        the face and the way to get in touch. Neither has to wait for the
        other, and the page stops being a single long thing a reader has to
        get to the bottom of.
      */}
      <div className="hbw-studio__said" ref={said}>
        {/*
          The index, back.
          
          A reader in the middle of the writing had no way of knowing what
          else was here or how much was left — the chrome names the part, but
          naming one part is not the same as showing the shape of the whole.
          It holds its place while the writing moves past it.
        */}
        <nav className="hbw-studio__index" aria-label="The studio">
          {PARTS.map((part) => (
            <a
              key={part.id}
              href={`#${part.id}`}
              aria-current={here === part.id ? "true" : undefined}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                said.current
                  ?.querySelector<HTMLElement>(`[data-part="${part.id}"]`)
                  ?.scrollIntoView({ block: "start" });
              }}
            >
              {part.name}
            </a>
          ))}
        </nav>
      <section className="hbw-part" data-part="practice" data-here={here === "practice"} data-open={here === "practice"}>
        {/* The block says its own name, so a closed one is still a way in. */}
        <button
          type="button"
          className="hbw-part__name"
          aria-expanded={here === "practice"}
          onClick={() => setHere("practice")}
        >
          Practice
        </button>
        <div className="hbw-part__say">
          <div className="hbw-part__col">
            {/* One statement in two tones: the tension, then who answers it. */}
            <h2 className="hbw-part__lead">
              <span className="hbw-ink">{STUDIO_COPY.statement[0]}</span>{" "}
              <span>{STUDIO_COPY.statement[1]}</span>
            </h2>
            <p>{STUDIO_COPY.brief}</p>
          </div>
          <div className="hbw-part__col">
            <dl className="hbw-facts">
              {FACTS.map((fact) => (
                <div key={fact.label}>
                  <dt className="hbw-m">{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="hbw-part" data-part="approach" data-here={here === "approach"} data-open={here === "approach"}>
        {/* The block says its own name, so a closed one is still a way in. */}
        <button
          type="button"
          className="hbw-part__name"
          aria-expanded={here === "approach"}
          onClick={() => setHere("approach")}
        >
          Approach
        </button>
        <div className="hbw-part__say">
          <div className="hbw-part__col">
            <h2 className="hbw-part__lead">{STUDIO_COPY.philosophy[0]}</h2>
          </div>
          <div className="hbw-part__col">
            <p>{STUDIO_COPY.philosophy[1]}</p>
          </div>
          <div className="hbw-part__col">
            <p>{STUDIO_COPY.role}</p>
          </div>
        </div>
      </section>

      <section className="hbw-part" data-part="process" data-here={here === "process"} data-open={here === "process"}>
        {/* The block says its own name, so a closed one is still a way in. */}
        <button
          type="button"
          className="hbw-part__name"
          aria-expanded={here === "process"}
          onClick={() => setHere("process")}
        >
          Process
        </button>
        <div className="hbw-part__say">
          <div className="hbw-part__col">
            <h2 className="hbw-part__lead">{STUDIO_COPY.howIntro}</h2>
          </div>
          {/*
            One stage, one module.
            
            They were set two to a column, which made two tall objects out of
            four short ones — and the board is built to give each thing the
            room it actually needs. Four modules read as four steps.

            They stand in two columns of two, under the two they follow from:
            Express under Clarify, Support under Shape. Left to flow they
            wrapped to the start of the next row, which put the third step
            under the sentence that introduces all four and broke the pairs.
          */}
          {STUDIO_COPY.steps.map((step) => (
            <div className="hbw-part__col hbw-part__col--step" key={step.id}>
              <ol className="hbw-part__steps">
                <li>
                  <span className="hbw-m">{step.id}</span>
                  <span className="hbw-ink">{step.title}</span>
                  <p>{step.copy}</p>
                </li>
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="hbw-part" data-part="manifesto" data-here={here === "manifesto"} data-open={here === "manifesto"}>
        {/* The block says its own name, so a closed one is still a way in. */}
        <button
          type="button"
          className="hbw-part__name"
          aria-expanded={here === "manifesto"}
          onClick={() => setHere("manifesto")}
        >
          Manifesto
        </button>
        <div className="hbw-part__say">
          <div className="hbw-part__col">
            <h2 className="hbw-part__lead">{MANIFESTO_COPY.opening.join(" ")}</h2>
          </div>
          {/*
            The belief in full, in one module, with the room where the second
            one stood left empty.

            It used to be in two: the part about what brand is reduced to, and
            then the one line the whole thing is for, with the rest of it only
            on /studio. Which meant the block called Manifesto held a third of
            a manifesto and a pointer to the rest. It is the same shaping /studio
            gives it — the reduction, then a paragraph a thought, then the line
            it arrives at — so the two cannot drift apart. The closing mark is
            not repeated here: "How by Why" is already across the foot.
          */}
          <div className="hbw-part__col hbw-part__col--end">
            {MANIFESTO_COPY.reduced.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {MANIFESTO_COPY.body.map((thought) => (
              <p key={thought.join(" ")}>{thought.join(" ")}</p>
            ))}
            <p className="hbw-ink">{MANIFESTO_COPY.close[0]}</p>
          </div>
        </div>
      </section>

      <section
        className="hbw-part"
        data-part="contact"
        data-here={here === "contact"}
        data-open={here === "contact"}
        data-tool={tool ? "poster" : undefined}
        data-going={going ? "true" : undefined}
      >
        {/*
          The block's own row, which names it and — once the drawing is out —
          holds the way back to the reading. The nav two pixels above says
          Close and means the studio; this one says what it closes.
        */}
        <div className="hbw-part__head">
          {/* The block says its own name, so a closed one is still a way in. */}
          <button
            type="button"
            className="hbw-part__name"
            aria-expanded={here === "contact"}
            onClick={() => setHere("contact")}
          >
            Talk
          </button>
          {tool ? (
            <button type="button" className="hbw-part__exit" onClick={shutTool}>
              Close poster
            </button>
          ) : null}
        </div>
        <div className="hbw-part__say">
          {armed ? (
            <div
              className="hbw-part__col hbw-part__tool hbw-tool"
              data-arriving={arriving ? "true" : undefined}
              data-going={going ? "true" : undefined}
            >
              <PosterTool />
            </div>
          ) : (
            <>
              <div className="hbw-part__col">
                <h2 className="hbw-part__lead">{STUDIO_COPY.contactLine}</h2>
              </div>
              <div className="hbw-part__col">
                <p>
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </p>
              </div>
              <div className="hbw-part__col">
                <p className="is-mute">{STUDIO_PLACE}</p>
                {/*
                  The poster, back where someone can find it.
                  
                  Rewriting this sheet dropped it, and the only page left
                  holding it is one the nav no longer points at — so a tool
                  built to be the other way in had become unreachable.
                */}
                <p className="is-mute">{CONTACT_WAYS.draw.copy}</p>
                <p>
                  <button type="button" className="hbw-part__start" onClick={openTool}>
                    Make a poster
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      </div>

      <aside className="hbw-studio__aside" aria-label="The studio">
        <img
          className="hbw-studio__portrait"
          src="/practice/mark-blackler-studio-720.jpg"
          alt="Mark Blackler in the studio."
          width={576}
          height={720}
          loading="lazy"
          decoding="async"
        />
        <Footer />
      </aside>

      {/*
        The studio's name, across the foot of the whole sheet.

        It arrives when the last block opens — you have read the thing, and
        what is left to say is who said it. Set large enough that it runs
        past the right edge, because a name at this size is a mark, not a
        line of text to be fitted.
      */}
      <p className="hbw-studio__end" aria-hidden="true">How by Why</p>
    </div>
  );
}
