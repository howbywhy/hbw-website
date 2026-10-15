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
import { useEffect, useRef, useState } from "react";
import { Footer } from "@/components/site/Footer";
import { MANIFESTO_COPY, STUDIO_COPY } from "@/components/home/studio-copy";
import { CONTACT_EMAIL, CONTACT_WAYS, STUDIO_PLACE } from "@/lib/contact";
import { PosterLink } from "@/components/site/PosterLink";

const PARTS = [
  { id: "practice", name: "Practice" },
  { id: "approach", name: "Approach" },
  { id: "process", name: "Process" },
  { id: "manifesto", name: "Manifesto" },
  { id: "contact", name: "Contact" },
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
  }, [here]);

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
    <div className="hbw-studio-doc" ref={doc}>
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
          */}
          {STUDIO_COPY.steps.map((step) => (
            <div className="hbw-part__col" key={step.id}>
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
          <div className="hbw-part__col">
            {MANIFESTO_COPY.reduced.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="hbw-part__col">
            {/* The belief in full is on /studio; this is the half of it that
                says what the studio is for. */}
            <p className="hbw-ink">{MANIFESTO_COPY.close[0]}</p>
          </div>
        </div>
      </section>

      <section className="hbw-part" data-part="contact" data-here={here === "contact"} data-open={here === "contact"}>
        {/* The block says its own name, so a closed one is still a way in. */}
        <button
          type="button"
          className="hbw-part__name"
          aria-expanded={here === "contact"}
          onClick={() => setHere("contact")}
        >
          Contact
        </button>
        <div className="hbw-part__say">
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
              
              Rewriting this sheet dropped it, and the only page left holding
              it is one the nav no longer points at — so a tool that was built
              to be the other way in had become unreachable from the site.
            */}
            <p className="is-mute">{CONTACT_WAYS.draw.copy}</p>
            <PosterLink />
          </div>
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
