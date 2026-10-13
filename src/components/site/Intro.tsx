"use client";

/**
 * The way in: the name, then the work.
 *
 * A sequence rather than a page. The studio is called How by Why and nobody
 * reads a wordmark in a corner, so the name gets one beat of the screen to
 * itself before the work arrives.
 *
 * What it is not: a loading screen. The whole page is rendered underneath it
 * from the first byte — this is a sheet over finished content, it never gates
 * anything, and it is gone in a little over a second. It plays once a session,
 * never under reduced motion, and a click or a key ends it early.
 */
import { useCallback, useEffect, useState } from "react";

const SEEN = "hbw.intro";

export function Intro({ mark, line }: { mark: string; line: string }) {
  // Starts false so the server and the first client render agree; the effect
  // decides, which also means scripting off never sees it at all.
  const [playing, setPlaying] = useState(false);
  const [going, setGoing] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem(SEEN)) return;
      sessionStorage.setItem(SEEN, "1");
    } catch {
      /* private window: play it, it is a second */
    }
    setPlaying(true);
    const out = window.setTimeout(() => setGoing(true), 1250);
    const done = window.setTimeout(() => setPlaying(false), 2050);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(done);
    };
  }, []);

  const end = useCallback(() => {
    setGoing(true);
    window.setTimeout(() => setPlaying(false), 600);
  }, []);

  useEffect(() => {
    if (!playing) return;
    // While it is up nothing should scroll underneath it.
    const had = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", end);
    return () => {
      document.body.style.overflow = had;
      window.removeEventListener("keydown", end);
    };
  }, [playing, end]);

  if (!playing) return null;

  return (
    <div className={`hbw-intro${going ? " is-going" : ""}`} onClick={end} aria-hidden="true">
      <p className="hbw-intro__mark">{mark}</p>
      <p className="hbw-intro__line">{line}</p>
    </div>
  );
}
