"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_E164 } from "@/components/home/SiteNav";
import { MANIFESTO_COPY, STUDIO_COPY } from "@/components/home/studio-copy";
import { PRESS, PROFILES } from "@/lib/structured-data";
import { HBW_T, reduceMotion } from "@/components/home/motion";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Props = {
  view: "studio" | "manifesto";
  leaving: boolean;
  onClose: () => void;
  onPoster: () => void;
};

const SECTIONS = [
  { id: "practice", label: "Practice" },
  { id: "approach", label: "Approach" },
  { id: "process", label: "Process" },
  { id: "manifesto", label: "Manifesto" },
  { id: "published", label: "Published" },
  { id: "contact", label: "Contact" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

/** The manifesto as a sequence of thoughts, each read on its own. */
const THOUGHTS: string[] = [
  MANIFESTO_COPY.opening.join(" "),
  `${MANIFESTO_COPY.reduced[0]} ${MANIFESTO_COPY.reduced[1]}`,
  MANIFESTO_COPY.reduced[2],
  ...MANIFESTO_COPY.body.map((lines) => lines.join(" ")),
  MANIFESTO_COPY.close[0],
];
/** The page's top inset: sections land with their hairline on it. */
const inset = (page: HTMLElement) => Number.parseFloat(getComputedStyle(page).paddingTop || "0");

/** How much page each thought is given to be read in, as a share of the viewer's height. */
const THOUGHT_SPAN = 0.62;

/**
 * Studio, on the Poster's own page rather than in a box: one continuous page that rises
 * from the bottom and is closed from the nav, because the practice isn't an object.
 * After Alex Hunting Studio's About: a two-tone statement, the studio's image, then
 * sections under small labels, with an index that holds its place on the left and
 * glides you between them. The Manifesto is read, not scanned: one thought at a
 * time holds the stage while its words light as you scroll, then gives way.
 */
export function StudioDetail({ view, leaving, onClose, onPoster }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLElement>(null);
  const glide = useRef<{ target: number | null; raf: number }>({ target: null, raf: 0 });
  const [current, setCurrent] = useState<SectionId>(view === "manifesto" ? "manifesto" : "practice");
  const [thought, setThought] = useState(0);
  const [place, setPlace] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Arrive: the same rise as a project opened from the nav.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    const page = pageRef.current;
    if (!root || !panel) return;
    root.focus({ preventScroll: true });
    // A /manifesto link opens on the manifesto.
    if (view === "manifesto" && page && readerRef.current) page.scrollTop = readerRef.current.offsetTop - inset(page);
    if (reduceMotion()) return;
    root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: HBW_T.spatial, easing: EASE });
    // It rises from the bottom edge, whole: no growing box, no fade.
    panel.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 600, easing: EASE });
    // Mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leave: the shell unmounts after HBW_T.spatial.
  useEffect(() => {
    if (!leaving || reduceMotion()) return;
    rootRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: HBW_T.spatial, easing: EASE, fill: "forwards" });
    panelRef.current?.animate([{ transform: "none" }, { transform: "translateY(100%)" }], {
      duration: HBW_T.spatial,
      easing: EASE,
      fill: "forwards",
    });
  }, [leaving]);

  // The index takes its width from the nav group above it, so the two edges agree.
  useLayoutEffect(() => {
    const page = pageRef.current;
    const group = document.querySelector<HTMLElement>(".hbw-pills .hbw-pill-group");
    if (!page || !group) return;
    const measure = () => page.style.setProperty("--index-w", `${Math.round(group.offsetWidth)}px`);
    measure();
    const sizes = new ResizeObserver(measure);
    sizes.observe(group);
    return () => sizes.disconnect();
  }, []);

  // The viewer names itself, so the nav's line steps aside — as it does for a project.
  useEffect(() => {
    document.documentElement.classList.toggle("hbw-viewing", !leaving);
    return () => document.documentElement.classList.remove("hbw-viewing");
  }, [leaving]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  // Where the practice is, and what it's like there right now.
  useEffect(() => {
    let live = true;
    fetch("/api/hbw/place")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { ok?: boolean; temperature?: number; condition?: string } | null) => {
        if (live && data?.ok && typeof data.temperature === "number" && data.condition)
          setPlace(`${Math.round(data.temperature)}° and ${data.condition.toLowerCase()}`);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  // One pass on scroll: which section is in the reading line, and — inside the
  // manifesto — which thought holds the stage and how much of it has been read.
  useEffect(() => {
    const page = pageRef.current;
    const reader = readerRef.current;
    if (!page || !reader) return;
    const sections = Array.from(page.querySelectorAll<HTMLElement>("[data-studio-section]"));
    const stage = reader.querySelector<HTMLElement>(".hbw-reader__stage");
    let frame = 0;
    let shown = -1;
    const read = () => {
      frame = 0;
      const y = page.scrollTop;
      const line = y + page.clientHeight * 0.3;
      let now: SectionId = "practice";
      sections.forEach((s) => {
        if (s.offsetTop <= line) now = s.dataset.studioSection as SectionId;
      });
      if (y >= page.scrollHeight - page.clientHeight - 2) now = "contact";
      setCurrent(now);

      const run = reader.offsetHeight - page.clientHeight;
      const p = Math.max(0, Math.min(0.9999, (y - reader.offsetTop) / Math.max(1, run)));
      const at = p * THOUGHTS.length;
      const i = Math.floor(at);
      // The words of a thought light over the first two-thirds of its span; the rest is a pause.
      const k = Math.min(1, (at - i) / 0.66);
      if (i !== shown) {
        shown = i;
        setThought(i);
      }
      stage?.style.setProperty("--k", String(Math.round(k * 1000) / 1000));
      stage?.style.setProperty("--p", String(Math.round(p * 1000) / 1000));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    page.addEventListener("scroll", onScroll, { passive: true });
    read();

    // Sections settle in as they arrive, once.
    const arrive = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          arrive.unobserve(e.target);
        }),
      { root: page, rootMargin: "0px 0px -10% 0px" }
    );
    sections.forEach((s) => arrive.observe(s));
    return () => {
      page.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      arrive.disconnect();
    };
  }, []);

  // One easing for every move the page makes, as on the line and in the gallery.
  const glideTo = useCallback((y: number) => {
    const page = pageRef.current;
    if (!page) return;
    const g = glide.current;
    g.target = Math.max(0, Math.min(page.scrollHeight - page.clientHeight, y));
    if (reduceMotion()) {
      page.scrollTop = g.target;
      g.target = null;
      return;
    }
    if (g.raf) return;
    const tick = () => {
      const target = g.target;
      if (target == null) {
        g.raf = 0;
        return;
      }
      const cur = page.scrollTop;
      const next = cur + (target - cur) * 0.16;
      if (Math.abs(target - cur) < 4 || Math.round(next) === Math.round(cur)) {
        page.scrollTop = target;
        g.target = null;
        g.raf = 0;
        return;
      }
      page.scrollTop = next;
      g.raf = requestAnimationFrame(tick);
    };
    g.raf = requestAnimationFrame(tick);
  }, []);
  useEffect(() => () => cancelAnimationFrame(glide.current.raf), []);

  function toSection(id: SectionId) {
    const page = pageRef.current;
    const el = page?.querySelector<HTMLElement>(`#studio-${id}`);
    if (!page || !el) return;
    // Each section lands with its hairline on the viewer's top inset.
    glideTo(id === "practice" ? 0 : el.offsetTop - inset(page));
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  }

  return (
    <div ref={rootRef} className="hbw-detail hbw-detail--studio" role="dialog" aria-modal="true" aria-label="Studio" tabIndex={-1}>
      <button type="button" className="hbw-detail__scrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <article ref={panelRef} className="hbw-viewer hbw-viewer--studio" aria-label="Studio">

        <div className="hbw-viewer__body">
          <div ref={pageRef} className="hbw-studio" tabIndex={-1}>
            <nav className="hbw-studio__index" aria-label="Studio">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="hbw-studio__index-item"
                  aria-current={current === s.id ? "true" : undefined}
                  onClick={() => toSection(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </nav>

            <div className="hbw-studio__sections">
              <section id="studio-practice" data-studio-section="practice" className="hbw-studio__section hbw-studio__hero is-in">
                <p className="hbw-studio__statement">
                  <span className="hbw-studio__ink">{STUDIO_COPY.statement[0]}</span>{" "}
                  <span className="hbw-studio__grey">{STUDIO_COPY.statement[1]}</span>
                </p>
                <dl className="hbw-studio__facts">
                  <div>
                    <dt>Led by</dt>
                    <dd>Mark Blackler</dd>
                  </div>
                  <div>
                    <dt>Works with</dt>
                    <dd>Founders and leadership teams</dd>
                  </div>
                  <div>
                    <dt>Based</dt>
                    <dd>
                      {STUDIO_COPY.place}
                      {place ? <span className="hbw-studio__grey">, {place}</span> : null}
                    </dd>
                  </div>
                </dl>
                <figure className="hbw-studio__portrait">
                  <img
                    src="/practice/mark-blackler-studio.jpg"
                    alt="Mark Blackler in the HBW studio"
                    width={819}
                    height={1024}
                    decoding="async"
                  />
                  <figcaption>Mark Blackler in the studio</figcaption>
                </figure>
              </section>

              <section id="studio-approach" data-studio-section="approach" className="hbw-studio__section">
                <h3 className="hbw-studio__label">Approach</h3>
                <div className="hbw-studio__lead">
                  <p className="hbw-studio__ink">{STUDIO_COPY.philosophy[0]}</p>
                  <p className="hbw-studio__grey">{STUDIO_COPY.philosophy[1]}</p>
                  <p className="hbw-studio__grey">{STUDIO_COPY.brief}</p>
                </div>
                <div className="hbw-studio__list">
                  <h4 className="hbw-studio__label">Disciplines</h4>
                  <ul>
                    {STUDIO_COPY.disciplineList.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section id="studio-process" data-studio-section="process" className="hbw-studio__section">
                <h3 className="hbw-studio__label">Process</h3>
                <p className="hbw-studio__lead hbw-studio__grey">{STUDIO_COPY.howTools}</p>
                <ol className="hbw-studio__steps">
                  {STUDIO_COPY.steps.map((step) => (
                    <li key={step.id}>
                      <span className="hbw-studio__step-name">
                        <span className="hbw-studio__step-n">{step.id}</span>
                        {step.title}
                      </span>
                      <span className="hbw-studio__step-copy">{step.copy}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* The manifesto, read: a tall run of page with a pinned stage. Each thought holds
                  the stage while its words light, then lifts away for the next. */}
              <section
                ref={readerRef}
                id="studio-manifesto"
                data-studio-section="manifesto"
                className="hbw-studio__section hbw-reader is-in"
                style={{ "--thoughts": THOUGHTS.length, "--span": THOUGHT_SPAN } as React.CSSProperties}
                aria-label="Manifesto"
              >
                <div className="hbw-reader__stage">
                  <h3 className="hbw-studio__label">Manifesto</h3>
                  <div className="hbw-reader__thoughts">
                    {THOUGHTS.map((t, i) => {
                      const words = t.split(" ");
                      return (
                        <p
                          key={t}
                          className={`hbw-reader__thought${i === thought ? " is-now" : i < thought ? " is-read" : ""}`}
                          aria-hidden={i === thought ? undefined : true}
                          style={{ "--n": words.length } as React.CSSProperties}
                        >
                          {words.map((w, j) => (
                            <span key={j} className="hbw-reader__word" style={{ "--w": j } as React.CSSProperties}>
                              {w}{" "}
                            </span>
                          ))}
                        </p>
                      );
                    })}
                  </div>
                  <p className="hbw-reader__meta" aria-hidden="true">
                    <span>
                      {String(thought + 1).padStart(2, "0")} / {String(THOUGHTS.length).padStart(2, "0")}
                    </span>
                    <span className="hbw-reader__track">
                      <span className="hbw-reader__fill" />
                    </span>
                    <span>{MANIFESTO_COPY.close[1]}</span>
                  </p>
                </div>
                {/* Read aloud in full for assistive tech; the stage above is visual. */}
                <div className="hbw-reader__plain">
                  {THOUGHTS.map((t) => (
                    <p key={t}>{t}</p>
                  ))}
                </div>
              </section>

              {/* Written about the studio by people who do not work for it.
                  A rater, a client and a model all look for the same thing:
                  somebody else saying it. */}
              <section id="studio-published" data-studio-section="published" className="hbw-studio__section">
                <h3 className="hbw-studio__label">Published</h3>
                <ul className="hbw-studio__press">
                  {PRESS.map((item) => (
                    <li key={item.url}>
                      <a
                        className="hbw-studio__press-link"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="hbw-studio__press-name">{item.name}</span>
                        <span className="hbw-studio__press-where">
                          {item.publisher}, {item.date.slice(0, 4)} <span aria-hidden="true">↗</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="hbw-studio__elsewhere">
                  <span className="hbw-studio__grey">Elsewhere:</span>{" "}
                  {PROFILES.map((profile, i) => (
                    <span key={profile.url}>
                      {i > 0 ? ", " : ""}
                      <a className="hbw-viewer__link" href={profile.url} target="_blank" rel="me noreferrer">
                        {profile.name}
                      </a>
                    </span>
                  ))}
                </p>
              </section>

              <section id="studio-contact" data-studio-section="contact" className="hbw-studio__section hbw-studio__contact">
                <h3 className="hbw-studio__label">Contact</h3>
                <p className="hbw-studio__statement">
                  <span className="hbw-studio__ink">At a turning point of your own?</span>{" "}
                  <span className="hbw-studio__grey">{STUDIO_COPY.contactLine}</span>
                </p>
                <p className="hbw-studio__actions">
                  <button type="button" className="hbw-viewer__link" onClick={onPoster}>
                    Start a poster <span aria-hidden="true">↗</span>
                  </button>
                  <button type="button" className="hbw-viewer__link" onClick={copyEmail}>
                    {copied ? `Copied ${CONTACT_EMAIL}` : CONTACT_EMAIL}
                  </button>
                  <a className="hbw-viewer__link" href={`tel:${CONTACT_PHONE_E164}`}>
                    {CONTACT_PHONE}
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
